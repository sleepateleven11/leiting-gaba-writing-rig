import type {
  ChatMessage,
  Outline,
  OutlineSection,
  SuggestionCardData,
  ThoughtBoard,
  WorkspaceState
} from "@/types";
import {
  createId,
  generateAiReply,
  optimizeOutline as optimizeMockOutline
} from "@/lib/workspace";
import { deepseekJson, hasDeepSeekConfig } from "@/lib/ai/deepseekClient";
import { chatPrompt, outlinePrompt, thoughtBoardPrompt } from "@/lib/ai/prompts";
import {
  chatResponseSchema,
  modelChatResponseSchema,
  modelOutlineResponseSchema,
  outlineSchema,
  thoughtBoardResponseSchema,
  thoughtBoardSchema,
  type ApiSuggestion,
  type ChatAIResponse
} from "@/lib/ai/schemas";

type Trigger = {
  type: "news_changed" | "option_selected" | "suggestion_applied" | "user_edited" | "chat_message";
  description: string;
};

export async function chatWithAI(input: {
  workspace: WorkspaceState;
  messages: ChatMessage[];
  userMessage: string;
}): Promise<ChatAIResponse & { fallback?: "mock" }> {
  if (!hasDeepSeekConfig()) {
    const fallback = generateAiReply(
      input.userMessage,
      input.workspace.selectedNews,
      input.workspace.thoughtBoard
    );

    return {
      assistantMessage: fallback.content,
      suggestions: fallback.suggestion ? [mapMockSuggestion(fallback.suggestion)] : [],
      fallback: "mock"
    };
  }

  const modelResponse = await jsonWithRetry(
    (attempt) => [
      { role: "system", content: chatPrompt },
      {
        role: "user",
        content: JSON.stringify(
          {
            retryInstruction:
              attempt > 0
                ? "上一次返回没有通过 JSON 或 schema 校验。请只返回符合格式的严格 JSON。"
                : undefined,
            workspace: compactWorkspace(input.workspace),
            recentMessages: input.messages.slice(-10).map((message) => ({
              role: message.role,
              content: message.content
            })),
            userMessage: input.userMessage
          },
          null,
          2
        )
      }
    ],
    (raw) => modelChatResponseSchema.parse(raw)
  );
  const normalized = {
    assistantMessage: modelResponse.assistantMessage,
    suggestions: modelResponse.suggestions.map((suggestion) => ({
      ...suggestion,
      id: suggestion.id || createId("sug")
    }))
  };

  return chatResponseSchema.parse(normalized);
}

export async function updateThoughtBoard(input: {
  workspace: WorkspaceState;
  trigger: Trigger;
}): Promise<{ thoughtBoard: ThoughtBoard; fallback?: "mock" }> {
  if (!hasDeepSeekConfig()) {
    return {
      thoughtBoard: input.workspace.thoughtBoard,
      fallback: "mock"
    };
  }

  const parsed = await jsonWithRetry(
    (attempt) => [
      { role: "system", content: thoughtBoardPrompt },
      {
        role: "user",
        content: JSON.stringify(
          {
            retryInstruction:
              attempt > 0
                ? "上一次返回没有通过 JSON 或 schema 校验。请只返回 { thoughtBoard: ... } 严格 JSON。"
                : undefined,
            trigger: input.trigger,
            workspace: compactWorkspace(input.workspace)
          },
          null,
          2
        )
      }
    ],
    (raw) => thoughtBoardResponseSchema.parse(raw)
  );
  const safeBoard = sanitizeThoughtBoard(parsed.thoughtBoard, input.workspace);

  return {
    thoughtBoard: thoughtBoardSchema.parse(safeBoard)
  };
}

export async function optimizeOutline(input: {
  workspace: WorkspaceState;
  thoughtBoard: ThoughtBoard;
  outline: Outline;
}): Promise<{ outline: Outline; changeSummary: string; fallback?: "mock" }> {
  if (!hasDeepSeekConfig()) {
    return {
      outline: optimizeMockOutline(input.outline, input.workspace.selectedNews, input.thoughtBoard),
      changeSummary: "使用 mock fallback 优化了未锁定大纲节点。",
      fallback: "mock"
    };
  }

  const parsed = await jsonWithRetry(
    (attempt) => [
      { role: "system", content: outlinePrompt },
      {
        role: "user",
        content: JSON.stringify(
          {
            retryInstruction:
              attempt > 0
                ? "上一次返回没有通过 JSON 或 schema 校验。请严格保留 locked=true 节点，并只返回指定 JSON。"
                : undefined,
            workspace: compactWorkspace(input.workspace),
            thoughtBoard: input.thoughtBoard,
            outline: input.outline
          },
          null,
          2
        )
      }
    ],
    (raw) => modelOutlineResponseSchema.parse(raw)
  );
  const outline = mergeOutlineWithLockedSections(
    parsed.outline,
    input.outline,
    input.workspace.selectedNews.map((item) => item.news.id)
  );

  return {
    outline: outlineSchema.parse(outline),
    changeSummary: parsed.changeSummary
  };
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

  throw lastError instanceof Error ? lastError : new Error("DeepSeek JSON call failed.");
}

