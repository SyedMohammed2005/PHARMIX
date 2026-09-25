"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";
import {
  AlertTriangle,
  ArrowLeft,
  Bell,
  Bot,
  CalendarClock,
  Check,
  ChevronRight,
  Home,
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
  status?: "sending" | "sent";
  timestamp: string;
}
interface CopilotResult {
  answer: string;
  intent: string;
  confidence: number;
  timePeriod?: {
    days: number;
    label: string;
    matchedPhrase?: string;
  };
  validation?: {
    valid: boolean;
    warnings: string[];
  };
}

type CopilotCategory =
  | "inventory"
  | "stockout"
  | "reorder"
  | "demand"
  | "expiry"
  | "seasonal"
  | "alerts";

interface Category {
  id: CopilotCategory;
  label: string;
  description: string;
  icon: typeof PackageSearch;
}

interface SubQuestion {
  label: string;
  question: string;
}

const categories: Category[] = [
  {
    id: "inventory",
    label: "Inventory",
    description: "Stock levels and inventory status",
    icon: PackageSearch,
  },
  {
    id: "stockout",
    label: "Stockout Risk",
    description: "Products that may run out",
    icon: AlertTriangle,
  },
  {
    id: "reorder",
    label: "Reordering",
    description: "Restocking recommendations",
    icon: PackageSearch,
  },
  {
    id: "demand",
    label: "Demand",
    description: "Demand and sales trends",
    icon: TrendingUp,
  },
  {
    id: "expiry",
    label: "Expiry",
    description: "Batch expiry risks",
    icon: CalendarClock,
  },
  {
    id: "seasonal",
    label: "Seasonal Intelligence",
    description: "Seasonal and weather signals",
    icon: Sparkles,
  },
  {
    id: "alerts",
    label: "Alerts",
    description: "Important PHARMIX alerts",
    icon: Bell,
  },
];

const categoryQuestions: Record<
  CopilotCategory,
  SubQuestion[]
> = {
  inventory: [
    {
      label: "Show my inventory overview",
      question:
        "Give me an overview of the current pharmacy inventory.",
    },
    {
      label: "How is our stock status?",
      question:
        "How is our current stock status?",
    },
    {
      label: "Show low-stock products",
      question:
        "Which products currently have low stock?",
    },
  ],

  stockout: [
    {
      label: "Which products are at risk?",
      question:
        "Which medicines may stock out this week?",
    },
    {
      label: "What's currently out of stock?",
      question:
        "Which medicines are currently out of stock?",
    },
    {
      label: "Show critical stockout risks",
      question:
        "Which products have critical stockout risk?",
    },
  ],

  reorder: [
    {
      label: "Which products should I reorder?",
      question:
        "Which medicines should I reorder?",
    },
    {
      label: "What needs urgent restocking?",
      question:
        "Which products need urgent restocking?",
    },
    {
      label: "Show recommended quantities",
      question:
        "What are the recommended reorder quantities?",
    },
    {
      label: "Show all reorder recommendations",
      question:
        "Show me all current reorder recommendations.",
    },
  ],

  demand: [
    {
      label: "Show demand trends",
      question:
        "Which medicines have an increasing or decreasing demand trend?",
    },
    {
      label: "What demand is increasing?",
      question:
        "Which medicines have increasing demand?",
    },
    {
      label: "What demand is decreasing?",
      question:
        "Which medicines have decreasing demand?",
    },
    {
      label: "Show demand spikes",
      question:
        "Which medicines have a demand spike?",
    },
  ],

  expiry: [
    {
      label: "Which batches are expiring soon?",
      question:
        "Which medicines have batches that are at expiry risk?",
    },
    {
      label: "Show critical expiry risks",
      question:
        "Which batches have critical expiry risk?",
    },
    {
      label: "What's expiring within 30 days?",
      question:
        "Which medicine batches expire within 30 days?",
    },
  ],

  seasonal: [
    {
      label: "Show seasonal demand",
      question:
        "Which medicines have seasonal demand?",
    },
    {
      label: "Show weather-related demand",
      question:
        "Which medicines have weather-related demand signals?",
    },
    {
      label: "Which products are seasonally relevant?",
      question:
        "Which products are currently seasonally relevant?",
    },
  ],

  alerts: [
    {
      label: "Show my unread alerts",
      question:
        "Show me my unread alerts.",
    },
    {
      label: "Show critical alerts",
      question:
        "Show me the critical alerts that need attention.",
    },
    {
      label: "Show recent alerts",
      question:
        "Give me a summary of my recent alerts.",
    },
  ],
};

