"use client";

import { useMemo, useState } from "react";
import { Newspaper, History, Trash2, Eye } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import type { News, NewsRole, WorkspaceNews } from "@/types";
import { NewsCard } from "@/components/NewsCard";
import { formatRole } from "@/lib/workspace";
import { formatImportanceScore, getTranslatedTitle } from "@/lib/newsDisplay";

type NewsSidebarProps = {
  allNews: News[];
  selectedNews: WorkspaceNews[];
  browsedNewsIds: string[];
  onToggleNews: (news: News) => void;
  onOpenDetails: (news: News) => void;
  onSetRole: (id: string, role: NewsRole) => void;
  onRemove: (id: string) => void;
  onUpdateNote: (id: string, note: string) => void;
};

type TabKey = "selected" | "all" | "history";

const roleColors: Record<string, string> = {
  main_news: "bg-purple-100 text-purple-700 border-purple-300",
  supporting_news: "bg-blue-100 text-blue-700 border-blue-300",
  reference_news: "bg-gray-100 text-gray-700 border-gray-300"
};

const roleLabels: Record<string, string> = {
  main_news: "主新闻",
  supporting_news: "辅助",
  reference_news: "参考"
};

export function NewsSidebar({
  allNews,
  selectedNews,
  browsedNewsIds,
  onToggleNews,
  onOpenDetails,
  onSetRole,
  onRemove,
  onUpdateNote
}: NewsSidebarProps) {
  const [tab, setTab] = useState<TabKey>("selected");

  const historyNews = useMemo(() => {
    return browsedNewsIds
      .map((id) => allNews.find((item) => item.id === id))
      .filter((item): item is News => Boolean(item));
  }, [allNews, browsedNewsIds]);

  return (
    <aside className="w-80 border-r bg-white flex flex-col min-h-0">
      <div className="border-b">
        <div className="flex">
          {([
            { key: "selected" as TabKey, label: `已选 (${selectedNews.length})` },
            { key: "all" as TabKey, label: "全部" },
            { key: "history" as TabKey, label: "历史" }
          ]).map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                tab === t.key
                  ? "border-purple-600 text-purple-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
        {tab === "selected" && (
          <>
            {selectedNews.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Newspaper className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">还没有新闻进入工作区...</p>
              </div>
            ) : (
              <div className="space-y-4">
                <AnimatePresence>
                  {selectedNews.map((item, index) => (
                    <motion.div
                      key={item.news.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ delay: index * 0.05 }}
                      className={`border rounded-lg p-3 hover:shadow-md transition-shadow ${
                        item.role === "main_news" ? "bg-purple-50/30" : "bg-gray-50"
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <span className={`px-2 py-1 rounded-full text-xs border ${roleColors[item.role]}`}>
                          {formatRole(item.role)} · ★{formatImportanceScore(item.news.importanceScore)}
                        </span>
                        <button
                          onClick={() => onRemove(item.news.id)}
                          className="p-1 hover:bg-red-100 rounded transition-colors"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      </div>

                      <h4 className="text-sm font-medium mb-2">{getTranslatedTitle(item.news)}</h4>

                      <div className="mb-3">
                        <div className="text-xs text-gray-600 mb-1">角色定位</div>
                        <div className="flex gap-1">
                          {(["main_news", "supporting_news", "reference_news"] as NewsRole[]).map((role) => (
                            <button
                              key={role}
                              onClick={() => onSetRole(item.news.id, role)}
                              className={`flex-1 px-2 py-1 rounded text-xs transition-colors ${
                                item.role === role
                                  ? "bg-purple-600 text-white"
                                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                              }`}
                            >
                              {roleLabels[role]}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="mb-3">
                        <label className="text-xs text-gray-600 block mb-1">一句备注</label>
                        <textarea
                          value={item.note ?? ""}
                          onChange={(e) => onUpdateNote(item.news.id, e.target.value)}
                          rows={2}
                          placeholder="记录这条新闻的作用..."
                          className="w-full px-2 py-1 text-xs border rounded focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => onOpenDetails(item.news)}
                        className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 border border-gray-300 rounded text-xs hover:bg-gray-50 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        查看详情
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </>
        )}

        {tab === "all" && (
          <div className="space-y-3">
            {allNews.map((item) => {
              const selected = selectedNews.find((si) => si.news.id === item.id);
              return (
                <NewsCard
                  key={item.id}
                  news={item}
                  selected={Boolean(selected)}
                  role={selected?.role}
                  compact
                  onToggle={() => onToggleNews(item)}
                  onOpenDetails={() => onOpenDetails(item)}
                />
              );
            })}
          </div>
        )}

        {tab === "history" && (
          <>
            {historyNews.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">还没有浏览记录...</p>
              </div>
            ) : (
              <div className="space-y-3">
                {historyNews.map((item) => {
                  const selected = selectedNews.find((si) => si.news.id === item.id);
                  return (
                    <NewsCard
                      key={item.id}
                      news={item}
                      selected={Boolean(selected)}
                      role={selected?.role}
                      compact
                      onToggle={() => onToggleNews(item)}
                      onOpenDetails={() => onOpenDetails(item)}
                    />
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </aside>
  );
}
