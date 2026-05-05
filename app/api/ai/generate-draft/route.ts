import { NextResponse } from "next/server";
import { generateDraft } from "@/lib/ai/draftService";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const result = await generateDraft(payload);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: "generate_draft_failed", message: "生成完整草稿失败，当前正文已保留。" },
      { status: 500 }
    );
  }
}
