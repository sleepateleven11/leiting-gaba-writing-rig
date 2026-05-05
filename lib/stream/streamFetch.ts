type StreamEventData = Record<string, unknown>;

type StreamFetchOptions = {
  url: string;
  body: unknown;
  signal?: AbortSignal;
  onStart?: (data: StreamEventData) => void;
  onDelta?: (delta: string, data: StreamEventData) => void;
  onSectionStart?: (data: StreamEventData) => void;
  onSectionDone?: (data: StreamEventData) => void;
  onDone?: (data: StreamEventData) => void;
  onError?: (message: string, data?: StreamEventData) => void;
};

export async function streamFetch(options: StreamFetchOptions) {
  const response = await fetch(options.url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(options.body),
    signal: options.signal
  });

  if (!response.ok || !response.body) {
    throw new Error(`Stream request failed: ${response.status}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) {
      return;
    }

    buffer += decoder.decode(value, { stream: true });
    const frames = buffer.split(/\n\n/);
    buffer = frames.pop() ?? "";

    for (const frame of frames) {
      const event = parseSseFrame(frame);
      if (!event) {
        continue;
      }

      if (event.type === "start") {
        options.onStart?.(event.data);
      } else if (event.type === "delta") {
        options.onDelta?.(typeof event.data.delta === "string" ? event.data.delta : "", event.data);
      } else if (event.type === "section_start") {
        options.onSectionStart?.(event.data);
      } else if (event.type === "section_done") {
        options.onSectionDone?.(event.data);
      } else if (event.type === "done") {
        options.onDone?.(event.data);
        return;
      } else if (event.type === "error") {
        const message = typeof event.data.message === "string" ? event.data.message : "流式请求失败";
        options.onError?.(message, event.data);
        throw new Error(message);
      }
    }
  }
}

function parseSseFrame(frame: string) {
  const eventLine = frame.split(/\r?\n/).find((line) => line.startsWith("event:"));
  const dataLines = frame
    .split(/\r?\n/)
    .filter((line) => line.startsWith("data:"))
    .map((line) => line.replace(/^data:\s?/, ""));

  if (!eventLine || !dataLines.length) {
    return undefined;
  }

  try {
    return {
      type: eventLine.replace(/^event:\s?/, "").trim(),
      data: JSON.parse(dataLines.join("\n")) as StreamEventData
    };
  } catch {
    return undefined;
  }
}
