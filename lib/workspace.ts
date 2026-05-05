import type {
  ChatMessage,
  News,
  NewsRole,
  Outline,
  OutlineSection,
  QuickOptionKind,
  SuggestionCardData,
  ThoughtBoard,
  WorkspaceNews,
  WorkspaceStatus
} from "@/types";

const optionLabels: Record<QuickOptionKind, string> = {
  targetReader: "目标读者",
  writingAngle: "写作角度",
  stance: "表达立场"
};

const roleLabels: Record<NewsRole, string> = {
  main_news: "主新闻",
  supporting_news: "辅助新闻",
  reference_news: "参考新闻"
};

export function createId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

export function formatRole(role: NewsRole) {
  return roleLabels[role];
}

export function deriveWorkspaceStatus(
  selectedNews: WorkspaceNews[],
  thoughtBoard: ThoughtBoard,
  currentStatus: WorkspaceStatus
): WorkspaceStatus {
  if (selectedNews.length === 0) {
    return "empty";
  }

  if (currentStatus === "confirmed") {
    return "confirmed";
  }

  if (thoughtBoard.targetReader && thoughtBoard.writingAngle && thoughtBoard.coreIdea) {
    return "outlining";
  }

  return "collecting";
}

export function createInitialThoughtBoard(selectedNews: WorkspaceNews[]): ThoughtBoard {
  const mainNews = selectedNews.find((item) => item.role === "main_news") ?? selectedNews[0];
  const supportingNewsIds = selectedNews
    .filter((item) => item.news.id !== mainNews?.news.id)
    .map((item) => item.news.id);

  return {
    topic: inferTopic(selectedNews.map((item) => item.news)),
    mainNewsId: mainNews?.news.id,
    supportingNewsIds,
    targetReader: "",
    writingAngle: "",
    stance: "",
    coreIdea: selectedNews.length
      ? "这些新闻都在提示：AI 产品正在从单点能力走向可执行的工作流。"
      : "",
    supportReasons: buildSupportReasons(selectedNews),
    titles: buildTitles(selectedNews, ""),
    openQuestions: [
      "这篇文章最想服务哪类读者？",
      "主线是产品变化、行业趋势，还是个人启发？",
      "哪些细节需要补证据或案例？"
    ]
  };
}

export function syncBoardWithNews(
  board: ThoughtBoard,
  selectedNews: WorkspaceNews[]
): ThoughtBoard {
  const ids = new Set(selectedNews.map((item) => item.news.id));
  const mainFromRole = selectedNews.find((item) => item.role === "main_news");
  const mainNewsId = mainFromRole?.news.id ?? (board.mainNewsId && ids.has(board.mainNewsId) ? board.mainNewsId : selectedNews[0]?.news.id);
  const supportingNewsIds = selectedNews
    .filter((item) => item.news.id !== mainNewsId && item.role === "supporting_news")
    .map((item) => item.news.id);

  return {
    ...board,
    topic: board.topic || inferTopic(selectedNews.map((item) => item.news)),
    mainNewsId,
    supportingNewsIds,
    supportReasons: board.supportReasons.length ? board.supportReasons : buildSupportReasons(selectedNews),
    titles: board.titles.length ? board.titles : buildTitles(selectedNews, board.writingAngle)
  };
}

export function createInitialOutline(
  selectedNews: WorkspaceNews[],
  board: ThoughtBoard
): Outline {
  const news = selectedNews.map((item) => item.news);
  const main = selectedNews.find((item) => item.news.id === board.mainNewsId)?.news ?? news[0];
  const sections = buildBaseSections(selectedNews, board);

  return {
    recommendedTitle:
      board.titles[0] ??
      (main ? `从${main.keywords[0]}看 AI 产品的新拐点` : "先选几条新闻，让选题开始成型"),
    intro: main
      ? `从「${main.title}」切入，用一个具体变化带出 AI 产品从能力展示走向任务闭环的趋势。`
      : "先用一条最有代表性的新闻开场，再把其他素材组织成一条可讨论的主线。",
    sections,
    ending: "收束到创作者或目标读者可以采取的行动：关注入口变化、验证真实效率、保留独立判断。",
    readerTakeaway:
      board.targetReader
        ? `${board.targetReader}可以获得一套判断 AI 产品变化是否值得跟进的框架。`
        : "读者能看懂新闻背后的产品方向，并带走一个可复用的观察框架。",
    version: 1,
    updatedAt: new Date().toISOString()
  };
}

