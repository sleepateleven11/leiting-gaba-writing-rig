"use client";

import type { StyleTemplate } from "@/types";
import { cn } from "@/lib/cn";

type StyleTemplateSelectorProps = {
  templates: StyleTemplate[];
  selectedTemplateId: string;
  onSelect: (id: string) => void;
};

export function StyleTemplateSelector({
  templates,
  selectedTemplateId,
  onSelect
}: StyleTemplateSelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {templates.map((template) => {
        const active = template.id === selectedTemplateId;
        return (
          <button
            key={template.id}
            type="button"
            onClick={() => onSelect(template.id)}
            className={cn(
              "rounded-lg border p-3 text-left transition",
              active
                ? "border-tech-200 bg-tech-50 text-tech-700"
                : "border-line bg-white text-slate-600 hover:border-tech-100"
            )}
          >
            <p className="text-xs font-semibold">{template.name}</p>
            <p className="mt-1 line-clamp-2 text-[11px] leading-4 text-muted">{template.description}</p>
          </button>
        );
      })}
    </div>
  );
}
