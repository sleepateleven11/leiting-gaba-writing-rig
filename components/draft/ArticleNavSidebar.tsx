"use client";

import { CheckCircle2, CircleDashed, ClipboardList, Lock, PenLine } from "lucide-react";
import type { ArticleNavItem } from "@/lib/draft/articleBlocks";
import { cn } from "@/lib/cn";

type ArticleNavSidebarProps = {
  items: ArticleNavItem[];
  activeSectionId?: string;
  onSelect: (sectionId: string) => void;
};

const statusLabel: Record<ArticleNavItem["status"], string> = {
  empty: "未生成",
  generated: "已生成",
  edited: "已编辑",
  locked: "已锁定"
};

export function ArticleNavSidebar({ items, activeSectionId, onSelect }: ArticleNavSidebarProps) {
  return (
    <aside className="flex min-h-0 flex-col rounded-lg border border-line bg-white shadow-sm">
      <div className="border-b border-line p-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-tech-700">
          <ClipboardList className="h-4 w-4" />
          文章结构
        </div>
        <p className="mt-2 text-xs leading-5 text-muted">
          根据已确认大纲生成。点击节点可定位到正文块。
        </p>
      </div>

      <div className="scrollbar-thin min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
        {items.map((item, index) => {
          const active = item.sectionId === activeSectionId;
          const Icon = item.locked ? Lock : item.status === "edited" ? PenLine : item.status === "generated" ? CheckCircle2 : CircleDashed;

          return (
            <button
              key={item.sectionId}
              type="button"
              onClick={() => onSelect(item.sectionId)}
              className={cn(
                "w-full rounded-lg border p-3 text-left transition",
                active
                  ? "border-tech-200 bg-tech-50 shadow-sm"
                  : "border-transparent bg-slate-50 hover:border-tech-100 hover:bg-white"
              )}
            >
              <div className="flex items-start gap-2">
                <span
                  className={cn(
                    "mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full border text-[11px] font-semibold",
                    active ? "border-tech-200 bg-white text-tech-700" : "border-slate-200 bg-white text-slate-500"
                  )}
                >
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-sm font-semibold leading-5 text-ink">{item.sectionTitle}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted">
                    <span className="inline-flex items-center gap-1">
                      <Icon className="h-3.5 w-3.5" />
                      {statusLabel[item.status]}
                    </span>
                    <span>{item.wordCount} 字</span>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
