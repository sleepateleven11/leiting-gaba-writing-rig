import { NextResponse } from "next/server";
import { getNewsList } from "@/lib/news/newsService";

export async function GET() {
  try {
    const result = await getNewsList();
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: "news_list_failed", message },
      { status: 500 }
    );
  }
}
