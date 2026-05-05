import type { News, WritingAngle } from "@/types";

function angles(values: Array<[string, string, string]>): WritingAngle[] {
  return values.map(([angle, description, suitableFor]) => ({
    angle,
    description,
    suitableFor
  }));
}

export const mockNews: News[] = [
  {
    id: "mock-ai-coding-agent",
    title: "新一代 AI 编程工具开始支持跨仓库任务执行",
    translatedTitle: "新一代 AI 编程工具开始支持跨仓库任务执行",
    source: "AI Product Daily",
    publishedAt: "2026-04-30T09:20:00.000Z",
    summary: "多家 AI 编程产品将能力从代码补全扩展到需求拆解、跨文件修改、测试修复和 PR 说明。",
    url: "https://example.com/ai-coding-agent",
    keywords: ["AI Coding", "AI Agent", "Developer Tools"],
    importanceScore: 9.4,
    aiSummary: "AI 编程助手正在从被动补全走向主动执行，产品边界从 IDE 插件扩展到研发流程工作台。",
    whyImportant: "开发者工具的竞争焦点正在变化：模型能力仍然重要，但上下文管理、任务规划和验证闭环会成为新门槛。",
    writingAngles: angles([
      ["产品分析", "拆解 AI 编程工具从补全到任务执行的产品边界变化。", "AI 产品经理"],
      ["趋势判断", "观察开发工作流是否会被 Agent 重新组织。", "开发者"],
      ["职业启发", "讨论开发者如何适应 AI 参与研发流程。", "开发者"]
    ]),
    rawContent: "Mock article about AI coding agents.",
    provider: "mock"
  },
  {
    id: "mock-multimodal-long-context",
    title: "头部大模型厂商发布长上下文多模态模型",
    translatedTitle: "头部大模型厂商发布长上下文多模态模型",
    source: "模型观察",
    publishedAt: "2026-04-29T18:40:00.000Z",
    summary: "新模型支持更长文本、图像和视频输入，强调复杂资料理解与多步骤推理。",
    url: "https://example.com/multimodal-long-context",
    keywords: ["Multimodal", "LLM", "Model"],
    importanceScore: 8.9,
    aiSummary: "多模态模型开始把长文档、图片和视频统一纳入同一工作流，适合办公、教育和研究场景。",
    whyImportant: "当模型能稳定处理更长上下文，内容生产者可以重新设计选题调研、资料整理和观点验证方式。",
    writingAngles: angles([
      ["技术科普", "解释长上下文和多模态对内容处理意味着什么。", "普通 AI 用户"],
      ["新闻解读", "把模型发布放进 AI 应用竞争的大背景里解读。", "AI 产品经理"],
      ["趋势判断", "判断多模态能力会如何改变办公和研究流程。", "创业者"]
    ]),
    rawContent: "Mock article about multimodal long context models.",
    provider: "mock"
  },
  {
    id: "mock-ai-search-research",
    title: "AI 搜索产品加入可追溯答案和深度研究模式",
    translatedTitle: "AI 搜索产品加入可追溯答案和深度研究模式",
    source: "Search Lab",
    publishedAt: "2026-04-28T13:10:00.000Z",
    summary: "新版本强调引用链、对比表格和自动生成研究提纲，试图覆盖复杂信息查询。",
    url: "https://example.com/ai-search-research",
    keywords: ["AI Search", "Search", "LLM"],
    importanceScore: 8.6,
    aiSummary: "AI 搜索正在从问答入口变成研究助手，用户不只要答案，也需要证据、脉络和可复查路径。",
    whyImportant: "这会影响媒体、知识工作者和内容创作者的资料工作流，也会重塑搜索产品的商业定位。",
    writingAngles: angles([
      ["新闻解读", "解释 AI 搜索为什么不只是搜索框升级。", "普通 AI 用户"],
      ["产品分析", "分析可追溯答案和深度研究模式的产品价值。", "AI 产品经理"],
      ["个人观点", "讨论内容创作者应如何重新看待资料检索。", "内容创作者"]
    ]),
    rawContent: "Mock article about AI search and research mode.",
    provider: "mock"
  },
  {
    id: "mock-open-small-model-office",
    title: "开源小模型在端侧办公场景获得企业试点",
    translatedTitle: "开源小模型在端侧办公场景获得企业试点",
    source: "Open Model Weekly",
    publishedAt: "2026-04-27T20:30:00.000Z",
    summary: "几款开源小模型通过量化和端侧推理优化，被用于会议纪要、邮件草稿和内部知识问答。",
    url: "https://example.com/open-small-model-office",
    keywords: ["Open source", "Model", "AI Office"],
    importanceScore: 8.2,
    aiSummary: "企业开始关注可控、低成本、低延迟的小模型方案，尤其适合隐私敏感的办公场景。",
    whyImportant: "大模型不一定都要云端巨型模型，端侧与开源路线可能推动 AI 办公工具进入更细分的企业流程。",
    writingAngles: angles([
      ["技术科普", "讲清小模型、量化和端侧部署的实际意义。", "开发者"],
      ["趋势判断", "观察开源模型是否会推动企业私有 AI。", "创业者"],
      ["产品分析", "拆解端侧办公 AI 的优势和限制。", "AI 产品经理"]
    ]),
    rawContent: "Mock article about open small models in office scenarios.",
    provider: "mock"
  },
  {
    id: "mock-agent-sales-funding",
    title: "Agent 初创公司获得新一轮融资，主打销售自动化",
    translatedTitle: "Agent 初创公司获得新一轮融资，主打销售自动化",
    source: "Venture AI",
    publishedAt: "2026-04-26T16:05:00.000Z",
    summary: "该公司声称 Agent 可以自动完成线索研究、邮件生成、CRM 更新和跟进提醒。",
    url: "https://example.com/agent-sales-funding",
    keywords: ["AI Agent", "Funding", "Product"],
    importanceScore: 7.8,
    aiSummary: "资本继续下注垂直 Agent，但市场开始要求可衡量的业务结果，而不是单纯演示自动化流程。",
    whyImportant: "Agent 从概念走向商业化时，产品必须证明稳定性、可控性和 ROI，这对所有 AI 应用都是压力测试。",
    writingAngles: angles([
      ["产品分析", "分析销售 Agent 的价值闭环和落地难点。", "AI 产品经理"],
      ["创业观察", "讨论资本为什么仍在押注垂直 Agent。", "创业者"],
      ["风险提醒", "提醒读者区分演示自动化和真实业务结果。", "创业者"]
    ]),
    rawContent: "Mock article about sales agent funding.",
    provider: "mock"
  },
  {
    id: "mock-ai-office-loop",
    title: "AI 办公套件推出会议到执行任务的闭环功能",
    translatedTitle: "AI 办公套件推出会议到执行任务的闭环功能",
    source: "Work OS Review",
    publishedAt: "2026-04-25T11:45:00.000Z",
    summary: "新功能可以从会议转写中识别任务、分配负责人、生成项目看板并提醒后续进度。",
    url: "https://example.com/ai-office-loop",
    keywords: ["AI Office", "Agent", "Product"],
    importanceScore: 8.4,
    aiSummary: "办公 AI 正在从文档润色走向协作流程编排，把会议内容直接转化为团队行动。",
    whyImportant: "AI 办公工具的价值不再只是节省写作时间，而是减少信息丢失和跨工具搬运。",
    writingAngles: angles([
      ["产品分析", "拆解办公 AI 从内容工具到流程工具的变化。", "AI 产品经理"],
      ["职业启发", "讨论知识工作者如何把 AI 嵌入日常协作。", "普通 AI 用户"],
      ["趋势判断", "判断办公入口是否会被 AI 重新组织。", "创业者"]
    ]),
    rawContent: "Mock article about AI office workflow loop.",
    provider: "mock"
  },
  {
    id: "mock-ai-career-coach",
    title: "教育平台上线面向大学生的 AI 求职教练",
    translatedTitle: "教育平台上线面向大学生的 AI 求职教练",
    source: "EduTech Front",
    publishedAt: "2026-04-24T08:30:00.000Z",
    summary: "产品覆盖简历诊断、岗位匹配、模拟面试和项目经历提炼，强调个性化反馈。",
    url: "https://example.com/ai-career-coach",
    keywords: ["ChatGPT", "AI Education", "Product"],
    importanceScore: 7.3,
    aiSummary: "AI 教练类产品正在进入就业场景，核心是把通用模型转成可持续陪练和反馈机制。",
    whyImportant: "这类产品容易被用户感知价值，但也要处理建议可靠性、求职公平和心理依赖问题。",
    writingAngles: angles([
      ["职业启发", "面向求职者讲清 AI 求职教练能帮什么。", "大学生 / 求职者"],
      ["个人观点", "讨论 AI 是否会改变求职准备方式。", "普通 AI 用户"],
      ["风险提醒", "提醒读者注意建议可靠性和心理依赖。", "大学生 / 求职者"]
    ]),
    rawContent: "Mock article about AI career coach.",
    provider: "mock"
  },
  {
    id: "mock-browser-ai-agent",
    title: "浏览器厂商测试内置 AI 网页操作助手",
    translatedTitle: "浏览器厂商测试内置 AI 网页操作助手",
    source: "Web Future",
    publishedAt: "2026-04-23T22:15:00.000Z",
    summary: "实验功能允许用户用自然语言让浏览器对网页进行整理、填写、比价和摘要。",
    url: "https://example.com/browser-ai-agent",
    keywords: ["AI Agent", "Search", "Product"],
    importanceScore: 8.7,
    aiSummary: "浏览器可能成为普通用户接触 Agent 的默认入口，因为它天然连接网页、账号和日常任务。",
    whyImportant: "如果浏览器 Agent 成熟，AI 应用入口会从独立 App 转向用户已有的工作和消费环境。",
    writingAngles: angles([
      ["趋势判断", "判断浏览器会不会成为 Agent 的默认入口。", "AI 产品经理"],
      ["新闻解读", "解释内置网页操作助手与普通插件的差异。", "普通 AI 用户"],
      ["技术科普", "讲清网页操作 Agent 的能力边界。", "开发者"]
    ]),
    rawContent: "Mock article about browser AI agents.",
    provider: "mock"
  }
];
