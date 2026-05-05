"use client";

import { useMemo, useRef, useCallback } from "react";
import type {
  DraftState,
  Outline,
  RewriteInstruction,
  StyleTemplate,
  WorkspaceState
} from "@/types";
import { getDraftTocItems } from "@/lib/draft/editorContent";
import { countWords } from "@/lib/draft/articleBlocks";
import { DraftHeader } from "@/components/draft/DraftHeader";
import { ArticleTocSidebar } from "@/components/draft/ArticleTocSidebar";
import { ArticleEditor } from "@/components/draft/ArticleEditor";
import { WechatPreview } from "@/components/draft/WechatPreview";

type DraftWorkspacePageProps = {
  workspace: WorkspaceState;
  outline: Outline;
  draftState: DraftState;
  template: StyleTemplate;
  generatingSectionIds: string[];
  isGeneratingDraft: boolean;
  isRewriting: boolean;
  rewriteResult: string;
  rewriteInstruction: string;
  onBackToOutline: () => void;
  onContentChange: (content: string) => void;
  onSetActiveSection: (sectionId: string) => void;
  onGenerateDraft: () => void;
  onGenerateSection: (sectionId: string) => void;
  onRewritingAction: (instruction: RewriteInstruction, customInstruction?: string) => void;
  onAcceptRewrite: () => void;
  onCancelRewrite: () => void;
  onSelectTemplate: (id: string) => void;
  onCopyMarkdown: () => void;
  onCopyHtml: () => void;
};

export function DraftWorkspacePage({
  workspace,
  outline,
  draftState,
  template,
  generatingSectionIds,
  isGeneratingDraft,
  isRewriting,
  rewriteResult,
  rewriteInstruction,
  onBackToOutline,
  onContentChange,
  onSetActiveSection,
  onGenerateDraft,
  onGenerateSection,
  onRewritingAction,
  onAcceptRewrite,
  onCancelRewrite,
  onSelectTemplate,
  onCopyMarkdown,
  onCopyHtml
}: DraftWorkspacePageProps) {
  const wordCount = useMemo(() => countWords(draftState.editorContent), [draftState.editorContent]);

  const tocItems = useMemo(
    () => getDraftTocItems(outline, draftState),
    [outline, draftState]
  );

  const handleScrollToSection = useCallback(
    (sectionId: string) => {
      onSetActiveSection(sectionId);
    },
    [onSetActiveSection]
  );

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <DraftHeader
        workspaceName={workspace.workspaceName}
        status={draftState.status}
        isGenerating={isGeneratingDraft}
        wordCount={wordCount}
        onGenerateDraft={onGenerateDraft}
        onBackToOutline={onBackToOutline}
      />

      <div className="flex-1 flex overflow-hidden">
        <ArticleTocSidebar
          items={tocItems}
          activeSectionId={draftState.activeSectionId}
          generatingSectionIds={generatingSectionIds}
          onSelect={handleScrollToSection}
          onGenerateSection={onGenerateSection}
        />

        <ArticleEditor
          editorContent={draftState.editorContent}
          outline={outline}
          draftStatus={draftState.status}
          activeSectionId={draftState.activeSectionId}
          isGeneratingDraft={isGeneratingDraft}
          generatingSectionIds={generatingSectionIds}
          isRewriting={isRewriting}
          rewriteResult={rewriteResult}
          rewriteInstruction={rewriteInstruction}
          onContentChange={onContentChange}
          onGenerateDraft={onGenerateDraft}
          onGenerateSection={onGenerateSection}
          onRewritingAction={onRewritingAction}
          onAcceptRewrite={onAcceptRewrite}
          onCancelRewrite={onCancelRewrite}
          onScrollToSection={handleScrollToSection}
        />

        <WechatPreview
          editorContent={draftState.editorContent}
          outline={outline}
          template={template}
          selectedTemplateId={draftState.selectedTemplateId}
          onSelectTemplate={onSelectTemplate}
          onCopyMarkdown={onCopyMarkdown}
          onCopyHtml={onCopyHtml}
        />
      </div>
    </div>
  );
}
