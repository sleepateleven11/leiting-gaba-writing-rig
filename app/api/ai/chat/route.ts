import { NextResponse } from "next/server";
import { chatWithAI } from "@/lib/ai/aiService";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await chatWithAI(body);
    return NextResponse.json({
      assistantMessage: result.assistantMessage,
      suggestions: result.suggestions
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "AI 对话请求失败，页面状态已保留。",
        detail: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 502 }
    );
  }
}
