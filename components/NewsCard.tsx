"use client";

import { Clock, ExternalLink, Tag, TrendingUp, Sparkles } from "lucide-react";
import { motion } from "motion/react";
import type { News, NewsRole } from "@/types";
import { formatRole } from "@/lib/workspace";
import {
  formatImportanceScore,
  formatNewsTime,
  formatWritingAngles,
  getTranslatedTitle
} from "@/lib/newsDisplay";

type NewsCardProps = {
  news: News;
  selected: boolean;
  role?: NewsRole;
  compact?: boolean;
  onToggle: () => void;
  onOpenDetails: () => void;
};

export function NewsCard({
  news,
  selected,
  role,
  compact,
  onToggle,
  onOpenDetails
}: NewsCardProps) {
  const importance = news.importanceScore >= 8 ? "high" : news.importanceScore >= 5 ? "medium" : "low";
  const importanceColors = {
    high: "bg-red-100 text-red-700",
    medium: "bg-yellow-100 text-yellow-700",
    low: "bg-gray-100 text-gray-700"
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, boxShadow: "0 10px 30px -15px rgba(0,0,0,0.2)" }}
      transition={{ duration: 0.2 }}
      className={`border rounded-xl p-5 bg-white transition-all ${
        selected ? "ring-2 ring-purple-500 border-purple-500" : "hover:border-purple-300"
      } ${compact ? "p-3" : "p-5"}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 rounded-full text-xs ${importanceColors[importance]}`}>
            ★ {formatImportanceScore(news.importanceScore)}
          </span>
          <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full">
            {news.source}
          </span>
          {selected && role && (
            <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
              {formatRole(role)}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <Clock className="w-3 h-3" />
          {formatNewsTime(news.publishedAt)}
        </div>
      </div>

      {!compact && <h3 className="text-sm text-gray-500 mb-1">{news.title}</h3>}
      <h2 className={`font-semibold mb-3 ${compact ? "text-sm leading-5" : ""}`}>{getTranslatedTitle(news)}</h2>

      {!compact && (
        <>
          <p className="text-sm text-gray-600 mb-4 line-clamp-3">{news.summary}</p>

          <div className="mb-4 p-3 bg-purple-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-medium text-purple-900">推荐写作角度</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {formatWritingAngles(news.writingAngles).split(" / ").map((angle, i) => (
                <span key={i} className="text-xs text-purple-700 bg-purple-100 px-2 py-1 rounded">
                  {angle}
                </span>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            {news.keywords.slice(0, 5).map((keyword) => (
              <span key={keyword} className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded-full flex items-center gap-1">
                <Tag className="w-3 h-3" />
                {keyword}
              </span>
            ))}
          </div>
        </>
      )}

      {compact && (
        <p className="text-xs text-gray-600 mb-3 line-clamp-3">{news.summary}</p>
      )}

      <div className="flex items-center gap-2 mt-auto">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onToggle}
          className={`flex-1 px-4 py-2 rounded-lg transition-all relative overflow-hidden ${
            selected
              ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg"
              : "border border-gray-300 hover:border-purple-600 hover:text-purple-600 hover:shadow-md"
          }`}
        >
          <span className="relative z-10 flex items-center justify-center gap-2">
            {selected && <Sparkles className="w-4 h-4" />}
            {selected ? "已加入" : "加入工作区"}
          </span>
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onOpenDetails}
          className="px-4 py-2 border border-gray-300 rounded-lg hover:border-gray-400 hover:shadow-md transition-all flex items-center gap-2"
        >
          <ExternalLink className="w-4 h-4" />
          查看详情
        </motion.button>
      </div>
    </motion.div>
  );
}
