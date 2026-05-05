"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Wand2, Expand, Minimize, MessageSquareText, Sparkles,
  Lightbulb, ArrowLeftRight, Check, X, Book
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import type { DraftStatus, Outline, RewriteInstruction } from "@/types";
import { countWords } from "@/lib/draft/articleBlocks";
import { getDraftSectionIds, getDraftSectionTitle } from "@/lib/draft/editorContent";
import { sanitizeGeneratedText } from "@/lib/draft/sanitizeGeneratedText";

type ArticleEditorProps = {
  editorContent: string;
  outline: Outline;
  draftStatus: DraftStatus;
  activeSectionId?: string;
  isGeneratingDraft: boolean;
  generatingSectionIds: string[];
  isRewriting: boolean;
  rewriteResult: string;
  rewriteInstruction: string;
  onContentChange: (content: string) => void;
  onGenerateDraft: () => void;
  onGenerateSection: (sectionId: string) => void;
  onRewritingAction: (instruction: RewriteInstruction, customInstruction?: string) => void;
  onAcceptRewrite: () => void;
  onCancelRewrite: () => void;
  onScrollToSection: (sectionId: string) => void;
};

const aiActions: Array<{ id: RewriteInstruction; label: string; Icon: typeof Wand2 }> = [
  { id: "polish", label: "润色", Icon: Wand2 },
  { id: "expand", label: "扩写", Icon: Expand },
  { id: "shorten", label: "缩写", Icon: Minimize },
  { id: "wechat_style", label: "改公众号感", Icon: MessageSquareText },
  { id: "reduce_ai_tone", label: "降 AI 味", Icon: Sparkles },
  { id: "add_example", label: "加案例", Icon: Lightbulb },
  { id: "add_transition", label: "加转场", Icon: ArrowLeftRight },
  { id: "more_oral", label: "更口语", Icon: MessageSquareText },
  { id: "custom", label: "自定义", Icon: Wand2 }
];

