"use client";

import { Bookmark, Eye, Pin, Star, Trash2 } from "lucide-react";
import type { NewsRole, WorkspaceNews } from "@/types";
import { formatRole } from "@/lib/workspace";
import { cn } from "@/lib/cn";
import { formatImportanceScore, getTranslatedTitle } from "@/lib/newsDisplay";

type SelectedNewsListProps = {
  items: WorkspaceNews[];
  onOpenDetails: (id: string) => void;
  onSetRole: (id: string, role: NewsRole) => void;
  onRemove: (id: string) => void;
  onUpdateNote: (id: string, note: string) => void;
};

const roleOptions: Array<{ role: NewsRole; label: string }> = [
  { role: "main_news", label: "主新闻" },
  { role: "supporting_news", label: "辅助" },
  { role: "reference_news", label: "参考" }
];

export function SelectedNewsList({
  items,
  onOpenDetails,
  onSetRole,
  onRemove,
  onUpdateNote
}: SelectedNewsListProps) {
  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-line bg-slate-50 p-4 text-sm leading-6 text-muted">
        还没有新闻进入工作区。切到“全部新闻”挑一条，右侧会先形成粗略思路和大纲。
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => {
        const isMain = item.role === "main_news";
        return (
          <article
            key={item.news.id}
            className={cn(
              "rounded-lg border bg-white p-3 transition",
              isMain ? "border-tech-100 bg-tech-50/35 shadow-sm" : "border-line"
            )}
          >
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold",
                  isMain ? "bg-ink text-white" : "bg-slate-100 text-slate-600"
                )}
              >
                {isMain && <Pin className="h-3 w-3" />}
                {formatRole(item.role)}
              </span>
              <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-tech-700">
                <Star className="h-3 w-3 fill-tech-500 text-tech-500" />
                {formatImportanceScore(item.news.importanceScore)}
              </span>
            </div>

            <h3 className="text-sm font-semibold leading-5 text-ink">{item.news.title}</h3>
            <p className="mt-1 text-xs font-medium leading-5 text-slate-600">{getTranslatedTitle(item.news)}</p>

            <div className="mt-3 grid grid-cols-3 gap-1.5">
              {roleOptions.map((option) => (
                <button
                  key={option.role}
                  type="button"
                  onClick={() => onSetRole(item.news.id, option.role)}
                  className={cn(
                    "rounded-md border px-2 py-1.5 text-xs font-semibold transition",
                    item.role === option.role
                      ? "border-ink bg-ink text-white"
                      : "border-line bg-white text-slate-600 hover:border-tech-100 hover:text-tech-700"
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <label className="mt-3 block">
              <span className="mb-1 flex items-center gap-1 text-xs font-semibold text-slate-500">
                <Bookmark className="h-3 w-3" />
                一句备注
              </span>
              <textarea
                value={item.note ?? ""}
                onChange={(event) => onUpdateNote(item.news.id, event.target.value)}
                rows={2}
                placeholder="例如：适合放在第二节做案例"
                className="w-full resize-none rounded-lg border border-line bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-700 transition placeholder:text-slate-400 focus:border-tech-100 focus:bg-white"
              />
            </label>

            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => onOpenDetails(item.news.id)}
                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-line bg-white px-2 py-2 text-xs font-semibold text-slate-700 transition hover:border-tech-100 hover:text-tech-700"
              >
                <Eye className="h-3.5 w-3.5" />
                详情
              </button>
              <button
                type="button"
                onClick={() => {
                  const ok = window.confirm("确认把这条新闻移出工作区吗？右侧会提示是否优化大纲。");
                  if (ok) {
                    onRemove(item.news.id);
                  }
                }}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-red-100 bg-red-50 px-2 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-100"
              >
                <Trash2 className="h-3.5 w-3.5" />
                移出
              </button>
            </div>
          </article>
        );
      })}
    </div>
  );
}
