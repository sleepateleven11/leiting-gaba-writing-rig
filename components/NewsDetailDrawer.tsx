"use client";

import { X, ExternalLink, Lightbulb, Star } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import type { News, NewsRole } from "@/types";
import { formatRole } from "@/lib/workspace";
import { formatNewsTime, getTranslatedTitle } from "@/lib/newsDisplay";

type NewsDetailDrawerProps = {
  news?: News;
  selected: boolean;
  role?: NewsRole;
  onClose: () => void;
  onToggle: () => void;
};

export function NewsDetailDrawer({
  news,
  selected,
  role,
  onClose,
  onToggle
}: NewsDetailDrawerProps) {
  if (!news) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ x: 600 }}
        animate={{ x: 0 }}
        exit={{ x: 600 }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="fixed right-0 top-0 bottom-0 w-[600px] bg-white z-50 shadow-2xl overflow-y-auto"
      >
        <div className="sticky top-0 bg-white border-b p-6 flex items-center justify-between">
          <div>
            <h2 className="font-semibold">新闻详情</h2>
            <p className="text-sm text-gray-500">查看不会影响工作区状态</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full">
              {news.source}
            </span>
            <span className="text-xs text-gray-500">{formatNewsTime(news.publishedAt)}</span>
            {selected && role && (
              <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                {formatRole(role)}
              </span>
            )}
          </div>

          <div>
            <h3 className="text-sm text-gray-500 mb-2">{news.title}</h3>
            <h2 className="text-2xl font-semibold mb-4">{getTranslatedTitle(news)}</h2>
            <p className="text-gray-700">{news.summary}</p>
          </div>

          <div className="border rounded-lg p-4 bg-gray-50">
            <div className="flex items-center gap-2 mb-2">
              <ExternalLink className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium">原文链接</span>
            </div>
            <a
              href={news.url || "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:underline break-all"
            >
              {news.url || "#"}
            </a>
          </div>

          <div className="border-l-4 border-blue-600 pl-4 py-2 bg-blue-50">
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb className="w-4 h-4 text-blue-600" />
              <span className="font-medium text-blue-900">AI 总结</span>
            </div>
            <p className="text-sm text-blue-800">{news.aiSummary}</p>
          </div>

          <div className="border-l-4 border-purple-600 pl-4 py-2 bg-purple-50">
            <div className="flex items-center gap-2 mb-2">
              <Star className="w-4 h-4 text-purple-600" />
              <span className="font-medium text-purple-900">为什么重要</span>
            </div>
            <p className="text-sm text-purple-800">{news.whyImportant}</p>
          </div>

          <div>
            <h3 className="font-medium mb-3 flex items-center gap-2">
              <Star className="w-4 h-4 text-purple-600" />
              推荐写作角度
            </h3>
            <div className="space-y-2">
              {news.writingAngles.map((item, i) => (
                <div key={i} className="p-3 bg-purple-50 rounded-lg text-sm text-purple-900">
                  {item.angle}：{item.description}（适合：{item.suitableFor}）
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-medium mb-3">关键词</h3>
            <div className="flex flex-wrap gap-2">
              {news.keywords.map((keyword) => (
                <span key={keyword} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                  {keyword}
                </span>
              ))}
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              onToggle();
              onClose();
            }}
            className={`w-full py-3 rounded-lg font-medium transition-all ${
              selected
                ? "bg-gray-200 text-gray-700 hover:bg-gray-300"
                : "bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:shadow-lg"
            }`}
          >
            {selected ? "移出工作区" : "加入工作区"}
          </motion.button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
