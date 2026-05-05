"use client";

import { Loader2 } from "lucide-react";
import { motion } from "motion/react";
import type { DraftTocItem } from "@/lib/draft/editorContent";

type ArticleTocSidebarProps = {
  items: DraftTocItem[];
  activeSectionId?: string;
  generatingSectionIds: string[];
  onSelect: (sectionId: string) => void;
  onGenerateSection: (sectionId: string) => void;
};

const statusLabels: Record<DraftTocItem["status"], string> = {
  empty: "未生成",
  generating: "生成中",
  generated: "已生成",
  edited: "已编辑"
};

const statusColors: Record<DraftTocItem["status"], string> = {
  empty: "text-gray-400 bg-gray-100",
  generating: "text-blue-600 bg-blue-50",
  generated: "text-green-600 bg-green-50",
  edited: "text-purple-600 bg-purple-50"
};

export function ArticleTocSidebar({
  items,
  activeSectionId,
  generatingSectionIds,
  onSelect,
  onGenerateSection
}: ArticleTocSidebarProps) {
  return (
    <aside className="w-64 border-r bg-white flex flex-col min-h-0">
      <div className="p-4 border-b">
        <h3 className="font-semibold mb-1">文章目录</h3>
        <p className="text-xs text-gray-500">点击定位，或逐节生成</p>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin">
        {items.map((item, index) => {
          const active = item.sectionId === activeSectionId;
          const generating = generatingSectionIds.includes(item.sectionId);
          const isFirst = index === 0;
          const isSecond = index === 1;

          return (
            <motion.div
              key={item.sectionId}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.02, backgroundColor: "rgba(243, 244, 246, 1)" }}
              className={`p-3 rounded-lg cursor-pointer transition-all group ${
                active ? "bg-purple-50" : ""
              } ${generating ? "bg-blue-50" : ""}`}
            >
              <button
                type="button"
                onClick={() => onSelect(item.sectionId)}
                className="flex items-start gap-2 w-full text-left"
              >
                <span className="w-6 h-6 rounded bg-purple-100 text-purple-700 text-xs font-medium flex items-center justify-center flex-shrink-0">
                  {isFirst ? "T" : isSecond ? "A" : index - 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium mb-1 line-clamp-2">{item.title}</div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[generating ? "generating" : item.status]}`}>
                      {statusLabels[generating ? "generating" : item.status]}
                    </span>
                    {item.wordCount > 0 && (
                      <span className="text-xs text-gray-500">{item.wordCount} 字</span>
                    )}
                  </div>
                  {generating && (
                    <div className="flex items-center gap-1 mt-1 text-xs text-blue-600">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      生成中...
                    </div>
                  )}
                </div>
              </button>

              {item.status === "empty" && !generating && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onGenerateSection(item.sectionId);
                  }}
                  className="w-full mt-2 px-2 py-1 bg-purple-600 text-white rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  生成本节
                </motion.button>
              )}
            </motion.div>
          );
        })}
      </div>
    </aside>
  );
}
