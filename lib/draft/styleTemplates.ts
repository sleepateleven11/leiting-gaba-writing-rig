import type { StyleTemplate } from "@/types";

export const styleTemplates: StyleTemplate[] = [
  {
    id: "ai-tech-clean",
    name: "AI 科技简洁风",
    description: "适合新闻解读，信息密度高，短段落，小标题清晰，装饰少。",
    paragraphStyle:
      "font-size:16px;line-height:1.9;color:#1f2937;margin:0 0 16px;",
    headingStyle:
      "font-size:20px;line-height:1.45;font-weight:700;color:#0f172a;margin:28px 0 12px;border-left:4px solid #2563eb;padding-left:12px;",
    quoteStyle:
      "font-size:15px;line-height:1.8;color:#334155;background:#f1f5f9;border-left:4px solid #60a5fa;padding:12px 14px;margin:18px 0;",
    dividerStyle: "height:1px;background:#e2e8f0;margin:26px 0;border:0;"
  },
  {
    id: "deep-analysis",
    name: "深度分析风",
    description: "适合产品分析和趋势判断，结构感强，引用块适中，小标题更正式。",
    paragraphStyle:
      "font-size:16px;line-height:2;color:#111827;margin:0 0 18px;",
    headingStyle:
      "font-size:21px;line-height:1.45;font-weight:700;color:#111827;margin:32px 0 14px;padding-bottom:8px;border-bottom:1px solid #cbd5e1;",
    quoteStyle:
      "font-size:15px;line-height:1.9;color:#334155;background:#f8fafc;border:1px solid #dbeafe;padding:14px 16px;margin:20px 0;",
    dividerStyle: "height:1px;background:#cbd5e1;margin:30px 0;border:0;"
  },
  {
    id: "personal-opinion",
    name: "个人观点风",
    description: "适合博主表达，口语化，节奏轻快，金句突出，结尾有互动。",
    paragraphStyle:
      "font-size:16px;line-height:1.9;color:#1f2937;margin:0 0 15px;",
    headingStyle:
      "font-size:20px;line-height:1.45;font-weight:700;color:#111827;margin:28px 0 12px;",
    quoteStyle:
      "font-size:16px;line-height:1.8;color:#0f172a;background:#fff7ed;border-left:4px solid #f97316;padding:12px 14px;margin:18px 0;",
    dividerStyle: "height:1px;background:#fed7aa;margin:24px 0;border:0;"
  },
  {
    id: "brief-news",
    name: "快讯风",
    description: "适合热点新闻，开头直接，重点前置，段落短，判断明确。",
    paragraphStyle:
      "font-size:16px;line-height:1.75;color:#111827;margin:0 0 13px;",
    headingStyle:
      "font-size:19px;line-height:1.4;font-weight:700;color:#0f172a;margin:24px 0 10px;border-left:4px solid #0f172a;padding-left:10px;",
    quoteStyle:
      "font-size:15px;line-height:1.75;color:#1e293b;background:#eff6ff;padding:11px 13px;margin:16px 0;",
    dividerStyle: "height:1px;background:#dbeafe;margin:22px 0;border:0;"
  }
];

export function getStyleTemplate(id?: string) {
  return styleTemplates.find((template) => template.id === id) ?? styleTemplates[0];
}
