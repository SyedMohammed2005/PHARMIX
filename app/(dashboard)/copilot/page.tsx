"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Bot,
  BrainCircuit,
  MessageSquare,
  PackageSearch,
  TrendingUp,
  AlertTriangle,
  CalendarClock,
  Bell,
  Send,
  Loader2,
} from "lucide-react";

const suggestedQuestions = [
  {
    icon: PackageSearch,
    title: "Inventory overview",
    question: "Give me a summary of the current inventory situation.",
  },
  {
    icon: AlertTriangle,
    title: "Stockout risk",
    question: "Which medicines may stock out this week?",
  },
  {
    icon: TrendingUp,
    title: "Demand trends",
    question:
      "Which medicines have an increasing or decreasing demand trend?",
  },
  {
    icon: CalendarClock,
    title: "Expiry risk",
    question:
      "Which medicines have batches that are at expiry risk?",
  },
  {
    icon: BrainCircuit,
    title: "Seasonal demand",
    question:
      "Which medicines are affected by seasonal or weather demand?",
  },
  {
    icon: Bell,
    title: "Notifications",
    question: "What are my important unread notifications?",
  },
];

interface CopilotResult {
  answer: string;
  intent: string;
  confidence: number;
  validation?: {
    valid: boolean;
    warnings: string[];
  };
}

export default function CopilotPage() {
  const [question, setQuestion] = useState("");
  const [response, setResponse] =
    useState<CopilotResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function askCopilot(
    selectedQuestion?: string,
  ) {
    const finalQuestion =
      selectedQuestion?.trim() || question.trim();

    if (!finalQuestion || loading) {
      return;
    }

    setQuestion(finalQuestion);
    setLoading(true);
    setError("");
    setResponse(null);

    try {
      const res = await fetch("/api/copilot", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: finalQuestion,
          days: 7,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(
          data.message ||
            "Unable to process Copilot request.",
        );
      }

      setResponse(data.data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-lg">
              <Bot className="h-6 w-6" />
            </div>

            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                AI Pharmacy Copilot
              </h1>

              <p className="text-sm text-slate-500">
                Ask questions about your PHARMIX pharmacy
                operations.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Welcome */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
        >
          <div className="p-8">
            <div className="mb-4 flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-slate-700" />

              <span className="text-sm font-semibold text-slate-700">
                PHARMIX Intelligence
              </span>
            </div>

            <h2 className="mb-3 text-3xl font-bold text-slate-900">
              How can I help you today?
            </h2>

            <p className="max-w-2xl text-sm leading-6 text-slate-500">
              I can analyze your inventory, demand trends,
              stockout risks, expiry information, seasonal
              signals, and operational notifications using
              PHARMIX data.
            </p>
          </div>
        </motion.div>

        {/* Question Input */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mb-8 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
        >
          <div className="flex gap-3">
            <input
              value={question}
              onChange={(event) =>
                setQuestion(event.target.value)
              }
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  askCopilot();
                }
              }}
              placeholder="Ask PHARMIX Copilot..."
              disabled={loading}
              className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white"
            />

            <button
              type="button"
              onClick={() => askCopilot()}
              disabled={
                loading || !question.trim()
              }
              className="flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}

              {loading ? "Thinking..." : "Ask"}
            </button>
          </div>
        </motion.div>

        {/* Response */}
        {response && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <div className="mb-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white">
                  <Bot className="h-5 w-5" />
                </div>

                <div>
                  <h3 className="font-semibold text-slate-900">
                    PHARMIX Copilot
                  </h3>

                  <p className="text-xs text-slate-500">
                    Intent: {response.intent}
                  </p>
                </div>
              </div>

              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                {Math.round(
                  response.confidence * 100,
                )}
                % confidence
              </span>
            </div>

            <div className="whitespace-pre-wrap text-sm leading-7 text-slate-700">
              {response.answer}
            </div>

            {response.validation && (
              <div className="mt-5 border-t border-slate-100 pt-4">
                <span
                  className={
                    response.validation.valid
                      ? "text-xs font-medium text-emerald-600"
                      : "text-xs font-medium text-amber-600"
                  }
                >
                  {response.validation.valid
                    ? "✓ Response validated against PHARMIX evidence"
                    : "⚠ Response requires review"}
                </span>
              </div>
            )}
          </motion.div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-8 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Suggested Questions */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-slate-900">
              Try asking
            </h3>

            <p className="text-sm text-slate-500">
              Start with one of these operational questions.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {suggestedQuestions.map((item) => {
              const Icon = item.icon;

              return (
                <button
                  key={item.title}
                  type="button"
                  onClick={() =>
                    askCopilot(item.question)
                  }
                  disabled={loading}
                  className="group rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700 transition group-hover:bg-slate-900 group-hover:text-white">
                    <Icon className="h-5 w-5" />
                  </div>

                  <h4 className="mb-1 font-semibold text-slate-900">
                    {item.title}
                  </h4>

                  <p className="text-sm leading-5 text-slate-500">
                    {item.question}
                  </p>
                </button>
              );
            })}
          </div>
        </motion.div>
      </div>
    </div>
  );
}