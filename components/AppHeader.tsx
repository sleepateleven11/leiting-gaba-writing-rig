"use client";

import { ArrowLeft, Bolt, CheckCircle, ClipboardList, X } from "lucide-react";
import { motion } from "motion/react";
import type { WorkspaceStatus } from "@/types";

type AppHeaderProps = {
  page: "home" | "workspace";
  selectedCount: number;
  status: WorkspaceStatus;
  onStart: () => void;
  onBackHome: () => void;
  onConfirmOutline?: () => void;
  onEnterDraft?: () => void;
};

const statusLabels: Record<WorkspaceStatus, string> = {
  empty: "等待素材",
  collecting: "正在构思",
  outlining: "大纲成型中",
  confirmed: "大纲已确认"
};

export function AppHeader({
  page,
  selectedCount,
  status,
  onStart,
  onBackHome,
  onConfirmOutline,
  onEnterDraft
}: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-4">
          {page === "workspace" && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onBackHome}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="返回新闻首页"
            >
              <ArrowLeft className="w-5 h-5" />
            </motion.button>
          )}
          <div className="flex items-center gap-3">
            <motion.div
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.6 }}
              className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center shadow-lg"
            >
              <Bolt className="w-6 h-6 text-white" />
            </motion.div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-semibold">雷霆嘎巴写稿器</h1>
                <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full">MVP</span>
              </div>
              <p className="text-sm text-gray-600">从 AI 新闻到公众号大纲，让想法自己成型</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {page === "workspace" && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">工作区</span>
              <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                {statusLabels[status]}
              </span>
            </div>
          )}
          {selectedCount > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium"
            >
              已选 {selectedCount} 条新闻
            </motion.div>
          )}
          {page === "home" ? (
            <motion.button
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onStart}
              disabled={selectedCount === 0}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              开始构思
            </motion.button>
          ) : (
            <div className="flex items-center gap-2">
              {onConfirmOutline && (
                status === "confirmed" ? (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onConfirmOutline}
                    className="px-4 py-2 border border-red-200 bg-red-50 text-red-600 rounded-lg text-sm font-semibold hover:bg-red-100 transition-all flex items-center gap-1.5"
                  >
                    <X className="w-4 h-4" />
                    取消确认
                  </motion.button>
                ) : (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onConfirmOutline}
                    disabled={selectedCount === 0}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                  >
                    <CheckCircle className="w-4 h-4" />
                    确认当前大纲
                  </motion.button>
                )
              )}
              {onEnterDraft && (
                <motion.button
                  whileHover={status === "confirmed" ? { scale: 1.05 } : {}}
                  whileTap={status === "confirmed" ? { scale: 0.95 } : {}}
                  onClick={status === "confirmed" ? onEnterDraft : undefined}
                  disabled={status !== "confirmed"}
                  className="px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg hover:shadow-xl"
                >
                  <ClipboardList className="w-4 h-4" />
                  进入成稿排版
                </motion.button>
              )}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onStart}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg shadow-lg hover:shadow-xl transition-all"
              >
                回到工作台
              </motion.button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
