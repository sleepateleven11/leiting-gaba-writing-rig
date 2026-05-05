import { createHash } from "crypto";
import type { News, WritingAngle } from "@/types";
import type { GNewsArticle } from "@/lib/news/newsTypes";

const KEYWORD_MATCHERS: Array<[string, RegExp]> = [
  ["OpenAI", /\bopenai\b/i],
  ["Anthropic", /\banthropic\b/i],
  ["Google", /\bgoogle\b/i],
  ["DeepMind", /\bdeepmind\b/i],
  ["DeepSeek", /\bdeepseek\b/i],
  ["Claude", /\bclaude\b/i],
  ["ChatGPT", /\bchatgpt\b/i],
  ["Gemini", /\bgemini\b/i],
  ["Llama", /\bllama\b/i],
  ["Qwen", /\bqwen\b/i],
  ["Grok", /\bgrok\b/i],
  ["AI Agent", /\b(ai agent|agentic|agents?)\b/i],
  ["LLM", /\b(llm|large language model)\b/i],
  ["Multimodal", /\b(multimodal|vision language)\b/i],
  ["Coding", /\b(coding|developer|programming|code)\b/i],
  ["Cursor", /\bcursor\b/i],
  ["Claude Code", /\bclaude code\b/i],
  ["Search", /\bsearch\b/i],
  ["Robotics", /\b(robotics|robot)\b/i],
  ["Open source", /\b(open source|open-source)\b/i],
  ["Model", /\b(model|models)\b/i],
  ["API", /\bapi\b/i]
];

const SOURCE_WEIGHTS: Array<[RegExp, number]> = [
  [/\b(openai|anthropic|google|deepmind|microsoft|meta|nvidia|hugging face)\b/i, 1.8],
  [/\b(reuters|techcrunch|the verge|venturebeat|wired|bloomberg|cnbc|financial times)\b/i, 1.3],
  [/\b(arxiv|mit technology review|semianalysis)\b/i, 1.1]
];

const TOPIC_WEIGHTS: Array<[RegExp, number]> = [
  [/\b(model release|launches|released|new model|frontier model)\b/i, 1.4],
  [/\b(ai agent|coding agent|agentic)\b/i, 1.4],
  [/\b(multimodal|video model|vision model)\b/i, 1.1],
  [/\b(api|developer platform)\b/i, 0.9],
  [/\b(open source|open-source)\b/i, 1],
  [/\b(benchmark|leaderboard)\b/i, 0.8],
  [/\b(funding|raises|acquisition|acquires)\b/i, 0.8],
  [/\b(regulation|safety|policy)\b/i, 0.7],
  [/\b(product|tool|coding|search|launch|agent|model)\b/i, 0.9]
];

export function normalizeGNewsArticle(article: GNewsArticle): News | undefined {
  const title = cleanText(article.title);
  const url = cleanText(article.url);
  const source = cleanText(article.source?.name) || "GNews";

  if (!title || !url) {
    return undefined;
  }

  const summary = truncate(cleanText(article.description) || cleanText(article.content) || title, 260);

  const publishedAt = normalizePublishedAt(article.publishedAt);
  const rawContent = cleanText(article.content);
  const keywords = extractKeywords(`${title} ${summary} ${rawContent ?? ""}`);
  const importanceScore = scoreNews({
    source,
    title,
    summary,
    publishedAt,
    keywords
  });

  return {
    id: createNewsId(url || `${title}-${publishedAt}`),
    title,
    translatedTitle: undefined,
    source,
    publishedAt,
    summary,
    url,
    imageUrl: cleanText(article.image),
    keywords,
    importanceScore,
    aiSummary: summary,
    whyImportant: buildRuleBasedWhyImportant(keywords),
    writingAngles: buildRuleBasedAngles(keywords),
    rawContent,
    provider: "gnews"
  };
}

export function extractKeywords(text: string) {
  const keywords = KEYWORD_MATCHERS.filter(([, pattern]) => pattern.test(text)).map(([keyword]) => keyword);
  return keywords.length ? Array.from(new Set(keywords)).slice(0, 6) : ["AI"];
}

