import type { News } from "@/types";
import { deepseekJson, hasDeepSeekConfig } from "@/lib/ai/deepseekClient";
import { fetchGNewsArticles, hasGNewsConfig } from "@/lib/news/gnewsClient";
import { dedupeNews } from "@/lib/news/newsDeduper";
import { getMockNewsResponse } from "@/lib/news/mockNewsService";
import {
  createNewsId,
  extractKeywords,
  normalizeGNewsArticle,
  sortNews
} from "@/lib/news/newsNormalizer";
import { NEWS_CACHE_TTL_MS } from "@/lib/news/newsQueries";
import {
  analyzeNewsResponseSchema,
  newsListResponseSchema,
  normalizedNewsSchema
} from "@/lib/news/newsSchemas";
import type { NewsListResponse } from "@/lib/news/newsTypes";

let memoryCache: NewsListResponse | undefined;

export async function getNewsList(options: { forceRefresh?: boolean } = {}) {
  const provider = process.env.NEWS_PROVIDER || "gnews";
  const now = Date.now();

  if (!options.forceRefresh && memoryCache && now - new Date(memoryCache.updatedAt).getTime() < NEWS_CACHE_TTL_MS) {
    return newsListResponseSchema.parse(memoryCache);
  }

  if (!hasGNewsConfig()) {
    throw new Error("GNEWS_API_KEY is not configured.");
  }

  try {
    const articles = await fetchGNewsArticles();
    const normalized = articles
      .map(normalizeGNewsArticle)
      .filter((item): item is News => Boolean(item))
      .map((item) => normalizedNewsSchema.safeParse(item))
      .filter((result) => result.success)
      .map((result) => result.data);

    const deduped = dedupeNews(normalized);
    if (!deduped.length) {
      throw new Error("All GNews articles were invalid or duplicated.");
    }

    const analyzed = await analyzeNews(deduped.slice(0, 40));
    const response = newsListResponseSchema.parse({
      provider: "gnews",
      updatedAt: new Date().toISOString(),
      news: sortNews(analyzed)
    });

    memoryCache = response;
    return response;
  } catch (error) {
    if (memoryCache) {
      return newsListResponseSchema.parse({
        ...memoryCache,
        fallbackReason: "GNews refresh failed; returned cached news."
      });
    }

    return getMockNewsResponse(error instanceof Error ? error.message : "GNews unavailable");
  }
}

export async function analyzeNews(news: News[]) {
  if (!news.length || !hasDeepSeekConfig()) {
    return news;
  }

  try {
    const analyzedItems = [];
    for (const chunk of chunkNews(news, 10)) {
      try {
        const analyzed = await analyzeWithRetry(chunk);
        analyzedItems.push(...analyzed.news);
      } catch {
        // Keep rule-based fields for this chunk.
      }
    }
    const analyzedById = new Map(analyzedItems.map((item) => [item.id, item]));

    return news.map((item) => {
      const analysis = analyzedById.get(item.id);
      if (!analysis) {
        return item;
      }

      return normalizedNewsSchema.parse({
        ...item,
        translatedTitle: analysis.translatedTitle || item.translatedTitle,
        aiSummary: analysis.aiSummary,
        whyImportant: analysis.whyImportant,
        importanceScore: analysis.importanceScore,
        keywords: analysis.keywords.length ? analysis.keywords : extractKeywords(`${item.title} ${item.summary}`),
        writingAngles: analysis.writingAngles
      });
    });
  } catch {
    return news;
  }
}

function chunkNews(news: News[], size: number) {
  const chunks: News[][] = [];
  for (let index = 0; index < news.length; index += size) {
    chunks.push(news.slice(index, index + size));
  }
  return chunks;
}

async function analyzeWithRetry(news: News[]) {
  let lastError: unknown;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const raw = await deepseekJson(
        [
          {
            role: "system",
            content:
              "你是「雷霆嘎巴写稿器」的新闻分析编辑。请批量分析 AI 科技新闻，补充适合公众号选题使用的中文标题翻译、摘要、重要性、关键词和写作角度。必须输出严格 JSON，不要 Markdown。"
          },
          {
            role: "user",
            content: JSON.stringify(
              {
                retryInstruction:
                  attempt > 0
                    ? "上一次返回没有通过 JSON 或 schema 校验。请只返回 { news: [...] } 严格 JSON。"
                    : undefined,
                outputSchema: {
                  news: [
                    {
                      id: "string",
                      translatedTitle: "string，保留原意的中文标题翻译，适合展示给中文读者",
                      aiSummary: "string",
                      whyImportant: "string",
                      importanceScore: "number 0-10",
                      keywords: ["string"],
                      writingAngles: [
                        {
                          angle: "string",
                          description: "string",
                          suitableFor: "string"
                        }
                      ]
                    }
                  ]
                },
                news: news.map((item) => ({
                  id: item.id || createNewsId(item.url || item.title),
                  title: item.title,
                  source: item.source,
                  publishedAt: item.publishedAt,
                  summary: item.summary,
                  keywords: item.keywords,
                  rawContent: item.rawContent
                }))
              },
              null,
              2
            )
          }
        ],
        { json: true, temperature: 0.25 }
      );

      return analyzeNewsResponseSchema.parse(raw);
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError instanceof Error ? lastError : new Error("DeepSeek news analysis failed.");
}
