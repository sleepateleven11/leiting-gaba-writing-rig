export type NewsRole = "main_news" | "supporting_news" | "reference_news";

export type NewsProvider = "gnews" | "newsapi" | "rss" | "mock";

export type WritingAngle = {
  angle: string;
  description: string;
  suitableFor: string;
};

export type News = {
  id: string;
  title: string;
  translatedTitle?: string;
  source: string;
  publishedAt: string;
  summary: string;
  url: string;
  imageUrl?: string;
  keywords: string[];
  importanceScore: number;
  aiSummary: string;
  whyImportant: string;
  writingAngles: WritingAngle[];
  rawContent?: string;
  provider: NewsProvider;
};

export type WorkspaceNews = {
  news: News;
  role: NewsRole;
  note?: string;
  addedAt: string;
};

export type ChatRole = "assistant" | "user";

export type SuggestionCardData = {
  id: string;
  type?:
    | "core_opinion"
    | "main_thread"
    | "target_reader"
    | "writing_angle"
    | "outline_patch"
    | "reference";
  headline: string;
  title?: string;
  description?: string;
  mainLine?: string;
  targetReader?: string;
  writingAngle?: string;
  stance?: string;
  coreIdea?: string;
  supportReasons?: string[];
  outlineTitle?: string;
  applyPayload?: Record<string, unknown>;
};

export type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: string;
  suggestion?: SuggestionCardData;
  isReference?: boolean;
  isStreaming?: boolean;
  streamingStatus?: string;
  reasoningSummary?: string;
};

export type ThoughtBoard = {
  topic: string;
  mainNewsId?: string;
  supportingNewsIds: string[];
  targetReader: string;
  writingAngle: string;
  stance: string;
  coreIdea: string;
  supportReasons: string[];
  titles: string[];
  openQuestions: string[];
};

export type OutlineSection = {
  id: string;
  title: string;
  purpose: string;
  keyPoints: string[];
  relatedNewsIds: string[];
  aiAdvice: string;
  locked: boolean;
};

export type Outline = {
  recommendedTitle: string;
  intro: string;
  sections: OutlineSection[];
  ending: string;
  readerTakeaway: string;
  version: number;
  updatedAt: string;
};

export type WorkspaceStatus = "empty" | "collecting" | "outlining" | "confirmed";

export type WorkspaceState = {
  workspaceName: string;
  selectedNews: WorkspaceNews[];
  browsedNewsIds: string[];
  thoughtBoard: ThoughtBoard;
  outline: Outline;
  previousOutline?: Outline;
  status: WorkspaceStatus;
  materialDirty: boolean;
  ideaDirty: boolean;
};

export type QuickOptionKind = "targetReader" | "writingAngle" | "stance";

export type ArticleBlockType =
  | "title"
  | "intro"
  | "heading"
  | "paragraph"
  | "quote"
  | "list"
  | "conclusion"
  | "cta";

export type ArticleBlockStatus = "empty" | "generated" | "edited";

export type ArticleBlock = {
  id: string;
  outlineSectionId: string;
  type: ArticleBlockType;
  content: string;
  status: ArticleBlockStatus;
  locked: boolean;
  updatedAt: string;
};

export type StyleTemplate = {
  id: string;
  name: string;
  description: string;
  paragraphStyle: string;
  headingStyle: string;
  quoteStyle: string;
  dividerStyle: string;
};

export type DraftSectionStatus = {
  status: "empty" | "generating" | "generated" | "edited";
  wordCount: number;
};

export type DraftStatus = "empty" | "generating" | "partial" | "generated" | "edited" | "exported";

export type DraftState = {
  outlineId: string;
  editorContent: string;
  sectionStatusMap: Record<string, DraftSectionStatus>;
  blocks: ArticleBlock[];
  selectedTemplateId: string;
  activeSectionId?: string;
  status: DraftStatus;
  updatedAt: string;
};

export type RewriteInstruction =
  | "polish"
  | "expand"
  | "shorten"
  | "wechat_style"
  | "reduce_ai_tone"
  | "add_example"
  | "add_transition"
  | "more_oral"
  | "custom";
