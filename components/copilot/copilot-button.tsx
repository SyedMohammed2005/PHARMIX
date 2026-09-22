"use client";

import { Bot, Sparkles } from "lucide-react";

interface CopilotButtonProps {
  onClick: () => void;
  open?: boolean;
}

export default function CopilotButton({
  onClick,
  open = false,
}: CopilotButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={
        open
          ? "Close PHARMIX Copilot"
          : "Open PHARMIX Copilot"
      }
      title={
        open
          ? "Close Copilot"
          : "PHARMIX AI Copilot"
      }
      className={`group fixed bottom-5 right-5 z-[60] flex h-14 w-14 items-center justify-center rounded-2xl border shadow-xl transition-all duration-300 ${
        open
          ? "border-slate-300 bg-white text-slate-700 shadow-slate-300/40"
          : "border-slate-800 bg-slate-900 text-white shadow-slate-900/30 hover:-translate-y-1 hover:shadow-2xl"
      }`}
    >
      {open ? (
        <span className="text-xl leading-none">
          ×
        </span>
      ) : (
        <>
          <Bot
            className="h-6 w-6 transition-transform duration-300 group-hover:scale-110"
          />

          <span className="absolute right-1.5 top-1.5 flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />

            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-slate-900" />
          </span>
        </>
      )}

      {!open && (
        <span className="pointer-events-none absolute bottom-full right-0 mb-3 hidden w-max rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity group-hover:block group-hover:opacity-100">
          Ask PHARMIX Copilot
        </span>
      )}
    </button>
  );
}