export function optimizeOutline(
  outline: Outline,
  selectedNews: WorkspaceNews[],
  board: ThoughtBoard
): Outline {
  const fresh = createInitialOutline(selectedNews, board);
  const lockedById = new Map(outline.sections.filter((section) => section.locked).map((section) => [section.id, section]));
  const optimizedSections = fresh.sections.map((section, index) => {
    const previous = outline.sections[index];
    if (previous?.locked) {
      return previous;
    }

    const lockedSameId = lockedById.get(section.id);
    if (lockedSameId) {
      return lockedSameId;
    }

    return {
      ...section,
      id: previous?.id ?? section.id,
      title: tuneSectionTitle(section.title, board),
      purpose: `${section.purpose}${board.targetReader ? ` 面向${board.targetReader}，减少泛泛而谈。` : ""}`,
      aiAdvice: buildAiAdvice(board, section)
    };
  });

  return {
    ...fresh,
    sections: optimizedSections,
    recommendedTitle:
      board.titles[0] ??
      `${board.topic || "AI 新闻"}：${board.coreIdea || "从热点到判断框架"}`,
    intro: buildIntro(selectedNews, board),
    ending: buildEnding(board),
    readerTakeaway: buildTakeaway(board),
    version: outline.version + 1,
    updatedAt: new Date().toISOString()
  };
}

export function generateAssistantOpening(selectedNews: WorkspaceNews[]): ChatMessage {
  const count = selectedNews.length;
  const topic = inferTopic(selectedNews.map((item) => item.news));

  return {
    id: createId("msg"),
    role: "assistant",
    createdAt: new Date().toISOString(),
    content:
      count > 0
        ? `你选择了 ${count} 条 AI 新闻。它们大致可以组合成一个主题：${topic}。我们可以先确定三个问题：你想写给谁看？你想从什么角度写？你想表达什么核心观点？`
        : "先从左侧选择几条新闻，我会帮你把它们组合成公众号文章的思路板和粗略大纲。"
  };
}

export function generateAiReply(
  userInput: string,
  selectedNews: WorkspaceNews[],
  board: ThoughtBoard,
  quickOption?: { kind: QuickOptionKind; value: string }
): ChatMessage {
  const topic = board.topic || inferTopic(selectedNews.map((item) => item.news));
  const mainLine =
    board.coreIdea ||
    `这些素材可以合成一条主线：${topic}，重点不是罗列新闻，而是解释变化如何影响具体人群。`;

  const content = quickOption
    ? `已收到你的选择：${optionLabels[quickOption.kind]}是「${quickOption.value}」。这会让文章更容易聚焦，后续可以把案例筛选、标题语气和结尾建议都围绕这个选择收紧。`
    : buildConversationalReply(userInput, selectedNews, board);

  return {
    id: createId("msg"),
    role: "assistant",
    createdAt: new Date().toISOString(),
    content,
    suggestion: {
      id: createId("sug"),
      headline: "可应用建议",
      mainLine,
      targetReader: board.targetReader || quickOptionValue("targetReader", quickOption) || "AI 产品经理",
      writingAngle: board.writingAngle || quickOptionValue("writingAngle", quickOption) || "产品分析",
      stance: board.stance || quickOptionValue("stance", quickOption) || "中立分析",
      coreIdea: refineCoreIdea(selectedNews, board, quickOption),
      supportReasons: buildSupportReasons(selectedNews),
      outlineTitle: buildTitles(selectedNews, board.writingAngle || quickOptionValue("writingAngle", quickOption))[0]
    }
  };
}

