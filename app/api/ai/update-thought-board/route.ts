import { NextResponse } from "next/server";
import { updateThoughtBoard } from "@/lib/ai/aiService";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await updateThoughtBoard(body);
    return NextResponse.json({
      thoughtBoard: result.thoughtBoard
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "思路板 AI 更新失败，已保留当前思路板。",
        detail: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 502 }
    );
  }
}
