export type SseSend = (event: string, data?: Record<string, unknown>) => void;

export function createSseResponse(run: (send: SseSend) => Promise<void>) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send: SseSend = (event, data = {}) => {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
        );
      };

      try {
        await run(send);
      } catch (error) {
        send("error", {
          message: error instanceof Error ? error.message : "stream_failed"
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
