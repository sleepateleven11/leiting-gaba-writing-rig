import { GNEWS_PER_QUERY_LIMIT, GNEWS_QUERIES } from "@/lib/news/newsQueries";
import { gnewsResponseSchema } from "@/lib/news/newsSchemas";
import type { GNewsArticle } from "@/lib/news/newsTypes";

const GNEWS_BASE_URL = "https://gnews.io/api/v4/search";

export function hasGNewsConfig() {
  const key = process.env.GNEWS_API_KEY?.trim();
  return Boolean(key && !key.includes("请把这里替换"));
}

export async function fetchGNewsArticles() {
  const token = process.env.GNEWS_API_KEY?.trim();
  if (!token || token.includes("请把这里替换")) {
    throw new Error("GNEWS_API_KEY is not configured.");
  }

  // Use 2 queries in parallel to stay under 10s serverless timeout
  const batches = await Promise.allSettled(
    GNEWS_QUERIES.slice(0, 2).map((query) => fetchQuery(query, token))
  );
  const articles = batches.flatMap((batch) => (batch.status === "fulfilled" ? batch.value : []));

  if (!articles.length) {
    throw new Error("GNews returned no articles.");
  }

  return articles;
}

async function fetchQuery(query: string, token: string): Promise<GNewsArticle[]> {
  const url = new URL(GNEWS_BASE_URL);
  url.searchParams.set("q", query);
  url.searchParams.set("lang", "en");
  url.searchParams.set("max", String(GNEWS_PER_QUERY_LIMIT));
  url.searchParams.set("sortby", "publishedAt");
  url.searchParams.set("apikey", token);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4000);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: "application/json"
      }
    });

    if (!response.ok) {
      throw new Error(`GNews request failed with status ${response.status}.`);
    }

    const raw = await response.json();
    const parsed = gnewsResponseSchema.parse(raw);
    return parsed.articles;
  } finally {
    clearTimeout(timeout);
  }
}
