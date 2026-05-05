"use client";

import { ClipboardList, Link2 } from "lucide-react";

type ExportButtonsProps = {
  onCopyMarkdown: () => void;
  onCopyHtml: () => void;
};

export function ExportButtons({ onCopyMarkdown, onCopyHtml }: ExportButtonsProps) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={onCopyMarkdown}
        className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-line bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-tech-100 hover:text-tech-700"
      >
        <ClipboardList className="h-3.5 w-3.5" />
        复制 Markdown
      </button>
      <button
        type="button"
        onClick={onCopyHtml}
        className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-ink px-3 py-2 text-xs font-semibold text-white transition hover:bg-tech-700"
      >
        <Link2 className="h-3.5 w-3.5" />
        复制 HTML
      </button>
    </div>
  );
}
