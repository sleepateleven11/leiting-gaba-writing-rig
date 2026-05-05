import { createId } from "@/lib/workspace";
import { styleTemplates } from "@/lib/draft/styleTemplates";
import type { ArticleBlock, DraftState, Outline, OutlineSection } from "@/types";

export type ArticleNavItem = {
  sectionId: string;
  sectionTitle: string;
  status: "empty" | "generated" | "edited" | "locked";
  locked: boolean;
  wordCount: number;
};

export const INTRO_SECTION_ID = "article-intro";
export const TITLE_SECTION_ID = "article-title";
export const CONCLUSION_SECTION_ID = "article-conclusion";

export function getOutlineId(outline: Outline) {
  return `outline-v${outline.version}-${outline.updatedAt}`;
}

export function createInitialDraftState(outline: Outline, templateId = styleTemplates[0].id): DraftState {
  return {
    outlineId: getOutlineId(outline),
    editorContent: "",
    sectionStatusMap: createInitialDraftSectionStatusMap(outline),
    blocks: createEmptyBlocksFromOutline(outline),
    selectedTemplateId: templateId,
    activeSectionId: TITLE_SECTION_ID,
    status: "empty",
    updatedAt: new Date().toISOString()
  };
}

function createInitialDraftSectionStatusMap(outline: Outline) {
  return [
    TITLE_SECTION_ID,
    INTRO_SECTION_ID,
    ...outline.sections.map((section) => section.id),
    CONCLUSION_SECTION_ID
  ].reduce<Record<string, { status: "empty"; wordCount: number }>>((acc, sectionId) => {
    acc[sectionId] = { status: "empty", wordCount: 0 };
    return acc;
  }, {});
}

export function createEmptyBlocksFromOutline(outline: Outline): ArticleBlock[] {
  const now = new Date().toISOString();
  const blocks: ArticleBlock[] = [
    {
      id: createId("block"),
      outlineSectionId: TITLE_SECTION_ID,
      type: "title",
      content: outline.recommendedTitle,
      status: "generated",
      locked: false,
      updatedAt: now
    },
    {
      id: createId("block"),
      outlineSectionId: INTRO_SECTION_ID,
      type: "intro",
      content: "",
      status: "empty",
      locked: false,
      updatedAt: now
    }
  ];

  outline.sections.forEach((section) => {
    blocks.push(
      {
        id: createId("block"),
        outlineSectionId: section.id,
        type: "heading",
        content: section.title,
        status: "generated",
        locked: false,
        updatedAt: now
      },
      {
        id: createId("block"),
        outlineSectionId: section.id,
        type: "paragraph",
        content: "",
        status: "empty",
        locked: false,
        updatedAt: now
      }
    );
  });

  blocks.push(
    {
      id: createId("block"),
      outlineSectionId: CONCLUSION_SECTION_ID,
      type: "conclusion",
      content: "",
      status: "empty",
      locked: false,
      updatedAt: now
    },
    {
      id: createId("block"),
      outlineSectionId: CONCLUSION_SECTION_ID,
      type: "cta",
      content: "",
      status: "empty",
      locked: false,
      updatedAt: now
    }
  );

  return blocks;
}

export function getSectionTitle(sectionId: string, outline: Outline) {
  if (sectionId === TITLE_SECTION_ID) {
    return "推荐标题";
  }

  if (sectionId === INTRO_SECTION_ID) {
    return "开头";
  }

  if (sectionId === CONCLUSION_SECTION_ID) {
    return "结尾";
  }

  return outline.sections.find((section) => section.id === sectionId)?.title ?? "正文小节";
}

export function createSyntheticSection(sectionId: string, outline: Outline): OutlineSection {
  if (sectionId === INTRO_SECTION_ID) {
    return {
      id: INTRO_SECTION_ID,
      title: "开头",
      purpose: "用一个清晰的新闻切入点把读者带进文章。",
      keyPoints: [outline.intro],
      relatedNewsIds: outline.sections.flatMap((section) => section.relatedNewsIds).slice(0, 2),
      aiAdvice: "开头不要堆信息，先抛问题，再交代为什么值得读。",
      locked: false
    };
  }

  if (sectionId === CONCLUSION_SECTION_ID) {
    return {
      id: CONCLUSION_SECTION_ID,
      title: "结尾",
      purpose: "收束文章判断，并给读者一个可以带走的启发。",
      keyPoints: [outline.ending, outline.readerTakeaway],
      relatedNewsIds: outline.sections.flatMap((section) => section.relatedNewsIds),
      aiAdvice: "结尾回到核心观点，给出行动建议和互动问题。",
      locked: false
    };
  }

  const section = outline.sections.find((item) => item.id === sectionId);
  if (section) {
    return section;
  }

  return {
    id: sectionId,
    title: "正文小节",
    purpose: "补充这一节正文。",
    keyPoints: [],
    relatedNewsIds: [],
    aiAdvice: "保持短段落和明确判断。",
    locked: false
  };
}

