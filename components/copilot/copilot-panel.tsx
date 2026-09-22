"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";
import {
  AlertTriangle,
  Bot,
  CalendarClock,
  Loader2,
  PackageSearch,
  Send,
  Sparkles,
  TrendingUp,
  X,
} from "lucide-react";

interface CopilotPanelProps {
  open: boolean;
  onClose: () => void;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface CopilotResult {
  answer: string;
  intent: string;
  confidence: number;
  validation?: {
    valid: boolean;
    warnings: string[];
  };
}

const quickQuestions = [
  {
    label: "Stockout risks",
    question:
      "Which medicines may stock out this week?",
    icon: AlertTriangle,
  },
  {
    label: "What to reorder",
    question:
      "What medicines should I reorder?",
    icon: PackageSearch,
  },
  {
    label: "Demand trends",
    question:
      "Which medicines have an increasing or decreasing demand trend?",
    icon: TrendingUp,
  },
  {
    label: "Expiry risks",
    question:
      "Which medicines have batches that are at expiry risk?",
    icon: CalendarClock,
  },
];

function formatAssistantMessage(content: string) {
  const lines = content
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  return lines.map((line, index) => {
    const isBullet = /^[-•*]\s*/.test(line);

    const cleanedLine = line.replace(
      /^[-•*]\s*/,
      "",
    );

    const isHeading =
      line.endsWith(":") &&
      line.length < 80;

    if (isBullet) {
      return (
        <div
          key={`${line}-${index}`}
          className="flex gap-2"
        >
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />

          <span className="leading-6">
            {cleanedLine}
          </span>
        </div>
      );
    }

    if (isHeading) {
      return (
        <p
          key={`${line}-${index}`}
          className="pt-1 font-semibold text-slate-900"
        >
          {line}
        </p>
      );
    }

    return (
      <p
        key={`${line}-${index}`}
        className="leading-6"
      >
        {line}
      </p>
    );
  });
}

export default function CopilotPanel({
  open,
  onClose,
}: CopilotPanelProps) {
  const [question, setQuestion] = useState("");

  const [messages, setMessages] =
    useState<Message[]>([]);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const inputRef =
    useRef<HTMLInputElement>(null);

  const messagesEndRef =
    useRef<HTMLDivElement>(null);

  /*
   * Focus input when Copilot opens.
   */
  useEffect(() => {
    if (!open) {
      return;
    }

    const timer = window.setTimeout(() => {
      inputRef.current?.focus();
    }, 200);

    return () => {
      window.clearTimeout(timer);
    };
  }, [open]);

  /*
   * Keep latest message visible.
   */
  useEffect(() => {
    if (!open) {
      return;
    }

    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
    });
  }, [messages, loading, open]);

  async function askCopilot(
    selectedQuestion?: string,
  ) {
    const finalQuestion =
      selectedQuestion?.trim() ||
      question.trim();

    if (!finalQuestion || loading) {
      return;
    }

    setQuestion("");
    setError("");

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: finalQuestion,
    };

    setMessages((current) => [
      ...current,
      userMessage,
    ]);

    setLoading(true);

    try {
      const response = await fetch(
        "/api/copilot",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            question: finalQuestion,
            days: 7,
          }),
        },
      );

      const data =
        await response.json();

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.message ||
            "Unable to process Copilot request.",
        );
      }

      const result =
        data.data as CopilotResult;

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: result.answer,
      };

      setMessages((current) => [
        ...current,
        assistantMessage,
      ]);
    } catch (err) {
      console.error(
        "Copilot request failed:",
        err,
      );

      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong.",
      );
    } finally {
      setLoading(false);

      window.setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }

  function handleKeyDown(
    event: React.KeyboardEvent<HTMLInputElement>,
  ) {
    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();
      askCopilot();
    }
  }

  if (!open) {
    return null;
  }

  return (
    <div
      className="
        fixed
        bottom-[92px]
        right-5
        z-[9999]

        flex
        h-[min(680px,calc(100dvh-150px))]
        w-[min(420px,calc(100vw-2rem))]
        flex-col

        overflow-hidden

        rounded-2xl
        border
        border-slate-200
        bg-white

        shadow-[0_20px_60px_rgba(15,23,42,0.20)]
      "
    >
      {/* ==================================================
          HEADER
      ================================================== */}

      <div
        className="
          flex
          shrink-0
          items-center
          justify-between
          border-b
          border-slate-100
          bg-white
          px-4
          py-3.5
        "
      >
        <div className="flex items-center gap-3">
          <div
            className="
              relative
              flex
              h-10
              w-10
              shrink-0
              items-center
              justify-center
              rounded-xl
              bg-slate-900
              text-white
              shadow-sm
            "
          >
            <Bot className="h-5 w-5" />

            <span
              className="
                absolute
                -right-0.5
                -top-0.5
                h-2.5
                w-2.5
                rounded-full
                bg-emerald-400
                ring-2
                ring-white
              "
            />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-semibold text-slate-900">
                PHARMIX Copilot
              </h3>

              <Sparkles className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
            </div>

            <p className="mt-0.5 truncate text-[11px] text-slate-500">
              AI assistant • PHARMIX intelligence
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close Copilot"
          title="Close Copilot"
          className="
            flex
            h-8
            w-8
            shrink-0
            items-center
            justify-center
            rounded-xl
            text-slate-400
            transition-all
            hover:bg-slate-100
            hover:text-slate-700
          "
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* ==================================================
          CHAT AREA
      ================================================== */}

      <div
        className="
          min-h-0
          flex-1
          overflow-y-auto
          bg-slate-50
          px-4
          py-4
        "
      >
        {messages.length === 0 ? (
          <div className="flex min-h-full flex-col">
            {/* Welcome */}
            <div className="flex flex-1 flex-col items-center justify-center py-8 text-center">
              <div
                className="
                  mb-4
                  flex
                  h-14
                  w-14
                  items-center
                  justify-center
                  rounded-2xl
                  bg-white
                  text-slate-700
                  shadow-sm
                  ring-1
                  ring-slate-200
                "
              >
                <Bot className="h-7 w-7" />
              </div>

              <h3 className="text-base font-semibold text-slate-900">
                How can I help?
              </h3>

              <p className="mt-1.5 max-w-[290px] text-xs leading-5 text-slate-500">
                Ask me about inventory,
                demand, stockout risk,
                expiry, or pharmacy
                operations.
              </p>
            </div>

            {/* Suggested questions */}
            <div className="mt-4">
              <div className="mb-2.5">
                <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                  Suggested questions
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {quickQuestions.map(
                  (item) => {
                    const Icon =
                      item.icon;

                    return (
                      <button
                        key={
                          item.label
                        }
                        type="button"
                        disabled={loading}
                        onClick={() => {
                          void askCopilot(
                            item.question,
                          );
                        }}
                        className="
                          group
                          rounded-xl
                          border
                          border-slate-200
                          bg-white
                          px-3
                          py-3
                          text-left
                          transition-all
                          duration-200
                          hover:-translate-y-0.5
                          hover:border-emerald-200
                          hover:bg-emerald-50/40
                          hover:shadow-sm
                          active:translate-y-0
                          disabled:cursor-not-allowed
                          disabled:opacity-50
                        "
                      >
                        <div
                          className="
                            mb-2
                            flex
                            h-7
                            w-7
                            items-center
                            justify-center
                            rounded-lg
                            bg-slate-50
                            text-slate-500
                            transition-colors
                            group-hover:bg-emerald-100
                            group-hover:text-emerald-600
                          "
                        >
                          <Icon className="h-3.5 w-3.5" />
                        </div>

                        <span className="block text-xs font-medium leading-4 text-slate-700">
                          {item.label}
                        </span>
                      </button>
                    );
                  },
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {messages.map(
              (message) => {
                const isUser =
                  message.role ===
                  "user";

                return (
                  <div
                    key={
                      message.id
                    }
                    className={`flex ${
                      isUser
                        ? "justify-end"
                        : "justify-start"
                    }`}
                  >
                    <div
                      className={`flex max-w-[91%] gap-2.5 ${
                        isUser
                          ? "flex-row-reverse"
                          : "flex-row"
                      }`}
                    >
                      {/* Avatar */}
                      <div
                        className={`
                          flex
                          h-7
                          w-7
                          shrink-0
                          items-center
                          justify-center
                          rounded-lg
                          ${
                            isUser
                              ? "bg-slate-200 text-slate-600"
                              : "bg-slate-900 text-white"
                          }
                        `}
                      >
                        {isUser ? (
                          <span className="text-[9px] font-bold">
                            YOU
                          </span>
                        ) : (
                          <Bot className="h-3.5 w-3.5" />
                        )}
                      </div>

                      {/* Message */}
                      <div
                        className={`
                          rounded-2xl
                          px-3.5
                          py-2.5
                          text-sm
                          ${
                            isUser
                              ? "rounded-tr-md bg-slate-900 text-white shadow-sm"
                              : "rounded-tl-md border border-slate-200 bg-white text-slate-700 shadow-sm"
                          }
                        `}
                      >
                        {isUser ? (
                          <p className="whitespace-pre-wrap leading-6">
                            {
                              message.content
                            }
                          </p>
                        ) : (
                          <div className="space-y-2">
                            {formatAssistantMessage(
                              message.content,
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              },
            )}

            {/* Typing indicator */}
            {loading && (
              <div className="flex justify-start">
                <div className="flex gap-2.5">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-white">
                    <Bot className="h-3.5 w-3.5" />
                  </div>

                  <div
                    className="
                      flex
                      items-center
                      gap-1
                      rounded-2xl
                      rounded-tl-md
                      border
                      border-slate-200
                      bg-white
                      px-4
                      py-3
                      shadow-sm
                    "
                  >
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.3s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.15s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}

        {/* Error */}
        {error && (
          <div
            className="
              mt-3
              rounded-xl
              border
              border-red-200
              bg-red-50
              px-3
              py-2.5
              text-xs
              leading-5
              text-red-700
            "
          >
            {error}
          </div>
        )}
      </div>

      {/* ==================================================
          INPUT
      ================================================== */}

      <div
        className="
          shrink-0
          border-t
          border-slate-100
          bg-white
          p-3
        "
      >
        <div
          className="
            rounded-2xl
            border
            border-slate-200
            bg-slate-50
            p-1.5
            transition-all
            focus-within:border-slate-300
            focus-within:bg-white
            focus-within:shadow-sm
          "
        >
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              value={question}
              onChange={(event) =>
                setQuestion(
                  event.target.value,
                )
              }
              onKeyDown={
                handleKeyDown
              }
              disabled={loading}
              placeholder="Ask about your pharmacy..."
              className="
                min-w-0
                flex-1
                bg-transparent
                px-3
                py-2.5
                text-sm
                text-slate-900
                outline-none
                placeholder:text-slate-400
                disabled:opacity-50
              "
            />

            <button
              type="button"
              onClick={() => {
                void askCopilot();
              }}
              disabled={
                loading ||
                !question.trim()
              }
              aria-label="Send message"
              title="Send message"
              className="
                flex
                h-9
                w-9
                shrink-0
                items-center
                justify-center
                rounded-xl
                bg-slate-900
                text-white
                transition-all
                hover:bg-slate-800
                active:scale-95
                disabled:cursor-not-allowed
                disabled:opacity-30
              "
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        <div className="mt-2 flex items-center justify-between px-1">
          <span className="text-[10px] text-slate-400">
            PHARMIX intelligence
          </span>

          <span className="text-[10px] text-slate-400">
            Enter ↵
          </span>
        </div>
      </div>
    </div>
  );
}