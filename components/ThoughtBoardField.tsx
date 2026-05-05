"use client";

import { PencilLine } from "lucide-react";
import { cn } from "@/lib/cn";

type ThoughtBoardFieldProps = {
  label: string;
  value: string;
  placeholder: string;
  multiline?: boolean;
  highlighted?: boolean;
  onChange: (value: string) => void;
};

export function ThoughtBoardField({
  label,
  value,
  placeholder,
  multiline,
  highlighted,
  onChange
}: ThoughtBoardFieldProps) {
  return (
    <label
      className={cn(
        "block rounded-lg border border-line bg-white p-3 transition",
        highlighted && "field-highlight"
      )}
    >
      <span className="mb-2 flex items-center justify-between gap-2 text-xs font-semibold text-slate-500">
        {label}
        <PencilLine className="h-3.5 w-3.5 text-slate-400" />
      </span>
      {multiline ? (
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          rows={4}
          placeholder={placeholder}
          className="w-full resize-none rounded-md border border-transparent bg-slate-50 px-2 py-2 text-sm leading-6 text-ink transition placeholder:text-slate-400 focus:border-tech-100 focus:bg-white"
        />
      ) : (
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="w-full rounded-md border border-transparent bg-slate-50 px-2 py-2 text-sm text-ink transition placeholder:text-slate-400 focus:border-tech-100 focus:bg-white"
        />
      )}
    </label>
  );
}