export function applySuggestionToBoard(
  board: ThoughtBoard,
  suggestion: SuggestionCardData,
  mode: "coreIdea" | "mainLine"
): ThoughtBoard {
  const payload = suggestion.applyPayload ?? {};
  const payloadTitles = getPayloadStringArray(payload.titles);
  const payloadSupportReasons = getPayloadStringArray(payload.supportReasons);

  if (mode === "mainLine") {
    return {
      ...board,
      topic: getPayloadString(payload.topic) ?? suggestion.mainLine ?? board.topic,
      targetReader: getPayloadString(payload.targetReader) ?? suggestion.targetReader ?? board.targetReader,
      writingAngle: getPayloadString(payload.writingAngle) ?? suggestion.writingAngle ?? board.writingAngle,
      stance: getPayloadString(payload.stance) ?? suggestion.stance ?? board.stance,
      coreIdea: getPayloadString(payload.coreIdea) ?? board.coreIdea,
      supportReasons: payloadSupportReasons.length ? payloadSupportReasons : board.supportReasons,
      titles: uniqueStrings([suggestion.outlineTitle, ...payloadTitles, ...board.titles])
    };
  }

  return {
    ...board,
    coreIdea: getPayloadString(payload.coreIdea) ?? suggestion.coreIdea ?? suggestion.mainLine ?? board.coreIdea,
    targetReader: getPayloadString(payload.targetReader) ?? suggestion.targetReader ?? board.targetReader,
    writingAngle: getPayloadString(payload.writingAngle) ?? suggestion.writingAngle ?? board.writingAngle,
    stance: getPayloadString(payload.stance) ?? suggestion.stance ?? board.stance,
    supportReasons: payloadSupportReasons.length
      ? payloadSupportReasons
      : suggestion.supportReasons?.length
        ? suggestion.supportReasons
        : board.supportReasons,
    titles: uniqueStrings([suggestion.outlineTitle, ...payloadTitles, ...board.titles])
  };
}

export function getNewsTitle(newsId: string, allNews: News[]) {
  return allNews.find((item) => item.id === newsId)?.title ?? "未关联新闻";
}

export function roleForNewSelection(existing: WorkspaceNews[]): NewsRole {
  if (existing.length === 0 || !existing.some((item) => item.role === "main_news")) {
    return "main_news";
  }

  return "supporting_news";
}

function inferTopic(news: News[]) {
  if (news.length === 0) {
    return "从 AI 新闻中寻找一个值得展开的选题";
  }

  const keywordCounts = news
    .flatMap((item) => item.keywords)
    .reduce<Record<string, number>>((acc, keyword) => {
      acc[keyword] = (acc[keyword] ?? 0) + 1;
      return acc;
    }, {});
  const topKeywords = Object.entries(keywordCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([keyword]) => keyword);

  if (topKeywords.some((keyword) => keyword.includes("编程") || keyword.includes("Agent"))) {
    return "AI 编程工具正在从辅助补全走向任务执行";
  }

  if (topKeywords.some((keyword) => keyword.includes("多模态"))) {
    return "多模态模型正在把内容理解和工作流连接起来";
  }

  if (topKeywords.some((keyword) => keyword.includes("办公"))) {
    return "AI 办公工具正在从效率插件变成协作流程入口";
  }

  return `${topKeywords.join("、") || "AI 产品"}背后的新变化`;
}

function buildSupportReasons(selectedNews: WorkspaceNews[]) {
  if (selectedNews.length === 0) {
    return [];
  }

  return selectedNews.slice(0, 4).map((item) => {
    const keyword = item.news.keywords[0];
    return `${keyword}案例显示：${item.news.summary}`;
  });
}

