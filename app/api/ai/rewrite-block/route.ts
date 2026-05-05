import { NextResponse } from "next/server";
import { rewriteBlock } from "@/lib/ai/draftService";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const result = await rewriteBlock(payload);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Error && error.message === "BLOCK_LOCKED") {
      return NextResponse.json(
        { error: "block_locked", message: "该正文块已锁定，请先解锁再使用 AI 改写。" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "rewrite_block_failed", message: "改写失败，原内容已保留。" },
      { status: 500 }
    );
  }
}
