"use client";

import { useState } from "react";
import {
  AlertCircle, Sparkles, Lock, Unlock, Edit2, Save,
  ArrowUp, ArrowDown, Trash2, RotateCcw
} from "lucide-react";
import { motion } from "motion/react";
import type { News, Outline, OutlineSection, WorkspaceStatus, WorkspaceNews } from "@/types";
import { getNewsTitle } from "@/lib/workspace";

type OutlinePanelProps = {
  outline: Outline;
  allNews: News[];
  selectedNews: WorkspaceNews[];
  status: WorkspaceStatus;
  previousOutline?: Outline;
  materialDirty: boolean;
  ideaDirty: boolean;
  isOptimizing: boolean;
  highlightedSectionIds: string[];
  onOptimize: () => void;
  onRestorePrevious: () => void;
  onConfirm: () => void;
  onUpdateSection: (section: OutlineSection) => void;
  onRegenerateSection: (id: string) => void;
  onToggleLock: (id: string) => void;
  onDeleteSection: (id: string) => void;
  onMoveSection: (id: string, direction: "up" | "down") => void;
  onEnterDraft?: () => void;
};

export function OutlinePanel({
  outline,
  allNews,
  selectedNews,
  status,
  previousOutline,
  materialDirty,
  ideaDirty,
  isOptimizing,
  highlightedSectionIds,
  onOptimize,
  onRestorePrevious,
  onConfirm,
  onUpdateSection,
  onRegenerateSection,
  onToggleLock,
  onDeleteSection,
  onMoveSection,
  onEnterDraft
}: OutlinePanelProps) {
  const isDirty = materialDirty || ideaDirty;
  const hasLocked = outline.sections.some((s) => s.locked);
  const selectedNewsIds = selectedNews.map((item) => item.news.id);

  return (
    <section className="border rounded-lg p-4 bg-white">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold">动态大纲</h3>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>版本 {outline.version}</span>
            <span>·</span>
            <span>根据思路板自动调整</span>
          </div>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onOptimize}
          disabled={isOptimizing || selectedNews.length === 0}
          className="flex-1 px-3 py-2 bg-purple-600 text-white rounded text-sm hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
        >
          <Sparkles className={`w-4 h-4 ${isOptimizing ? "animate-spin" : ""}`} />
          {isOptimizing ? "优化中" : "优化大纲"}
        </motion.button>
        <button
          onClick={onRestorePrevious}
          disabled={!previousOutline || isOptimizing}
          className="px-3 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {(isDirty || hasLocked) && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
          <AlertCircle className="w-4 h-4 inline mr-1" />
          {hasLocked ? "已保留锁定内容，只优化未锁定部分。" : materialDirty ? "素材已变化，是否优化大纲？" : "思路已变化，是否优化大纲？"}
        </div>
      )}

      <div className="space-y-4">
        <OutlineBlock label="推荐标题" value={outline.recommendedTitle} color="blue" />
        <OutlineBlock label="开头切入方式" value={outline.intro} color="green" />

        {outline.sections.map((section, index) => (
          <SectionCard
            key={section.id}
            section={section}
            index={index}
            total={outline.sections.length}
            allNews={allNews}
            selectedNewsIds={selectedNewsIds}
            highlighted={highlightedSectionIds.includes(section.id)}
            onUpdate={onUpdateSection}
            onRegenerate={onRegenerateSection}
            onToggleLock={onToggleLock}
            onDelete={onDeleteSection}
            onMove={onMoveSection}
          />
        ))}

        <OutlineBlock label="结尾方向" value={outline.ending} color="orange" />
        <OutlineBlock label="读者收获" value={outline.readerTakeaway} color="teal" />
      </div>

    </section>
  );
}

function OutlineBlock({ label, value, color }: { label: string; value: string; color: string }) {
  const colors: Record<string, string> = {
    blue: "bg-blue-50 border-blue-200 text-blue-900",
    green: "bg-green-50 border-green-200 text-green-900",
    orange: "bg-orange-50 border-orange-200 text-orange-900",
    teal: "bg-teal-50 border-teal-200 text-teal-900"
  };
  const labelColors: Record<string, string> = {
    blue: "text-blue-700",
    green: "text-green-700",
    orange: "text-orange-700",
    teal: "text-teal-700"
  };

  return (
    <div className={`p-3 border rounded ${colors[color] || colors.blue}`}>
      <div className={`text-xs mb-1 ${labelColors[color] || labelColors.blue}`}>{label}</div>
      <div className="text-sm">{value}</div>
    </div>
  );
}

