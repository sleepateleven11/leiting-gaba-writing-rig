"use client";

import { Send, Bot, UserRound, Lightbulb, Loader2 } from "lucide-react";
import { FormEvent, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import type {
  ChatMessage as ChatMessageType,
  QuickOptionKind,
  SuggestionCardData,
  ThoughtBoard,
  WorkspaceStatus
} from "@/types";

type ChatPanelProps = {
  workspaceName: string;
  status: WorkspaceStatus;
  thoughtBoard: ThoughtBoard;
  messages: ChatMessageType[];
  isTyping: boolean;
  onSend: (input: string) => void;
  onQuickOption: (kind: QuickOptionKind, value: string) => void;
  onApplyCoreIdea: (suggestion: SuggestionCardData) => void;
  onApplyMainLine: (suggestion: SuggestionCardData) => void;
  onKeepReference: (suggestion: SuggestionCardData) => void;
};

const statusLabels: Record<WorkspaceStatus, string> = {
  empty: "等待素材",
  collecting: "正在构思",
  outlining: "大纲成型中",
  confirmed: "大纲已确认"
};

const audiences = ["AI 产品经理", "开发者", "大学生&求职者", "普通 AI 用户", "创业者"];
const angles = ["新闻解读", "产品分析", "趋势判断", "技术科普", "职业启发", "个人观点"];
const stances = ["看好", "质疑", "中立分析", "提醒风险", "提炼启发"];

export function ChatPanel({
  workspaceName,
  status,
  thoughtBoard,
  messages,
  isTyping,
  onSend,
  onQuickOption,
  onApplyCoreIdea,
  onApplyMainLine,
  onKeepReference
}: ChatPanelProps) {
  const [input, setInput] = useState("");
  const listRef = useRef<HTMLDivElement | null>(null);
  const hasStreamingMessage = messages.some((m) => m.isStreaming);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isTyping]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = input.trim();
    if (!value || isTyping) return;
    setInput("");
    onSend(value);
  }

  return (
    <section className="flex-1 flex flex-col border-r bg-white min-h-0">
      <div className="border-b px-6 py-4">
        <div className="flex items-center gap-2 mb-4">
          <Bot className="w-5 h-5 text-purple-600" />
          <h2 className="font-semibold">AI 编辑助手</h2>
          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
            {statusLabels[status]}
          </span>
        </div>
        <h3 className="text-lg font-semibold mb-3">{workspaceName}</h3>

        <div className="space-y-3">
          <div>
            <div className="text-xs text-gray-600 mb-1">目标读者</div>
            <div className="flex flex-wrap gap-2">
              {audiences.map((aud) => (
                <motion.button
                  key={aud}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onQuickOption("targetReader", aud)}
                  className={`px-3 py-1 rounded-full text-xs transition-all ${
                    thoughtBoard.targetReader === aud
                      ? "bg-purple-600 text-white shadow-md"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {aud}
                </motion.button>
              ))}
            </div>
          </div>

          <div>
            <div className="text-xs text-gray-600 mb-1">写作角度</div>
            <div className="flex flex-wrap gap-2">
              {angles.map((ang) => (
                <motion.button
                  key={ang}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onQuickOption("writingAngle", ang)}
                  className={`px-3 py-1 rounded-full text-xs transition-all ${
                    thoughtBoard.writingAngle === ang
                      ? "bg-blue-600 text-white shadow-md"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {ang}
                </motion.button>
              ))}
            </div>
          </div>

          <div>
            <div className="text-xs text-gray-600 mb-1">表达立场</div>
            <div className="flex flex-wrap gap-2">
              {stances.map((st) => (
                <motion.button
                  key={st}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onQuickOption("stance", st)}
                  className={`px-3 py-1 rounded-full text-xs transition-all ${
                    thoughtBoard.stance === st
                      ? "bg-green-600 text-white shadow-md"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {st}
                </motion.button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div ref={listRef} className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin">
        <AnimatePresence>
          {messages.map((msg, index) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                msg.role === "user" ? "bg-purple-600" : "bg-gray-200"
              }`}>
                {msg.role === "user" ? (
                  <UserRound className="w-4 h-4 text-white" />
                ) : (
                  <Bot className="w-4 h-4 text-gray-700" />
                )}
              </div>
              <div className={`flex-1 ${msg.role === "user" ? "text-right" : ""}`}>
                <div className={`inline-block px-4 py-3 rounded-lg ${
                  msg.role === "user"
                    ? "bg-purple-600 text-white"
                    : msg.isReference
                      ? "border border-dashed border-gray-300 bg-gray-50 text-gray-600"
                      : "bg-gray-100 text-gray-900"
                }`}>
                  <div className="whitespace-pre-wrap text-sm">
                    {msg.content || msg.streamingStatus || "正在理解新闻素材..."}
                  </div>
                  {!msg.isReference && msg.isStreaming && (
                    <div className="mt-2 inline-flex items-center gap-2 rounded-md bg-gray-200 px-2 py-1 text-xs font-medium text-gray-600">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      {msg.streamingStatus || "正在生成回答..."}
                    </div>
                  )}
                  {!msg.isReference && msg.role === "assistant" && msg.reasoningSummary && (
                    <details className="mt-3 rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-500">
                      <summary className="cursor-pointer font-medium text-gray-600">AI 分析摘要</summary>
                      <p className="mt-2 leading-5">{msg.reasoningSummary}</p>
                    </details>
                  )}
                </div>

                {msg.role === "assistant" && msg.suggestion && !msg.isReference && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="mt-3 border rounded-lg p-4 bg-blue-50 border-blue-200"
                  >
                    <div className="flex items-start gap-2 mb-3">
                      <Lightbulb className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <h4 className="font-medium text-blue-900 mb-1">{msg.suggestion.headline}</h4>
                        <div className="text-sm text-blue-800 space-y-1">
                          {msg.suggestion.mainLine && (
                            <p><span className="font-medium">建议主线:</span> {msg.suggestion.mainLine}</p>
                          )}
                          {msg.suggestion.coreIdea && (
                            <p><span className="font-medium">建议核心观点:</span> {msg.suggestion.coreIdea}</p>
                          )}
                        </div>
                        <div className="flex gap-2 mt-2 text-xs">
                          <span className="px-2 py-1 bg-blue-200 text-blue-800 rounded">读者: {msg.suggestion.targetReader || "待定"}</span>
                          <span className="px-2 py-1 bg-blue-200 text-blue-800 rounded">角度: {msg.suggestion.writingAngle || "待定"}</span>
                          <span className="px-2 py-1 bg-blue-200 text-blue-800 rounded">立场: {msg.suggestion.stance || "待定"}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => onApplyCoreIdea(msg.suggestion!)}
                        className="flex-1 px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 hover:shadow-md transition-all"
                      >
                        应用为核心观点
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => onApplyMainLine(msg.suggestion!)}
                        className="flex-1 px-3 py-2 bg-white text-blue-600 border border-blue-600 rounded text-sm hover:bg-blue-50 hover:shadow-md transition-all"
                      >
                        应用为文章主线
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => onKeepReference(msg.suggestion!)}
                        className="px-3 py-2 bg-white text-gray-600 border border-gray-300 rounded text-sm hover:bg-gray-50 hover:shadow-md transition-all"
                      >
                        仅保留为参考
                      </motion.button>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isTyping && !hasStreamingMessage && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
              <Bot className="w-4 h-4 text-gray-700" />
            </div>
            <div className="flex items-center gap-2 px-4 py-3 bg-gray-100 rounded-lg">
              <Loader2 className="w-4 h-4 animate-spin text-gray-600" />
              <span className="text-sm text-gray-600">AI 正在思考...</span>
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="border-t p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="输入你的想法或问题..."
            className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <button
            type="submit"
            disabled={!input.trim() || isTyping}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </form>
    </section>
  );
}