export function ArticleEditor({
  editorContent,
  outline,
  draftStatus,
  activeSectionId,
  isGeneratingDraft,
  generatingSectionIds,
  isRewriting,
  rewriteResult,
  rewriteInstruction,
  onContentChange,
  onGenerateDraft,
  onGenerateSection,
  onRewritingAction,
  onAcceptRewrite,
  onCancelRewrite,
  onScrollToSection
}: ArticleEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const syncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const streamingPaused = useRef(false);
  const toolbarLocked = useRef(false);
  const [showEmpty, setShowEmpty] = useState(!editorContent.trim());
  const [showToolbar, setShowToolbar] = useState(false);
  const [toolbarPosition, setToolbarPosition] = useState({ x: 0, y: 0 });
  const [customMode, setCustomMode] = useState(false);
  const [customInstruction, setCustomInstruction] = useState("");
  const [selectedText, setSelectedText] = useState("");

  useEffect(() => {
    setShowEmpty(!editorContent.trim() && !isGeneratingDraft);
  }, [editorContent, isGeneratingDraft]);

  const isStreaming = isGeneratingDraft || generatingSectionIds.length > 0;

  // Pause DOM sync during streaming generation to avoid freezing
  useEffect(() => {
    streamingPaused.current = isStreaming;
    // When generation ends, force a one-time sync
    if (!isStreaming && editorRef.current) {
      const el = editorRef.current;
      const stateText = (editorContent || "").replace(/\n{3,}/g, "\n\n").trim();
      if (stateText) el.textContent = stateText;
    }
  }, [isStreaming, editorContent]);

  useEffect(() => {
    if (streamingPaused.current) return;
    const el = editorRef.current;
    if (!el) return;
    const domText = (el.textContent || "").replace(/\n{3,}/g, "\n\n").trim();
    const stateText = (editorContent || "").replace(/\n{3,}/g, "\n\n").trim();
    if (domText !== stateText) {
      el.textContent = stateText || "";
      if (!stateText) el.innerHTML = "";
    }
  }, [editorContent]);

  const syncToState = useCallback(() => {
    if (streamingPaused.current) return;
    const text = editorRef.current?.textContent || "";
    const clean = text.replace(/\n{3,}/g, "\n\n");
    onContentChange(clean);
  }, [onContentChange]);

  const handleInput = useCallback(() => {
    if (syncTimer.current) clearTimeout(syncTimer.current);
    syncTimer.current = setTimeout(syncToState, 300);
  }, [syncToState]);

  const handleBlur = useCallback(() => {
    if (syncTimer.current) clearTimeout(syncTimer.current);
    syncToState();
  }, [syncToState]);

  // Text selection detection
  const handleSelectionChange = useCallback(() => {
    if (isRewriting || rewriteResult || toolbarLocked.current) return;
    setTimeout(() => {
      if (toolbarLocked.current) return;
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || !sel.toString().trim()) {
        setSelectedText("");
        setShowToolbar(false);
        return;
      }
      const text = sel.toString().trim();
      if (!text) {
        setSelectedText("");
        setShowToolbar(false);
        return;
      }
      const editorEl = editorRef.current;
      if (!editorEl || !editorEl.contains(sel.getRangeAt(0).commonAncestorContainer)) {
        setSelectedText("");
        setShowToolbar(false);
        return;
      }
      const rect = sel.getRangeAt(0).getBoundingClientRect();
      setSelectedText(text);
      setToolbarPosition({
        x: rect.left + rect.width / 2,
        y: rect.top - 10
      });
      setShowToolbar(true);
      setCustomMode(false);
      toolbarLocked.current = false;
    }, 10);
  }, [isRewriting, rewriteResult]);

  useEffect(() => {
    document.addEventListener("selectionchange", handleSelectionChange);
    return () => document.removeEventListener("selectionchange", handleSelectionChange);
  }, [handleSelectionChange]);

  // Scroll to section
  useEffect(() => {
    if (!activeSectionId || !editorRef.current) return;
    const title = getDraftSectionTitle(outline, activeSectionId);
    const el = editorRef.current;
    const text = el.textContent || "";
    const idx = text.indexOf(title);
    if (idx >= 0) {
      const range = document.createRange();
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      let node = walker.nextNode();
      let charCount = 0;
      while (node) {
        const len = (node.textContent || "").length;
        if (charCount + len > idx) {
          range.setStart(node, idx - charCount);
          range.collapse(true);
          const rect = range.getBoundingClientRect();
          el.scrollTo({ top: el.scrollTop + rect.top - 120, behavior: "smooth" });
          break;
        }
        charCount += len;
        node = walker.nextNode();
      }
    }
  }, [activeSectionId, outline]);

  const handleClose = () => {
    toolbarLocked.current = false;
    setShowToolbar(false);
    setCustomMode(false);
    setCustomInstruction("");
    window.getSelection()?.removeAllRanges();
  };

  const wordCount = countWords(editorContent);
  const sectionIds = getDraftSectionIds(outline);

  return (
    <section className="flex-1 flex flex-col bg-white border-r relative min-h-0">
      <div className="border-b px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Book className="w-5 h-5 text-purple-600" />
          <h3 className="font-semibold text-sm">正文编辑</h3>
          <span className="text-xs text-gray-500">{wordCount} 字</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              if (editorRef.current) {
                const clean = sanitizeGeneratedText(editorRef.current.textContent || "");
                editorRef.current.textContent = clean;
                onContentChange(clean);
              }
            }}
            className="px-3 py-1.5 border border-gray-300 rounded text-sm hover:bg-gray-50 transition-colors"
          >
            清理 AI 格式
          </button>
          <button
            onClick={onGenerateDraft}
            disabled={isGeneratingDraft}
            className="px-3 py-1.5 bg-purple-600 text-white rounded text-sm hover:bg-purple-700 transition-colors disabled:opacity-50"
          >
            生成草稿
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {showEmpty ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <Book className="w-16 h-16 mb-4 opacity-50" />
            <h3 className="font-medium mb-2">正文还没有开始</h3>
            <p className="text-sm mb-6">点击下方按钮开始生成文章</p>
            <div className="flex gap-3">
              <button
                onClick={onGenerateDraft}
                disabled={isGeneratingDraft}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                生成完整草稿
              </button>
              <button
                onClick={() => onGenerateSection("article-intro")}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                先生成开头
              </button>
            </div>
          </div>
        ) : (
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            onInput={handleInput}
            onBlur={handleBlur}
            className="min-h-full cursor-text whitespace-pre-wrap break-words px-8 py-8 text-[16px] leading-[2] text-gray-900 outline-none selection:bg-purple-100"
            style={{
              fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif",
              minHeight: "100%"
            }}
          />
        )}

        {isGeneratingDraft && (
          <div className="flex items-center justify-center gap-2 border-t border-purple-200 bg-purple-50/50 py-3">
            <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-purple-200 border-t-purple-600" />
            <span className="text-xs font-semibold text-purple-600">正在生成文章...</span>
          </div>
        )}
      </div>

      {/* Bottom quick-nav */}
      <div className="flex-shrink-0 border-t bg-gray-50 px-4 py-1.5">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {sectionIds.map((sid) => {
            const title = getDraftSectionTitle(outline, sid);
            return (
              <button
                key={sid}
                onClick={() => onScrollToSection(sid)}
                className={`shrink-0 rounded-md px-2 py-1 text-[10px] font-semibold transition hover:bg-white hover:text-purple-700 ${
                  sid === activeSectionId ? "text-purple-700 bg-white" : "text-gray-500"
                }`}
              >
                {title}
              </button>
            );
          })}
        </div>
      </div>

      {/* AI Floating Toolbar */}
      <AnimatePresence>
        {showToolbar && (selectedText || isRewriting || rewriteResult) && (
          <>
            {!(isRewriting || rewriteResult) && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-40"
                onClick={handleClose}
              />
            )}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              className="fixed z-50"
              style={{
                left: Math.min(toolbarPosition.x, window.innerWidth - 320),
                top: toolbarPosition.y - 12,
                transform: "translate(-50%, -100%)"
              }}
              onMouseDown={(e) => e.preventDefault()}
            >
              {(isRewriting || rewriteResult) ? (
                <div className="bg-white rounded-lg shadow-2xl border border-gray-200 p-3 w-96">
                  <div className="text-xs text-gray-500 mb-2">AI 改写结果</div>
                  <div className="max-h-60 overflow-y-auto p-3 bg-purple-50 rounded border border-purple-200 text-sm mb-3 whitespace-pre-wrap">
                    {isRewriting ? (
                      <div className="flex items-center gap-2 text-purple-600">
                        <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
                        处理中...
                      </div>
                    ) : (
                      rewriteResult
                    )}
                  </div>
                  {!isRewriting && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          onAcceptRewrite();
                          handleClose();
                        }}
                        className="flex-1 px-3 py-2 bg-purple-600 text-white rounded text-sm hover:bg-purple-700 transition-colors flex items-center justify-center gap-1"
                      >
                        <Check className="w-4 h-4" />
                        替换原文
                      </button>
                      <button
                        onClick={() => {
                          onCancelRewrite();
                          handleClose();
                        }}
                        className="px-3 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50 transition-colors flex items-center gap-1"
                      >
                        <X className="w-4 h-4" />
                        取消
                      </button>
                    </div>
                  )}
                </div>
              ) : customMode ? (
                <div className="bg-white rounded-lg shadow-2xl border border-gray-200 p-3 w-80">
                  <div className="text-xs text-gray-500 mb-2">自定义改写指令</div>
                  <textarea
                    value={customInstruction}
                    onChange={(e) => setCustomInstruction(e.target.value)}
                    placeholder="例如：改成更有说服力的表达"
                    rows={3}
                    className="w-full px-3 py-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 mb-2 resize-none"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        if (customInstruction.trim()) {
                          onRewritingAction("custom", customInstruction.trim());
                          toolbarLocked.current = false;
                          setCustomMode(false);
                          setCustomInstruction("");
                        }
                      }}
                      disabled={!customInstruction.trim()}
                      className="flex-1 px-3 py-2 bg-purple-600 text-white rounded text-sm hover:bg-purple-700 transition-colors disabled:opacity-50"
                    >
                      确定
                    </button>
                    <button
                      onClick={() => { toolbarLocked.current = false; setCustomMode(false); }}
                      className="px-3 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50 transition-colors"
                    >
                      返回
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow-2xl border border-gray-200 p-3">
                  <div className="flex items-center justify-between mb-2 px-1">
                    <span className="text-xs text-gray-500">已选中 {selectedText.length} 字</span>
                    <button onClick={handleClose} className="text-xs text-gray-400 hover:text-gray-600">✕</button>
                  </div>
                  <div className="grid grid-cols-3 gap-2 w-80">
                    {aiActions.map((action) => {
                      const Icon = action.Icon;
                      return (
                        <motion.button
                          key={action.id}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => {
                            if (action.id === "custom") {
                              toolbarLocked.current = true;
                              setCustomMode(true);
                            } else {
                              onRewritingAction(action.id);
                            }
                          }}
                          className="flex flex-col items-center gap-1 p-2 rounded hover:bg-purple-50 transition-colors group"
                        >
                          <Icon className="w-4 h-4 text-gray-600 group-hover:text-purple-600" />
                          <span className="text-xs text-gray-700 group-hover:text-purple-600">{action.label}</span>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </section>
  );
}