export function compactWorkspace(workspace: WorkspaceState) {
  return {
    workspaceName: workspace.workspaceName,
    status: workspace.status,
    selectedNews: workspace.selectedNews.map((item) => ({
      id: item.news.id,
      title: item.news.title,
      translatedTitle: item.news.translatedTitle,
      source: item.news.source,
      publishedAt: item.news.publishedAt,
      summary: item.news.summary,
      keywords: item.news.keywords,
      importanceScore: item.news.importanceScore,
      aiSummary: item.news.aiSummary,
      whyImportant: item.news.whyImportant,
      writingAngles: item.news.writingAngles,
      role: item.role,
      note: item.note
    })),
    thoughtBoard: workspace.thoughtBoard,
    outline: workspace.outline,
    materialDirty: workspace.materialDirty,
    ideaDirty: workspace.ideaDirty
  };
}

function mapMockSuggestion(suggestion: SuggestionCardData): ApiSuggestion {
  return {
    id: suggestion.id,
    type: suggestion.coreIdea ? "core_opinion" : "main_thread",
    title: suggestion.headline || "可应用建议",
    description: suggestion.coreIdea || suggestion.mainLine || "保留这条建议作为写作参考。",
    applyPayload: {
      topic: suggestion.mainLine,
      targetReader: suggestion.targetReader,
      writingAngle: suggestion.writingAngle,
      stance: suggestion.stance,
      coreIdea: suggestion.coreIdea,
      supportReasons: suggestion.supportReasons,
      titles: suggestion.outlineTitle ? [suggestion.outlineTitle] : undefined
    }
  };
}

function sanitizeThoughtBoard(board: ThoughtBoard, workspace: WorkspaceState): ThoughtBoard {
  const current = workspace.thoughtBoard;
  const selectedIds = workspace.selectedNews.map((item) => item.news.id);
  const selectedIdSet = new Set(selectedIds);
  const mainNewsId =
    board.mainNewsId && selectedIdSet.has(board.mainNewsId)
      ? board.mainNewsId
      : current.mainNewsId && selectedIdSet.has(current.mainNewsId)
        ? current.mainNewsId
        : selectedIds[0];

  return {
    topic: board.topic || current.topic,
    mainNewsId,
    supportingNewsIds: board.supportingNewsIds.filter((id) => selectedIdSet.has(id) && id !== mainNewsId),
    targetReader: board.targetReader || current.targetReader,
    writingAngle: board.writingAngle || current.writingAngle,
    stance: board.stance || current.stance,
    coreIdea: board.coreIdea || current.coreIdea,
    supportReasons: board.supportReasons.length ? board.supportReasons : current.supportReasons,
    titles: board.titles.length ? board.titles : current.titles,
    openQuestions: board.openQuestions.length ? board.openQuestions : current.openQuestions
  };
}

function mergeOutlineWithLockedSections(
  modelOutline: {
    recommendedTitle: string;
    intro: string;
    sections: Array<{
      id?: string;
      sectionTitle: string;
      sectionGoal: string;
      keyPoints: string[];
      relatedNewsIds: string[];
      writingTips: string;
      locked: boolean;
    }>;
    ending: string;
    readerTakeaway: string;
  },
  previous: Outline,
  selectedNewsIds: string[]
): Outline {
  const selectedIdSet = new Set(selectedNewsIds);
  const candidateSections: OutlineSection[] = modelOutline.sections.map((section, index) => ({
    id: section.id || previous.sections[index]?.id || createId("sec"),
    title: section.sectionTitle,
    purpose: section.sectionGoal,
    keyPoints: section.keyPoints,
    relatedNewsIds: section.relatedNewsIds.filter((id) => selectedIdSet.has(id)),
    aiAdvice: section.writingTips,
    locked: false
  }));

  const usedCandidateIds = new Set<string>();
  const candidateById = new Map(candidateSections.map((section) => [section.id, section]));
  const mergedSections = previous.sections.map((section, index) => {
    if (section.locked) {
      usedCandidateIds.add(section.id);
      return section;
    }

    const exact = candidateById.get(section.id);
    if (exact) {
      usedCandidateIds.add(exact.id);
      return { ...exact, id: section.id, locked: false };
    }

    const byIndex = candidateSections[index];
    if (byIndex && !usedCandidateIds.has(byIndex.id)) {
      usedCandidateIds.add(byIndex.id);
      return { ...byIndex, id: section.id, locked: false };
    }

    return section;
  });

  for (const candidate of candidateSections) {
    if (mergedSections.length >= 5) {
      break;
    }

    if (!usedCandidateIds.has(candidate.id)) {
      mergedSections.push(candidate);
    }
  }

  return {
    recommendedTitle: modelOutline.recommendedTitle,
    intro: modelOutline.intro,
    sections: mergedSections.length ? mergedSections : previous.sections,
    ending: modelOutline.ending,
    readerTakeaway: modelOutline.readerTakeaway,
    version: previous.version + 1,
    updatedAt: new Date().toISOString()
  };
}
