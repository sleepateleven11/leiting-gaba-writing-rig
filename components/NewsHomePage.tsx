"use client";

import { Loader2, Newspaper, RefreshCw } from "lucide-react";
import { motion } from "motion/react";
import type { News, NewsProvider, WorkspaceNews } from "@/types";
import { NewsCard } from "@/components/NewsCard";

type NewsHomePageProps = {
  news: News[];
  selectedNews: WorkspaceNews[];
  provider: NewsProvider;
  updatedAt?: string;
  loading: boolean;
  refreshing: boolean;
  onToggleNews: (news: News) => void;
  onOpenDetails: (news: News) => void;
  onStart: () => void;
  onRefresh: () => void;
};

export function NewsHomePage({
  news,
  selectedNews,
  provider,
  updatedAt,
  loading,
  refreshing,
  onToggleNews,
  onOpenDetails,
  onStart,
  onRefresh
}: NewsHomePageProps) {
  return (
    <main className="max-w-7xl mx-auto px-6 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
            AI 科技新闻素材池
          </span>
        </div>
        <h2 className="text-2xl font-semibold mb-2">
          从真实 AI 新闻里，筛出能写成文章的那几条
        </h2>
        <p className="text-gray-600">
          每条新闻都经过 AI 评估重要性和写作潜力，帮你快速找到值得深入的话题
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-6 p-4 bg-white rounded-xl border shadow-sm hover:shadow-md transition-shadow"
      >
        <div className="flex items-center gap-3">
          <Newspaper className="w-5 h-5 text-gray-600" />
          <span className="text-sm text-gray-600">
            新闻来源: <span className="font-medium text-gray-900">{provider === "gnews" ? "GNews API" : "Mock Data"}</span>
          </span>
          {updatedAt && <span className="text-sm text-gray-500">· 更新于 {formatUpdatedAt(updatedAt)}</span>}
        </div>
        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:border-gray-400 hover:shadow-md transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            刷新新闻
          </motion.button>
          {selectedNews.length > 0 && (
            <motion.button
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onStart}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg shadow-lg hover:shadow-xl transition-all"
            >
              开始构思
            </motion.button>
          )}
        </div>
      </motion.div>

      <div className="mb-4">
        <h3 className="font-semibold">
          可用新闻 <span className="text-gray-500 font-normal">({news.length} 条)</span>
        </h3>
      </div>

      {loading && news.length === 0 ? (
        <div className="grid grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="border rounded-xl p-5 bg-white animate-pulse">
              <div className="h-6 bg-gray-200 rounded mb-3 w-3/4" />
              <div className="h-4 bg-gray-200 rounded mb-2" />
              <div className="h-4 bg-gray-200 rounded mb-4 w-5/6" />
              <div className="h-20 bg-gray-200 rounded mb-4" />
              <div className="flex gap-2">
                <div className="h-10 bg-gray-200 rounded flex-1" />
                <div className="h-10 bg-gray-200 rounded w-24" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-6">
          {news.map((item, index) => {
            const selected = selectedNews.find((wn) => wn.news.id === item.id);
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <NewsCard
                  news={item}
                  selected={Boolean(selected)}
                  role={selected?.role}
                  onToggle={() => onToggleNews(item)}
                  onOpenDetails={() => onOpenDetails(item)}
                />
              </motion.div>
            );
          })}
        </div>
      )}

      {refreshing && news.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed bottom-6 right-6 bg-white px-4 py-3 rounded-lg shadow-xl border flex items-center gap-3"
        >
          <Loader2 className="w-5 h-5 animate-spin text-purple-600" />
          <span className="text-sm">正在刷新新闻...</span>
        </motion.div>
      )}
    </main>
  );
}

function formatUpdatedAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}`;
}
