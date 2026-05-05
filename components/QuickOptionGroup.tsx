"use client";

import type { QuickOptionKind } from "@/types";
import { cn } from "@/lib/cn";

type QuickOptionGroupProps = {
  title: string;
  kind: QuickOptionKind;
  options: string[];
  value: string;
  onSelect: (kind: QuickOptionKind, value: string) => void;
};

export function QuickOptionGroup({
  title,
  kind,
  options,
  value,
  onSelect
}: QuickOptionGroupProps) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
      <p className="w-16 shrink-0 pt-2 text-xs font-semibold text-slate-500">{title}</p>
      <div className="flex flex-1 flex-wrap gap-1.5">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onSelect(kind, option)}
            className={cn(
              "rounded-md border px-2.5 py-1.5 text-xs font-semibold transition",
              value === option
                ? "border-ink bg-ink text-white"
                : "border-line bg-white text-slate-600 hover:border-tech-100 hover:text-tech-700"
            )}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}
