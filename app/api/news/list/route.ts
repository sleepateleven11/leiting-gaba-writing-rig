import { NextResponse } from "next/server";
import { getNewsList } from "@/lib/news/newsService";

export async function GET() {
  const result = await getNewsList();
  return NextResponse.json(result);
}
