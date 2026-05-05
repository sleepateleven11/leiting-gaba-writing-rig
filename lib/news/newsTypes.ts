import type { News, NewsProvider } from "@/types";

export type NewsListResponse = {
  provider: NewsProvider;
  updatedAt: string;
  news: News[];
  fallbackReason?: string;
};

export type GNewsArticle = {
  title?: string | null;
  description?: string | null;
  content?: string | null;
  url?: string | null;
  image?: string | null;
  publishedAt?: string | null;
  source?: {
    name?: string | null;
    url?: string | null;
  } | null;
};

export type GNewsResponse = {
  totalArticles?: number;
  articles: GNewsArticle[];
};
