"use client";

import { CheckCircle2, CircleDashed, ClipboardList, Sparkles } from "lucide-react";
import type { WorkspaceStatus } from "@/types";
import { cn } from "@/lib/cn";

const statusMeta: Record<
  WorkspaceStatus,
  {
    label: string;
    description: string;
    className: string;
    Icon: typeof CircleDashed;
  }
> = {
  empty: {
    label: "等待素材",
    description: "先选择新闻",
    className: "border-slate-200 bg-slate-50 text-slate-600",
    Icon: CircleDashed
  },
  collecting: {
    label: "正在构思",
    description: "素材已进入工作台",
    className: "border-tech-100 bg-tech-50 text-tech-700",
    Icon: Sparkles
  },
  outlining: {
    label: "大纲成型中",
    description: "方向基本明确",
    className: "border-mint-500/20 bg-mint-50 text-mint-600",
    Icon: ClipboardList
  },
  confirmed: {
    label: "大纲已确认",
    description: "可继续微调",
    className: "border-amber-200 bg-ambersoft-50 text-ambersoft-500",
    Icon: CheckCircle2
  }
};

type WorkspaceStatusBadgeProps = {
  status: WorkspaceStatus;
  compact?: boolean;
};

export function WorkspaceStatusBadge({ status, compact }: WorkspaceStatusBadgeProps) {
  const meta = statusMeta[status];
  const Icon = meta.Icon;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium",
        meta.className
      )}
      title={meta.description}
    >
      <Icon className="h-4 w-4" />
      <span>{meta.label}</span>
      {!compact && <span className="hidden text-xs font-normal opacity-75 md:inline">{meta.description}</span>}
    </div>
  );
}
