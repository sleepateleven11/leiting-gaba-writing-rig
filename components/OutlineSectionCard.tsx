"use client";

import {
  ArrowDown,
  ArrowUp,
  Link2,
  Lock,
  Pencil,
  RefreshCw,
  Save,
  Trash2,
  Unlock
} from "lucide-react";
import { useState } from "react";
import type { News, OutlineSection } from "@/types";
import { getNewsTitle } from "@/lib/workspace";
import { cn } from "@/lib/cn";

type OutlineSectionCardProps = {
  section: OutlineSection;
  index: number;
  total: number;
  allNews: News[];
  selectedNewsIds: string[];
  highlighted?: boolean;
  onUpdate: (section: OutlineSection) => void;
  onRegenerate: (id: string) => void;
  onToggleLock: (id: string) => void;
  onDelete: (id: string) => void;
  onMove: (id: string, direction: "up" | "down") => void;
};

export function OutlineSectionCard({
  section,
  index,
  total,
  allNews,
  selectedNewsIds,
  highlighted,
  onUpdate,
  onRegenerate,
  onToggleLock,
  onDelete,
  onMove
}: OutlineSectionCardProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(section);

  function save() {
    onUpdate(draft);
    setEditing(false);
  }

  function toggleRelated(newsId: string, checked: boolean) {
    setDraft((current) => ({
      ...current,
      relatedNewsIds: checked
        ? [...current.relatedNewsIds, newsId]
        : current.relatedNewsIds.filter((id) => id !== newsId)
    }));
  }

  return (
    <article
      className={cn(
        "rounded-lg border bg-white p-3 transition",
        section.locked ? "border-amber-200 bg-ambersoft-50/50" : "border-line",
        highlighted && "field-highlight"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
              第 {index + 1} 节
            </span>
            {section.locked && (
              <span className="inline-flex items-center gap-1 rounded-md bg-ambersoft-50 px-2 py-1 text-xs font-semibold text-ambersoft-500">
                <Lock className="h-3 w-3" />
                已锁定
              </span>
            )}
          </div>
          {editing ? (
            <input
              value={draft.title}
              onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
              className="w-full rounded-md border border-line bg-white px-2 py-2 text-sm font-semibold text-ink focus:border-tech-100"
            />
          ) : (
            <h3 className="text-base font-semibold leading-6 text-ink">{section.title}</h3>
          )}
        </div>

        <div className="flex shrink-0 gap-1">
          <IconButton
            label={section.locked ? "解锁" : "锁定"}
            onClick={() => onToggleLock(section.id)}
          >
            {section.locked ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
          </IconButton>
          <IconButton label={editing ? "保存" : "编辑"} onClick={editing ? save : () => setEditing(true)}>
            {editing ? <Save className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
          </IconButton>
        </div>
      </div>

      <div className="mt-3 space-y-3 text-sm leading-6 text-slate-700">
        {editing ? (
          <>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-slate-500">这一节目的</span>
              <textarea
                value={draft.purpose}
                onChange={(event) => setDraft((current) => ({ ...current, purpose: event.target.value }))}
                rows={2}
                className="w-full resize-none rounded-md border border-line bg-slate-50 px-2 py-2 text-sm focus:border-tech-100 focus:bg-white"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-slate-500">关键要点</span>
              <textarea
                value={draft.keyPoints.join("\n")}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    keyPoints: event.target.value
                      .split("\n")
                      .map((item) => item.trim())
                      .filter(Boolean)
                  }))
                }
                rows={4}
                className="w-full resize-none rounded-md border border-line bg-slate-50 px-2 py-2 text-sm focus:border-tech-100 focus:bg-white"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-slate-500">AI 写作建议</span>
              <textarea
                value={draft.aiAdvice}
                onChange={(event) => setDraft((current) => ({ ...current, aiAdvice: event.target.value }))}
                rows={2}
                className="w-full resize-none rounded-md border border-line bg-slate-50 px-2 py-2 text-sm focus:border-tech-100 focus:bg-white"
              />
            </label>
            <div>
              <span className="mb-1 flex items-center gap-1 text-xs font-semibold text-slate-500">
                <Link2 className="h-3 w-3" />
                关联新闻
              </span>
              <div className="space-y-2">
                {selectedNewsIds.map((newsId) => (
                  <label
                    key={newsId}
                    className="flex items-start gap-2 rounded-md bg-slate-50 p-2 text-xs leading-5 text-slate-700"
                  >
                    <input
                      type="checkbox"
                      checked={draft.relatedNewsIds.includes(newsId)}
                      onChange={(event) => toggleRelated(newsId, event.target.checked)}
                      className="mt-1"
                    />
                    <span>{getNewsTitle(newsId, allNews)}</span>
                  </label>
                ))}
              </div>
            </div>
          </>
        ) : (
          <>
            <InfoBlock label="这一节目的" value={section.purpose} />
            <div>
              <p className="text-xs font-semibold text-slate-500">关键要点</p>
              <ul className="mt-1 space-y-1">
                {section.keyPoints.map((point) => (
                  <li key={point} className="rounded-md bg-slate-50 px-3 py-2">
                    {point}
                  </li>
                ))}
              </ul>
            </div>
            <InfoBlock label="关联新闻" value={section.relatedNewsIds.map((id) => getNewsTitle(id, allNews)).join(" / ") || "暂未关联"} />
            <InfoBlock label="AI 写作建议" value={section.aiAdvice} />
          </>
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <SmallButton onClick={() => onRegenerate(section.id)} disabled={section.locked}>
          <RefreshCw className="h-3.5 w-3.5" />
          重新生成本节
        </SmallButton>
        <SmallButton onClick={() => setEditing(true)}>
          <Link2 className="h-3.5 w-3.5" />
          关联新闻
        </SmallButton>
        <SmallButton onClick={() => onMove(section.id, "up")} disabled={index === 0}>
          <ArrowUp className="h-3.5 w-3.5" />
          上移
        </SmallButton>
        <SmallButton onClick={() => onMove(section.id, "down")} disabled={index === total - 1}>
          <ArrowDown className="h-3.5 w-3.5" />
          下移
        </SmallButton>
        <SmallButton onClick={() => onDelete(section.id)} tone="danger">
          <Trash2 className="h-3.5 w-3.5" />
          删除
        </SmallButton>
      </div>
    </article>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold text-slate-500">{label}</p>
      <p className="mt-1 rounded-md bg-slate-50 px-3 py-2">{value}</p>
    </div>
  );
}

function IconButton({
  label,
  onClick,
  children
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-white text-slate-600 transition hover:border-tech-100 hover:text-tech-700"
      aria-label={label}
      title={label}
    >
      {children}
    </button>
  );
}

function SmallButton({
  children,
  onClick,
  disabled,
  tone
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  tone?: "danger";
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400",
        tone === "danger"
          ? "border-red-100 bg-red-50 text-red-600 hover:bg-red-100"
          : "border-line bg-white text-slate-600 hover:border-tech-100 hover:text-tech-700"
      )}
    >
      {children}
    </button>
  );
}
