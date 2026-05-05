import { createSseResponse } from "@/lib/ai/sseResponse";
import { streamDraftArticle } from "@/lib/ai/draftStreamService";

export async function POST(request: Request) {
  const payload = await request.json();
  return createSseResponse((send) => streamDraftArticle(payload, send));
}
