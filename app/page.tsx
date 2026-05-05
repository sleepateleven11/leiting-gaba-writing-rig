"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { AppHeader } from "@/components/AppHeader";
import { NewsDetailDrawer } from "@/components/NewsDetailDrawer";
import { NewsHomePage } from "@/components/NewsHomePage";
import { WorkspacePage } from "@/components/WorkspacePage";
import { DraftWorkspacePage } from "@/components/draft/DraftWorkspacePage";

import { createInitialDraftState, createSyntheticSection, getOutlineId, mergeDraftBlocks, mergeGeneratedBlocks } from "@/lib/draft/articleBlocks";
import { getStyleTemplate } from "@/lib/draft/styleTemplates";
import { articleToHtml, editorContentToHtml } from "@/lib/export/articleToHtml";
import { articleToMarkdown, editorContentToMarkdown } from "@/lib/export/articleToMarkdown";
import { getSectionText, replaceSectionContent } from "@/lib/draft/editorContent";
import { sanitizeGeneratedText } from "@/lib/draft/sanitizeGeneratedText";
import { streamFetch } from "@/lib/stream/streamFetch";
import {
  applySuggestionToBoard,
  createId,
  createInitialOutline,
  createInitialThoughtBoard,
  deriveWorkspaceStatus,
  generateAssistantOpening,
  roleForNewSelection,
  syncBoardWithNews
} from "@/lib/workspace";
import type {
  ArticleBlock,
  ChatMessage,
  DraftState,
  News,
  NewsProvider,
  NewsRole,
  Outline,
  OutlineSection,
  QuickOptionKind,
  RewriteInstruction,
  SuggestionCardData,
  ThoughtBoard,
  WorkspaceNews,
  WorkspaceState,
  WorkspaceStatus
} from "@/types";

type NewsListApiResponse = {
  provider: NewsProvider;
  updatedAt: string;
  news: News[];
  fallbackReason?: string;
};

type ApiSuggestionPayload = {
  id: string;
  type: NonNullable<SuggestionCardData["type"]>;
  title: string;
  description: string;
  applyPayload: Record<string, unknown>;
};

type PageMode = "home" | "workspace";
type WorkspaceStage = "outline" | "draft";

type GenerateSectionApiResponse = {
  blocks: ArticleBlock[];
  fallback?: "mock";
};

type RewriteBlockApiResponse = {
  block: ArticleBlock;
  fallback?: "mock";
};

type GenerateDraftApiResponse = {
  blocks: ArticleBlock[];
  fallback?: "mock";
};

