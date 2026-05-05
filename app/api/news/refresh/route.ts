import { NextResponse } from "next/server";
import { getNewsList } from "@/lib/news/newsService";

export async function POST() {
  try {
    const result = await getNewsList({ forceRefresh: true });
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: "news_refresh_failed", message },
      { status: 500 }
    );
  }
}
