import type { ArticleBlock, StyleTemplate } from "@/types";
import type { Outline } from "@/types";
import { sanitizeGeneratedText } from "@/lib/draft/sanitizeGeneratedText";

export function articleToHtml(blocks: ArticleBlock[], template: StyleTemplate) {
  const body = blocks
    .filter((block) => block.content.trim())
    .map((block) => blockToHtml(block, template))
    .join("\n");

  return `<section style="max-width:677px;margin:0 auto;background:#ffffff;color:#111827;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','PingFang SC','Microsoft YaHei',sans-serif;">\n${body}\n</section>`;
}

export function editorContentToHtml(content: string, template: StyleTemplate, outline?: Outline) {
  const lines = sanitizeGeneratedText(content)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const headingSet = new Set(outline ? [outline.recommendedTitle, ...outline.sections.map((section) => section.title), "结尾"] : []);

  const body = lines
    .map((line, index) => {
      if (index === 0 || headingSet.has(line)) {
        if (index === 0) {
          return `<h1 style="font-size:24px;line-height:1.45;font-weight:800;color:#0f172a;margin:0 0 18px;">${inlineFormat(escapeHtml(line))}</h1>`;
        }

        return `<h2 style="${template.headingStyle}">${inlineFormat(escapeHtml(line))}</h2>`;
      }

      if (line.startsWith(">")) {
        return `<blockquote style="${template.quoteStyle}">${inlineFormat(escapeHtml(line.replace(/^>\s*/, "")))}</blockquote>`;
      }

      return `<p style="${template.paragraphStyle}">${inlineFormat(escapeHtml(line))}</p>`;
    })
    .join("\n");

  return `<section style="max-width:677px;margin:0 auto;background:#ffffff;color:#111827;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','PingFang SC','Microsoft YaHei',sans-serif;">\n${body}\n</section>`;
}

function blockToHtml(block: ArticleBlock, template: StyleTemplate) {
  const content = inlineFormat(escapeHtml(block.content.trim()));

  if (block.type === "title") {
    return `<h1 style="font-size:24px;line-height:1.45;font-weight:800;color:#0f172a;margin:0 0 18px;">${content}</h1>`;
  }

  if (block.type === "heading") {
    return `<h2 style="${template.headingStyle}">${content}</h2>`;
  }

  if (block.type === "quote") {
    return `<blockquote style="${template.quoteStyle}">${content.replace(/\n/g, "<br />")}</blockquote>`;
  }

  if (block.type === "list") {
    const items = block.content
      .split(/\r?\n/)
      .filter(Boolean)
      .map((line) => `<li style="margin:0 0 8px;">${inlineFormat(escapeHtml(line.replace(/^-\s*/, "")))}</li>`)
      .join("");
    return `<ul style="padding-left:22px;margin:0 0 18px;color:#1f2937;line-height:1.85;">${items}</ul>`;
  }

  if (block.type === "cta") {
    return `<p style="${template.paragraphStyle}"><strong>${content}</strong></p>`;
  }

  if (block.type === "conclusion") {
    return `<hr style="${template.dividerStyle}" /><p style="${template.paragraphStyle}">${content.replace(/\n/g, "<br />")}</p>`;
  }

  return `<p style="${template.paragraphStyle}">${content.replace(/\n/g, "<br />")}</p>`;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function inlineFormat(value: string) {
  return value.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
}
