"use client";

import { Copy, Check, Eye } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { motion } from "motion/react";
import type { StyleTemplate, Outline } from "@/types";
import { styleTemplates } from "@/lib/draft/styleTemplates";
import { sanitizeGeneratedText } from "@/lib/draft/sanitizeGeneratedText";

type WechatPreviewProps = {
  editorContent: string;
  outline: Outline;
  template: StyleTemplate;
  selectedTemplateId: string;
  onSelectTemplate: (id: string) => void;
  onCopyMarkdown: () => void;
  onCopyHtml: () => void;
};

export function WechatPreview({
  editorContent,
  outline,
  template,
  selectedTemplateId,
  onSelectTemplate,
  onCopyMarkdown,
  onCopyHtml
}: WechatPreviewProps) {
  const [copied, setCopied] = useState<"md" | "html" | null>(null);

  const clean = sanitizeGeneratedText(editorContent).trim();
  const lines = clean ? clean.split(/\r?\n/) : [];
  const title = lines[0] || outline.recommendedTitle || "未命名文章";

  const headingSet = new Set([
    outline.recommendedTitle,
    ...outline.sections.map((s) => s.title),
    "结尾"
  ]);

  const bodyLines = lines.slice(clean.includes(title) ? 1 : 0);
  let hasContent = false;

  const handleCopy = (type: "md" | "html") => {
    if (type === "md") {
      onCopyMarkdown();
    } else {
      onCopyHtml();
    }
    setCopied(type);
    toast.success(type === "md" ? "已复制 Markdown" : "已复制 HTML");
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <aside className="w-96 bg-gray-50 border-l flex flex-col min-h-0">
      <div className="border-b bg-white p-4">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-purple-700">
          <Eye className="w-4 h-4" />
          公众号预览
        </div>

        <div className="mb-4">
          <div className="text-xs text-gray-600 mb-2">排版模板</div>
          <div className="grid grid-cols-2 gap-2">
            {styleTemplates.map((tpl) => (
              <motion.button
                key={tpl.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onSelectTemplate(tpl.id)}
                className={`p-2 rounded border text-left transition-all ${
                  selectedTemplateId === tpl.id
                    ? "border-purple-600 bg-purple-50 shadow-md"
                    : "border-gray-300 hover:border-gray-400 hover:shadow-sm"
                }`}
              >
                <div className="text-sm font-medium">{tpl.name}</div>
                <div className="text-xs text-gray-500">{tpl.description}</div>
              </motion.button>
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleCopy("md")}
            className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50 hover:shadow-md transition-all flex items-center justify-center gap-1"
          >
            {copied === "md" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            复制 Markdown
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleCopy("html")}
            className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50 hover:shadow-md transition-all flex items-center justify-center gap-1"
          >
            {copied === "html" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            复制 HTML
          </motion.button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
        {!clean ? (
          <div className="text-center text-gray-500 text-sm mt-12">
            <div className="w-12 h-12 bg-gray-200 rounded-lg mx-auto mb-3 flex items-center justify-center text-lg">
              📱
            </div>
            <p>正文生成后会在这里</p>
            <p>实时预览公众号阅读效果</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="border-8 border-gray-800 rounded-3xl overflow-hidden">
              <div className="h-[600px] overflow-y-auto bg-white">
                <div className="p-6">
                  <h1 className="text-[20px] font-bold mb-4 leading-tight">{title}</h1>
                  <div className="flex items-center gap-2 text-sm text-gray-500 pb-4 border-b">
                    <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white text-xs">
                      雷
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">雷霆嘎巴写稿器</div>
                      <div className="text-xs">2026年5月5日</div>
                    </div>
                  </div>
                </div>

                <div className="px-6 pb-6 text-gray-800 text-sm">
                  {bodyLines.map((line, index) => {
                    const trimmed = line.trim();
                    if (!trimmed) {
                      return <div key={index} className="h-3" />;
                    }
                    hasContent = true;
                    if (headingSet.has(trimmed)) {
                      return (
                        <h2 key={index} style={styleStringToObject(template.headingStyle)}>
                          {trimmed}
                        </h2>
                      );
                    }
                    if (trimmed.startsWith(">")) {
                      return (
                        <blockquote key={index} style={styleStringToObject(template.quoteStyle)}>
                          {trimmed.replace(/^>\s*/, "")}
                        </blockquote>
                      );
                    }
                    return (
                      <p key={index} style={styleStringToObject(template.paragraphStyle)} className="mb-3 leading-relaxed">
                        {trimmed}
                      </p>
                    );
                  })}
                  {!hasContent && (
                    <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-500 text-center">
                      正文生成后会在这里实时预览公众号阅读效果。
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

function styleStringToObject(style: string) {
  return style.split(";").reduce<Record<string, string>>((acc, rule) => {
    const [property, value] = rule.split(":").map((item) => item?.trim());
    if (!property || !value) return acc;
    acc[property.replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase())] = value;
    return acc;
  }, {});
}