function buildTitles(selectedNews: WorkspaceNews[], writingAngle?: string) {
  const first = selectedNews[0]?.news;
  const angle = writingAngle || "趋势";

  if (!first) {
    return ["选题还在发芽：先把素材放进工作区"];
  }

  return [
    `AI 产品进入执行时代：${angle}视角下的新机会`,
    `别只看模型参数，AI 工具真正的变化在工作流里`,
    `从${first.keywords[0]}新闻看下一波 AI 应用竞争`
  ];
}

function buildBaseSections(selectedNews: WorkspaceNews[], board: ThoughtBoard): OutlineSection[] {
  const news = selectedNews.map((item) => item.news);
  const main = selectedNews.find((item) => item.news.id === board.mainNewsId)?.news ?? news[0];
  const relatedIds = selectedNews.map((item) => item.news.id);

  if (news.length === 0) {
    return [
      {
        id: createId("sec"),
        title: "先确定素材池",
        purpose: "明确要讨论的新闻范围，避免空泛开题。",
        keyPoints: ["选择至少一条主新闻", "补充一到三条辅助新闻", "记录你想追问的问题"],
        relatedNewsIds: [],
        aiAdvice: "先不要急着生成正文，把素材关系确认清楚。",
        locked: false
      }
    ];
  }

  return [
    {
      id: createId("sec"),
      title: "用一个具体新闻打开问题",
      purpose: "让读者先看到一个清晰变化，而不是直接进入抽象判断。",
      keyPoints: [
        main ? `主新闻：${main.title}` : "选出最能代表趋势的一条新闻",
        "解释它和读者日常工作或决策的关系",
        "提出文章要回答的核心问题"
      ],
      relatedNewsIds: main ? [main.id] : [],
      aiAdvice: "开头不宜堆信息，保留一个强问题即可。",
      locked: false
    },
    {
      id: createId("sec"),
      title: "把多条新闻归成一条主线",
      purpose: "从新闻罗列转向结构化解释，形成文章判断框架。",
      keyPoints: [
        board.topic || inferTopic(news),
        "找出共同变量：能力、入口、成本、场景或商业化",
        "区分确定趋势和还未验证的部分"
      ],
      relatedNewsIds: relatedIds.slice(0, 3),
      aiAdvice: "这一节适合用并列案例，不要让每条新闻平均占篇幅。",
      locked: false
    },
    {
      id: createId("sec"),
      title: "分析对目标读者的真实影响",
      purpose: "把行业变化翻译成读者可感知的机会、风险和行动。",
      keyPoints: [
        board.targetReader ? `围绕${board.targetReader}展开` : "先选择目标读者",
        "说明哪些工作会被增强，哪些判断仍需人来完成",
        "给出一到两个具体使用或观察建议"
      ],
      relatedNewsIds: relatedIds.slice(1, 4),
      aiAdvice: "避免泛泛说效率提升，最好写出一个具体工作场景。",
      locked: false
    },
    {
      id: createId("sec"),
      title: "给出你的判断与边界",
      purpose: "形成公众号文章的观点记忆点，让读者知道你到底怎么看。",
      keyPoints: [
        board.stance ? `表达立场：${board.stance}` : "选择看好、质疑或中立分析",
        board.coreIdea || "补充一句核心观点",
        "指出还需要等待验证的指标"
      ],
      relatedNewsIds: relatedIds,
      aiAdvice: "结论可以鲜明，但要保留证据边界。",
      locked: false
    }
  ];
}

function tuneSectionTitle(title: string, board: ThoughtBoard) {
  if (!board.writingAngle) {
    return title;
  }

  if (board.writingAngle === "产品分析") {
    return title.replace("真实影响", "产品机会").replace("判断与边界", "产品判断与风险");
  }

  if (board.writingAngle === "职业启发") {
    return title.replace("真实影响", "个人能力影响").replace("判断与边界", "行动建议");
  }

  if (board.writingAngle === "技术科普") {
    return title.replace("主线", "技术逻辑").replace("真实影响", "使用门槛");
  }

  return title;
}

