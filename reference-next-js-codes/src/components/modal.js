"use client";

import { X } from "lucide-react";
import { Button, Card } from "@/components/ui";

export function Modal({ open, title, description, children, footer, onClose, maxWidth = "max-w-3xl" }) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/70 px-0 pt-0 backdrop-blur-sm md:items-start md:px-6 md:pt-8">
      <Card className={`flex max-h-[100dvh] w-full ${maxWidth} flex-col overflow-hidden rounded-t-2xl rounded-b-none border-slate-200 bg-white p-0 shadow-2xl dark:border-slate-800 dark:bg-slate-900 md:max-h-[calc(100dvh-2rem)] md:rounded-2xl`}>
        <div className="flex items-start justify-between gap-4 border-b border-emerald-100 bg-gradient-to-r from-emerald-50 via-white to-dark-emerald-50 p-4 dark:border-slate-800 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900 md:p-5">
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-50">{title}</h3>
            {description ? (
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{description}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-50"
            aria-label="Close modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">{children}</div>

        {footer ? <div className="border-t border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">{footer}</div> : null}
      </Card>
    </div>
  );
}