export function getArticleNavItems(outline: Outline, blocks: ArticleBlock[]): ArticleNavItem[] {
  const sectionIds = [
    TITLE_SECTION_ID,
    INTRO_SECTION_ID,
    ...outline.sections.map((section) => section.id),
    CONCLUSION_SECTION_ID
  ];

  return sectionIds.map((sectionId) => {
    const sectionBlocks = blocks.filter((block) => block.outlineSectionId === sectionId);
    const locked = sectionBlocks.some((block) => block.locked);
    const generated = sectionBlocks.some((block) => block.status !== "empty" && block.content.trim());
    const edited = sectionBlocks.some((block) => block.status === "edited");
    return {
      sectionId,
      sectionTitle: getSectionTitle(sectionId, outline),
      status: locked ? "locked" : edited ? "edited" : generated ? "generated" : "empty",
      locked,
      wordCount: countWords(sectionBlocks.map((block) => block.content).join(""))
    };
  });
}

export function countWords(content: string) {
  const chineseChars = content.match(/[\u4e00-\u9fa5]/g)?.length ?? 0;
  const englishWords = content
    .replace(/[\u4e00-\u9fa5]/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
  return chineseChars + englishWords;
}

export function mergeGeneratedBlocks(
  currentBlocks: ArticleBlock[],
  generatedBlocks: ArticleBlock[],
  sectionId: string,
  options: { allowOverwriteEdited?: boolean } = {}
) {
  const generated = generatedBlocks.filter((block) => block.outlineSectionId === sectionId);
  if (!generated.length) {
    return currentBlocks;
  }

  const preserved = currentBlocks.filter(
    (block) =>
      block.outlineSectionId === sectionId &&
      (block.locked || (block.status === "edited" && !options.allowOverwriteEdited))
  );
  const sectionStartIndex = currentBlocks.findIndex((block) => block.outlineSectionId === sectionId);
  const withoutSection = currentBlocks.filter((block) => block.outlineSectionId !== sectionId);
  const insertionIndex =
    sectionStartIndex < 0
      ? withoutSection.length
      : withoutSection.findIndex((_, index) => index >= sectionStartIndex);
  const nextSectionBlocks = [...preserved, ...generated.filter((block) => !preserved.some((item) => item.id === block.id))];

  if (insertionIndex < 0) {
    return [...withoutSection, ...nextSectionBlocks];
  }

  return [
    ...withoutSection.slice(0, insertionIndex),
    ...nextSectionBlocks,
    ...withoutSection.slice(insertionIndex)
  ];
}

export function mergeDraftBlocks(
  currentBlocks: ArticleBlock[],
  generatedBlocks: ArticleBlock[],
  options: { allowOverwriteEdited?: boolean } = {}
) {
  const generatedById = new Map(generatedBlocks.map((block) => [block.id, block]));
  const generatedBySection = new Map<string, ArticleBlock[]>();
  generatedBlocks.forEach((block) => {
    generatedBySection.set(block.outlineSectionId, [
      ...(generatedBySection.get(block.outlineSectionId) ?? []),
      block
    ]);
  });

  const usedGeneratedIds = new Set<string>();
  const next = currentBlocks.flatMap((block) => {
    if (block.locked || (block.status === "edited" && !options.allowOverwriteEdited)) {
      return [block];
    }

    const exact = generatedById.get(block.id);
    if (exact) {
      usedGeneratedIds.add(exact.id);
      return [exact];
    }

    const sameSection = generatedBySection.get(block.outlineSectionId) ?? [];
    const replacement = sameSection.find((item) => item.type === block.type && !usedGeneratedIds.has(item.id));
    if (replacement) {
      usedGeneratedIds.add(replacement.id);
      return [replacement];
    }

    return [block];
  });

  generatedBlocks.forEach((block) => {
    if (!usedGeneratedIds.has(block.id) && !next.some((item) => item.id === block.id)) {
      next.push(block);
    }
  });

  return next;
}
