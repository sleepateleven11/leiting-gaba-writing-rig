import type { DraftSectionStatus, DraftState, Outline } from "@/types";
import { countWords, INTRO_SECTION_ID, TITLE_SECTION_ID, CONCLUSION_SECTION_ID } from "@/lib/draft/articleBlocks";
import { sanitizeGeneratedText } from "@/lib/draft/sanitizeGeneratedText";

export type DraftTocItem = {
  sectionId: string;
  title: string;
  status: DraftSectionStatus["status"];
  wordCount: number;
};

export function createInitialSectionStatusMap(outline: Outline): Record<string, DraftSectionStatus> {
  return getDraftSectionIds(outline).reduce<Record<string, DraftSectionStatus>>((acc, sectionId) => {
    acc[sectionId] = { status: "empty", wordCount: 0 };
    return acc;
  }, {});
}

export function getDraftTocItems(outline: Outline, draftState: DraftState): DraftTocItem[] {
  const map = refreshSectionStatusMap(outline, draftState.editorContent, draftState.sectionStatusMap);
  return getDraftSectionIds(outline).map((sectionId) => ({
    sectionId,
    title: getDraftSectionTitle(outline, sectionId),
    status: map[sectionId]?.status ?? "empty",
    wordCount: map[sectionId]?.wordCount ?? 0
  }));
}

export function getDraftSectionIds(outline: Outline) {
  return [
    TITLE_SECTION_ID,
    INTRO_SECTION_ID,
    ...outline.sections.map((section) => section.id),
    CONCLUSION_SECTION_ID
  ];
}

export function getDraftSectionTitle(outline: Outline, sectionId: string) {
  if (sectionId === TITLE_SECTION_ID) {
    return outline.recommendedTitle || "推荐标题";
  }

  if (sectionId === INTRO_SECTION_ID) {
    return "开头";
  }

  if (sectionId === CONCLUSION_SECTION_ID) {
    return "结尾";
  }

  return outline.sections.find((section) => section.id === sectionId)?.title ?? "正文小节";
}

export function refreshSectionStatusMap(
  outline: Outline,
  content: string,
  previous: Record<string, DraftSectionStatus> = {},
  editedSectionId?: string
) {
  const next: Record<string, DraftSectionStatus> = {};

  for (const sectionId of getDraftSectionIds(outline)) {
    const previousStatus = previous[sectionId]?.status ?? "empty";
    const sectionText = getSectionText(content, outline, sectionId);
    const wordCount = countWords(sectionText);
    const hasContent = wordCount > 0;
    const status =
      previousStatus === "generating"
        ? "generating"
        : editedSectionId === sectionId && hasContent
          ? "edited"
          : previousStatus === "edited" && hasContent
            ? "edited"
            : hasContent
              ? "generated"
              : "empty";

    next[sectionId] = { status, wordCount };
  }

  return next;
}

export function getSectionText(content: string, outline: Outline, sectionId: string) {
  const lines = normalizeContent(content).split("\n");
  const range = findSectionRange(lines, outline, sectionId);
  if (!range) {
    return "";
  }

  return lines.slice(range.start, range.end).join("\n").trim();
}

