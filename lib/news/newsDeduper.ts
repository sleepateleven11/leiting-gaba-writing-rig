import type { News } from "@/types";

const MEDIA_SUFFIXES = [
  "the verge",
  "techcrunch",
  "reuters",
  "bloomberg",
  "wired",
  "venturebeat",
  "forbes",
  "cnbc",
  "zdnet"
];

export function dedupeNews(news: News[]) {
  const result: News[] = [];
  const seenUrls = new Set<string>();
  const seenTitles = new Set<string>();

  for (const item of news) {
    const urlKey = item.url.trim().toLowerCase();
    const titleKey = item.title.trim().toLowerCase();
    const normalizedTitle = normalizeTitle(item.title);

    if (urlKey && seenUrls.has(urlKey)) {
      continue;
    }

    if (titleKey && seenTitles.has(titleKey)) {
      continue;
    }

    const duplicate = result.some((existing) => {
      const existingTitle = normalizeTitle(existing.title);
      if (!normalizedTitle || !existingTitle) {
        return false;
      }

      if (normalizedTitle.includes(existingTitle) || existingTitle.includes(normalizedTitle)) {
        return true;
      }

      const sameSourceAndTime =
        existing.source === item.source && normalizeDate(existing.publishedAt) === normalizeDate(item.publishedAt);

      return jaccardSimilarity(normalizedTitle, existingTitle) > (sameSourceAndTime ? 0.78 : 0.85);
    });

    if (duplicate) {
      continue;
    }

    result.push(item);
    if (urlKey) {
      seenUrls.add(urlKey);
    }
    if (titleKey) {
      seenTitles.add(titleKey);
    }
  }

  return result;
}

export function normalizeTitle(title: string) {
  let normalized = title
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

  for (const suffix of MEDIA_SUFFIXES) {
    normalized = normalized.replace(new RegExp(`\\b${suffix}\\b$`, "i"), "").trim();
  }

  return normalized;
}

function normalizeDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toISOString().slice(0, 16);
}

function jaccardSimilarity(a: string, b: string) {
  const aTokens = new Set(a.split(" ").filter(Boolean));
  const bTokens = new Set(b.split(" ").filter(Boolean));
  const union = new Set([...aTokens, ...bTokens]);

  if (union.size === 0) {
    return 0;
  }

  let intersection = 0;
  for (const token of aTokens) {
    if (bTokens.has(token)) {
      intersection += 1;
    }
  }

  return intersection / union.size;
}
