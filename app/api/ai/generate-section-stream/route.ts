import { createSseResponse } from "@/lib/ai/sseResponse";
import { streamDraftSection } from "@/lib/ai/draftStreamService";

export async function POST(request: Request) {
  const payload = await request.json();
  return createSseResponse((send) => streamDraftSection(payload, send));
}