export function replaceSectionContent(content: string, outline: Outline, sectionId: string, generatedText: string) {
  const cleanGenerated = sanitizeGeneratedText(generatedText);
  const normalized = ensureArticleTitle(normalizeContent(content), outline);
  const lines = normalized ? normalized.split("\n") : [];
  const range = findSectionRange(lines, outline, sectionId);
  const sectionText = buildSectionText(outline, sectionId, cleanGenerated);

  if (!range) {
    return insertMissingSection(lines, outline, sectionId, sectionText).join("\n").replace(/\n{3,}/g, "\n\n").trim();
  }

  const nextLines = [
    ...lines.slice(0, range.start),
    ...sectionText.split("\n"),
    ...lines.slice(range.end)
  ];

  return nextLines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

export function ensureArticleTitle(content: string, outline: Outline) {
  const clean = content.trim();
  if (!clean) {
    return outline.recommendedTitle;
  }

  const firstLine = clean.split("\n").find((line) => line.trim());
  if (firstLine === outline.recommendedTitle) {
    return clean;
  }

  return `${outline.recommendedTitle}\n\n${clean}`;
}

export function normalizeContent(content: string) {
  return sanitizeGeneratedText(content).replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

function buildSectionText(outline: Outline, sectionId: string, generatedText: string) {
  if (sectionId === TITLE_SECTION_ID) {
    return generatedText || outline.recommendedTitle;
  }

  if (sectionId === INTRO_SECTION_ID) {
    return generatedText;
  }

  const title = getDraftSectionTitle(outline, sectionId);
  const body = generatedText
    .split("\n")
    .filter((line, index) => index !== 0 || line.trim() !== title)
    .join("\n")
    .trim();

  return `${title}\n\n${body}`.trim();
}

function insertMissingSection(lines: string[], outline: Outline, sectionId: string, sectionText: string) {
  if (!lines.length) {
    return sectionId === TITLE_SECTION_ID
      ? [sectionText]
      : [outline.recommendedTitle, "", ...sectionText.split("\n")];
  }

  if (sectionId === INTRO_SECTION_ID) {
    return [lines[0] || outline.recommendedTitle, "", ...sectionText.split("\n"), "", ...lines.slice(1)];
  }

  if (sectionId === CONCLUSION_SECTION_ID) {
    return [...lines, "", ...sectionText.split("\n")];
  }

  const sectionIds = outline.sections.map((section) => section.id);
  const currentIndex = sectionIds.indexOf(sectionId);
  for (let index = currentIndex - 1; index >= 0; index -= 1) {
    const previousTitle = getDraftSectionTitle(outline, sectionIds[index]);
    const previousLine = findLineIndex(lines, previousTitle);
    if (previousLine >= 0) {
      const nextHeading = findNextHeadingIndex(lines, outline, previousLine + 1);
      const insertAt = nextHeading >= 0 ? nextHeading : lines.length;
      return [...lines.slice(0, insertAt), "", ...sectionText.split("\n"), "", ...lines.slice(insertAt)];
    }
  }

  const conclusionIndex = findLineIndex(lines, "结尾");
  if (conclusionIndex >= 0) {
    return [...lines.slice(0, conclusionIndex), "", ...sectionText.split("\n"), "", ...lines.slice(conclusionIndex)];
  }

  return [...lines, "", ...sectionText.split("\n")];
}

function findSectionRange(lines: string[], outline: Outline, sectionId: string) {
  if (!lines.length) {
    return undefined;
  }

  if (sectionId === TITLE_SECTION_ID) {
    return { start: 0, end: 1 };
  }

  if (sectionId === INTRO_SECTION_ID) {
    const start = lines[0]?.trim() === outline.recommendedTitle ? 1 : 0;
    const end = findNextHeadingIndex(lines, outline, start);
    return end > start ? { start, end } : undefined;
  }

  const title = getDraftSectionTitle(outline, sectionId);
  const headingIndex = findLineIndex(lines, title);
  if (headingIndex < 0) {
    return undefined;
  }

  const nextHeading = findNextHeadingIndex(lines, outline, headingIndex + 1);
  return {
    start: headingIndex,
    end: nextHeading >= 0 ? nextHeading : lines.length
  };
}

function findNextHeadingIndex(lines: string[], outline: Outline, start: number) {
  const headings = new Set([
    ...outline.sections.map((section) => section.title),
    "结尾"
  ]);

  for (let index = start; index < lines.length; index += 1) {
    if (headings.has(lines[index].trim())) {
      return index;
    }
  }

  return -1;
}

function findLineIndex(lines: string[], value: string) {
  return lines.findIndex((line) => line.trim() === value.trim());
}
