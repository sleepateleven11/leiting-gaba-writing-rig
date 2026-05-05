"use client";

import { ClipboardList, Lock, Pin } from "lucide-react";
import type { ArticleBlock, RewriteInstruction } from "@/types";
import { cn } from "@/lib/cn";
import { countWords } from "@/lib/draft/articleBlocks";
import { ArticleBlockToolbar } from "@/components/draft/ArticleBlockToolbar";

type ArticleBlockCardProps = {
  block: ArticleBlock;
  sectionTitle: string;
  generating: boolean;
  rewriting: boolean;
  onChange: (id: string, content: string) => void;
  onGenerateSection: (sectionId: string) => void;
  onRewrite: (id: string, instruction: RewriteInstruction) => void;
  onToggleLock: (id: string) => void;
};

const blockTypeLabel: Record<ArticleBlock["type"], string> = {
  title: "标题",
  intro: "开头",
  heading: "小标题",
  paragraph: "正文",
  quote: "引用",
  list: "列表",
  conclusion: "结尾",
  cta: "互动"
};

export function ArticleBlockCard({
  block,
  sectionTitle,
  generating,
  rewriting,
  onChange,
  onGenerateSection,
  onRewrite,
  onToggleLock
}: ArticleBlockCardProps) {
  const isLarge = block.type === "paragraph" || block.type === "intro" || block.type === "conclusion";
  const canGenerate = block.type !== "title";

  return (
    <article
      className={cn(
        "rounded-lg border bg-white p-4 shadow-sm transition",
        block.locked ? "border-amber-200 bg-ambersoft-50/30" : "border-line"
      )}
    >
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs font-semibold text-muted">
            <Pin className="h-3.5 w-3.5" />
            {sectionTitle}
          </div>
          <div className="mt-1 flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
              <ClipboardList className="h-3.5 w-3.5" />
              {blockTypeLabel[block.type]}
            </span>
            <span className="rounded-full bg-white px-2 py-1 text-xs text-muted">{countWords(block.content)} 字</span>
            {block.locked && (
              <span className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-1 text-xs font-semibold text-ambersoft-500">
                <Lock className="h-3.5 w-3.5" />
                AI 不会改写
              </span>
            )}
          </div>
        </div>
        <span
          className={cn(
            "rounded-full px-2.5 py-1 text-xs font-semibold",
            block.status === "edited"
              ? "bg-ambersoft-50 text-ambersoft-500"
              : block.status === "generated"
                ? "bg-mint-50 text-mint-600"
                : "bg-slate-100 text-slate-500"
          )}
        >
          {block.status === "edited" ? "已编辑" : block.status === "generated" ? "已生成" : "未生成"}
        </span>
      </div>

      <textarea
        value={block.content}
        onChange={(event) => onChange(block.id, event.target.value)}
        disabled={block.locked}
        placeholder={block.type === "title" ? "输入文章标题" : "这一块还没有正文，可以点击生成本节，或直接手写。"}
        className={cn(
          "w-full resize-none rounded-lg border border-line bg-white px-3 py-3 text-sm leading-7 text-ink outline-none transition placeholder:text-slate-400 focus:border-tech-200 focus:ring-4 focus:ring-tech-50 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500",
          isLarge ? "min-h-[168px]" : "min-h-[92px]",
          block.type === "title" && "text-lg font-semibold leading-8",
          block.type === "heading" && "font-semibold",
          block.type === "quote" && "bg-slate-50"
        )}
      />

      <div className="mt-3 border-t border-line pt-3">
        <ArticleBlockToolbar
          locked={block.locked}
          generating={generating}
          rewriting={rewriting}
          canGenerate={canGenerate}
          onGenerate={() => onGenerateSection(block.outlineSectionId)}
          onRewrite={(instruction) => onRewrite(block.id, instruction)}
          onToggleLock={() => onToggleLock(block.id)}
        />
      </div>
    </article>
  );
}
