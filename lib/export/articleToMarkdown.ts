import type { ArticleBlock } from "@/types";
import { sanitizeGeneratedText } from "@/lib/draft/sanitizeGeneratedText";

export function articleToMarkdown(blocks: ArticleBlock[]) {
  return blocks
    .filter((block) => block.content.trim())
    .map((block) => {
      const content = block.content.trim();

      if (block.type === "title") {
        return `# ${content}`;
      }

      if (block.type === "heading") {
        return `## ${content}`;
      }

      if (block.type === "quote") {
        return content
          .split(/\r?\n/)
          .filter(Boolean)
          .map((line) => `> ${line}`)
          .join("\n");
      }

      if (block.type === "list") {
        return content
          .split(/\r?\n/)
          .filter(Boolean)
          .map((line) => (line.trim().startsWith("-") ? line.trim() : `- ${line.trim()}`))
          .join("\n");
      }

      if (block.type === "cta") {
        return `**${content}**`;
      }

      return content;
    })
    .join("\n\n");
}

export function editorContentToMarkdown(content: string) {
  return sanitizeGeneratedText(content).trim();
}
