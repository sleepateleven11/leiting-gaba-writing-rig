import { NextResponse } from "next/server";
import { getNewsList } from "@/lib/news/newsService";

export async function GET() {
  try {
    const result = await getNewsList();
    return NextResponse.json({ ok: true, count: result.news.length });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      message: (error as Error).message,
    }, { status: 500 });
  }
}
