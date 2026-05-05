"use client";

import { Check, ClipboardPlus, Lightbulb, Pin } from "lucide-react";
import type { SuggestionCardData } from "@/types";

type SuggestionCardProps = {
  suggestion: SuggestionCardData;
  onApplyCoreIdea: (suggestion: SuggestionCardData) => void;
  onApplyMainLine: (suggestion: SuggestionCardData) => void;
  onKeepReference: (suggestion: SuggestionCardData) => void;
};

export function SuggestionCard({
  suggestion,
  onApplyCoreIdea,
  onApplyMainLine,
  onKeepReference
}: SuggestionCardProps) {
  return (
    <div className="mt-3 rounded-lg border border-tech-100 bg-tech-50/70 p-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-tech-700">
        <Lightbulb className="h-4 w-4" />
        {suggestion.headline}
      </div>
      <div className="mt-3 space-y-2 text-sm leading-6 text-slate-700">
        {suggestion.mainLine && (
          <p>
            <span className="font-semibold text-ink">建议主线：</span>
            {suggestion.mainLine}
          </p>
        )}
        {suggestion.coreIdea && (
          <p>
            <span className="font-semibold text-ink">建议核心观点：</span>
            {suggestion.coreIdea}
          </p>
        )}
        <div className="grid gap-2 sm:grid-cols-3">
          <SmallMeta label="目标读者" value={suggestion.targetReader} />
          <SmallMeta label="写作角度" value={suggestion.writingAngle} />
          <SmallMeta label="表达立场" value={suggestion.stance} />
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onApplyCoreIdea(suggestion)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-ink px-3 py-2 text-xs font-semibold text-white transition hover:bg-tech-700"
        >
          <Check className="h-3.5 w-3.5" />
          应用为核心观点
        </button>
        <button
          type="button"
          onClick={() => onApplyMainLine(suggestion)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-tech-100 bg-white px-3 py-2 text-xs font-semibold text-tech-700 transition hover:bg-tech-50"
        >
          <Pin className="h-3.5 w-3.5" />
          应用为文章主线
        </button>
        <button
          type="button"
          onClick={() => onKeepReference(suggestion)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-tech-100 hover:text-tech-700"
        >
          <ClipboardPlus className="h-3.5 w-3.5" />
          仅保留为参考
        </button>
      </div>
    </div>
  );
}

function SmallMeta({ label, value }: { label: string; value?: string }) {
  return (
    <div className="rounded-lg border border-line bg-white px-3 py-2">
      <p className="text-[11px] font-semibold text-slate-500">{label}</p>
      <p className="mt-1 text-xs font-semibold text-ink">{value || "待定"}</p>
    </div>
  );
}
