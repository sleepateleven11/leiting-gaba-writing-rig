"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import type { RewriteInstruction } from "@/types";

type RewriteAction = {
  instruction: RewriteInstruction;
  label: string;
  shortLabel: string;
};

const rewriteActions: RewriteAction[] = [
  { instruction: "polish", label: "润色", shortLabel: "润色" },
  { instruction: "expand", label: "扩写", shortLabel: "扩写" },
  { instruction: "shorten", label: "缩写", shortLabel: "缩写" },
  { instruction: "wechat_style", label: "改公众号感", shortLabel: "公众号感" },
  { instruction: "reduce_ai_tone", label: "降 AI 味", shortLabel: "降AI味" },
  { instruction: "add_example", label: "加案例", shortLabel: "加案例" },
  { instruction: "add_transition", label: "加转场", shortLabel: "加转场" },
  { instruction: "more_oral", label: "改得更口语", shortLabel: "更口语" },
  { instruction: "custom", label: "自定义指令", shortLabel: "自定义" }
];

type AIFloatingToolbarProps = {
  position: { x: number; y: number } | null;
  selectedText: string;
  isRewriting: boolean;
  rewriteResult: string;
  instructionLabel: string;
  onAction: (instruction: RewriteInstruction, customInstruction?: string) => void;
  onAccept: () => void;
  onCancel: () => void;
  onDismiss: () => void;
};

export function AIFloatingToolbar({
  position,
  selectedText,
  isRewriting,
  rewriteResult,
  instructionLabel,
  onAction,
  onAccept,
  onCancel,
  onDismiss
}: AIFloatingToolbarProps) {
  const [customInput, setCustomInput] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);
  const toolbarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (toolbarRef.current && !toolbarRef.current.contains(e.target as Node)) {
        if (!isRewriting) {
          onDismiss();
        }
      }
    }

    if (position) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [position, isRewriting, onDismiss]);

  useEffect(() => {
    setShowCustomInput(false);
    setCustomInput("");
  }, [selectedText]);

  if (!position) {
    return null;
  }

  return (
    <div
      ref={toolbarRef}
      className="fixed z-50"
      style={{
        left: Math.min(position.x, window.innerWidth - 320),
        top: position.y - 12
      }}
    >
      {(isRewriting || rewriteResult) ? (
        <div className="w-[340px] rounded-xl border border-tech-200 bg-white p-4 shadow-xl">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold text-tech-700">
              {instructionLabel}结果
            </span>
            {isRewriting && (
              <span className="inline-flex items-center gap-1 text-xs text-muted">
                <span className="inline-block h-2.5 w-2.5 animate-spin rounded-full border-2 border-tech-200 border-t-tech-600" />
                生成中
              </span>
            )}
          </div>
          <div className="mb-3 max-h-[200px] overflow-y-auto rounded-lg border border-line bg-slate-50 p-3 text-sm leading-6 text-ink whitespace-pre-wrap">
            {rewriteResult}
          </div>
          {!isRewriting && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onAccept}
                className="flex-1 rounded-lg bg-ink py-2 text-xs font-semibold text-white transition hover:bg-tech-700"
              >
                替换原文
              </button>
              <button
                type="button"
                onClick={onCancel}
                className="rounded-lg border border-line bg-white px-4 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                取消
              </button>
            </div>
          )}
        </div>
      ) : showCustomInput ? (
        <div className="w-[300px] rounded-xl border border-tech-200 bg-white p-3 shadow-xl">
          <textarea
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            placeholder="输入改写指令..."
            className="mb-2 w-full resize-none rounded-lg border border-line p-2 text-xs text-ink outline-none placeholder:text-slate-400 focus:border-tech-200"
            rows={2}
            autoFocus
          />
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (customInput.trim()) {
                  onAction("custom", customInput.trim());
                }
              }}
              disabled={!customInput.trim()}
              className="flex-1 rounded-lg bg-ink py-1.5 text-xs font-semibold text-white transition hover:bg-tech-700 disabled:bg-slate-200 disabled:text-slate-500"
            >
              确定
            </button>
            <button
              type="button"
              onClick={() => setShowCustomInput(false)}
              className="rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              返回
            </button>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-line bg-white p-2 shadow-xl">
          <div className="mb-2 flex items-center justify-between px-1">
            <span className="text-[11px] font-semibold text-muted">
              已选中 {selectedText.length} 字
            </span>
            <button
              type="button"
              onClick={onDismiss}
              className="text-xs text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
          </div>
          <div className="grid grid-cols-3 gap-1">
            {rewriteActions.map((action) => (
              <button
                key={action.instruction}
                type="button"
                onClick={() => {
                  if (action.instruction === "custom") {
                    setShowCustomInput(true);
                  } else {
                    onAction(action.instruction);
                  }
                }}
                className={cn(
                  "rounded-lg px-2 py-1.5 text-[11px] font-semibold transition",
                  "border border-line bg-white text-slate-600 hover:border-tech-100 hover:bg-tech-50 hover:text-tech-700"
                )}
              >
                {action.shortLabel}
              </button>
            ))}
          </div>
          <p className="mt-1.5 px-1 text-[10px] text-muted">点击空白处关闭</p>
        </div>
      )}
    </div>
  );
}
