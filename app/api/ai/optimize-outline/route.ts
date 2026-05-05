import { NextResponse } from "next/server";
import { optimizeOutline } from "@/lib/ai/aiService";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await optimizeOutline(body);
    return NextResponse.json({
      outline: result.outline,
      changeSummary: result.changeSummary
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "大纲优化失败，已保留当前大纲。",
        detail: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 502 }
    );
  }
}
