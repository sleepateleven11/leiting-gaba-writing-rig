import type { Outline, OutlineSection, RewriteInstruction, StyleTemplate, WorkspaceState } from "@/types";
import { compactWorkspace } from "@/lib/ai/aiService";
import { hasDeepSeekConfig, streamDeepSeekChat } from "@/lib/ai/deepseekClient";
import {
  draftArticleStreamPrompt,
  draftSectionStreamPrompt,
  rewriteSelectionStreamPrompt
} from "@/lib/ai/prompts";
import type { SseSend } from "@/lib/ai/sseResponse";
import { sanitizeGeneratedText } from "@/lib/draft/sanitizeGeneratedText";
import {
  mockFullArticleText,
  mockRewriteSelectionText,
  mockSectionText
} from "@/lib/draft/mockArticleText";

type DraftStreamInput = {
  workspace: WorkspaceState;
  outline: Outline;
  styleTemplate: StyleTemplate;
  existingArticle?: string;
};

type SectionStreamInput = DraftStreamInput & {
  section: OutlineSection;
};

type RewriteSelectionStreamInput = {
  workspace: WorkspaceState;
  outline: Outline;
  selectedText: string;
  surroundingText: string;
  instruction: RewriteInstruction;
  customInstruction?: string;
  styleTemplate: StyleTemplate;
};

export async function streamDraftArticle(input: DraftStreamInput, send: SseSend) {
  send("start", { mode: "draft" });
  send("section_start", { sectionId: "draft", title: input.outline.recommendedTitle });

  const mockText = () => mockFullArticleText(input.workspace, input.outline);
  const text = await streamModelOrMock(
    [
      { role: "system" as const, content: draftArticleStreamPrompt },
      {
        role: "user" as const,
        content: JSON.stringify(
          {
            workspace: compactWorkspace(input.workspace),
            outline: input.outline,
            styleTemplate: input.styleTemplate,
            existingArticle: input.existingArticle || ""
          },
          null,
          2
        )
      }
    ],
    send,
    mockText
  );

  send("section_done", { sectionId: "draft" });
  send("done", { text });
}

export async function streamDraftSection(input: SectionStreamInput, send: SseSend) {
  send("start", { mode: "section", sectionId: input.section.id });
  send("section_start", { sectionId: input.section.id, title: input.section.title });

  const mockText = () => mockSectionText(input.workspace, input.outline, input.section);
  const text = await streamModelOrMock(
    [
      { role: "system" as const, content: draftSectionStreamPrompt },
      {
        role: "user" as const,
        content: JSON.stringify(
          {
            workspace: compactWorkspace(input.workspace),
            outline: input.outline,
            section: input.section,
            styleTemplate: input.styleTemplate,
            existingArticle: input.existingArticle || ""
          },
          null,
          2
        )
      }
    ],
    send,
    mockText
  );

  send("section_done", { sectionId: input.section.id });
  send("done", { text, sectionId: input.section.id });
}

export async function streamRewriteSelection(input: RewriteSelectionStreamInput, send: SseSend) {
  send("start", { mode: "rewrite" });

  const mockText = () =>
    mockRewriteSelectionText(input.selectedText, input.instruction, input.customInstruction);
  const text = await streamModelOrMock(
    [
      { role: "system" as const, content: rewriteSelectionStreamPrompt },
      {
        role: "user" as const,
        content: JSON.stringify(
          {
            workspace: compactWorkspace(input.workspace),
            outline: input.outline,
            selectedText: input.selectedText,
            surroundingText: input.surroundingText,
            instruction: input.instruction,
            customInstruction: input.customInstruction,
            styleTemplate: input.styleTemplate
          },
          null,
          2
        )
      }
    ],
    send,
    mockText
  );

  send("done", { text });
}

async function streamModelOrMock(
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>,
  send: SseSend,
  buildMockText: () => string
) {
  let collected = "";
  let emitted = false;

  if (hasDeepSeekConfig()) {
    try {
      await streamDeepSeekChat(messages, (event) => {
        if (event.type !== "content") {
          return;
        }

        emitted = true;
        collected += event.delta;
        send("delta", { delta: event.delta });
      }, { temperature: 0.42 });

      return sanitizeGeneratedText(collected);
    } catch (error) {
      if (emitted) {
        throw error;
      }
    }
  }

  collected = "";
  for (const chunk of chunkText(buildMockText(), 18)) {
    collected += chunk;
    send("delta", { delta: chunk, fallback: "mock" });
    await sleep(24);
  }

  return sanitizeGeneratedText(collected);
}

function chunkText(text: string, size: number) {
  const chunks: string[] = [];
  for (let index = 0; index < text.length; index += size) {
    chunks.push(text.slice(index, index + size));
  }
  return chunks;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
