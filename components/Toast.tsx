"use client";

import { CheckCircle2, Info, X } from "lucide-react";
import { cn } from "@/lib/cn";

export type ToastItem = {
  id: string;
  title: string;
  description?: string;
  tone?: "info" | "success" | "warning";
};

type ToastProps = {
  items: ToastItem[];
  onClose: (id: string) => void;
};

export function Toast({ items, onClose }: ToastProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className="fixed right-4 top-20 z-50 flex w-[min(360px,calc(100vw_-_2rem))] flex-col gap-2">
      {items.map((item) => {
        const isSuccess = item.tone === "success";
        return (
          <div
            key={item.id}
            className={cn(
              "animate-slide-up rounded-lg border bg-white p-3 shadow-soft",
              item.tone === "warning" ? "border-amber-200" : "border-line"
            )}
          >
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  "mt-0.5 flex h-7 w-7 items-center justify-center rounded-lg",
                  isSuccess ? "bg-mint-50 text-mint-600" : "bg-tech-50 text-tech-600"
                )}
              >
                {isSuccess ? <CheckCircle2 className="h-4 w-4" /> : <Info className="h-4 w-4" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-ink">{item.title}</p>
                {item.description && <p className="mt-0.5 text-xs leading-5 text-muted">{item.description}</p>}
              </div>
              <button
                type="button"
                onClick={() => onClose(item.id)}
                className="rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label="关闭提示"
                title="关闭"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
