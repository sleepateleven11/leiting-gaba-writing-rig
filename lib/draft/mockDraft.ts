import { createId } from "@/lib/workspace";
import type {
  ArticleBlock,
  Outline,
  OutlineSection,
  RewriteInstruction,
  StyleTemplate,
  WorkspaceState
} from "@/types";

type SectionInput = {
  workspace: WorkspaceState;
  outline: Outline;
  section: OutlineSection;
  existingBlocks: ArticleBlock[];
  styleTemplate: StyleTemplate;
};

type DraftInput = {
  workspace: WorkspaceState;
  outline: Outline;
  existingBlocks: ArticleBlock[];
  styleTemplate: StyleTemplate;
  allowOverwriteEdited?: boolean;
};

export function mockGenerateSection(input: SectionInput) {
  const now = new Date().toISOString();
  const sectionBlocks = input.existingBlocks.filter((block) => block.outlineSectionId === input.section.id);
  const reusableHeading = sectionBlocks.find((block) => block.type === "heading");
  const reusableParagraph = sectionBlocks.find((block) => block.type === "paragraph");
  const reusableQuote = sectionBlocks.find((block) => block.type === "quote");
  const reusableList = sectionBlocks.find((block) => block.type === "list");
  const facts = getSectionFacts(input);
  const coreIdea = input.workspace.thoughtBoard.coreIdea || input.section.purpose;
  const reader = input.workspace.thoughtBoard.targetReader || "正在关注 AI 的读者";
  const angle = input.workspace.thoughtBoard.writingAngle || "新闻解读";

  const blocks: ArticleBlock[] = [
    {
      id: reusableHeading?.id || createId("block"),
      outlineSectionId: input.section.id,
      type: "heading",
      content: input.section.title,
      status: "generated",
      locked: reusableHeading?.locked ?? false,
      updatedAt: now
    },
    {
      id: reusableParagraph?.id || createId("block"),
      outlineSectionId: input.section.id,
      type: "paragraph",
      content: `这一节可以先把判断说清楚：${coreIdea}。如果从${angle}来看，真正值得写的不是单条新闻本身，而是它暴露出的产品方向和使用门槛变化。`,
      status: "generated",
      locked: reusableParagraph?.locked ?? false,
      updatedAt: now
    },
    {
      id: reusableQuote?.id || createId("block"),
      outlineSectionId: input.section.id,
      type: "quote",
      content: `对${reader}来说，关键不是“又有一个 AI 产品更新了”，而是判断它会不会进入真实工作流。`,
      status: "generated",
      locked: reusableQuote?.locked ?? false,
      updatedAt: now
    },
    {
      id: reusableList?.id || createId("block"),
      outlineSectionId: input.section.id,
      type: "list",
      content: [
        `先看变化：${input.section.keyPoints[0] || input.section.purpose}`,
        `再看证据：${facts[0] || "目前素材更适合谨慎观察，避免过度外推"}`,
        `最后落点：把它翻译成${reader}能采取的下一步判断`
      ].join("\n"),
      status: "generated",
      locked: reusableList?.locked ?? false,
      updatedAt: now
    }
  ];

  return {
    blocks: blocks.filter((block) => !block.locked)
  };
}

export function mockRewriteBlock(
  block: ArticleBlock,
  instruction: RewriteInstruction,
  customInstruction?: string
) {
  const now = new Date().toISOString();
  const content = block.content.trim() || "这里需要补上一段围绕大纲的正文。";
  const rewritten = rewriteContent(content, instruction, customInstruction);

  return {
    block: {
      ...block,
      content: rewritten,
      status: "generated" as const,
      updatedAt: now
    }
  };
}

export function mockGenerateDraft(input: DraftInput) {
  let blocks = [...input.existingBlocks];

  for (const section of [
    createIntroSection(input.outline),
    ...input.outline.sections,
    createConclusionSection(input.outline)
  ]) {
    const canGenerate = blocks.some(
      (block) =>
        block.outlineSectionId === section.id &&
        !block.locked &&
        (block.status === "empty" || (input.allowOverwriteEdited && block.status === "edited"))
    );

    if (!canGenerate) {
      continue;
    }

    const generated = mockGenerateSection({
      workspace: input.workspace,
      outline: input.outline,
      section,
      existingBlocks: blocks,
      styleTemplate: input.styleTemplate
    }).blocks;

    blocks = replaceSectionBlocks(blocks, section.id, generated, input.allowOverwriteEdited);
  }

  return { blocks };
}