export function scoreNews(input: {
  source: string;
  title: string;
  summary: string;
  publishedAt: string;
  keywords: string[];
}) {
  const haystack = `${input.source} ${input.title} ${input.summary}`;
  let score = 4.8;

  for (const [pattern, weight] of SOURCE_WEIGHTS) {
    if (pattern.test(input.source)) {
      score += weight;
      break;
    }
  }

  for (const [pattern, weight] of TOPIC_WEIGHTS) {
    if (pattern.test(haystack)) {
      score += weight;
    }
  }

  const ageMs = Date.now() - new Date(input.publishedAt).getTime();
  const dayMs = 24 * 60 * 60 * 1000;
  if (Number.isFinite(ageMs)) {
    if (ageMs <= dayMs) {
      score += 1.2;
    } else if (ageMs <= 3 * dayMs) {
      score += 0.7;
    } else if (ageMs > 7 * dayMs) {
      score -= 0.8;
    }
  }

  if (input.keywords.some((keyword) => ["OpenAI", "Anthropic", "DeepSeek", "Claude", "ChatGPT", "Gemini"].includes(keyword))) {
    score += 0.7;
  }

  return clampScore(score);
}

export function createNewsId(seed: string) {
  return createHash("sha1").update(seed).digest("hex").slice(0, 16);
}

export function sortNews(news: News[]) {
  return [...news].sort((a, b) => {
    if (b.importanceScore !== a.importanceScore) {
      return b.importanceScore - a.importanceScore;
    }

    return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
  });
}

function buildRuleBasedWhyImportant(keywords: string[]) {
  if (keywords.includes("AI Agent")) {
    return "这条新闻可能影响 AI 产品从问答工具走向任务执行工具的叙事，适合延展成公众号选题。";
  }

  if (keywords.includes("Coding") || keywords.includes("Claude Code") || keywords.includes("Cursor")) {
    return "它和开发者工具、AI 编程工作流相关，容易连接到产品变化和职业影响。";
  }

  if (keywords.includes("Model") || keywords.includes("LLM") || keywords.includes("Multimodal")) {
    return "模型能力变化会影响下游应用和内容生产方式，适合作为趋势判断素材。";
  }

  return "这条新闻和 AI 科技生态变化相关，可作为观察产品、模型或行业趋势的素材。";
}

function buildRuleBasedAngles(keywords: string[]): WritingAngle[] {
  const angles: WritingAngle[] = [];

  if (keywords.includes("Coding") || keywords.includes("Claude Code") || keywords.includes("Cursor")) {
    angles.push({
      angle: "产品分析",
      description: "拆解 AI 编程工具如何改变开发流程和产品边界。",
      suitableFor: "AI 产品经理 / 开发者"
    });
  }

  if (keywords.includes("AI Agent")) {
    angles.push({
      angle: "趋势判断",
      description: "观察 Agent 是否正在从演示能力走向真实任务执行。",
      suitableFor: "创业者 / AI 产品经理"
    });
  }

  if (keywords.includes("Model") || keywords.includes("LLM") || keywords.includes("Multimodal")) {
    angles.push({
      angle: "技术科普",
      description: "用普通读者能理解的方式解释模型能力变化。",
      suitableFor: "普通 AI 用户"
    });
  }

  if (!angles.length) {
    angles.push({
      angle: "新闻解读",
      description: "解释这条新闻背后的产品、行业或用户影响。",
      suitableFor: "AI 科技内容读者"
    });
  }

  return angles.slice(0, 3);
}

function normalizePublishedAt(value?: string | null) {
  const date = value ? new Date(value) : new Date();
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
}

function cleanText(value?: string | null) {
  return value?.replace(/\s+/g, " ").trim() || undefined;
}

function truncate(value: string, max: number) {
  return value.length > max ? `${value.slice(0, max - 1)}...` : value;
}

function clampScore(value: number) {
  return Math.max(0, Math.min(10, Number(value.toFixed(1))));
}
