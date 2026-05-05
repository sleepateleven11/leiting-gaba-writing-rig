import { mockNews } from "@/data/mockNews";
import type { NewsListResponse } from "@/lib/news/newsTypes";
import { newsListResponseSchema } from "@/lib/news/newsSchemas";
import { sortNews } from "@/lib/news/newsNormalizer";

export function getMockNewsResponse(reason?: string): NewsListResponse {
  return newsListResponseSchema.parse({
    provider: "mock",
    updatedAt: new Date().toISOString(),
    news: sortNews(mockNews),
    fallbackReason: reason
  });
}
