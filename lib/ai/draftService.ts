import type {
  ArticleBlock,
  Outline,
  OutlineSection,
  RewriteInstruction,
  StyleTemplate,
  WorkspaceState
} from "@/types";
import { deepseekJson, hasDeepSeekConfig } from "@/lib/ai/deepseekClient";
import { compactWorkspace } from "@/lib/ai/aiService";
import {
  generateDraftPrompt,
  generateSectionPrompt,
  rewriteBlockPrompt
} from "@/lib/ai/prompts";
import {
  generateDraftResponseSchema,
  generateSectionResponseSchema,
  rewriteBlockResponseSchema,
  type GenerateDraftResponse,
  type GenerateSectionResponse,
  type RewriteBlockResponse
} from "@/lib/ai/schemas";
import {
  mockGenerateDraft,
  mockGenerateSection,
  mockRewriteBlock
} from "@/lib/draft/mockDraft";

type GenerateSectionInput = {
  workspace: WorkspaceState;
  outline: Outline;
  section: OutlineSection;
  existingBlocks: ArticleBlock[];
  styleTemplate: StyleTemplate;
};

type RewriteBlockInput = {
  workspace: WorkspaceState;
  outline: Outline;
  block: ArticleBlock;
  instruction: RewriteInstruction;
  customInstruction?: string;
  styleTemplate: StyleTemplate;
};

type GenerateDraftInput = {
  workspace: WorkspaceState;
  outline: Outline;
  existingBlocks: ArticleBlock[];
  styleTemplate: StyleTemplate;
  allowOverwriteEdited?: boolean;
};

export async function generateSection(input: GenerateSectionInput): Promise<GenerateSectionResponse & { fallback?: "mock" }> {
  if (!hasDeepSeekConfig()) {
    return {
      ...mockGenerateSection(input),
      fallback: "mock"
    };
  }

  try {
    const parsed = await jsonWithRetry(
      (attempt) => [
        { role: "system" as const, content: generateSectionPrompt },
        {
          role: "user" as const,
          content: JSON.stringify(
            {
              retryInstruction:
                attempt > 0
                  ? "上一次返回没有通过 JSON 或 schema 校验。请只返回严格 JSON，并确保 blocks 里的 outlineSectionId 等于当前 section.id。"
                  : undefined,
              workspace: compactWorkspace(input.workspace),
              outline: input.outline,
              section: input.section,
              existingBlocks: input.existingBlocks,
              styleTemplate: input.styleTemplate
            },
            null,
            2
          )
        }
      ],
      (raw) => generateSectionResponseSchema.parse(raw)
    );

    return {
      blocks: sanitizeGeneratedBlocks(parsed.blocks, input.existingBlocks, {
        sectionId: input.section.id
      })
    };
  } catch {
    return {
      ...mockGenerateSection(input),
      fallback: "mock"
    };
  }
}

export async function rewriteBlock(input: RewriteBlockInput): Promise<RewriteBlockResponse & { fallback?: "mock" }> {
  if (input.block.locked) {
    throw new Error("BLOCK_LOCKED");
  }

  if (!hasDeepSeekConfig()) {
    return {
      ...mockRewriteBlock(input.block, input.instruction, input.customInstruction),
      fallback: "mock"
    };
  }

  try {
    const parsed = await jsonWithRetry(
      (attempt) => [
        { role: "system" as const, content: rewriteBlockPrompt },
        {
          role: "user" as const,
          content: JSON.stringify(
            {
              retryInstruction:
                attempt > 0
                  ? "上一次返回没有通过 JSON 或 schema 校验。请只返回 { block: ... }，并保留原 block.id 和 outlineSectionId。"
                  : undefined,
              workspace: compactWorkspace(input.workspace),
              outline: input.outline,
              block: input.block,
              instruction: input.instruction,
              customInstruction: input.customInstruction,
              styleTemplate: input.styleTemplate
            },
            null,
            2
          )
        }
      ],
      (raw) => rewriteBlockResponseSchema.parse(raw)
    );

    return {
      block: {
        ...parsed.block,
        id: input.block.id,
        outlineSectionId: input.block.outlineSectionId,
        type: input.block.type,
        locked: false,
        status: "generated",
        updatedAt: new Date().toISOString()
      }
    };
  } catch {
    return {
      ...mockRewriteBlock(input.block, input.instruction, input.customInstruction),
      fallback: "mock"
    };
  }
}

export async function generateDraft(input: GenerateDraftInput): Promise<GenerateDraftResponse & { fallback?: "mock" }> {
  if (!hasDeepSeekConfig()) {
    return {
      ...mockGenerateDraft(input),
      fallback: "mock"
    };
  }

  try {
    const parsed = await jsonWithRetry(
      (attempt) => [
        { role: "system" as const, content: generateDraftPrompt },
        {
          role: "user" as const,
          content: JSON.stringify(
            {
              retryInstruction:
                attempt > 0
                  ? "上一次返回没有通过 JSON 或 schema 校验。请只返回 { blocks: [...] }，不要覆盖 locked 或未授权覆盖的 edited block。"
                  : undefined,
              workspace: compactWorkspace(input.workspace),
              outline: input.outline,
              existingBlocks: input.existingBlocks,
              styleTemplate: input.styleTemplate,
              allowOverwriteEdited: Boolean(input.allowOverwriteEdited)
            },
            null,
            2
          )
        }
      ],
      (raw) => generateDraftResponseSchema.parse(raw)
    );

    return {
      blocks: sanitizeGeneratedBlocks(parsed.blocks, input.existingBlocks, {
        allowOverwriteEdited: Boolean(input.allowOverwriteEdited)
      })
    };
  } catch {
    return {
      ...mockGenerateDraft(input),
      fallback: "mock"
    };
  }
}

async function jsonWithRetry<T>(
  buildMessages: (attempt: number) => Array<{ role: "system" | "user" | "assistant"; content: string }>,
  parse: (raw: unknown) => T
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const raw = await deepseekJson(buildMessages(attempt), { json: true });
      return parse(raw);
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError instanceof Error ? lastError : new Error("DeepSeek draft JSON call failed.");
}

function sanitizeGeneratedBlocks(
  generatedBlocks: ArticleBlock[],
  existingBlocks: ArticleBlock[],
  options: { sectionId?: string; allowOverwriteEdited?: boolean } = {}
) {
  const now = new Date().toISOString();
  const lockedTypesBySection = new Map<string, Set<string>>();
  const editedTypesBySection = new Map<string, Set<string>>();

  existingBlocks.forEach((block) => {
    if (block.locked) {
      lockedTypesBySection.set(block.outlineSectionId, lockedTypesBySection.get(block.outlineSectionId) ?? new Set());
      lockedTypesBySection.get(block.outlineSectionId)?.add(block.type);
    }

    if (block.status === "edited" && !options.allowOverwriteEdited) {
      editedTypesBySection.set(block.outlineSectionId, editedTypesBySection.get(block.outlineSectionId) ?? new Set());
      editedTypesBySection.get(block.outlineSectionId)?.add(block.type);
    }
  });

  return generatedBlocks
    .filter((block) => !options.sectionId || block.outlineSectionId === options.sectionId)
    .filter((block) => !lockedTypesBySection.get(block.outlineSectionId)?.has(block.type))
    .filter((block) => !editedTypesBySection.get(block.outlineSectionId)?.has(block.type))
    .map((block) => ({
      ...block,
      content: block.content ?? "",
      status: block.status === "empty" ? "generated" : block.status,
      locked: false,
      updatedAt: block.updatedAt || now
    }));
}