export default function Home() {
  const initialBoard = useMemo(() => createInitialThoughtBoard([]), []);
  const [newsList, setNewsList] = useState<News[]>([]);
  const [newsProvider, setNewsProvider] = useState<NewsProvider>("gnews");
  const [newsUpdatedAt, setNewsUpdatedAt] = useState<string>();
  const [newsLoading, setNewsLoading] = useState(true);
  const [newsRefreshing, setNewsRefreshing] = useState(false);
  const [pageMode, setPageMode] = useState<PageMode>("home");
  const [workspaceStage, setWorkspaceStage] = useState<WorkspaceStage>("outline");
  const [selectedNews, setSelectedNews] = useState<WorkspaceNews[]>([]);
  const [browsedNewsIds, setBrowsedNewsIds] = useState<string[]>([]);
  const [detailNews, setDetailNews] = useState<News | undefined>();
  const [thoughtBoard, setThoughtBoard] = useState<ThoughtBoard>(initialBoard);
  const [outline, setOutline] = useState<Outline>(() => createInitialOutline([], initialBoard));
  const [draftState, setDraftState] = useState<DraftState>(() =>
    createInitialDraftState(createInitialOutline([], initialBoard))
  );
  const [previousOutline, setPreviousOutline] = useState<Outline | undefined>();
  const [statusMode, setStatusMode] = useState<WorkspaceStatus>("empty");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [materialDirty, setMaterialDirty] = useState(false);
  const [ideaDirty, setIdeaDirty] = useState(false);
  const [highlightedFields, setHighlightedFields] = useState<string[]>([]);
  const [highlightedSectionIds, setHighlightedSectionIds] = useState<string[]>([]);
  const [generatingSectionIds, setGeneratingSectionIds] = useState<string[]>([]);
  const [rewritingBlockIds, setRewritingBlockIds] = useState<string[]>([]);
  const [isGeneratingDraft, setIsGeneratingDraft] = useState(false);
  const thoughtBoardRequestId = useRef(0);
  const thoughtBoardEditTimer = useRef<number | undefined>(undefined);
  const draftAbortRef = useRef<AbortController | null>(null);
  const sectionAbortRef = useRef<AbortController | null>(null);
  const rewriteAbortRef = useRef<AbortController | null>(null);
  const [isRewriting, setIsRewriting] = useState(false);
  const [rewriteResult, setRewriteResult] = useState("");
  const [rewriteInstruction, setRewriteInstruction] = useState("");
  const [selectedRewriteText, setSelectedRewriteText] = useState("");

  const status = deriveWorkspaceStatus(selectedNews, thoughtBoard, statusMode);
  const workspaceName = thoughtBoard.topic || "AI 编程工具选题构思";
  const workspaceNewsPool = useMemo(
    () => mergeNewsById(newsList, selectedNews.map((item) => item.news)),
    [newsList, selectedNews]
  );
  const selectedStyleTemplate = useMemo(
    () => getStyleTemplate(draftState.selectedTemplateId),
    [draftState.selectedTemplateId]
  );

  useEffect(() => {
    void loadNews(false);
  }, []);

  function buildWorkspaceState(overrides: Partial<WorkspaceState> = {}): WorkspaceState {
    return {
      workspaceName,
      selectedNews,
      browsedNewsIds,
      thoughtBoard,
      outline,
      previousOutline,
      status,
      materialDirty,
      ideaDirty,
      ...overrides
    };
  }

  function addToast(title: string, description?: string, tone: "info" | "success" | "warning" = "info") {
    if (tone === "warning") {
      toast.warning(title, { description });
    } else if (tone === "success") {
      toast.success(title, { description });
    } else {
      toast.info(title, { description });
    }
  }

  async function loadNews(forceRefresh: boolean) {
    if (forceRefresh) {
      setNewsRefreshing(true);
    } else {
      setNewsLoading(true);
    }

    try {
      const data = await postJson<NewsListApiResponse>(
        forceRefresh ? "/api/news/refresh" : "/api/news/list",
        undefined,
        forceRefresh ? "POST" : "GET"
      );
      setNewsList(data.news);
      setNewsProvider(data.provider);
      setNewsUpdatedAt(data.updatedAt);

      if (data.provider === "mock") {
        addToast("已使用 Mock 新闻", data.fallbackReason || "未配置 GNews 或新闻源暂不可用。", "warning");
      } else if (forceRefresh) {
        addToast("新闻已刷新", "已拉取并分析最新 AI 科技新闻。", "success");
      }
    } catch {
      setNewsProvider("mock");
      addToast("新闻加载失败", "请检查 GNEWS_API_KEY 是否正确配置。", "warning");
    } finally {
      setNewsLoading(false);
      setNewsRefreshing(false);
    }
  }

  function markFields(fields: string[]) {
    setHighlightedFields(fields);
    window.setTimeout(() => {
      setHighlightedFields((current) => current.filter((field) => !fields.includes(field)));
    }, 1200);
  }

  function markSections(sectionIds: string[]) {
    setHighlightedSectionIds(sectionIds);
    window.setTimeout(() => {
      setHighlightedSectionIds((current) => current.filter((id) => !sectionIds.includes(id)));
    }, 1200);
  }

  function requestThoughtBoardUpdate(
    nextBoard: ThoughtBoard,
    nextSelected: WorkspaceNews[],
    trigger: {
      type: "news_changed" | "option_selected" | "suggestion_applied" | "user_edited" | "chat_message";
      description: string;
    },
    debounce = false
  ) {
    const run = async () => {
      const requestId = thoughtBoardRequestId.current + 1;
      thoughtBoardRequestId.current = requestId;

      try {
        const data = await postJson<{ thoughtBoard: ThoughtBoard }>("/api/ai/update-thought-board", {
          workspace: buildWorkspaceState({
            selectedNews: nextSelected,
            thoughtBoard: nextBoard,
            outline: softRefreshOutline(outline, nextSelected, nextBoard)
          }),
          trigger
        });

        if (requestId !== thoughtBoardRequestId.current) {
          return;
        }

        setThoughtBoard(data.thoughtBoard);
        setOutline((current) => {
          const refreshed = softRefreshOutline(current, nextSelected, data.thoughtBoard);
          markSections(refreshed.sections.filter((section) => !section.locked).map((section) => section.id));
          return refreshed;
        });
        markFields(["topic", "targetReader", "writingAngle", "stance", "coreIdea", "supportReasons", "titles", "openQuestions"]);
      } catch {
        addToast("AI 思路板更新失败", "已保留当前思路板，稍后可继续编辑或优化。", "warning");
      }
    };

    if (debounce) {
      if (thoughtBoardEditTimer.current) {
        window.clearTimeout(thoughtBoardEditTimer.current);
      }
      thoughtBoardEditTimer.current = window.setTimeout(run, 700);
      return;
    }

    void run();
  }

  function normalizeRoles(items: WorkspaceNews[]): WorkspaceNews[] {
    if (items.length === 0) {
      return [];
    }

    const firstMain = items.find((item) => item.role === "main_news")?.news.id ?? items[0].news.id;
    return items.map((item) => {
      if (item.news.id === firstMain) {
        return { ...item, role: "main_news" };
      }

      return item.role === "main_news" ? { ...item, role: "supporting_news" } : item;
    });
  }

  function softRefreshOutline(current: Outline, nextSelected: WorkspaceNews[], nextBoard: ThoughtBoard): Outline {
    const fresh = createInitialOutline(nextSelected, nextBoard);
    const nextSections = fresh.sections.map((section, index) => {
      const previous = current.sections[index];
      if (previous?.locked) {
        return previous;
      }

      return {
        ...section,
        id: previous?.id ?? section.id,
        locked: previous?.locked ?? false
      };
    });

    return {
      ...current,
      recommendedTitle: fresh.recommendedTitle,
      intro: fresh.intro,
      ending: fresh.ending,
      readerTakeaway: fresh.readerTakeaway,
      sections: nextSections,
      updatedAt: new Date().toISOString()
    };
  }

  function applyMaterialChange(nextItems: WorkspaceNews[], toastTitle: string) {
    const normalized = normalizeRoles(nextItems);
    const nextBoard =
      normalized.length === 0
        ? createInitialThoughtBoard([])
        : selectedNews.length === 0
          ? createInitialThoughtBoard(normalized)
          : syncBoardWithNews(thoughtBoard, normalized);
    const nextOutline = softRefreshOutline(outline, normalized, nextBoard);

    setSelectedNews(normalized);
    setThoughtBoard(nextBoard);
    setOutline(nextOutline);
    setMaterialDirty(normalized.length > 0);
    setIdeaDirty(false);
    setStatusMode((current) => (current === "confirmed" ? "outlining" : current));
    markFields(["mainNewsId", "supportingNewsIds", "topic"]);
    markSections(nextOutline.sections.filter((section) => !section.locked).map((section) => section.id));
    addToast(toastTitle, "右侧已提示：素材已变化，是否优化大纲。", "success");
    requestThoughtBoardUpdate(nextBoard, normalized, {
      type: "news_changed",
      description: toastTitle
    });
  }

  function toggleNews(news: News) {
    const existing = selectedNews.find((item) => item.news.id === news.id);

    if (existing) {
      applyMaterialChange(
        selectedNews.filter((item) => item.news.id !== news.id),
        "已移出工作区"
      );
      return;
    }

    const next: WorkspaceNews[] = [
      ...selectedNews,
      {
        news,
        role: roleForNewSelection(selectedNews),
        note: "",
        addedAt: new Date().toISOString()
      }
    ];

    applyMaterialChange(next, "已加入工作区");
  }

  function openDetails(news: News) {
    setDetailNews(news);
    setBrowsedNewsIds((ids) => [news.id, ...ids.filter((id) => id !== news.id)].slice(0, 12));
  }

  function startWorkspace() {
    if (selectedNews.length === 0) {
      addToast("先选择至少一条新闻", "工作区需要素材，才能生成思路板和动态大纲。", "warning");
      return;
    }

    setPageMode("workspace");
    setWorkspaceStage("outline");
    if (messages.length === 0) {
      setMessages([generateAssistantOpening(selectedNews)]);
    }
    addToast("已进入写作工作区", "左侧素材、中间对话和右侧大纲已经联动。", "success");
  }

  function setNewsRole(id: string, role: NewsRole) {
    const next: WorkspaceNews[] = selectedNews.map((item): WorkspaceNews => {
      if (role === "main_news") {
        return {
          ...item,
          role: item.news.id === id ? "main_news" : item.role === "main_news" ? "supporting_news" : item.role
        };
      }

      return item.news.id === id ? { ...item, role } : item;
    });

    applyMaterialChange(next, role === "main_news" ? "主新闻已更新" : "新闻角色已更新");
  }

  function removeNews(id: string) {
    applyMaterialChange(
      selectedNews.filter((item) => item.news.id !== id),
      "已移出工作区"
    );
  }

  function updateNote(id: string, note: string) {
    setSelectedNews((items) =>
      items.map((item) => (item.news.id === id ? { ...item, note } : item))
    );
  }

  function updateThoughtField<K extends keyof ThoughtBoard>(field: K, value: ThoughtBoard[K]) {
    let nextBoard: ThoughtBoard = {
      ...thoughtBoard,
      [field]: value
    };
    let nextSelected = selectedNews;
    const materialFields: Array<keyof ThoughtBoard> = ["mainNewsId", "supportingNewsIds"];

    if (field === "mainNewsId" && typeof value === "string") {
      nextSelected = selectedNews.map((item) => ({
        ...item,
        role: item.news.id === value ? "main_news" : item.role === "main_news" ? "supporting_news" : item.role
      }));
      nextBoard = syncBoardWithNews(nextBoard, nextSelected);
    }

    if (field === "supportingNewsIds" && Array.isArray(value)) {
      nextSelected = selectedNews.map((item) => {
        if (item.news.id === nextBoard.mainNewsId) {
          return { ...item, role: "main_news" };
        }

        return {
          ...item,
          role: value.includes(item.news.id) ? "supporting_news" : "reference_news"
        };
      });
      nextBoard = syncBoardWithNews(nextBoard, nextSelected);
    }

    const nextOutline = softRefreshOutline(outline, nextSelected, nextBoard);
    setSelectedNews(nextSelected);
    setThoughtBoard(nextBoard);
    setOutline(nextOutline);
    markFields([String(field)]);
    markSections(nextOutline.sections.filter((section) => !section.locked).map((section) => section.id));

    if (materialFields.includes(field)) {
      setMaterialDirty(true);
      setIdeaDirty(false);
      addToast("素材关系已变化", "右侧可以继续优化大纲。");
      requestThoughtBoardUpdate(nextBoard, nextSelected, {
        type: "news_changed",
        description: `思路板字段 ${String(field)} 改变`
      });
    } else {
      setIdeaDirty(true);
      addToast("思路板已更新", "大纲区域已提示是否优化。");
      requestThoughtBoardUpdate(
        nextBoard,
        nextSelected,
        {
          type: "user_edited",
          description: `用户编辑了思路板字段 ${String(field)}`
        },
        true
      );
    }

    setStatusMode((current) => (current === "confirmed" ? "outlining" : current));
  }

  function pushUserMessage(content: string) {
    const message: ChatMessage = {
      id: createId("msg"),
      role: "user",
      content,
      createdAt: new Date().toISOString()
    };
    setMessages((items) => [...items, message]);
  }

  function requestAiReply(
    content: string,
    boardSnapshot = thoughtBoard,
    quickOption?: { kind: QuickOptionKind; value: string }
  ) {
    const selectedSnapshot = selectedNews;
    const outlineSnapshot = softRefreshOutline(outline, selectedSnapshot, boardSnapshot);
    const userMessage: ChatMessage = {
      id: createId("msg"),
      role: "user",
      content,
      createdAt: new Date().toISOString()
    };
    const assistantId = createId("msg");
    const assistantMessage: ChatMessage = {
      id: assistantId,
      role: "assistant",
      content: "",
      createdAt: new Date().toISOString(),
      isStreaming: true,
      streamingStatus: "正在理解新闻素材..."
    };
    const conversationMessages = [...messages, userMessage];
    const nextMessages = [...conversationMessages, assistantMessage];
    setMessages(nextMessages);
    setIsTyping(true);

    void (async () => {
      let receivedContent = false;

      try {
        await streamChatReply({
          assistantId,
          workspace: buildWorkspaceState({
            selectedNews: selectedSnapshot,
            thoughtBoard: boardSnapshot,
            outline: outlineSnapshot
          }),
          messages: conversationMessages,
          userMessage: quickOption ? `${content}` : content,
          onContent: () => {
            receivedContent = true;
          }
        });
      } catch {
        if (receivedContent) {
          finishStreamingMessage(assistantId);
          addToast("AI 流式响应中断", "已保留当前已生成内容，可稍后重试。", "warning");
          return;
        }

        try {
          updateAssistantMessage(assistantId, {
            streamingStatus: "流式响应不可用，正在切换普通模式..."
          });
          await requestNonStreamingAiReply({
            assistantId,
            workspace: buildWorkspaceState({
              selectedNews: selectedSnapshot,
              thoughtBoard: boardSnapshot,
              outline: outlineSnapshot
            }),
            messages: conversationMessages,
            userMessage: quickOption ? `${content}` : content
          });
        } catch {
          updateAssistantMessage(assistantId, {
            content: "这次 AI 对话请求失败了，当前聊天记录已保留。你可以稍后重试。",
            isStreaming: false,
            streamingStatus: undefined
          });
          addToast("AI 对话请求失败", "已保留当前页面状态，请稍后重试。", "warning");
        }
      } finally {
        setIsTyping(false);
      }
    })();
  }

  function updateAssistantMessage(id: string, patch: Partial<ChatMessage>) {
    setMessages((items) =>
      items.map((item) => (item.id === id ? { ...item, ...patch } : item))
    );
  }

  function finishStreamingMessage(id: string) {
    setMessages((items) =>
      items.map((item) =>
        item.id === id
          ? {
              ...item,
              isStreaming: false,
              streamingStatus: undefined,
              content: item.content || "我暂时没有拿到完整回复，可以稍后再试一次。"
            }
          : item
      )
    );
  }

  async function requestNonStreamingAiReply(input: {
    assistantId: string;
    workspace: WorkspaceState;
    messages: ChatMessage[];
    userMessage: string;
  }) {
    const data = await postJson<{
      assistantMessage: string;
      suggestions: ApiSuggestionPayload[];
    }>("/api/ai/chat", {
      workspace: input.workspace,
      messages: input.messages,
      userMessage: input.userMessage
    });

    updateAssistantMessage(input.assistantId, {
      content: data.assistantMessage,
      suggestion: data.suggestions[0] ? mapApiSuggestionToCard(data.suggestions[0]) : undefined,
      isStreaming: false,
      streamingStatus: undefined
    });
  }

  async function streamChatReply(input: {
    assistantId: string;
    workspace: WorkspaceState;
    messages: ChatMessage[];
    userMessage: string;
    onContent: () => void;
  }) {
    const response = await fetch("/api/ai/chat-stream", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        workspace: input.workspace,
        messages: input.messages,
        userMessage: input.userMessage
      })
    });

    if (!response.ok || !response.body) {
      throw new Error(`Stream request failed: ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) {
        finishStreamingMessage(input.assistantId);
        return;
      }

      buffer += decoder.decode(value, { stream: true });
      const frames = buffer.split(/\n\n/);
      buffer = frames.pop() ?? "";

      for (const frame of frames) {
        const event = parseSseFrame(frame);
        if (!event) {
          continue;
        }

        if (event.type === "reasoning") {
          const status = getString(event.data.status);
          if (status) {
            updateAssistantMessage(input.assistantId, {
              streamingStatus: status
            });
          }
        }

        if (event.type === "content") {
          const delta = getString(event.data.delta);
          if (delta) {
            input.onContent();
            setMessages((items) =>
              items.map((item) =>
                item.id === input.assistantId
                  ? {
                      ...item,
                      content: `${item.content}${delta}`,
                      streamingStatus: "正在生成回答..."
                    }
                  : item
              )
            );
          }
        }

        if (event.type === "suggestions") {
          const suggestions = getApiSuggestions(event.data.suggestions);
          updateAssistantMessage(input.assistantId, {
            suggestion: suggestions[0] ? mapApiSuggestionToCard(suggestions[0]) : undefined,
            streamingStatus: "正在收尾..."
          });
        }

        if (event.type === "done") {
          finishStreamingMessage(input.assistantId);
          return;
        }

        if (event.type === "error") {
          throw new Error(getString(event.data.message) || "AI stream failed.");
        }
      }
    }
  }

  function sendMessage(input: string) {
    if (selectedNews.length === 0) {
      addToast("先放入新闻素材", "AI 编辑助手需要知道你想围绕哪些新闻构思。", "warning");
      return;
    }

    requestAiReply(input);
  }

  function quickOption(kind: QuickOptionKind, value: string) {
    const nextBoard = {
      ...thoughtBoard,
      [kind]: value
    };
    const nextOutline = softRefreshOutline(outline, selectedNews, nextBoard);

    setThoughtBoard(nextBoard);
    setOutline(nextOutline);
    setIdeaDirty(true);
    setStatusMode((current) => (current === "confirmed" ? "outlining" : current));
    markFields([kind]);
    markSections(nextOutline.sections.filter((section) => !section.locked).map((section) => section.id));
    requestThoughtBoardUpdate(nextBoard, selectedNews, {
      type: "option_selected",
      description: `${quickLabel(kind)}：${value}`
    });
    requestAiReply(`选择${quickLabel(kind)}：${value}`, nextBoard, { kind, value });
  }

  function applySuggestion(suggestion: SuggestionCardData, mode: "coreIdea" | "mainLine") {
    const nextBoard = applySuggestionToBoard(thoughtBoard, suggestion, mode);
    const nextOutline = softRefreshOutline(outline, selectedNews, nextBoard);

    setThoughtBoard(nextBoard);
    setOutline(nextOutline);
    setIdeaDirty(true);
    setStatusMode((current) => (current === "confirmed" ? "outlining" : current));
    markFields(mode === "coreIdea" ? ["coreIdea", "supportReasons", "titles"] : ["topic", "targetReader", "writingAngle", "stance", "titles"]);
    markSections(nextOutline.sections.filter((section) => !section.locked).map((section) => section.id));
    addToast(mode === "coreIdea" ? "已应用为核心观点" : "已应用为文章主线", "AI 建议已写入思路板，大纲等待你决定是否进一步优化。", "success");
    requestThoughtBoardUpdate(nextBoard, selectedNews, {
      type: "suggestion_applied",
      description: mode === "coreIdea" ? "用户应用了 AI 核心观点建议" : "用户应用了 AI 文章主线建议"
    });
  }

  function keepReference(suggestion: SuggestionCardData) {
    setMessages((items) =>
      items.map((item) =>
        item.suggestion?.id === suggestion.id
          ? { ...item, isReference: true, content: `${item.content}\n\n已保留为参考，未修改右侧思路板和大纲。` }
          : item
      )
    );
    addToast("已仅保留为参考", "右侧内容没有被修改。");
  }

  function optimizeCurrentOutline() {
    if (selectedNews.length === 0) {
      addToast("没有可优化的素材", "先从左侧选择新闻。", "warning");
      return;
    }

    setPreviousOutline(outline);
    setIsOptimizing(true);

    void (async () => {
      try {
        const data = await postJson<{ outline: Outline; changeSummary: string }>("/api/ai/optimize-outline", {
          workspace: buildWorkspaceState(),
          thoughtBoard,
          outline
        });

        setOutline(data.outline);
        markSections(data.outline.sections.filter((section) => !section.locked).map((section) => section.id));
        setMaterialDirty(false);
        setIdeaDirty(false);
        setStatusMode("outlining");
        addToast(
          outline.sections.some((section) => section.locked) ? "已优化未锁定部分" : "大纲已优化",
          data.changeSummary || "当前大纲已保存上一版，可随时恢复。",
          "success"
        );
      } catch {
        addToast("大纲优化失败", "已保留当前大纲和上一版记录。", "warning");
      } finally {
        setIsOptimizing(false);
      }
    })();
  }

  function restorePrevious() {
    if (!previousOutline) {
      addToast("暂无上一版", "点击优化大纲后，系统会先保存当前版本。", "warning");
      return;
    }

    setOutline(previousOutline);
    setPreviousOutline(undefined);
    setMaterialDirty(false);
    setIdeaDirty(false);
    markSections(previousOutline.sections.map((section) => section.id));
    addToast("已恢复上一版", "当前大纲已回到上一次优化前的状态。", "success");
  }

  function confirmOutline() {
    if (statusMode === "confirmed") {
      setStatusMode("outlining");
      setMaterialDirty(true);
      addToast("已取消确认", "大纲状态恢复为可编辑。", "info");
      return;
    }
    if (selectedNews.length === 0) {
      addToast("还不能确认", "至少需要一条新闻素材。", "warning");
      return;
    }
    setStatusMode("confirmed");
    setMaterialDirty(false);
    setIdeaDirty(false);
    addToast("当前大纲已确认", "后续继续修改会产生新版本。", "success");
  }

  function enterDraftWorkspace() {
    setDraftState((current) =>
      current.outlineId === getOutlineId(outline)
        ? current
        : createInitialDraftState(outline, current.selectedTemplateId)
    );
    setWorkspaceStage("draft");
    addToast("已进入成稿排版", "可以逐节生成正文，并在右侧实时查看公众号预览。", "success");
  }

  function updateDraftBlock(id: string, content: string) {
    setDraftState((current) => ({
      ...current,
      blocks: current.blocks.map((block) =>
        block.id === id
          ? {
              ...block,
              content,
              status: "edited",
              updatedAt: new Date().toISOString()
            }
          : block
      ),
      status: "edited",
      updatedAt: new Date().toISOString()
    }));
  }

  function setDraftActiveSection(sectionId: string) {
    setDraftState((current) => ({
      ...current,
      activeSectionId: sectionId
    }));
  }

  function toggleDraftBlockLock(id: string) {
    setDraftState((current) => ({
      ...current,
      blocks: current.blocks.map((block) =>
        block.id === id ? { ...block, locked: !block.locked, updatedAt: new Date().toISOString() } : block
      ),
      updatedAt: new Date().toISOString()
    }));
    addToast("正文块锁定状态已更新", "锁定后 AI 不会改写该块。");
  }

  function selectDraftTemplate(id: string) {
    setDraftState((current) => ({
      ...current,
      selectedTemplateId: id,
      updatedAt: new Date().toISOString()
    }));
    addToast("排版模板已切换", "正文内容不变，预览和 HTML 导出会使用新模板。", "success");
  }

  // ─── Streaming: Generate Full Draft ──────────────────────────────
  function streamGenerateDraft() {
    if (isGeneratingDraft) return;

    const controller = new AbortController();
    draftAbortRef.current = controller;

    setIsGeneratingDraft(true);
    setDraftState((current) => ({ ...current, status: "generating", updatedAt: new Date().toISOString() }));

    void (async () => {
      try {
        await streamFetch({
          url: "/api/ai/generate-draft-stream",
          body: {
            workspace: buildWorkspaceState(),
            outline,
            styleTemplate: selectedStyleTemplate,
            existingArticle: draftState.editorContent
          },
          signal: controller.signal,
          onDelta: (delta) => {
            setDraftState((current) => ({
              ...current,
              editorContent: current.editorContent + delta,
              updatedAt: new Date().toISOString()
            }));
          },
          onDone: () => {
            setDraftState((current) => {
              const clean = sanitizeGeneratedText(current.editorContent);
              return {
                ...current,
                editorContent: clean,
                status: current.status === "edited" ? "edited" : "generated",
                updatedAt: new Date().toISOString()
              };
            });
            addToast("完整草稿已生成", "文章已流式生成完成，你可以继续编辑。", "success");
          },
          onError: (message) => {
            setDraftState((current) => ({
              ...current,
              status: current.editorContent.trim() ? "partial" : "empty",
              updatedAt: new Date().toISOString()
            }));
            addToast("草稿生成中断", message, "warning");
          }
        });
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : "";
        if (msg.includes("abort") || msg.includes("AbortError")) {
          setDraftState((current) => ({
            ...current,
            status: current.editorContent.trim() ? "partial" : "empty",
            updatedAt: new Date().toISOString()
          }));
          addToast("已取消生成", "已生成的内容已保留。");
        } else if (!draftState.editorContent.trim()) {
          // Fallback to non-streaming
          await legacyGenerateDraft();
        } else {
          addToast("草稿生成失败", "已保留当前内容，请稍后重试。", "warning");
        }
      } finally {
        setIsGeneratingDraft(false);
        draftAbortRef.current = null;
      }
    })();
  }

  // ─── Streaming: Generate Section ─────────────────────────────────
  function streamGenerateSection(sectionId: string) {
    if (generatingSectionIds.includes(sectionId)) return;

    const section = createSyntheticSection(sectionId, outline);
    const existingText = getSectionText(draftState.editorContent, outline, sectionId);
    if (existingText && draftState.sectionStatusMap[sectionId]?.status === "edited") {
      const ok = window.confirm("本节已有编辑过的内容，是否覆盖？");
      if (!ok) return;
    }

    const controller = new AbortController();
    sectionAbortRef.current = controller;

    setGeneratingSectionIds((ids) => [...new Set([...ids, sectionId])]);
    setDraftState((current) => ({
      ...current,
      activeSectionId: sectionId,
      sectionStatusMap: {
        ...current.sectionStatusMap,
        [sectionId]: { status: "generating", wordCount: current.sectionStatusMap[sectionId]?.wordCount ?? 0 }
      },
      updatedAt: new Date().toISOString()
    }));

    void (async () => {
      try {
        await streamFetch({
          url: "/api/ai/generate-section-stream",
          body: {
            workspace: buildWorkspaceState(),
            outline,
            section,
            styleTemplate: selectedStyleTemplate,
            existingArticle: draftState.editorContent
          },
          signal: controller.signal,
          onDelta: (delta) => {
            setDraftState((current) => ({
              ...current,
              editorContent: current.editorContent + delta,
              updatedAt: new Date().toISOString()
            }));
          },
          onDone: () => {
            setDraftState((current) => {
              const clean = sanitizeGeneratedText(current.editorContent);
              return {
                ...current,
                editorContent: clean,
                status: current.status === "empty" ? "partial" : current.status,
                updatedAt: new Date().toISOString()
              };
            });
            addToast("本节已生成", "内容已流式插入到文章对应位置。", "success");
          },
          onError: (message) => {
            addToast("本节生成中断", message, "warning");
          }
        });
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : "";
        if (msg.includes("abort") || msg.includes("AbortError")) {
          addToast("已取消生成", "已生成的内容已保留。");
        } else {
          addToast("本节生成失败", "请稍后重试。", "warning");
        }
      } finally {
        setGeneratingSectionIds((ids) => ids.filter((id) => id !== sectionId));
        sectionAbortRef.current = null;
      }
    })();
  }

  // ─── Streaming: Rewrite Selection ────────────────────────────────
  function streamRewriteSelection(instruction: RewriteInstruction, customInstruction?: string) {
    if (isRewriting) return;

    const selectedText = window.getSelection()?.toString().trim();
    if (!selectedText) {
      addToast("请先选中文字", "在正文编辑器中选中需要改写的内容。", "warning");
      return;
    }

    setSelectedRewriteText(selectedText);
    setRewriteInstruction(rewriteLabel(instruction));
    setRewriteResult("");
    setIsRewriting(true);

    const controller = new AbortController();
    rewriteAbortRef.current = controller;

    // Get surrounding context
    const content = draftState.editorContent;
    const selIndex = content.indexOf(selectedText);
    const contextStart = Math.max(0, selIndex - 200);
    const contextEnd = Math.min(content.length, selIndex + selectedText.length + 200);
    const surroundingText = content.slice(contextStart, contextEnd);

    void (async () => {
      const TIMEOUT_MS = 30000;

      try {
        const streamPromise = streamFetch({
          url: "/api/ai/rewrite-selection-stream",
          body: {
            workspace: buildWorkspaceState(),
            outline,
            selectedText,
            surroundingText,
            instruction,
            customInstruction: customInstruction || undefined,
            styleTemplate: selectedStyleTemplate
          },
          signal: controller.signal,
          onDelta: (delta) => {
            setRewriteResult((current) => current + delta);
          },
          onDone: () => {
            setIsRewriting(false);
          },
          onError: (message) => {
            setIsRewriting(false);
            addToast("改写失败", message, "warning");
          }
        });

        const timeoutPromise = new Promise<void>((_, reject) =>
          setTimeout(() => {
            controller.abort();
            reject(new Error("timeout"));
          }, TIMEOUT_MS)
        );

        await Promise.race([streamPromise, timeoutPromise]);
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : "";
        if (msg.includes("abort") || msg.includes("AbortError") || msg === "timeout") {
          setRewriteResult("");
          setIsRewriting(false);
          addToast(msg === "timeout" ? "改写超时" : "已取消改写", msg === "timeout" ? "30秒未返回结果，请重试。" : undefined, "warning");
        } else {
          setIsRewriting(false);
          addToast("改写失败", "请稍后重试。", "warning");
        }
      } finally {
        rewriteAbortRef.current = null;
      }
    })();
  }

  function acceptRewrite() {
    if (!rewriteResult || !selectedRewriteText) return;

    const clean = sanitizeGeneratedText(rewriteResult);
    setDraftState((current) => ({
      ...current,
      editorContent: current.editorContent.replace(selectedRewriteText, clean),
      status: "edited",
      updatedAt: new Date().toISOString()
    }));
    setRewriteResult("");
    setSelectedRewriteText("");
    setRewriteInstruction("");
    addToast("已替换原文", "AI 改写内容已应用到文章中。", "success");
  }

  function cancelRewrite() {
    if (rewriteAbortRef.current) {
      rewriteAbortRef.current.abort();
    }
    setRewriteResult("");
    setSelectedRewriteText("");
    setRewriteInstruction("");
    setIsRewriting(false);
  }

  function updateEditorContent(content: string) {
    setDraftState((current) => ({
      ...current,
      editorContent: content,
      status: current.status === "empty" || current.status === "generating" ? current.status : "edited",
      updatedAt: new Date().toISOString()
    }));
  }

  // ─── Legacy fallback: non-streaming draft generation ─────────────
  async function legacyGenerateDraft() {
    try {
      const data = await postJson<GenerateDraftApiResponse>("/api/ai/generate-draft", {
        workspace: buildWorkspaceState(),
        outline,
        existingBlocks: draftState.blocks,
        styleTemplate: selectedStyleTemplate,
        allowOverwriteEdited: false
      });

      setDraftState((current) => ({
        ...current,
        blocks: mergeDraftBlocks(current.blocks, data.blocks),
        status: current.blocks.some((block) => block.status === "edited") ? "edited" : "generated",
        updatedAt: new Date().toISOString()
      }));
      addToast(
        data.fallback ? "已使用 mock 生成草稿" : "完整草稿已生成",
        "已编辑和锁定内容没有被覆盖。",
        data.fallback ? "warning" : "success"
      );
    } catch {
      addToast("完整草稿生成失败", "当前正文已保留，请稍后重试。", "warning");
    }
  }

  // ─── Legacy non-streaming section generate (fallback) ─────────────
  function generateDraftSection(sectionId: string) {
    const section = createSyntheticSection(sectionId, outline);
    const sectionBlocks = draftState.blocks.filter((block) => block.outlineSectionId === sectionId);

    if (sectionBlocks.length && sectionBlocks.every((block) => block.locked)) {
      addToast("本节已全部锁定", "先解锁需要生成或改写的正文块。", "warning");
      return;
    }

    setGeneratingSectionIds((ids) => [...new Set([...ids, sectionId])]);

    void (async () => {
      try {
        const data = await postJson<GenerateSectionApiResponse>("/api/ai/generate-section", {
          workspace: buildWorkspaceState(),
          outline,
          section,
          existingBlocks: draftState.blocks,
          styleTemplate: selectedStyleTemplate
        });

        setDraftState((current) => ({
          ...current,
          blocks: mergeGeneratedBlocks(current.blocks, data.blocks, sectionId),
          activeSectionId: sectionId,
          status: current.status === "edited" ? "edited" : "partial",
          updatedAt: new Date().toISOString()
        }));
        addToast(
          data.fallback ? "已使用 mock 生成本节" : "本节正文已生成",
          "锁定和已编辑内容已保留。",
          data.fallback ? "warning" : "success"
        );
      } catch {
        addToast("生成本节失败", "原正文内容已保留，请稍后重试。", "warning");
      } finally {
        setGeneratingSectionIds((ids) => ids.filter((id) => id !== sectionId));
      }
    })();
  }

  // ─── Legacy non-streaming block rewrite (fallback) ────────────────
  function rewriteDraftBlock(id: string, instruction: RewriteInstruction) {
    const block = draftState.blocks.find((item) => item.id === id);
    if (!block) return;

    if (block.locked) {
      addToast("正文块已锁定", "先解锁，再使用 AI 改写。", "warning");
      return;
    }

    setRewritingBlockIds((ids) => [...new Set([...ids, id])]);

    void (async () => {
      try {
        const data = await postJson<RewriteBlockApiResponse>("/api/ai/rewrite-block", {
          workspace: buildWorkspaceState(),
          outline,
          block,
          instruction,
          styleTemplate: selectedStyleTemplate
        });

        setDraftState((current) => ({
          ...current,
          blocks: current.blocks.map((item) =>
            item.id === id && !item.locked ? data.block : item
          ),
          status: current.status === "empty" ? "partial" : current.status,
          updatedAt: new Date().toISOString()
        }));
        addToast(
          data.fallback ? "已使用 mock 改写" : "正文块已改写",
          "只更新了当前正文块。",
          data.fallback ? "warning" : "success"
        );
      } catch {
        addToast("改写失败", "原内容已保留，请稍后重试。", "warning");
      } finally {
        setRewritingBlockIds((ids) => ids.filter((item) => item !== id));
      }
    })();
  }

  // ─── Legacy non-streaming full draft (fallback) ───────────────────
  function legacyFullDraft() {
    setIsGeneratingDraft(true);

    void (async () => {
      try {
        const data = await postJson<GenerateDraftApiResponse>("/api/ai/generate-draft", {
          workspace: buildWorkspaceState(),
          outline,
          existingBlocks: draftState.blocks,
          styleTemplate: selectedStyleTemplate,
          allowOverwriteEdited: false
        });

        setDraftState((current) => ({
          ...current,
          blocks: mergeDraftBlocks(current.blocks, data.blocks),
          status: current.blocks.some((block) => block.status === "edited") ? "edited" : "generated",
          updatedAt: new Date().toISOString()
        }));
        addToast(
          data.fallback ? "已使用 mock 生成草稿" : "完整草稿已生成",
          "已编辑和锁定内容没有被覆盖。",
          data.fallback ? "warning" : "success"
        );
      } catch {
        addToast("完整草稿生成失败", "当前正文已保留，请稍后重试。", "warning");
      } finally {
        setIsGeneratingDraft(false);
      }
    })();
  }

  async function copyDraftMarkdown() {
    try {
      const markdown = draftState.editorContent.trim()
        ? editorContentToMarkdown(draftState.editorContent)
        : articleToMarkdown(draftState.blocks);
      await navigator.clipboard.writeText(markdown);
      setDraftState((current) => ({ ...current, status: "exported", updatedAt: new Date().toISOString() }));
      addToast("已复制 Markdown", "可以粘贴到文档或编辑器继续处理。", "success");
    } catch {
      addToast("复制失败，请重试", "浏览器剪贴板权限可能被拦截。", "warning");
    }
  }

  async function copyDraftHtml() {
    try {
      const html = draftState.editorContent.trim()
        ? editorContentToHtml(draftState.editorContent, selectedStyleTemplate, outline)
        : articleToHtml(draftState.blocks, selectedStyleTemplate);
      await navigator.clipboard.writeText(html);
      setDraftState((current) => ({ ...current, status: "exported", updatedAt: new Date().toISOString() }));
      addToast("已复制 HTML", "可以粘贴到公众号后台预览。", "success");
    } catch {
      addToast("复制失败，请重试", "浏览器剪贴板权限可能被拦截。", "warning");
    }
  }

  function updateSection(section: OutlineSection) {
    setOutline((current) => ({
      ...current,
      sections: current.sections.map((item) => (item.id === section.id ? section : item)),
      updatedAt: new Date().toISOString()
    }));
    setStatusMode((current) => (current === "confirmed" ? "outlining" : current));
    markSections([section.id]);
    addToast("本节已更新", "修改已保留在当前大纲中。", "success");
  }

  function regenerateSection(id: string) {
    const target = outline.sections.find((section) => section.id === id);
    if (target?.locked) {
      addToast("本节已锁定", "先解锁，再重新生成这一节。", "warning");
      return;
    }

    setPreviousOutline(outline);
    setOutline((current) => ({
      ...current,
      sections: current.sections.map((section) =>
        section.id === id
          ? {
              ...section,
              title: `${section.title.replace(/（新版.*）$/, "")}（新版）`,
              purpose: `${section.purpose} 这一版会更贴合「${thoughtBoard.writingAngle || "当前角度"}」。`,
              keyPoints: [
                thoughtBoard.coreIdea || "先补一句核心观点",
                ...(thoughtBoard.supportReasons.length ? thoughtBoard.supportReasons.slice(0, 2) : section.keyPoints.slice(0, 2))
              ],
              aiAdvice: `重写时先给判断，再用新闻做证据，最后落到${thoughtBoard.targetReader || "目标读者"}能带走的启发。`
            }
          : section
      ),
      updatedAt: new Date().toISOString()
    }));
    markSections([id]);
    addToast("已重新生成本节", "上一版大纲已保存，可恢复。", "success");
  }

  function toggleSectionLock(id: string) {
    setOutline((current) => ({
      ...current,
      sections: current.sections.map((section) =>
        section.id === id ? { ...section, locked: !section.locked } : section
      )
    }));
    markSections([id]);
    addToast("锁定状态已更新", "锁定后优化大纲会保留该节点。");
  }

  function deleteSection(id: string) {
    const ok = window.confirm("确认删除这个大纲节点吗？");
    if (!ok) {
      return;
    }

    setPreviousOutline(outline);
    setOutline((current) => ({
      ...current,
      sections: current.sections.filter((section) => section.id !== id),
      updatedAt: new Date().toISOString()
    }));
    addToast("节点已删除", "上一版大纲已保存，可恢复。");
  }

  function moveSection(id: string, direction: "up" | "down") {
    setOutline((current) => {
      const index = current.sections.findIndex((section) => section.id === id);
      const nextIndex = direction === "up" ? index - 1 : index + 1;

      if (index < 0 || nextIndex < 0 || nextIndex >= current.sections.length) {
        return current;
      }

      const sections = [...current.sections];
      const [section] = sections.splice(index, 1);
      sections.splice(nextIndex, 0, section);
      return {
        ...current,
        sections,
        updatedAt: new Date().toISOString()
      };
    });
    markSections([id]);
  }

  const detailSelected = detailNews
    ? selectedNews.find((item) => item.news.id === detailNews.id)
    : undefined;

  return (
    <div className={`${pageMode === "workspace" ? "h-screen overflow-hidden" : "min-h-screen"} bg-gray-50 flex flex-col`}>
      <AppHeader
        page={pageMode}
        selectedCount={selectedNews.length}
        status={status}
        onStart={startWorkspace}
        onBackHome={() => {
          setPageMode("home");
          setWorkspaceStage("outline");
        }}
        onConfirmOutline={confirmOutline}
        onEnterDraft={enterDraftWorkspace}
      />

      {pageMode === "home" ? (
        <NewsHomePage
          news={newsList}
          selectedNews={selectedNews}
          provider={newsProvider}
          updatedAt={newsUpdatedAt}
          loading={newsLoading}
          refreshing={newsRefreshing}
          onToggleNews={toggleNews}
          onOpenDetails={openDetails}
          onStart={startWorkspace}
          onRefresh={() => void loadNews(true)}
        />
      ) : workspaceStage === "draft" ? (
        <DraftWorkspacePage
          workspace={buildWorkspaceState({ status: "confirmed" })}
          outline={outline}
          draftState={draftState}
          template={selectedStyleTemplate}
          generatingSectionIds={generatingSectionIds}
          isGeneratingDraft={isGeneratingDraft}
          isRewriting={isRewriting}
          rewriteResult={rewriteResult}
          rewriteInstruction={rewriteInstruction}
          onBackToOutline={() => setWorkspaceStage("outline")}
          onContentChange={updateEditorContent}
          onSetActiveSection={setDraftActiveSection}
          onGenerateDraft={streamGenerateDraft}
          onGenerateSection={streamGenerateSection}
          onRewritingAction={streamRewriteSelection}
          onAcceptRewrite={acceptRewrite}
          onCancelRewrite={cancelRewrite}
          onSelectTemplate={selectDraftTemplate}
          onCopyMarkdown={() => void copyDraftMarkdown()}
          onCopyHtml={() => void copyDraftHtml()}
        />
      ) : (
        <WorkspacePage
          allNews={workspaceNewsPool}
          selectedNews={selectedNews}
          browsedNewsIds={browsedNewsIds}
          workspaceName={workspaceName}
          status={status}
          thoughtBoard={thoughtBoard}
          outline={outline}
          previousOutline={previousOutline}
          messages={messages}
          isTyping={isTyping}
          isOptimizing={isOptimizing}
          materialDirty={materialDirty}
          ideaDirty={ideaDirty}
          highlightedFields={highlightedFields}
          highlightedSectionIds={highlightedSectionIds}
          onToggleNews={toggleNews}
          onOpenDetails={openDetails}
          onSetRole={setNewsRole}
          onRemoveNews={removeNews}
          onUpdateNote={updateNote}
          onThoughtChange={updateThoughtField}
          onSendMessage={sendMessage}
          onQuickOption={quickOption}
          onApplyCoreIdea={(suggestion) => applySuggestion(suggestion, "coreIdea")}
          onApplyMainLine={(suggestion) => applySuggestion(suggestion, "mainLine")}
          onKeepReference={keepReference}
          onOptimizeOutline={optimizeCurrentOutline}
          onRestorePrevious={restorePrevious}
          onConfirmOutline={confirmOutline}
          onUpdateSection={updateSection}
          onRegenerateSection={regenerateSection}
          onToggleSectionLock={toggleSectionLock}
          onDeleteSection={deleteSection}
          onMoveSection={moveSection}
          onEnterDraft={enterDraftWorkspace}
        />
      )}

      <NewsDetailDrawer
        news={detailNews}
        selected={Boolean(detailSelected)}
        role={detailSelected?.role}
        onClose={() => setDetailNews(undefined)}
        onToggle={() => {
          if (detailNews) {
            toggleNews(detailNews);
          }
        }}
      />

    </div>
  );
}

async function postJson<T>(url: string, body?: unknown, method = "POST"): Promise<T> {
  const response = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json"
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) })
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return (await response.json()) as T;
}

function mapApiSuggestionToCard(suggestion: ApiSuggestionPayload): SuggestionCardData {
  const payload = suggestion.applyPayload || {};
  const titles = getStringArray(payload.titles);

  return {
    id: suggestion.id,
    type: suggestion.type,
    headline: suggestion.title,
    title: suggestion.title,
    description: suggestion.description,
    mainLine: getString(payload.mainLine) || getString(payload.topic) || suggestion.description,
    targetReader: getString(payload.targetReader),
    writingAngle: getString(payload.writingAngle),
    stance: getString(payload.stance),
    coreIdea: getString(payload.coreIdea) || (suggestion.type === "core_opinion" ? suggestion.description : undefined),
    supportReasons: getStringArray(payload.supportReasons),
    outlineTitle: getString(payload.outlineTitle) || titles[0],
    applyPayload: payload
  };
}

function getString(value: unknown) {
  return typeof value === "string" ? value : undefined;
}

function getStringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function getApiSuggestions(value: unknown): ApiSuggestionPayload[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is ApiSuggestionPayload => {
    return (
      Boolean(item) &&
      typeof item === "object" &&
      typeof (item as ApiSuggestionPayload).id === "string" &&
      typeof (item as ApiSuggestionPayload).type === "string" &&
      typeof (item as ApiSuggestionPayload).title === "string" &&
      typeof (item as ApiSuggestionPayload).description === "string" &&
      typeof (item as ApiSuggestionPayload).applyPayload === "object"
    );
  });
}

function parseSseFrame(frame: string) {
  const eventLine = frame.split(/\r?\n/).find((line) => line.startsWith("event:"));
  const dataLines = frame
    .split(/\r?\n/)
    .filter((line) => line.startsWith("data:"))
    .map((line) => line.replace(/^data:\s?/, ""));

  if (!eventLine || !dataLines.length) {
    return undefined;
  }

  try {
    return {
      type: eventLine.replace(/^event:\s?/, "").trim(),
      data: JSON.parse(dataLines.join("\n")) as Record<string, unknown>
    };
  } catch {
    return undefined;
  }
}

function mergeNewsById(primary: News[], secondary: News[]) {
  const map = new Map<string, News>();
  for (const item of primary) {
    map.set(item.id, item);
  }
  for (const item of secondary) {
    if (!map.has(item.id)) {
      map.set(item.id, item);
    }
  }
  return Array.from(map.values());
}

function quickLabel(kind: QuickOptionKind) {
  if (kind === "targetReader") {
    return "目标读者";
  }

  if (kind === "writingAngle") {
    return "写作角度";
  }

  return "表达立场";
}

function rewriteLabel(instruction: RewriteInstruction) {
  switch (instruction) {
    case "polish": return "润色";
    case "expand": return "扩写";
    case "shorten": return "缩写";
    case "wechat_style": return "改公众号感";
    case "reduce_ai_tone": return "降AI味";
    case "add_example": return "加案例";
    case "add_transition": return "加转场";
    case "more_oral": return "更口语";
    case "custom": return "自定义";
  }
}
