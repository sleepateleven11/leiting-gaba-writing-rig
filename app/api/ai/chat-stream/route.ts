import { NextResponse } from "next/server";
import { chatWithAI, compactWorkspace } from "@/lib/ai/aiService";
import { streamDeepSeekChat } from "@/lib/ai/deepseekClient";
import { streamChatPrompt } from "@/lib/ai/prompts";
import type { ChatMessage, WorkspaceState } from "@/types";

type ChatStreamRequest = {
  workspace: WorkspaceState;
  messages: ChatMessage[];
  userMessage: string;
};

const reasoningStages = [
  "正在理解新闻素材...",
  "正在分析新闻关系...",
  "正在提炼写作主线...",
  "正在生成建议卡片..."
];

export async function POST(request: Request) {
  let body: ChatStreamRequest;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const encoder = new TextEncoder();
      let reasoningLength = 0;
      let stageIndex = 0;

      const send = (event: "reasoning" | "content" | "suggestions" | "done" | "error", data: unknown) => {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
        );
      };

      try {
        send("reasoning", { status: reasoningStages[0] });

        await streamDeepSeekChat(
          [
            { role: "system", content: streamChatPrompt },
            {
              role: "user",
              content: JSON.stringify(
                {
                  workspace: compactWorkspace(body.workspace),
                  recentMessages: body.messages.slice(-10).map((message) => ({
                    role: message.role,
                    content: message.content
                  })),
                  userMessage: body.userMessage
                },
                null,
                2
              )
            }
          ],
          (event) => {
            if (event.type === "reasoning") {
              reasoningLength += event.delta.length;
              const nextStageIndex = Math.min(
                reasoningStages.length - 2,
                Math.floor(reasoningLength / 120)
              );
              if (nextStageIndex !== stageIndex) {
                stageIndex = nextStageIndex;
                send("reasoning", { status: reasoningStages[stageIndex] });
              }
              return;
            }

            if (event.type === "content") {
              send("content", { delta: event.delta });
            }
          },
          { temperature: 0.35 }
        );

        send("reasoning", { status: reasoningStages[3] });

        try {
          const structured = await chatWithAI(body);
          send("suggestions", {
            suggestions: structured.suggestions
          });
        } catch {
          send("suggestions", { suggestions: [] });
        }

        send("done", {});
      } catch (error) {
        send("error", {
          message: error instanceof Error ? error.message : "AI stream failed."
        });
      } finally {
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive"
    }
  });
}
