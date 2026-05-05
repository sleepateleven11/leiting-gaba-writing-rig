import { NextResponse } from "next/server";
import { analyzeNews } from "@/lib/news/newsService";
import { analyzeNewsApiResponseSchema, normalizedNewsSchema } from "@/lib/news/newsSchemas";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const news = [];
    if (Array.isArray(body?.news)) {
      for (const item of body.news) {
        const parsed = normalizedNewsSchema.safeParse(item);
        if (parsed.success) {
          news.push(parsed.data);
        }
      }
    }

    const analyzed = await analyzeNews(news);
    return NextResponse.json(analyzeNewsApiResponseSchema.parse({ news: analyzed }));
  } catch (error) {
    return NextResponse.json(
      {
        error: "新闻分析失败，已保留原新闻字段。",
        detail: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 502 }
    );
  }
}