function buildAiAdvice(board: ThoughtBoard, section: OutlineSection) {
  const reader = board.targetReader ? `面向${board.targetReader}` : "面向明确读者";
  const angle = board.writingAngle || "当前角度";
  return `${reader}，用${angle}语气处理「${section.title}」：先讲变化，再讲影响，最后给一个可执行判断。`;
}

function buildIntro(selectedNews: WorkspaceNews[], board: ThoughtBoard) {
  const main = selectedNews.find((item) => item.news.id === board.mainNewsId)?.news ?? selectedNews[0]?.news;
  if (!main) {
    return "先选择新闻素材，再从最有冲突感的一条新闻切入。";
  }

  return `从「${main.title}」切入，先说明它为什么不是孤立事件，再把话题收束到「${board.topic || "AI 产品变化"}」。`;
}

function buildEnding(board: ThoughtBoard) {
  if (board.stance === "提醒风险" || board.stance === "质疑") {
    return "结尾提醒读者区分演示能力和稳定价值：看清边界，再决定是否投入时间和资源。";
  }

  if (board.stance === "看好") {
    return "结尾给出积极判断：真正值得关注的不是单个工具，而是 AI 进入工作流后的长期复利。";
  }

  return "结尾回到判断框架：哪些变化已经发生，哪些还需要继续观察，读者下一步可以如何验证。";
}

function buildTakeaway(board: ThoughtBoard) {
  if (board.targetReader) {
    return `${board.targetReader}将带走一套观察 AI 新闻的方法：看入口、看任务闭环、看是否创造真实效率。`;
  }

  return "读者将带走一套把 AI 热点转化为判断框架的方法。";
}

function buildConversationalReply(
  input: string,
  selectedNews: WorkspaceNews[],
  board: ThoughtBoard
) {
  const normalized = input.trim();
  const topic = board.topic || inferTopic(selectedNews.map((item) => item.news));

  if (/合成|组合|一篇|主线/.test(normalized)) {
    return `可以。它们共同指向一个趋势：${topic}。建议不要按新闻时间线写，而是先提出一个变化，再用不同新闻分别证明「能力变化」「场景变化」和「读者影响」。`;
  }

  if (/标题|题目/.test(normalized)) {
    return `标题可以把「新闻事实」和「读者收益」同时放进去。比如先用一个判断抓住注意力，再用副标题暗示这不是单条新闻解读，而是一篇趋势判断。`;
  }

  if (/风险|问题|质疑/.test(normalized)) {
    return `可以加入风险视角：AI 产品现在最容易被高估的是演示效果，最需要验证的是稳定性、成本、上下文安全和真实工作流中的可控性。`;
  }

  return `我的建议是先把这组素材收束到一个可争论的问题：${topic}。公众号文章不必追求覆盖所有信息，关键是让读者读完后多一个判断角度。`;
}

function refineCoreIdea(
  selectedNews: WorkspaceNews[],
  board: ThoughtBoard,
  quickOption?: { kind: QuickOptionKind; value: string }
) {
  const topic = board.topic || inferTopic(selectedNews.map((item) => item.news));
  const reader = quickOptionValue("targetReader", quickOption) || board.targetReader || "内容读者";
  const angle = quickOptionValue("writingAngle", quickOption) || board.writingAngle || "趋势判断";

  return `从${angle}看，${topic}。这件事对${reader}的意义，是判断 AI 工具是否正在从“会回答”走向“能完成任务”。`;
}

function quickOptionValue(
  kind: QuickOptionKind,
  quickOption?: { kind: QuickOptionKind; value: string }
) {
  return quickOption?.kind === kind ? quickOption.value : undefined;
}

function uniqueStrings(values: Array<string | undefined>) {
  return values.filter((value, index, array): value is string => {
    return Boolean(value) && array.indexOf(value) === index;
  });
}

function getPayloadString(value: unknown) {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function getPayloadStringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && Boolean(item.trim())) : [];
}
