import type { Outline, OutlineSection, RewriteInstruction, WorkspaceState } from "@/types";

export function mockFullArticleText(workspace: WorkspaceState, outline: Outline) {
  const sections = outline.sections.map((section) => {
    return `${section.title}\n\n${mockSectionText(workspace, outline, section)}`;
  });

  return [
    outline.recommendedTitle,
    mockIntroText(workspace, outline),
    ...sections,
    "结尾",
    mockConclusionText(workspace, outline)
  ].join("\n\n");
}

export function mockSectionText(workspace: WorkspaceState, outline: Outline, section: OutlineSection) {
  if (section.id === "article-intro") {
    return mockIntroText(workspace, outline);
  }

  if (section.id === "article-conclusion") {
    return mockConclusionText(workspace, outline);
  }

  const mainNews = workspace.selectedNews.find((item) => item.news.id === workspace.thoughtBoard.mainNewsId)?.news ?? workspace.selectedNews[0]?.news;
  const fact = mainNews?.aiSummary || mainNews?.summary || "这些新闻更像是一个观察窗口，而不是可以马上下定论的终点。";
  const reader = workspace.thoughtBoard.targetReader || "读者";
  const core = workspace.thoughtBoard.coreIdea || section.purpose;

  return [
    `把这一节放在文章里，重点不是复述新闻，而是把它和读者手里的问题连起来。${core}`,
    `从目前的素材看，比较确定的一点是：${fact}`,
    `对${reader}来说，这里真正需要判断的是工具有没有进入真实任务，而不是演示时看起来有多完整。这个问题不会因为一次发布就有答案，但它已经值得被认真观察。`
  ].join("\n\n");
}

export function mockRewriteSelectionText(selectedText: string, instruction: RewriteInstruction, customInstruction?: string) {
  const clean = selectedText.trim();
  if (!clean) {
    return "";
  }

  if (instruction === "polish") {
    return `${clean} 这句话可以再写得松一点：保留原来的判断，但让语气更像人在认真解释，而不是在给结论贴标签。`;
  }

  if (instruction === "expand") {
    return `${clean}\n\n再往前想一步，这类变化真正影响的不是某个按钮好不好用，而是用户会不会把它交给日常任务。只要进入了任务链路，评价标准就会从“能不能演示”变成“能不能稳定交付”。`;
  }

  if (instruction === "shorten") {
    return clean.split(/[。！？\n]/).filter(Boolean).slice(0, 2).join("。").concat("。");
  }

  if (instruction === "wechat_style") {
    return `换成公众号里更自然的说法：${clean} 这件事的看点不在热闹，而在它会不会改变真实的工作节奏。`;
  }

  if (instruction === "reduce_ai_tone") {
    return clean
      .replace(/清晰的信号/g, "一个变化")
      .replace(/值得注意的是/g, "我更在意的是")
      .replace(/综上所述/g, "说到底");
  }

  if (instruction === "add_example") {
    return `${clean}\n\n举个更贴近日常的例子：过去用户可能只是让 AI 帮忙补一段代码，现在则会希望它读懂任务、修改文件、解释影响，再把结果交给人确认。这个跨度，比“效率提升”四个字要具体得多。`;
  }

  if (instruction === "add_transition") {
    return `${clean}\n\n但这还不是最关键的地方。真正需要继续追问的是：这些能力会停留在演示里，还是会进入用户每天反复发生的工作流。`;
  }

  if (instruction === "more_oral") {
    return `说得直白一点，${clean} 这不是单纯的新功能更新，而是在提醒我们：AI 工具开始接近真实工作了。`;
  }

  return customInstruction ? `${clean}\n\n按你的要求再调整一下：${customInstruction}` : clean;
}

function mockIntroText(workspace: WorkspaceState, outline: Outline) {
  const mainNews = workspace.selectedNews[0]?.news;
  const topic = workspace.thoughtBoard.topic || outline.recommendedTitle;
  return [
    mainNews
      ? `最近这条新闻挺适合作为切口：${mainNews.translatedTitle || mainNews.title}。它本身当然是一个产品或模型动态，但更有意思的是，它把一个老问题又推到了台前。`
      : "这篇文章可以从一个具体变化写起，而不是一上来就给宏大的趋势判断。",
    `把几条素材放在一起看，会发现它们都绕着同一个问题转：${topic}。这个变化不算突然，但它带来的问题，比表面看起来复杂得多。`
  ].join("\n\n");
}

function mockConclusionText(workspace: WorkspaceState, outline: Outline) {
  const reader = workspace.thoughtBoard.targetReader || "读者";
  return [
    outline.ending,
    `对${reader}来说，接下来不妨少看一点口号，多看三个细节：它解决了哪个真实任务，成本和稳定性够不够，以及人还需要在哪些地方保留判断。`,
    outline.readerTakeaway
  ].join("\n\n");
}
