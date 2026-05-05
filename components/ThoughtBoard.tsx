"use client";

import { AlertCircle, Sparkles } from "lucide-react";
import { motion } from "motion/react";
import type { ThoughtBoard as ThoughtBoardType, WorkspaceNews } from "@/types";
import { getTranslatedTitle } from "@/lib/newsDisplay";

type ThoughtBoardProps = {
  board: ThoughtBoardType;
  selectedNews: WorkspaceNews[];
  highlightedFields: string[];
  materialDirty: boolean;
  ideaDirty: boolean;
  onChange: <K extends keyof ThoughtBoardType>(field: K, value: ThoughtBoardType[K]) => void;
};

export function ThoughtBoard({
  board,
  selectedNews,
  highlightedFields,
  materialDirty,
  ideaDirty,
  onChange
}: ThoughtBoardProps) {
  const isDirty = materialDirty || ideaDirty;
  const mainNews = selectedNews.find((item) => item.news.id === board.mainNewsId);

  return (
    <section className="border rounded-lg p-4 bg-white">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold">思路板</h3>
          <p className="text-xs text-gray-500">把想法钉在墙上</p>
        </div>
        {isDirty && (
          <div className="flex items-center gap-1 text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">
            <AlertCircle className="w-3 h-3" />
            有变化
          </div>
        )}
      </div>

      <div className="space-y-3">
        <SBField
          label="当前选题"
          value={board.topic}
          onChange={(v) => onChange("topic", v)}
          highlighted={highlightedFields.includes("topic")}
        />

        <SBField
          label="主新闻"
          type="select"
          value={board.mainNewsId ?? ""}
          onChange={(v) => onChange("mainNewsId", v)}
          options={selectedNews.map((n) => ({ value: n.news.id, label: getTranslatedTitle(n.news) }))}
          highlighted={highlightedFields.includes("mainNewsId")}
        />
        {mainNews && (
          <p className="text-xs text-gray-500 -mt-2 line-clamp-2">{mainNews.news.summary}</p>
        )}

        <div className="grid grid-cols-3 gap-2">
          <SBField
            label="目标读者"
            value={board.targetReader}
            onChange={(v) => onChange("targetReader", v)}
            highlighted={highlightedFields.includes("targetReader")}
          />
          <SBField
            label="写作角度"
            value={board.writingAngle}
            onChange={(v) => onChange("writingAngle", v)}
            highlighted={highlightedFields.includes("writingAngle")}
          />
          <SBField
            label="表达立场"
            value={board.stance}
            onChange={(v) => onChange("stance", v)}
            highlighted={highlightedFields.includes("stance")}
          />
        </div>

        <SBField
          label="核心观点"
          value={board.coreIdea}
          onChange={(v) => onChange("coreIdea", v)}
          multiline
          highlighted={highlightedFields.includes("coreIdea")}
        />

        <SBField
          label="支撑理由（每行一条）"
          value={board.supportReasons.join("\n")}
          onChange={(v) => onChange("supportReasons", v.split("\n").map((s) => s.trim()).filter(Boolean))}
          multiline
          highlighted={highlightedFields.includes("supportReasons")}
        />

        <SBField
          label="可用标题（每行一条）"
          value={board.titles.join("\n")}
          onChange={(v) => onChange("titles", v.split("\n").map((s) => s.trim()).filter(Boolean))}
          multiline
          highlighted={highlightedFields.includes("titles")}
        />

        <SBField
          label="待补充问题（每行一条）"
          value={board.openQuestions.join("\n")}
          onChange={(v) => onChange("openQuestions", v.split("\n").map((s) => s.trim()).filter(Boolean))}
          multiline
          highlighted={highlightedFields.includes("openQuestions")}
        />
      </div>
    </section>
  );
}

function SBField({
  label,
  value,
  onChange,
  multiline,
  highlighted,
  type,
  options
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
  highlighted?: boolean;
  type?: "select";
  options?: { value: string; label: string }[];
}) {
  return (
    <div>
      <label className="text-xs text-gray-600 block mb-1">{label}</label>
      {type === "select" && options ? (
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full px-3 py-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 ${
            highlighted ? "ring-2 ring-purple-500 bg-purple-50" : ""
          }`}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      ) : multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={4}
          className={`w-full px-3 py-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none ${
            highlighted ? "ring-2 ring-purple-500 bg-purple-50" : ""
          }`}
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full px-3 py-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 ${
            highlighted ? "ring-2 ring-purple-500 bg-purple-50" : ""
          }`}
        />
      )}
    </div>
  );
}
