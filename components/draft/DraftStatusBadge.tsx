"use client";

import { CheckCircle2, ClipboardList, Layers3, PenLine } from "lucide-react";
import type { DraftStatus } from "@/types";

const statusMeta: Record<DraftStatus, { label: string; tone: string; icon: typeof ClipboardList }> = {
  empty: {
    label: "待生成",
    tone: "border-slate-200 bg-slate-50 text-slate-600",
    icon: ClipboardList
  },
  generating: {
    label: "生成中",
    tone: "border-blue-200 bg-blue-50 text-blue-700",
    icon: Layers3
  },
  partial: {
    label: "逐节生成中",
    tone: "border-blue-200 bg-blue-50 text-blue-700",
    icon: Layers3
  },
  generated: {
    label: "草稿已生成",
    tone: "border-mint-500/30 bg-mint-50 text-mint-600",
    icon: CheckCircle2
  },
  edited: {
    label: "已编辑",
    tone: "border-amber-200 bg-ambersoft-50 text-ambersoft-500",
    icon: PenLine
  },
  exported: {
    label: "已导出",
    tone: "border-tech-100 bg-tech-50 text-tech-700",
    icon: CheckCircle2
  }
};

export function DraftStatusBadge({ status }: { status: DraftStatus }) {
  const meta = statusMeta[status];
  const Icon = meta.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${meta.tone}`}>
      <Icon className="h-3.5 w-3.5" />
      {meta.label}
    </span>
  );
}
