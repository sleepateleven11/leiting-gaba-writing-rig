"use client";

import { Lock, RefreshCw, Sparkles, Unlock } from "lucide-react";
import type { RewriteInstruction } from "@/types";
import { cn } from "@/lib/cn";

type ArticleBlockToolbarProps = {
  locked: boolean;
  generating: boolean;
  rewriting: boolean;
  canGenerate: boolean;
  onGenerate: () => void;
  onRewrite: (instruction: RewriteInstruction) => void;
  onToggleLock: () => void;
};

const rewriteActions: Array<{ instruction: RewriteInstruction; label: string }> = [
  { instruction: "expand", label: "扩写" },
  { instruction: "shorten", label: "缩写" },
  { instruction: "wechat_style", label: "公众号感" },
  { instruction: "reduce_ai_tone", label: "降 AI 味" },
  { instruction: "add_example", label: "加案例" },
  { instruction: "add_transition", label: "加转场" }
];

export function ArticleBlockToolbar({
  locked,
  generating,
  rewriting,
  canGenerate,
  onGenerate,
  onRewrite,
  onToggleLock
}: ArticleBlockToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {canGenerate && (
        <button
          type="button"
          onClick={onGenerate}
          disabled={locked || generating}
          className="inline-flex items-center gap-1.5 rounded-lg bg-ink px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-tech-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
        >
          <RefreshCw className={cn("h-3.5 w-3.5", generating && "animate-spin")} />
          {generating ? "生成中" : "生成本节"}
        </button>
      )}

      {rewriteActions.map((action) => (
        <button
          key={action.instruction}
          type="button"
          onClick={() => onRewrite(action.instruction)}
          disabled={locked || rewriting}
          className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-tech-100 hover:text-tech-700 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
        >
          <Sparkles className={cn("h-3.5 w-3.5", rewriting && "animate-pulse")} />
          {action.label}
        </button>
      ))}

      <button
        type="button"
        onClick={onToggleLock}
        className={cn(
          "ml-auto inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition",
          locked
            ? "border-amber-200 bg-ambersoft-50 text-ambersoft-500 hover:bg-white"
            : "border-line bg-white text-slate-600 hover:border-tech-100 hover:text-tech-700"
        )}
      >
        {locked ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
        {locked ? "已锁定" : "锁定"}
      </button>
    </div>
  );
}
