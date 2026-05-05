import { z } from "zod";

export const gnewsArticleSchema = z.object({
  title: z.string().nullish(),
  description: z.string().nullish(),
  content: z.string().nullish(),
  url: z.string().url().nullish(),
  image: z.string().url().nullish(),
  publishedAt: z.string().nullish(),
  source: z
    .object({
      name: z.string().nullish(),
      url: z.string().url().nullish()
    })
    .nullish()
});

export const gnewsResponseSchema = z.object({
  totalArticles: z.number().optional(),
  articles: z.array(gnewsArticleSchema).default([])
});

export const writingAngleSchema = z.object({
  angle: z.string().min(1),
  description: z.string().min(1),
  suitableFor: z.string().min(1)
});

export const normalizedNewsSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  translatedTitle: z.string().optional(),
  source: z.string().min(1),
  publishedAt: z.string().min(1),
  summary: z.string().min(1),
  url: z.string().min(1),
  imageUrl: z.string().optional(),
  keywords: z.array(z.string()).min(1),
  importanceScore: z.number().min(0).max(10),
  aiSummary: z.string().min(1),
  whyImportant: z.string().min(1),
  writingAngles: z.array(writingAngleSchema).min(1),
  rawContent: z.string().optional(),
  provider: z.enum(["gnews", "newsapi", "rss", "mock"])
});

export const newsListResponseSchema = z.object({
  provider: z.enum(["gnews", "newsapi", "rss", "mock"]),
  updatedAt: z.string().min(1),
  news: z.array(normalizedNewsSchema),
  fallbackReason: z.string().optional()
});

export const analyzedNewsItemSchema = z.object({
  id: z.string().min(1),
  translatedTitle: z.string().min(1).optional(),
  aiSummary: z.string().min(1),
  whyImportant: z.string().min(1),
  importanceScore: z.number().min(0).max(10),
  keywords: z.array(z.string()).min(1),
  writingAngles: z.array(writingAngleSchema).min(1)
});

export const analyzeNewsResponseSchema = z.object({
  news: z.array(analyzedNewsItemSchema)
});

export const analyzeNewsApiResponseSchema = z.object({
  news: z.array(normalizedNewsSchema)
});