function SectionCard({
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
}: {
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
}) {
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
    <div className={`border rounded-lg p-4 ${section.locked ? "bg-gray-50" : "bg-white"} ${highlighted ? "ring-2 ring-purple-500" : ""}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium">
            第{index + 1}节
          </span>
          {section.locked && (
            <span className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs flex items-center gap-1">
              <Lock className="w-3 h-3" />
              已锁定
            </span>
          )}
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => onToggleLock(section.id)}
            className="p-1 hover:bg-gray-200 rounded transition-colors"
            title={section.locked ? "解锁" : "锁定"}
          >
            {section.locked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
          </button>
          <button
            onClick={editing ? save : () => setEditing(true)}
            className="p-1 hover:bg-gray-200 rounded transition-colors"
            title={editing ? "保存" : "编辑"}
          >
            {editing ? <Save className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {editing ? (
        <div className="space-y-2">
          <input
            type="text"
            value={draft.title}
            onChange={(e) => setDraft((c) => ({ ...c, title: e.target.value }))}
            className="w-full px-2 py-1 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            placeholder="节点标题"
          />
          <textarea
            value={draft.purpose}
            onChange={(e) => setDraft((c) => ({ ...c, purpose: e.target.value }))}
            rows={2}
            className="w-full px-2 py-1 border rounded text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
            placeholder="这一节目的"
          />
          <textarea
            value={draft.keyPoints.join("\n")}
            onChange={(e) => setDraft((c) => ({
              ...c,
              keyPoints: e.target.value.split("\n").map((s) => s.trim()).filter(Boolean)
            }))}
            rows={3}
            className="w-full px-2 py-1 border rounded text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
            placeholder="关键要点（每行一条）"
          />
          <textarea
            value={draft.aiAdvice}
            onChange={(e) => setDraft((c) => ({ ...c, aiAdvice: e.target.value }))}
            rows={2}
            className="w-full px-2 py-1 border rounded text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
            placeholder="AI 写作建议"
          />
          <div>
            <span className="text-xs text-gray-600 block mb-1">关联新闻</span>
            <div className="space-y-2">
              {selectedNewsIds.map((nid) => (
                <label key={nid} className="flex items-start gap-2 rounded bg-gray-50 p-2 text-xs text-gray-700">
                  <input
                    type="checkbox"
                    checked={draft.relatedNewsIds.includes(nid)}
                    onChange={(e) => toggleRelated(nid, e.target.checked)}
                    className="mt-1"
                  />
                  <span>{getNewsTitle(nid, allNews)}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <>
          <h4 className="font-medium mb-2">{section.title}</h4>
          <div className="text-xs text-gray-600 mb-2">
            <span className="font-medium">这一节目的：</span>{section.purpose}
          </div>
          <div className="text-xs mb-2">
            <div className="font-medium text-gray-600 mb-1">关键要点：</div>
            <ul className="list-disc list-inside space-y-1 text-gray-700">
              {section.keyPoints.map((point, i) => (
                <li key={i}>{point}</li>
              ))}
            </ul>
          </div>
          <div className="text-xs mb-2">
            <span className="font-medium text-gray-600">关联新闻：</span>
            <span className="text-gray-700 ml-1">
              {section.relatedNewsIds.map((id) => getNewsTitle(id, allNews)).join(" / ") || "暂未关联"}
            </span>
          </div>
          <div className="text-xs p-2 bg-purple-50 rounded border border-purple-100">
            <div className="flex items-start gap-1">
              <Sparkles className="w-3 h-3 text-purple-600 flex-shrink-0 mt-0.5" />
              <span className="text-purple-800">{section.aiAdvice}</span>
            </div>
          </div>
        </>
      )}

      <div className="flex gap-1 mt-3 pt-3 border-t">
        <button
          onClick={() => onRegenerate(section.id)}
          disabled={section.locked}
          className="flex-1 px-2 py-1 bg-purple-50 text-purple-700 rounded text-xs hover:bg-purple-100 transition-colors disabled:opacity-50"
        >
          重新生成本节
        </button>
        <button
          onClick={() => onMove(section.id, "up")}
          disabled={index === 0}
          className="p-1 hover:bg-gray-100 rounded transition-colors disabled:opacity-30"
        >
          <ArrowUp className="w-4 h-4" />
        </button>
        <button
          onClick={() => onMove(section.id, "down")}
          disabled={index === total - 1}
          className="p-1 hover:bg-gray-100 rounded transition-colors disabled:opacity-30"
        >
          <ArrowDown className="w-4 h-4" />
        </button>
        <button
          onClick={() => onDelete(section.id)}
          className="p-1 hover:bg-red-100 rounded transition-colors"
        >
          <Trash2 className="w-4 h-4 text-red-600" />
        </button>
      </div>
    </div>
  );
}
