import type { News, WritingAngle } from "@/types";

export function getTranslatedTitle(news: News) {
  if (news.translatedTitle?.trim()) {
    return news.translatedTitle.trim();
  }

  const summary = news.aiSummary?.trim();
  if (summary && /[\u4e00-\u9fff]/.test(summary)) {
    return summarizeChineseTitle(summary);
  }

  return "暂无中文标题";
}

export function formatWritingAngles(angles: WritingAngle[]) {
  return angles.map((item) => item.angle).join(" / ");
}

export function formatNewsTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

export function formatImportanceScore(score: number) {
  return Number.isInteger(score) ? String(score) : score.toFixed(1);
}

function summarizeChineseTitle(value: string) {
  const firstSentence = value.split(/[。！？.!?]/)[0]?.trim() || value.trim();
  return firstSentence.length > 34 ? `${firstSentence.slice(0, 34)}...` : firstSentence;
}
