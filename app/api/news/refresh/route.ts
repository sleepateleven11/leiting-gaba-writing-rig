import { NextResponse } from "next/server";
import { getNewsList } from "@/lib/news/newsService";

export async function POST() {
  const result = await getNewsList({ forceRefresh: true });
  return NextResponse.json(result);
}