function getCurrentTime() {
  return new Intl.DateTimeFormat(
    "en-IN",
    {
      hour: "numeric",
      minute: "2-digit",
    },
  ).format(new Date());
}

function getGreetingResponse(question: string) {
  const normalized = question.trim().toLowerCase();

  if (/^(hi|hello|hey)([!.?,\s]*)$/i.test(normalized)) {
    return "Hello! 👋 I’m PHARMIX Copilot. How can I help you with your pharmacy operations today?";
  }

  if (
    /^(thanks|thank you|thankyou|thank u|thx)([!.?,\s]*)$/i.test(
      normalized,
    )
  ) {
    return "You’re welcome! I’m here whenever you need help with PHARMIX.";
  }

  return null;
}

function isSupportedCopilotQuestion(question: string) {
  const normalized = question.trim().toLowerCase();

  const supportedKeywords = [
    "inventory",
    "stock",
    "stockout",
    "reorder",
    "reordering",
    "demand",
    "forecast",
    "expiry",
    "expire",
    "seasonal",
    "season",
    "weather",
    "alert",
    "notification",
    "risk",
    "medicine",
    "medicines",
    "product",
    "products",
    "batch",
  ];

  const timePeriodKeywords = [
    "today",
    "this week",
    "next week",
    "next 7 days",
    "next seven days",
    "7 days",
    "seven days",
    "next 14 days",
    "next fourteen days",
    "14 days",
    "fourteen days",
    "next 2 weeks",
    "next two weeks",
    "2 weeks",
    "two weeks",
    "fortnight",
    "biweekly",
    "next 30 days",
    "next thirty days",
    "30 days",
    "thirty days",
    "next month",
    "this month",
    "monthly",
    "one month",
    "1 month",
  ];

  const contextualKeywords = [
    "those products",
    "those medicines",
    "those medicine",
    "what about them",
    "what about those",
    "what about these",
    "show them",
    "show those",
    "show these",
    "tell me about them",
    "tell me about those",
    "tell me about these",
  ];

  return (
    supportedKeywords.some((keyword) =>
      normalized.includes(keyword),
    ) ||
    timePeriodKeywords.some((keyword) =>
      normalized.includes(keyword),
    ) ||
    contextualKeywords.some((keyword) =>
      normalized.includes(keyword),
    )
  );
}

function getFollowUpSuggestions(
  intent: string,
  category: CopilotCategory | null,
) {
  switch (intent) {
    case "INVENTORY_OVERVIEW":
      return [
        "Show low-stock products",
        "Show stockout risks",
      ];

    case "STOCKOUT_RISK":
      return [
        "Show high-risk products",
        "What should I reorder?",
      ];

    case "REORDER":
      return [
        "Show products to reorder",
        "Show recommended quantities",
      ];

    case "DEMAND_TREND":
      return [
        "Show increasing demand",
        "Show demand spikes",
      ];

    case "EXPIRY_RISK":
      return [
        "Show batches expiring soon",
        "Show critical expiry risks",
      ];

    case "SEASONAL_DEMAND":
      return [
        "Show seasonal demand",
        "Show weather-related demand",
      ];

    case "NOTIFICATION_SUMMARY":
      return [
        "Show critical alerts",
        "Show unread alerts",
      ];

    default:
      switch (category) {
        case "inventory":
          return [
            "Show low-stock products",
            "Show stockout risks",
          ];

        case "stockout":
          return [
            "Show high-risk products",
            "What should I reorder?",
          ];

        case "reorder":
          return [
            "Show products to reorder",
            "Show recommended quantities",
          ];

        case "demand":
          return [
            "Show increasing demand",
            "Show demand spikes",
          ];

        case "expiry":
          return [
            "Show batches expiring soon",
            "Show critical expiry risks",
          ];

        case "seasonal":
          return [
            "Show seasonal demand",
            "Show weather-related demand",
          ];

        case "alerts":
          return [
            "Show critical alerts",
            "Show unread alerts",
          ];

        default:
          return [
            "Show inventory overview",
            "Show stockout risks",
          ];
      }
  }
}

