"use client";

import { CheckCircle2, FileText, Wand2 } from "lucide-react";
import type { DraftStatus } from "@/types";

type DraftHeaderProps = {
  workspaceName: string;
  status: DraftStatus;
  isGenerating: boolean;
  wordCount: number;
  onGenerateDraft: () => void;
  onBackToOutline: () => void;
};

const statusLabels: Record<DraftStatus, string> = {
  empty: "未开始",
  generating: "生成中",
  partial: "部分已生成",
  generated: "已生成",
  edited: "已编辑",
  exported: "已导出"
};

export function DraftHeader({
  workspaceName,
  status,
  isGenerating,
  wordCount,
  onGenerateDraft,
  onBackToOutline
}: DraftHeaderProps) {
  return (
    <div className="border-b bg-blue-50 px-6 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-blue-600 text-white rounded-full text-sm">
            大纲已确认，进入成稿排版
          </span>
          <span className="text-sm text-gray-700">{workspaceName}</span>
          <span className="text-sm text-gray-500">· {wordCount} 字</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
            {statusLabels[status]}
          </span>
          <button
            onClick={onGenerateDraft}
            disabled={isGenerating}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
          >
            <Wand2 className={`w-4 h-4 ${isGenerating ? "animate-spin" : ""}`} />
            {isGenerating ? "生成中..." : "生成完整草稿"}
          </button>
          <button
            onClick={onBackToOutline}
            className="px-3 py-1.5 border border-gray-300 rounded text-sm hover:bg-gray-50 transition-colors flex items-center gap-1"
          >
            <FileText className="w-4 h-4" />
            大纲
          </button>
        </div>
      </div>
    </div>
  );
}