function replaceSectionBlocks(
  currentBlocks: ArticleBlock[],
  sectionId: string,
  generatedBlocks: ArticleBlock[],
  allowOverwriteEdited?: boolean
) {
  const firstIndex = currentBlocks.findIndex((block) => block.outlineSectionId === sectionId);
  const preserved = currentBlocks.filter(
    (block) =>
      block.outlineSectionId === sectionId &&
      (block.locked || (block.status === "edited" && !allowOverwriteEdited))
  );
  const withoutSection = currentBlocks.filter((block) => block.outlineSectionId !== sectionId);
  const nextSection = [
    ...preserved,
    ...generatedBlocks.filter((block) => !preserved.some((item) => item.id === block.id))
  ];

  if (firstIndex < 0) {
    return [...withoutSection, ...nextSection];
  }

  const insertionIndex = Math.min(firstIndex, withoutSection.length);
  return [
    ...withoutSection.slice(0, insertionIndex),
    ...nextSection,
    ...withoutSection.slice(insertionIndex)
  ];
}

function createIntroSection(outline: Outline): OutlineSection {
  return {
    id: "article-intro",
    title: "开头",
    purpose: outline.intro,
    keyPoints: [outline.intro],
    relatedNewsIds: outline.sections.flatMap((section) => section.relatedNewsIds).slice(0, 2),
    aiAdvice: "用问题感打开文章，快速告诉读者为什么这件事值得看。",
    locked: false
  };
}

function createConclusionSection(outline: Outline): OutlineSection {
  return {
    id: "article-conclusion",
    title: "结尾",
    purpose: outline.ending,
    keyPoints: [outline.ending, outline.readerTakeaway],
    relatedNewsIds: outline.sections.flatMap((section) => section.relatedNewsIds),
    aiAdvice: "收束观点，给出一个可以带走的判断和互动问题。",
    locked: false
  };
}

function getSectionFacts(input: SectionInput) {
  const related = new Set(input.section.relatedNewsIds);
  const candidates = input.workspace.selectedNews
    .filter((item) => related.size === 0 || related.has(item.news.id))
    .map((item) => item.news.aiSummary || item.news.summary || item.news.title)
    .filter(Boolean);

  return candidates.length ? candidates : input.workspace.selectedNews.map((item) => item.news.summary).filter(Boolean);
}

function rewriteContent(content: string, instruction: RewriteInstruction, customInstruction?: string) {
  if (instruction === "expand") {
    return `${content}\n\n可以再往前推一步：这类变化一旦进入真实工作流，影响的就不只是工具选择，而是团队如何拆任务、验收结果和控制风险。`;
  }

  if (instruction === "shorten") {
    return content
      .split(/[。！？\n]/)
      .filter(Boolean)
      .slice(0, 2)
      .join("。")
      .concat("。");
  }

  if (instruction === "wechat_style") {
    return `换成公众号的说法，这件事可以这样看：${content}\n\n重点不在热闹，而在它会不会改变普通人的工作节奏。`;
  }

  if (instruction === "reduce_ai_tone") {
    return content
      .replace(/综上所述/g, "说到底")
      .replace(/值得关注的是/g, "我更在意的是")
      .concat("\n\n这不是一个可以立刻下结论的信号，但已经值得放进观察清单。");
  }

  if (instruction === "add_example") {
    return `${content}\n\n举个更贴近日常的例子：如果一个团队原本只是用 AI 补代码、查资料，现在开始让它拆任务、写说明、跟踪修改，那工具的价值就从“省一点时间”变成了“改变协作方式”。`;
  }

  if (instruction === "add_transition") {
    return `${content}\n\n但这还只是第一层。接下来更重要的问题是：这些变化会不会真的进入用户每天重复发生的工作流。`;
  }

  return customInstruction ? `${content}\n\n按你的补充要求调整：${customInstruction}` : content;
}