function renderHighlightedText(
  text: string,
) {
  const parts = text.split(
    /(\b(?:HIGH|CRITICAL|WARNING|LOW|SAFE|NORMAL|RISK|STOCKOUT)\b|\b\d+(?:\.\d+)?\s*(?:units?|days?|%|mg|₹)\b)/gi,
  );

  return parts.map((part, index) => {
    const upper = part.toUpperCase();

    const isRisk =
      [
        "HIGH",
        "CRITICAL",
        "WARNING",
        "STOCKOUT",
      ].includes(upper);

    const isPositive =
      ["SAFE", "NORMAL"].includes(
        upper,
      );

    const isValue =
      /^\d+(?:\.\d+)?\s*(?:units?|days?|%|mg|₹)$/i.test(
        part.trim(),
      );

    if (isRisk) {
      return (
        <span
          key={`${part}-${index}`}
          className="font-semibold text-amber-600"
        >
          {part}
        </span>
      );
    }

    if (isPositive) {
      return (
        <span
          key={`${part}-${index}`}
          className="font-semibold text-emerald-600"
        >
          {part}
        </span>
      );
    }

    if (isValue) {
      return (
        <span
          key={`${part}-${index}`}
          className="font-semibold text-slate-900"
        >
          {part}
        </span>
      );
    }

    return (
      <span key={`${part}-${index}`}>
        {part}
      </span>
    );
  });
}

function formatAssistantMessage(
  content: string,
) {
  const lines = content
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  return lines.map((line, index) => {
    const isBullet =
      /^[-•*]\s*/.test(line);

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
          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />

          <span className="leading-5">
            {renderHighlightedText(
              cleanedLine,
            )}
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
        className="leading-5"
      >
        {renderHighlightedText(line)}
      </p>
    );
  });
}

