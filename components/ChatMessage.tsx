"use client";

import { Bot, Loader2, UserRound } from "lucide-react";
import type { ChatMessage as ChatMessageType, SuggestionCardData } from "@/types";
import { SuggestionCard } from "@/components/SuggestionCard";
import { cn } from "@/lib/cn";

type ChatMessageProps = {
  message: ChatMessageType;
  onApplyCoreIdea: (suggestion: SuggestionCardData) => void;
  onApplyMainLine: (suggestion: SuggestionCardData) => void;
  onKeepReference: (suggestion: SuggestionCardData) => void;
};

export function ChatMessage({
  message,
  onApplyCoreIdea,
  onApplyMainLine,
  onKeepReference
}: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <div className={cn("flex gap-3", isUser && "justify-end")}>
      {!isUser && (
        <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-ink text-white">
          <Bot className="h-4 w-4" />
        </div>
      )}
      <div className={cn("max-w-[86%]", isUser && "order-first")}>
        <div
          className={cn(
            "whitespace-pre-line rounded-lg px-4 py-3 text-sm leading-6 shadow-sm",
            isUser
              ? "bg-tech-600 text-white"
              : message.isReference
                ? "border border-dashed border-line bg-slate-50 text-slate-600"
                : "border border-line bg-white text-slate-700"
          )}
        >
          {message.content || message.streamingStatus || "正在理解新闻素材..."}
          {!isUser && message.isStreaming && (
            <div className="mt-2 inline-flex items-center gap-2 rounded-md bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-500">
              <Loader2 className="h-3 w-3 animate-spin" />
              {message.streamingStatus || "正在生成回答..."}
            </div>
          )}
          {!isUser && message.reasoningSummary && (
            <details className="mt-3 rounded-md border border-line bg-slate-50 px-3 py-2 text-xs text-slate-500">
              <summary className="cursor-pointer font-semibold text-slate-600">AI 分析摘要</summary>
              <p className="mt-2 leading-5">{message.reasoningSummary}</p>
            </details>
          )}
        </div>
        {!isUser && message.suggestion && !message.isReference && (
          <SuggestionCard
            suggestion={message.suggestion}
            onApplyCoreIdea={onApplyCoreIdea}
            onApplyMainLine={onApplyMainLine}
            onKeepReference={onKeepReference}
          />
        )}
      </div>
      {isUser && (
        <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-tech-50 text-tech-700">
          <UserRound className="h-4 w-4" />
        </div>
      )}
    </div>
  );
}
