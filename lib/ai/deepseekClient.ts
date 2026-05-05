type DeepSeekMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type DeepSeekOptions = {
  temperature?: number;
  json?: boolean;
};

export type DeepSeekStreamEvent =
  | {
      type: "reasoning";
      delta: string;
    }
  | {
      type: "content";
      delta: string;
    };

export class DeepSeekClientError extends Error {
  constructor(
    message: string,
    public readonly code: "missing_api_key" | "request_failed" | "invalid_response" | "json_parse_failed",
    public readonly status?: number
  ) {
    super(message);
    this.name = "DeepSeekClientError";
  }
}

export function hasDeepSeekConfig() {
  return Boolean(process.env.DEEPSEEK_API_KEY);
}

export async function deepseekText(messages: DeepSeekMessage[], options: DeepSeekOptions = {}) {
  return callDeepSeek(messages, { ...options, json: false });
}

export async function deepseekJson(messages: DeepSeekMessage[], options: DeepSeekOptions = {}) {
  const content = await callDeepSeek(messages, { ...options, json: true });
  return parseJsonContent(content);
}

export async function streamDeepSeekChat(
  messages: DeepSeekMessage[],
  onEvent: (event: DeepSeekStreamEvent) => void,
  options: DeepSeekOptions = {}
) {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    throw new DeepSeekClientError("DEEPSEEK_API_KEY is not configured.", "missing_api_key");
  }

  const baseURL = normalizeBaseURL(process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com");
  const model = process.env.DEEPSEEK_MODEL || "deepseek-v4-pro";
  const response = await fetch(`${baseURL}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: options.temperature ?? 0.35,
      stream: true,
      reasoning_effort: "high",
      extra_body: {
        thinking: {
          type: "enabled"
        }
      }
    })
  });

  if (!response.ok || !response.body) {
    throw new DeepSeekClientError(
      `DeepSeek stream request failed with status ${response.status}.`,
      "request_failed",
      response.status
    );
  }

  await readSseStream(response.body, onEvent);
}

async function callDeepSeek(messages: DeepSeekMessage[], options: DeepSeekOptions) {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    throw new DeepSeekClientError("DEEPSEEK_API_KEY is not configured.", "missing_api_key");
  }

  const baseURL = normalizeBaseURL(process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com");
  const model = process.env.DEEPSEEK_MODEL || "deepseek-v4-pro";
  const response = await fetch(`${baseURL}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: options.temperature ?? 0.35,
      ...(options.json ? { response_format: { type: "json_object" } } : {})
    })
  });

  const payload = await response.json().catch(() => undefined);
  if (!response.ok) {
    throw new DeepSeekClientError(
      `DeepSeek request failed with status ${response.status}.`,
      "request_failed",
      response.status
    );
  }

  const content = payload?.choices?.[0]?.message?.content;
  if (typeof content !== "string" || !content.trim()) {
    throw new DeepSeekClientError("DeepSeek returned an empty response.", "invalid_response");
  }

  return content;
}

function normalizeBaseURL(baseURL: string) {
  return baseURL.replace(/\/+$/, "");
}

function parseJsonContent(content: string) {
  const cleaned = content
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  try {
    return JSON.parse(cleaned) as unknown;
  } catch (error) {
    throw new DeepSeekClientError("DeepSeek response is not valid JSON.", "json_parse_failed");
  }
}

async function readSseStream(
  body: ReadableStream<Uint8Array>,
  onEvent: (event: DeepSeekStreamEvent) => void
) {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    const frames = buffer.split(/\n\n/);
    buffer = frames.pop() ?? "";

    for (const frame of frames) {
      const dataLines = frame
        .split(/\r?\n/)
        .filter((line) => line.startsWith("data:"))
        .map((line) => line.replace(/^data:\s?/, "").trim());

      for (const data of dataLines) {
        if (!data || data === "[DONE]") {
          continue;
        }

        const parsed = JSON.parse(data);
        const delta = parsed?.choices?.[0]?.delta;
        const reasoning = delta?.reasoning_content;
        const content = delta?.content;

        if (typeof reasoning === "string" && reasoning) {
          onEvent({ type: "reasoning", delta: reasoning });
        }

        if (typeof content === "string" && content) {
          onEvent({ type: "content", delta: content });
        }
      }
    }
  }
}