export default function CopilotPanel({
  open,
  onClose,
}: CopilotPanelProps) {
  const [question, setQuestion] =
    useState("");

  const [messages, setMessages] =
    useState<Message[]>([]);

  const [loading, setLoading] =
    useState(false);

  const [typingResponse, setTypingResponse] =
    useState(false);

  const [error, setError] =
    useState("");

  const [selectedCategory, setSelectedCategory] =
    useState<CopilotCategory | null>(null);

  const [expandedMessages, setExpandedMessages] =
    useState<Record<string, boolean>>({});

  const [followUpSuggestions, setFollowUpSuggestions] =
    useState<string[]>([]);

  const [showFallbackMenu, setShowFallbackMenu] =
    useState(false);

  const lastQuestionRef =
    useRef("");
const lastTimePeriodRef = useRef<number>(7);

  const inputRef =
    useRef<HTMLInputElement>(null);

  const messagesEndRef =
    useRef<HTMLDivElement>(null);

  const typingTimerRef =
    useRef<number | null>(null);

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

  useEffect(() => {
    if (!open) {
      return;
    }

    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
    });
  }, [
    messages,
    loading,
    typingResponse,
    open,
  ]);

  useEffect(() => {
    return () => {
      if (
        typingTimerRef.current !==
        null
      ) {
        window.clearTimeout(
          typingTimerRef.current,
        );
      }
    };
  }, []);

  function resetCopilot() {
    if (
      typingTimerRef.current !==
      null
    ) {
      window.clearTimeout(
        typingTimerRef.current,
      );
    }

    setQuestion("");
    setMessages([]);
    setError("");
    setSelectedCategory(null);
    setLoading(false);
    setTypingResponse(false);
    setExpandedMessages({});
    setFollowUpSuggestions([]);
    setShowFallbackMenu(false);
    lastQuestionRef.current = "";
  }

  function handleClose() {
    resetCopilot();
    onClose();
  }

  function goToMainMenu() {
    if (
      typingTimerRef.current !==
      null
    ) {
      window.clearTimeout(
        typingTimerRef.current,
      );
    }

    setMessages([]);
    setQuestion("");
    setError("");
    setSelectedCategory(null);
    setTypingResponse(false);
    setExpandedMessages({});
    setFollowUpSuggestions([]);
    setShowFallbackMenu(false);
  }

  function goBackToCategory() {
    if (
      typingTimerRef.current !==
      null
    ) {
      window.clearTimeout(
        typingTimerRef.current,
      );
    }

    setMessages([]);
    setError("");
    setTypingResponse(false);
    setExpandedMessages({});
    setFollowUpSuggestions([]);
    setShowFallbackMenu(false);
  }

  function typeAssistantResponse(
    messageId: string,
    content: string,
  ) {
    if (
      typingTimerRef.current !==
      null
    ) {
      window.clearTimeout(
        typingTimerRef.current,
      );
    }

    setTypingResponse(true);

    const words =
      content.split(/(\s+)/);

    let currentIndex = 0;

    const typeNextWord = () => {
      if (
        currentIndex >=
        words.length
      ) {
        setTypingResponse(false);
        typingTimerRef.current =
          null;
        return;
      }

      const word =
        words[currentIndex];

      setMessages((current) =>
        current.map((message) =>
          message.id === messageId
            ? {
                ...message,
                content:
                  message.content +
                  word,
              }
            : message,
        ),
      );

      currentIndex += 1;

      typingTimerRef.current =
        window.setTimeout(
          typeNextWord,
          45,
        );
    };

    typeNextWord();
  }

  async function askCopilot(
    selectedQuestion?: string,
  ) {
    const finalQuestion =
      selectedQuestion?.trim() ||
      question.trim();

    if (
      !finalQuestion ||
      loading ||
      typingResponse
    ) {
      return;
    }

    lastQuestionRef.current =
      finalQuestion;

    setQuestion("");
    setFollowUpSuggestions([]);
    setShowFallbackMenu(false);
    setError("");
    setTypingResponse(false);

    const timestamp =
      getCurrentTime();

    const userMessageId =
      crypto.randomUUID();

    const userMessage: Message = {
      id: userMessageId,
      role: "user",
      content: finalQuestion,
      status: "sending",
      timestamp,
    };

    setMessages((current) => [
      ...current,
      userMessage,
    ]);

    const greetingResponse =
      getGreetingResponse(finalQuestion);

    if (greetingResponse) {
      const assistantMessageId =
        crypto.randomUUID();

      const assistantMessage: Message = {
        id: assistantMessageId,
        role: "assistant",
        content: "",
        timestamp: getCurrentTime(),
      };

      setMessages((current) => [
        ...current,
        assistantMessage,
      ]);

      setLoading(false);

      typeAssistantResponse(
        assistantMessageId,
        greetingResponse,
      );

      return;
    }

    if (!isSupportedCopilotQuestion(finalQuestion)) {
      const assistantMessageId =
        crypto.randomUUID();

      const assistantMessage: Message = {
        id: assistantMessageId,
        role: "assistant",
        content:
          "I can help with PHARMIX pharmacy operations. Please choose one of the options below.",
        timestamp: getCurrentTime(),
      };

      setMessages((current) => [
        ...current,
        assistantMessage,
      ]);

      setLoading(false);
      setShowFallbackMenu(true);
      return;
    }

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
 days: lastTimePeriodRef.current,
  conversationHistory: messages
    .filter(
      (message) =>
        message.role === "user" ||
        message.role === "assistant",
    )
    .slice(-10)
    .map((message) => ({
      role: message.role,
      content: message.content,
    })),
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
        if (result.timePeriod?.days) {
  lastTimePeriodRef.current = result.timePeriod.days;
}

      setMessages((current) =>
        current.map((message) =>
          message.id ===
          userMessageId
            ? {
                ...message,
                status: "sent",
              }
            : message,
        ),
      );

      const assistantMessageId =
        crypto.randomUUID();

      const assistantMessage: Message =
        {
          id: assistantMessageId,
          role: "assistant",
          content: "",
          timestamp:
            getCurrentTime(),
        };

      setMessages((current) => [
        ...current,
        assistantMessage,
      ]);

      setLoading(false);
      setFollowUpSuggestions(
        getFollowUpSuggestions(
          result.intent,
          selectedCategory,
        ),
      );

    const responseContent = result.timePeriod
  ? `Forecast period: ${result.timePeriod.label}\n\n${result.answer}`
  : result.answer;

typeAssistantResponse(
  assistantMessageId,
  responseContent,
);
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

      setMessages((current) =>
        current.map((message) =>
          message.id ===
          userMessageId
            ? {
                ...message,
                status: "sent",
              }
            : message,
        ),
      );

      setLoading(false);
      setTypingResponse(false);
      setFollowUpSuggestions([]);
    } finally {
      window.setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }

  function retryLastQuestion() {
    if (!lastQuestionRef.current) {
      return;
    }

    setError("");

    void askCopilot(
      lastQuestionRef.current,
    );
  }

  function handleKeyDown(
    event: React.KeyboardEvent<HTMLInputElement>,
  ) {
    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();
      void askCopilot();
    }
  }

  function toggleExpanded(
    messageId: string,
  ) {
    setExpandedMessages(
      (current) => ({
        ...current,
        [messageId]:
          !current[messageId],
      }),
    );
  }

  if (!open) {
    return null;
  }

  const selectedCategoryData =
    categories.find(
      (category) =>
        category.id ===
        selectedCategory,
    );

  const showMainMenu =
    messages.length === 0 &&
    selectedCategory === null;

  const showCategoryMenu =
    messages.length === 0 &&
    selectedCategory !== null;

  const hasAssistantResponse =
    messages.some(
      (message) =>
        message.role ===
          "assistant" &&
        message.content.trim()
          .length > 0,
    );

  return (
    <div
      className="
        fixed
        inset-x-3
        bottom-3
        z-[9999]
        mx-auto
        flex
        h-[calc(100dvh-24px)]
        max-h-[760px]
        w-[calc(100vw-24px)]
        max-w-[360px]
        flex-col
        overflow-hidden
        rounded-2xl
        border
        border-slate-200
        bg-white
        shadow-[0_20px_60px_rgba(15,23,42,0.20)]
        sm:inset-x-auto
        sm:bottom-4
        sm:right-4
        sm:h-[calc(100dvh-32px)]
        sm:w-[360px]
      "
    >
      {/* HEADER */}
      <div
        className="
          flex
          shrink-0
          items-center
          justify-between
          border-b
          border-slate-100
          bg-white
          px-3
          py-2.5
        "
      >
        <div className="flex min-w-0 items-center gap-2">
          {selectedCategory && (
            <button
              type="button"
              onClick={
                messages.length > 0
                  ? goBackToCategory
                  : goToMainMenu
              }
              aria-label="Back"
              title="Back"
              className="
                flex
                h-7
                w-7
                shrink-0
                items-center
                justify-center
                rounded-lg
                text-slate-500
                transition-all
                hover:bg-slate-100
                hover:text-slate-800
              "
            >
              <ArrowLeft className="h-3.5 w-3.5" />
            </button>
          )}

          <div
            className="
              relative
              flex
              h-8
              w-8
              shrink-0
              items-center
              justify-center
              rounded-xl
              bg-slate-900
              text-white
            "
          >
            <Bot className="h-4 w-4" />

            <span
              className="
                absolute
                -right-0.5
                -top-0.5
                h-2
                w-2
                rounded-full
                bg-emerald-400
                ring-2
                ring-white
              "
            />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1">
              <h3 className="truncate text-xs font-semibold text-slate-900">
                {selectedCategoryData?.label ||
                  "PHARMIX Copilot"}
              </h3>

              <Sparkles className="h-3 w-3 shrink-0 text-emerald-500" />
            </div>

            <p className="mt-0.5 truncate text-[9px] text-slate-500">
              {selectedCategoryData?.description ||
                "AI assistant • PHARMIX intelligence"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-0.5">
          {messages.length > 0 && (
            <button
              type="button"
              onClick={goToMainMenu}
              aria-label="Main menu"
              title="Main menu"
              className="
                flex
                h-7
                w-7
                items-center
                justify-center
                rounded-lg
                text-slate-400
                transition-all
                hover:bg-slate-100
                hover:text-slate-700
              "
            >
              <Home className="h-3.5 w-3.5" />
            </button>
          )}

          {selectedCategory && messages.length === 0 && (
            <button
              type="button"
              onClick={goToMainMenu}
              aria-label="Main menu"
              title="Main menu"
              className="
                flex
                h-7
                w-7
                items-center
                justify-center
                rounded-lg
                text-slate-400
                transition-all
                hover:bg-slate-100
                hover:text-slate-700
              "
            >
              <Home className="h-3.5 w-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={handleClose}
            aria-label="Close Copilot"
            title="Close Copilot"
            className="
              flex
              h-7
              w-7
              items-center
              justify-center
              rounded-lg
              text-slate-400
              transition-all
              hover:bg-slate-100
              hover:text-slate-700
            "
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* SCROLLABLE CONTENT */}
      <div
        className="
          min-h-0
          flex-1
          overflow-y-auto
          overscroll-contain
          bg-slate-50
          px-3
          py-3
          [scrollbar-color:#cbd5e1_transparent]
          [scrollbar-width:thin]
        "
      >
        {/* MAIN MENU */}
        {showMainMenu && (
          <div className="flex flex-col">
            <div className="py-3 text-center">
              <div
                className="
                  mx-auto
                  mb-2.5
                  flex
                  h-11
                  w-11
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
                <Bot className="h-5.5 w-5.5" />
              </div>

              <h3 className="text-[13px] font-semibold text-slate-900">
                Hi! How can I help?
              </h3>

              <p className="mx-auto mt-1 max-w-[270px] text-[10px] leading-4.5 text-slate-500">
                Explore PHARMIX intelligence or
                ask a question about your pharmacy.
              </p>
            </div>

            <div className="mb-2">
              <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                Explore PHARMIX
              </span>
            </div>

            <div className="space-y-1.5">
              {categories.map(
                (category) => {
                  const Icon =
                    category.icon;

                  return (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() =>
                        setSelectedCategory(
                          category.id,
                        )
                      }
                      className="
                        group
                        flex
                        w-full
                        items-center
                        gap-2.5
                        rounded-xl
                        border
                        border-slate-200
                        bg-white
                        px-2.5
                        py-2
                        text-left
                        transition-all
                        duration-200
                        hover:border-emerald-200
                        hover:bg-emerald-50/40
                        hover:shadow-sm
                      "
                    >
                      <div
                        className="
                          flex
                          h-7
                          w-7
                          shrink-0
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

                      <div className="min-w-0 flex-1">
                        <p className="text-[10.5px] font-semibold text-slate-800">
                          {category.label}
                        </p>

                        <p className="mt-0.5 truncate text-[9px] text-slate-500">
                          {category.description}
                        </p>
                      </div>

                      <ChevronRight
                        className="
                          h-3.5
                          w-3.5
                          shrink-0
                          text-slate-300
                          transition-colors
                          group-hover:text-emerald-500
                        "
                      />
                    </button>
                  );
                },
              )}
            </div>
          </div>
        )}

        {/* CATEGORY MENU */}
        {showCategoryMenu &&
          selectedCategoryData && (
            <div>
              <button
                type="button"
                onClick={goToMainMenu}
                className="
                  mb-3
                  flex
                  items-center
                  gap-1
                  text-[10px]
                  font-medium
                  text-slate-500
                  transition-colors
                  hover:text-slate-800
                "
              >
                <ArrowLeft className="h-3 w-3" />
                Back to Copilot
              </button>

              <div className="mb-3.5">
                <h3 className="text-[13px] font-semibold text-slate-900">
                  {selectedCategoryData.label}
                </h3>

                <p className="mt-1 text-[10px] leading-4.5 text-slate-500">
                  Choose what you'd like PHARMIX
                  Copilot to analyze.
                </p>
              </div>

              <div className="space-y-1.5">
                {categoryQuestions[
                  selectedCategory
                ].map((item) => (
                  <button
                    key={item.question}
                    type="button"
                    disabled={
                      loading ||
                      typingResponse
                    }
                    onClick={() => {
                      void askCopilot(
                        item.question,
                      );
                    }}
                    className="
                      group
                      flex
                      w-full
                      items-center
                      gap-2.5
                      rounded-xl
                      border
                      border-slate-200
                      bg-white
                      px-2.5
                      py-2.5
                      text-left
                      transition-all
                      duration-200
                      hover:border-emerald-200
                      hover:bg-emerald-50/40
                      hover:shadow-sm
                      disabled:cursor-not-allowed
                      disabled:opacity-50
                    "
                  >
                    <div
                      className="
                        flex
                        h-7
                        w-7
                        shrink-0
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
                      <Sparkles className="h-3 w-3" />
                    </div>

                    <span className="min-w-0 flex-1 text-[10.5px] font-medium leading-4.5 text-slate-700">
                      {item.label}
                    </span>

                    <ChevronRight
                      className="
                        h-3.5
                        w-3.5
                        shrink-0
                        text-slate-300
                        transition-colors
                        group-hover:text-emerald-500
                      "
                    />
                  </button>
                ))}
              </div>
            </div>
          )}

        {/* CHAT */}
        {messages.length > 0 && (
          <div className="space-y-3.5">
            {messages.map(
              (message) => {
                const isUser =
                  message.role ===
                  "user";

                const isLong =
                  message.role ===
                    "assistant" &&
                  message.content.length >
                    900;

                const isExpanded =
                  expandedMessages[
                    message.id
                  ];

                const displayedContent =
                  isLong &&
                  !isExpanded
                    ? `${message.content.slice(
                        0,
                        900,
                      )}...`
                    : message.content;

                return (
                  <div
                    key={message.id}
                    className={`flex ${
                      isUser
                        ? "justify-end"
                        : "justify-start"
                    }`}
                  >
                    <div
                      className={`flex max-w-[92%] gap-2 ${
                        isUser
                          ? "flex-row-reverse"
                          : "flex-row"
                      }`}
                    >
                      <div
                        className={`
                          flex
                          h-6
                          w-6
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
                          <span className="text-[7px] font-bold">
                            YOU
                          </span>
                        ) : (
                          <Bot className="h-3 w-3" />
                        )}
                      </div>

                      <div
                        className={`
                          rounded-2xl
                          px-3
                          py-2.5
                          text-[10.5px]
                          ${
                            isUser
                              ? "rounded-tr-md bg-slate-900 text-white shadow-sm"
                              : "rounded-tl-md border border-slate-200 bg-white text-slate-700 shadow-sm"
                          }
                        `}
                      >
                        {isUser ? (
                          <div>
                            <p className="whitespace-pre-wrap leading-4.5">
                              {message.content}
                            </p>

                            <div
                              className={`
                                mt-1.5
                                flex
                                items-center
                                justify-end
                                gap-1
                                text-[8px]
                                ${
                                  message.status ===
                                  "sending"
                                    ? "text-slate-400"
                                    : "text-emerald-400"
                                }
                              `}
                            >
                              {message.status ===
                              "sending" ? (
                                <>
                                  <Loader2 className="h-2.5 w-2.5 animate-spin" />

                                  <span>
                                    Sending...
                                  </span>
                                </>
                              ) : (
                                <span className="relative flex h-2.5 w-3.5 items-center">
                                  <Check className="absolute left-0 h-2.5 w-2.5" />

                                  <Check className="absolute left-1 h-2.5 w-2.5" />
                                </span>
                              )}

                              <span className="ml-1 text-slate-400">
                                {message.timestamp}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-1.5">
                            {formatAssistantMessage(
                              displayedContent,
                            )}

                            {isLong && (
                              <button
                                type="button"
                                onClick={() =>
                                  toggleExpanded(
                                    message.id,
                                  )
                                }
                                className="
                                  mt-1
                                  text-[9px]
                                  font-semibold
                                  text-emerald-600
                                  hover:text-emerald-700
                                "
                              >
                                {isExpanded
                                  ? "Show less"
                                  : "Show more"}
                              </button>
                            )}

                            <div className="flex items-center justify-between gap-2 pt-1">
                              <span className="text-[8px] text-slate-400">
                                PHARMIX Intelligence
                                {" • "}
                                Live data
                              </span>

                              <span className="text-[8px] text-slate-400">
                                {message.timestamp}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              },
            )}

            {/* FOLLOW-UP SUGGESTIONS */}
            {!loading &&
              !typingResponse &&
              hasAssistantResponse &&
              followUpSuggestions.length > 0 && (
                <div className="pt-1">
                  <p className="mb-2 text-[9px] font-semibold uppercase tracking-wide text-slate-400">
                    Ask a follow-up
                  </p>

                  <div className="flex flex-wrap gap-1.5">
                    {followUpSuggestions.map(
                      (suggestion) => (
                        <button
                          key={suggestion}
                          type="button"
                          onClick={() => {
                            setFollowUpSuggestions([]);
                            void askCopilot(
                              suggestion,
                            );
                          }}
                          disabled={
                            loading ||
                            typingResponse
                          }
                          className="
                            rounded-lg
                            border
                            border-slate-200
                            bg-white
                            px-2.5
                            py-1.5
                            text-[9px]
                            font-medium
                            text-slate-600
                            shadow-sm
                            transition-all
                            hover:border-emerald-200
                            hover:bg-emerald-50/40
                            hover:text-emerald-700
                            disabled:cursor-not-allowed
                            disabled:opacity-50
                          "
                        >
                          {suggestion}
                        </button>
                      ),
                    )}
                  </div>
                </div>
              )}

            {/* FALLBACK CATEGORY MENU */}
            {showFallbackMenu &&
              !loading &&
              !typingResponse && (
                <div className="pt-1">
                  <p className="mb-2 text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                    Explore PHARMIX
                  </p>

                  <div className="space-y-1.5">
                    {categories.map((category) => {
                      const Icon = category.icon;

                      return (
                        <button
                          key={category.id}
                          type="button"
                          onClick={() => {
                            setMessages([]);
                            setFollowUpSuggestions([]);
                            setShowFallbackMenu(false);
                            setSelectedCategory(
                              category.id,
                            );
                          }}
                          className="
                            group
                            flex
                            w-full
                            items-center
                            gap-2.5
                            rounded-xl
                            border
                            border-slate-200
                            bg-white
                            px-2.5
                            py-2
                            text-left
                            transition-all
                            duration-200
                            hover:border-emerald-200
                            hover:bg-emerald-50/40
                            hover:shadow-sm
                          "
                        >
                          <div
                            className="
                              flex
                              h-7
                              w-7
                              shrink-0
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

                          <div className="min-w-0 flex-1">
                            <p className="text-[10.5px] font-semibold text-slate-800">
                              {category.label}
                            </p>

                            <p className="mt-0.5 truncate text-[9px] text-slate-500">
                              {category.description}
                            </p>
                          </div>

                          <ChevronRight
                            className="
                              h-3.5
                              w-3.5
                              shrink-0
                              text-slate-300
                              transition-colors
                              group-hover:text-emerald-500
                            "
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

            {/* TYPING INDICATOR */}
            {(loading ||
              typingResponse) && (
              <div className="flex justify-start">
                <div className="flex gap-2">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-white">
                    <Bot className="h-3 w-3" />
                  </div>

                  <div
                    className="
                      flex
                      items-center
                      gap-2
                      rounded-2xl
                      rounded-tl-md
                      border
                      border-slate-200
                      bg-white
                      px-3
                      py-2.5
                      shadow-sm
                    "
                  >
                    <div className="flex items-center gap-1">
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.3s]" />

                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.15s]" />

                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" />
                    </div>

                    <span className="text-[9px] text-slate-400">
                      Typing...
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* BACK TO MENU */}
            {!loading &&
              !typingResponse &&
              hasAssistantResponse && (
                <button
                  type="button"
                  onClick={goToMainMenu}
                  className="
                    mx-auto
                    mt-2
                    flex
                    items-center
                    gap-1.5
                    rounded-lg
                    border
                    border-slate-200
                    bg-white
                    px-3
                    py-1.5
                    text-[9px]
                    font-medium
                    text-slate-500
                    shadow-sm
                    transition-all
                    hover:border-slate-300
                    hover:bg-slate-50
                    hover:text-slate-800
                  "
                >
                  <Home className="h-3 w-3" />
                  Back to menu
                </button>
              )}

            <div ref={messagesEndRef} />
          </div>
        )}

        {/* ERROR */}
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
              text-[9px]
              leading-4
              text-red-700
            "
          >
            <p>{error}</p>

            <button
              type="button"
              onClick={retryLastQuestion}
              disabled={
                loading ||
                typingResponse
              }
              className="
                mt-2
                rounded-lg
                border
                border-red-200
                bg-white
                px-2.5
                py-1
                text-[9px]
                font-semibold
                text-red-600
                transition-colors
                hover:bg-red-100
                disabled:opacity-50
              "
            >
              Try again
            </button>
          </div>
        )}
      </div>

      {/* INPUT — ALWAYS VISIBLE */}
      <div
        className="
          shrink-0
          border-t
          border-slate-100
          bg-white
          p-2
        "
      >
        <div
          className="
            rounded-xl
            border
            border-slate-200
            bg-slate-50
            p-1
            transition-all
            focus-within:border-slate-300
            focus-within:bg-white
            focus-within:shadow-sm
          "
        >
          <div className="flex items-center gap-1">
            <input
              ref={inputRef}
              value={question}
              onChange={(event) =>
                setQuestion(
                  event.target.value,
                )
              }
              onKeyDown={handleKeyDown}
              disabled={
                loading ||
                typingResponse
              }
              placeholder="Ask about your pharmacy..."
              className="
                min-w-0
                flex-1
                bg-transparent
                px-2.5
                py-1.5
                text-[10.5px]
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
                typingResponse ||
                !question.trim()
              }
              aria-label="Send message"
              title="Send message"
              className="
                flex
                h-7
                w-7
                shrink-0
                items-center
                justify-center
                rounded-lg
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
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Send className="h-3.5 w-3.5" />
              )}
            </button>
          </div>
        </div>

        <div className="mt-1 flex items-center justify-between px-1">
          <span className="text-[8px] text-slate-400">
            PHARMIX intelligence
          </span>

          <span className="text-[8px] text-slate-400">
            Enter ↵
          </span>
        </div>
      </div>
    </div>
  );
}
