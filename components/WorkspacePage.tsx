"use client";

import type {
  ChatMessage,
  News,
  NewsRole,
  Outline,
  OutlineSection,
  QuickOptionKind,
  SuggestionCardData,
  ThoughtBoard as ThoughtBoardType,
  WorkspaceNews,
  WorkspaceStatus
} from "@/types";
import { ChatPanel } from "@/components/ChatPanel";
import { NewsSidebar } from "@/components/NewsSidebar";
import { OutlinePanel } from "@/components/OutlinePanel";
import { ThoughtBoard } from "@/components/ThoughtBoard";

type WorkspacePageProps = {
  allNews: News[];
  selectedNews: WorkspaceNews[];
  browsedNewsIds: string[];
  workspaceName: string;
  status: WorkspaceStatus;
  thoughtBoard: ThoughtBoardType;
  outline: Outline;
  previousOutline?: Outline;
  messages: ChatMessage[];
  isTyping: boolean;
  isOptimizing: boolean;
  materialDirty: boolean;
  ideaDirty: boolean;
  highlightedFields: string[];
  highlightedSectionIds: string[];
  onToggleNews: (news: News) => void;
  onOpenDetails: (news: News) => void;
  onSetRole: (id: string, role: NewsRole) => void;
  onRemoveNews: (id: string) => void;
  onUpdateNote: (id: string, note: string) => void;
  onThoughtChange: <K extends keyof ThoughtBoardType>(field: K, value: ThoughtBoardType[K]) => void;
  onSendMessage: (input: string) => void;
  onQuickOption: (kind: QuickOptionKind, value: string) => void;
  onApplyCoreIdea: (suggestion: SuggestionCardData) => void;
  onApplyMainLine: (suggestion: SuggestionCardData) => void;
  onKeepReference: (suggestion: SuggestionCardData) => void;
  onOptimizeOutline: () => void;
  onRestorePrevious: () => void;
  onConfirmOutline: () => void;
  onUpdateSection: (section: OutlineSection) => void;
  onRegenerateSection: (id: string) => void;
  onToggleSectionLock: (id: string) => void;
  onDeleteSection: (id: string) => void;
  onMoveSection: (id: string, direction: "up" | "down") => void;
  onEnterDraft?: () => void;
};

export function WorkspacePage({
  allNews,
  selectedNews,
  browsedNewsIds,
  workspaceName,
  status,
  thoughtBoard,
  outline,
  previousOutline,
  messages,
  isTyping,
  isOptimizing,
  materialDirty,
  ideaDirty,
  highlightedFields,
  highlightedSectionIds,
  onToggleNews,
  onOpenDetails,
  onSetRole,
  onRemoveNews,
  onUpdateNote,
  onThoughtChange,
  onSendMessage,
  onQuickOption,
  onApplyCoreIdea,
  onApplyMainLine,
  onKeepReference,
  onOptimizeOutline,
  onRestorePrevious,
  onConfirmOutline,
  onUpdateSection,
  onRegenerateSection,
  onToggleSectionLock,
  onDeleteSection,
  onMoveSection,
  onEnterDraft
}: WorkspacePageProps) {
  return (
    <main className="flex-1 flex overflow-hidden">
      <NewsSidebar
        allNews={allNews}
        selectedNews={selectedNews}
        browsedNewsIds={browsedNewsIds}
        onToggleNews={onToggleNews}
        onOpenDetails={onOpenDetails}
        onSetRole={onSetRole}
        onRemove={onRemoveNews}
        onUpdateNote={onUpdateNote}
      />

      <ChatPanel
        workspaceName={workspaceName}
        status={status}
        thoughtBoard={thoughtBoard}
        messages={messages}
        isTyping={isTyping}
        onSend={onSendMessage}
        onQuickOption={onQuickOption}
        onApplyCoreIdea={onApplyCoreIdea}
        onApplyMainLine={onApplyMainLine}
        onKeepReference={onKeepReference}
      />

      <div className="w-[500px] bg-white border-l overflow-y-auto scrollbar-thin min-h-0">
        <div className="p-6 space-y-6">
          <ThoughtBoard
            board={thoughtBoard}
            selectedNews={selectedNews}
            highlightedFields={highlightedFields}
            materialDirty={materialDirty}
            ideaDirty={ideaDirty}
            onChange={onThoughtChange}
          />
          <OutlinePanel
            outline={outline}
            allNews={allNews}
            selectedNews={selectedNews}
            status={status}
            previousOutline={previousOutline}
            materialDirty={materialDirty}
            ideaDirty={ideaDirty}
            isOptimizing={isOptimizing}
            highlightedSectionIds={highlightedSectionIds}
            onOptimize={onOptimizeOutline}
            onRestorePrevious={onRestorePrevious}
            onConfirm={onConfirmOutline}
            onUpdateSection={onUpdateSection}
            onRegenerateSection={onRegenerateSection}
            onToggleLock={onToggleSectionLock}
            onDeleteSection={onDeleteSection}
            onMoveSection={onMoveSection}
            onEnterDraft={onEnterDraft}
          />
        </div>
      </div>
    </main>
  );
}
