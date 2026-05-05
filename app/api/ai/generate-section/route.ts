import { NextResponse } from "next/server";
import { generateSection } from "@/lib/ai/draftService";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const result = await generateSection(payload);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: "generate_section_failed", message: "生成本节失败，当前正文已保留。" },
      { status: 500 }
    );
  }
}
