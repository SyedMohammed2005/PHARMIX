"use client";

import { useEffect, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowUpFromLine,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Eye,
  FileText,
  Filter,
  Loader2,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  Users,
  X,
  Database,
} from "lucide-react";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type AuditStats = {
  totalLogs: number;
  createCount: number;
  updateCount: number;
  deleteCount: number;
  loginCount: number;
  logoutCount: number;
  stockAdjustmentCount: number;
  saleCreatedCount: number;
  saleReturnedCount: number;
  saleRefundedCount: number;
  purchaseCreatedCount: number;
  purchaseReturnedCount: number;
  batchCreatedCount: number;
  batchUpdatedCount: number;
  roleChangedCount: number;
};

type AuditTrend = {
  date: string;
  actionCount: number;
};

type AuditActivityByUser = {
  user: {
    id: string;
    name: string | null;
    email: string;
    role: string;
  } | null;
  actionCount: number;
};

type AuditActivityByEntity = {
  entity: string;
  actionCount: number;
};

type AuditLog = {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  description: string | null;
  beforeData: unknown;
  afterData: unknown;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    role: string;
  } | null;
};

type StatsResponse = {
  success: boolean;
  data: AuditStats;
};

type AuditLogsResponse = {
  success: boolean;
  data: {
    logs: AuditLog[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

type TrendResponse = {
  success: boolean;
  data: AuditTrend[];
};

type ActivityByUserResponse = {
  success: boolean;
  data: AuditActivityByUser[];
};

type ActivityByEntityResponse = {
  success: boolean;
  data: AuditActivityByEntity[];
};

const ACTION_OPTIONS = [
  "ALL",
  "LOGIN",
  "LOGOUT",
  "CREATE",
  "UPDATE",
  "DELETE",
  "STOCK_ADJUSTMENT",
  "SALE_CREATED",
  "SALE_RETURNED",
  "SALE_REFUNDED",
  "PURCHASE_CREATED",
  "PURCHASE_RETURNED",
  "BATCH_CREATED",
  "BATCH_UPDATED",
  "ROLE_CHANGED",
];

const ROLE_OPTIONS = [
  "ALL",
  "ADMIN",
  "PHARMACIST",
  "INVENTORY_MANAGER",
  "BUSINESS_ANALYST",
];

const ENTITY_OPTIONS = [
  "ALL",
  "User",
  "Product",
  "Inventory",
  "Batch",
  "Sale",
  "SaleReturn",
  "Purchase",
  "PurchaseReturn",
  "Payment",
];

const CRITICAL_ACTIONS = [
  "DELETE",
  "STOCK_ADJUSTMENT",
  "SALE_RETURNED",
  "SALE_REFUNDED",
  "PURCHASE_RETURNED",
  "ROLE_CHANGED",
];

function isCriticalAction(action: string) {
  return CRITICAL_ACTIONS.includes(action);
}

function formatAction(action: string) {
  return action
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatRole(role: string) {
  return role
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function getActionBadgeClasses(action: string) {
  if (action === "DELETE") {
    return "bg-red-100 text-red-700 border-red-200";
  }

  if (
    action === "STOCK_ADJUSTMENT" ||
    action === "SALE_REFUNDED" ||
    action === "SALE_RETURNED" ||
    action === "PURCHASE_RETURNED"
  ) {
    return "bg-orange-100 text-orange-700 border-orange-200";
  }

  if (action === "LOGIN") {
    return "bg-emerald-100 text-emerald-700 border-emerald-200";
  }

  if (action === "LOGOUT") {
    return "bg-gray-100 text-gray-700 border-gray-200";
  }

  if (action === "CREATE") {
    return "bg-blue-100 text-blue-700 border-blue-200";
  }

  if (action === "UPDATE") {
    return "bg-violet-100 text-violet-700 border-violet-200";
  }

  if (action === "ROLE_CHANGED") {
    return "bg-purple-100 text-purple-700 border-purple-200";
  }

  return "bg-gray-100 text-gray-700 border-gray-200";
}

function formatJson(value: unknown) {
  if (value === null || value === undefined) {
    return "No data";
  }

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return "Unable to display data";
  }
}

export default function AuditLogsPage() {
  const [stats, setStats] = useState<AuditStats | null>(null);
  const [trend, setTrend] = useState<AuditTrend[]>([]);

  const [activityByUser, setActivityByUser] = useState<
    AuditActivityByUser[]
  >([]);

  const [activityByEntity, setActivityByEntity] = useState<
    AuditActivityByEntity[]
  >([]);

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(
    null,
  );

  const [loading, setLoading] = useState(true);
  const [logsLoading, setLogsLoading] = useState(true);

  const [error, setError] = useState("");
  const [logsError, setLogsError] = useState("");

  const [search, setSearch] = useState("");
  const [action, setAction] = useState("ALL");
  const [role, setRole] = useState("ALL");
  const [entity, setEntity] = useState("ALL");
  const [criticalOnly, setCriticalOnly] = useState(false);

  const [page, setPage] = useState(1);

  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [refreshing, setRefreshing] = useState(false);

  /*
   * Fetch audit statistics, trend,
   * activity by user, and activity by entity.
   */
  useEffect(() => {
    async function fetchAuditOverview() {
      try {
        setLoading(true);
        setError("");

        const [
          statsResponse,
          trendResponse,
          userResponse,
          entityResponse,
        ] = await Promise.all([
          fetch("/api/audit-logs?stats=true", {
            cache: "no-store",
          }),

          fetch("/api/audit-logs?trend=true", {
            cache: "no-store",
          }),

          fetch("/api/audit-logs?byUser=true", {
            cache: "no-store",
          }),

          fetch("/api/audit-logs?byEntity=true", {
            cache: "no-store",
          }),
        ]);

        if (
          !statsResponse.ok ||
          !trendResponse.ok ||
          !userResponse.ok ||
          !entityResponse.ok
        ) {
          throw new Error(
            "Failed to fetch audit overview",
          );
        }

        const statsResult: StatsResponse =
          await statsResponse.json();

        const trendResult: TrendResponse =
          await trendResponse.json();

        const userResult: ActivityByUserResponse =
          await userResponse.json();

        const entityResult: ActivityByEntityResponse =
          await entityResponse.json();

        if (
          !statsResult.success ||
          !trendResult.success ||
          !userResult.success ||
          !entityResult.success
        ) {
          throw new Error(
            "Unable to load audit overview",
          );
        }

        setStats(statsResult.data);
        setTrend(trendResult.data);
        setActivityByUser(userResult.data);
        setActivityByEntity(entityResult.data);
      } catch (err) {
        console.error(
          "Audit overview error:",
          err,
        );

        setError(
          err instanceof Error
            ? err.message
            : "Something went wrong while loading audit data",
        );
      } finally {
        setLoading(false);
      }
    }

    fetchAuditOverview();
  }, []);

  /*
   * Fetch paginated audit logs.
   */
  useEffect(() => {
    async function fetchAuditLogs() {
      try {
        setLogsLoading(true);
        setLogsError("");

        const params = new URLSearchParams();

        params.set("page", String(page));
        params.set("limit", "10");

        if (search.trim()) {
          params.set("search", search.trim());
        }

        if (action !== "ALL") {
          params.set("action", action);
        }

        if (role !== "ALL") {
          params.set("role", role);
        }

        if (entity !== "ALL") {
          params.set("entity", entity);
        }

        const response = await fetch(
          `/api/audit-logs?${params.toString()}`,
          {
            cache: "no-store",
          },
        );

        if (!response.ok) {
          throw new Error(
            "Failed to fetch audit logs",
          );
        }

        const result: AuditLogsResponse =
          await response.json();

        if (!result.success) {
          throw new Error(
            "Unable to load audit logs",
          );
        }

        setLogs(result.data.logs);
        setTotal(result.data.total);
        setTotalPages(result.data.totalPages);
      } catch (err) {
        console.error(
          "Audit logs error:",
          err,
        );

        setLogsError(
          err instanceof Error
            ? err.message
            : "Unable to load audit logs",
        );
      } finally {
        setLogsLoading(false);
      }
    }

    fetchAuditLogs();
  }, [
    page,
    search,
    action,
    role,
    entity,
  ]);

  /*
   * Refresh all audit dashboard data.
   */
  async function handleRefresh() {
    try {
      setRefreshing(true);
      setError("");

      const [
        statsResponse,
        trendResponse,
        userResponse,
        entityResponse,
      ] = await Promise.all([
        fetch("/api/audit-logs?stats=true", {
          cache: "no-store",
        }),

        fetch("/api/audit-logs?trend=true", {
          cache: "no-store",
        }),

        fetch("/api/audit-logs?byUser=true", {
          cache: "no-store",
        }),

        fetch("/api/audit-logs?byEntity=true", {
          cache: "no-store",
        }),
      ]);

      if (
        !statsResponse.ok ||
        !trendResponse.ok ||
        !userResponse.ok ||
        !entityResponse.ok
      ) {
        throw new Error(
          "Failed to refresh audit overview",
        );
      }

      const statsResult: StatsResponse =
        await statsResponse.json();

      const trendResult: TrendResponse =
        await trendResponse.json();

      const userResult: ActivityByUserResponse =
        await userResponse.json();

      const entityResult: ActivityByEntityResponse =
        await entityResponse.json();

      if (statsResult.success) {
        setStats(statsResult.data);
      }

      if (trendResult.success) {
        setTrend(trendResult.data);
      }

      if (userResult.success) {
        setActivityByUser(userResult.data);
      }

      if (entityResult.success) {
        setActivityByEntity(
          entityResult.data,
        );
      }

      setPage(1);
    } catch (err) {
      console.error(
        "Audit refresh error:",
        err,
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to refresh audit data",
      );
    } finally {
      setRefreshing(false);
    }
  }

  function handleActionChange(value: string) {
    setAction(value);
    setPage(1);
  }

  function handleRoleChange(value: string) {
    setRole(value);
    setPage(1);
  }

  function handleEntityChange(value: string) {
    setEntity(value);
    setPage(1);
  }

  function handleSearchChange(value: string) {
    setSearch(value);
    setPage(1);
  }

  function handleCriticalToggle() {
    const nextValue = !criticalOnly;

    setCriticalOnly(nextValue);
    setPage(1);
  }

  const summaryCards = [
    {
      title: "Total Activities",
      value: stats?.totalLogs ?? 0,
      icon: Activity,
      description: "All recorded audit events",
    },
    {
      title: "Creates",
      value: stats?.createCount ?? 0,
      icon: ArrowUpFromLine,
      description: "Records created",
    },
    {
      title: "Updates",
      value: stats?.updateCount ?? 0,
      icon: FileText,
      description: "Records modified",
    },
    {
      title: "Deletes",
      value: stats?.deleteCount ?? 0,
      icon: Trash2,
      description: "Records deleted",
    },
  ];

  const securityCards = [
    {
      title: "Logins",
      value: stats?.loginCount ?? 0,
    },
    {
      title: "Logouts",
      value: stats?.logoutCount ?? 0,
    },
    {
      title: "Stock Adjustments",
      value:
        stats?.stockAdjustmentCount ?? 0,
    },
    {
      title: "Role Changes",
      value:
        stats?.roleChangedCount ?? 0,
    },
  ];

  /*
   * Transform API data into chart-friendly data.
   */
  const userChartData = activityByUser.map(
    (item) => ({
      name:
        item.user?.name ??
        "System / Unknown",
      role:
        item.user?.role
          ? formatRole(item.user.role)
          : "System",
      actionCount: item.actionCount,
    }),
  );

  const entityChartData =
    activityByEntity.map((item) => ({
      entity: item.entity,
      actionCount: item.actionCount,
    }));

  /*
   * Client-side critical filter.
   *
   * The normal paginated endpoint is used so search/entity/role/action
   * filtering remains available. Critical-only then narrows the returned
   * page to critical actions.
   */
  const displayedLogs = criticalOnly
    ? logs.filter((log) =>
        isCriticalAction(log.action),
      )
    : logs;

  return (
    <div className="min-h-full space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <ShieldCheck className="h-7 w-7 text-blue-600" />

            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              Audit Logs
            </h1>
          </div>

          <p className="max-w-3xl text-sm text-gray-500">
            Monitor system activity, security events,
            and important data changes across Pharmix.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 rounded-lg border border-blue-100 bg-blue-50 px-4 py-2 text-sm text-blue-700">
            <ShieldCheck className="h-4 w-4" />

            <span className="font-medium">
              Enterprise Activity Monitoring
            </span>
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              className={`h-4 w-4 ${
                refreshing
                  ? "animate-spin"
                  : ""
              }`}
            />

            Refresh
          </button>
        </div>
      </div>

      {/* Overview Loading */}
      {loading && (
        <div className="flex min-h-[220px] items-center justify-center rounded-xl border border-gray-200 bg-white">
          <div className="flex items-center gap-3 text-gray-500">
            <Loader2 className="h-5 w-5 animate-spin" />

            <span>
              Loading audit overview...
            </span>
          </div>
        </div>
      )}

      {/* Overview Error */}
      {!loading && error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 text-red-600" />

            <div>
              <h2 className="font-semibold text-red-800">
                Unable to load audit overview
              </h2>

              <p className="mt-1 text-sm text-red-700">
                {error}
              </p>
            </div>
          </div>
        </div>
      )}

      {!loading && !error && stats && (
        <>
          {/* Summary Cards */}
          <section>
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Activity Overview
              </h2>

              <p className="text-sm text-gray-500">
                High-level audit activity across the system.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {summaryCards.map((card) => {
                const Icon = card.icon;

                return (
                  <div
                    key={card.title}
                    className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-500">
                          {card.title}
                        </p>

                        <p className="mt-2 text-3xl font-bold text-gray-900">
                          {card.value}
                        </p>
                      </div>

                      <div className="rounded-lg bg-gray-100 p-3">
                        <Icon className="h-5 w-5 text-gray-700" />
                      </div>
                    </div>

                    <p className="mt-3 text-xs text-gray-500">
                      {card.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Security Activity */}
          <section>
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Security & Operational Activity
              </h2>

              <p className="text-sm text-gray-500">
                Important authentication and operational
                events recorded by Pharmix.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {securityCards.map((card) => (
                <div
                  key={card.title}
                  className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-500">
                      {card.title}
                    </p>

                    <Activity className="h-5 w-5 text-gray-400" />
                  </div>

                  <p className="mt-2 text-2xl font-bold text-gray-900">
                    {card.value}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* User & Entity Analytics */}
          <section>
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Activity Analytics
              </h2>

              <p className="text-sm text-gray-500">
                Understand where audit activity is coming
                from across Pharmix.
              </p>
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
              {/* Activity By User */}
              <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="mb-5 flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-blue-600" />

                      <h3 className="text-lg font-semibold text-gray-900">
                        Activity by User
                      </h3>
                    </div>

                    <p className="mt-1 text-sm text-gray-500">
                      Number of recorded actions performed
                      by each user.
                    </p>
                  </div>

                  <div className="rounded-lg bg-blue-50 p-2">
                    <Users className="h-4 w-4 text-blue-600" />
                  </div>
                </div>

                <div className="h-[320px] w-full">
                  {userChartData.length === 0 ? (
                    <div className="flex h-full items-center justify-center text-sm text-gray-500">
                      No user activity data available.
                    </div>
                  ) : (
                    <ResponsiveContainer
                      width="100%"
                      height="100%"
                    >
                      <BarChart
                        data={userChartData}
                        margin={{
                          top: 10,
                          right: 20,
                          left: 0,
                          bottom: 40,
                        }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                        />

                        <XAxis
                          dataKey="name"
                          angle={-20}
                          textAnchor="end"
                          interval={0}
                          tick={{
                            fontSize: 11,
                          }}
                        />

                        <YAxis
                          allowDecimals={false}
                          tick={{
                            fontSize: 12,
                          }}
                        />

                        <Tooltip />

                        <Bar
                          dataKey="actionCount"
                          name="Activities"
                          radius={[
                            6,
                            6,
                            0,
                            0,
                          ]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>

                {/* User Summary */}
                <div className="mt-4 space-y-2">
                  {activityByUser.map((item) => (
                    <div
                      key={
                        item.user?.id ??
                        "unknown-user"
                      }
                      className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-gray-900">
                          {item.user?.name ??
                            "System / Unknown"}
                        </p>

                        <p className="text-xs text-gray-500">
                          {item.user?.role
                            ? formatRole(
                                item.user.role,
                              )
                            : "System"}
                        </p>
                      </div>

                      <span className="ml-3 shrink-0 rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-gray-700">
                        {item.actionCount} actions
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Activity By Entity */}
              <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="mb-5 flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <Database className="h-5 w-5 text-violet-600" />

                      <h3 className="text-lg font-semibold text-gray-900">
                        Activity by Entity
                      </h3>
                    </div>

                    <p className="mt-1 text-sm text-gray-500">
                      Audit activity grouped by business
                      entity or module.
                    </p>
                  </div>

                  <div className="rounded-lg bg-violet-50 p-2">
                    <Database className="h-4 w-4 text-violet-600" />
                  </div>
                </div>

                <div className="h-[320px] w-full">
                  {entityChartData.length === 0 ? (
                    <div className="flex h-full items-center justify-center text-sm text-gray-500">
                      No entity activity data available.
                    </div>
                  ) : (
                    <ResponsiveContainer
                      width="100%"
                      height="100%"
                    >
                      <BarChart
                        data={entityChartData}
                        layout="vertical"
                        margin={{
                          top: 10,
                          right: 20,
                          left: 30,
                          bottom: 10,
                        }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                        />

                        <XAxis
                          type="number"
                          allowDecimals={false}
                          tick={{
                            fontSize: 12,
                          }}
                        />

                        <YAxis
                          type="category"
                          dataKey="entity"
                          width={100}
                          tick={{
                            fontSize: 11,
                          }}
                        />

                        <Tooltip />

                        <Bar
                          dataKey="actionCount"
                          name="Activities"
                          radius={[
                            0,
                            6,
                            6,
                            0,
                          ]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>

                {/* Entity Summary */}
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  {activityByEntity.map((item) => (
                    <div
                      key={item.entity}
                      className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2"
                    >
                      <span className="text-sm font-medium text-gray-700">
                        {item.entity}
                      </span>

                      <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-gray-700">
                        {item.actionCount}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Activity Trend */}
          <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-gray-900">
                Activity Trend
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Number of audit events recorded each day.
              </p>
            </div>

            <div className="h-[320px] w-full">
              {trend.length === 0 ? (
                <div className="flex h-full items-center justify-center text-sm text-gray-500">
                  No activity trend data available.
                </div>
              ) : (
                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >
                  <LineChart
                    data={trend}
                    margin={{
                      top: 10,
                      right: 20,
                      left: 0,
                      bottom: 10,
                    }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                    />

                    <XAxis
                      dataKey="date"
                      tick={{
                        fontSize: 12,
                      }}
                    />

                    <YAxis
                      allowDecimals={false}
                      tick={{
                        fontSize: 12,
                      }}
                    />

                    <Tooltip />

                    <Line
                      type="monotone"
                      dataKey="actionCount"
                      name="Activities"
                      strokeWidth={3}
                      dot={{
                        r: 4,
                      }}
                      activeDot={{
                        r: 6,
                      }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </section>

          {/* Event Breakdown */}
          <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-200 p-5">
              <h2 className="text-lg font-semibold text-gray-900">
                Event Breakdown
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Current audit event counts by business operation.
              </p>
            </div>

            <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-lg bg-gray-50 p-4">
                <p className="text-sm text-gray-500">
                  Sales Created
                </p>

                <p className="mt-1 text-xl font-semibold text-gray-900">
                  {stats.saleCreatedCount}
                </p>
              </div>

              <div className="rounded-lg bg-gray-50 p-4">
                <p className="text-sm text-gray-500">
                  Sales Returned
                </p>

                <p className="mt-1 text-xl font-semibold text-gray-900">
                  {stats.saleReturnedCount}
                </p>
              </div>

              <div className="rounded-lg bg-gray-50 p-4">
                <p className="text-sm text-gray-500">
                  Sales Refunded
                </p>

                <p className="mt-1 text-xl font-semibold text-gray-900">
                  {stats.saleRefundedCount}
                </p>
              </div>

              <div className="rounded-lg bg-gray-50 p-4">
                <p className="text-sm text-gray-500">
                  Purchases Created
                </p>

                <p className="mt-1 text-xl font-semibold text-gray-900">
                  {stats.purchaseCreatedCount}
                </p>
              </div>

              <div className="rounded-lg bg-gray-50 p-4">
                <p className="text-sm text-gray-500">
                  Purchases Returned
                </p>

                <p className="mt-1 text-xl font-semibold text-gray-900">
                  {stats.purchaseReturnedCount}
                </p>
              </div>

              <div className="rounded-lg bg-gray-50 p-4">
                <p className="text-sm text-gray-500">
                  Batch Created
                </p>

                <p className="mt-1 text-xl font-semibold text-gray-900">
                  {stats.batchCreatedCount}
                </p>
              </div>

              <div className="rounded-lg bg-gray-50 p-4">
                <p className="text-sm text-gray-500">
                  Batch Updated
                </p>

                <p className="mt-1 text-xl font-semibold text-gray-900">
                  {stats.batchUpdatedCount}
                </p>
              </div>

              <div className="rounded-lg bg-gray-50 p-4">
                <p className="text-sm text-gray-500">
                  Stock Adjustments
                </p>

                <p className="mt-1 text-xl font-semibold text-gray-900">
                  {stats.stockAdjustmentCount}
                </p>
              </div>

              <div className="rounded-lg bg-gray-50 p-4">
                <p className="text-sm text-gray-500">
                  Role Changes
                </p>

                <p className="mt-1 text-xl font-semibold text-gray-900">
                  {stats.roleChangedCount}
                </p>
              </div>
            </div>
          </section>

          {/* Audit Explorer */}
          <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-200 p-5">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <ClipboardList className="h-5 w-5 text-gray-700" />

                    <h2 className="text-lg font-semibold text-gray-900">
                      Audit Event Explorer
                    </h2>
                  </div>

                  <p className="mt-1 text-sm text-gray-500">
                    Search, filter, and inspect individual
                    system events.
                  </p>
                </div>

                <div className="text-sm text-gray-500">
                  {total} total events
                </div>
              </div>

              {/* Filters */}
              <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                {/* Search */}
                <div className="relative xl:col-span-2">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

                  <input
                    type="text"
                    value={search}
                    onChange={(event) =>
                      handleSearchChange(
                        event.target.value,
                      )
                    }
                    placeholder="Search entity, ID, description..."
                    className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-9 pr-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                {/* Action */}
                <div className="relative">
                  <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

                  <select
                    value={action}
                    onChange={(event) =>
                      handleActionChange(
                        event.target.value,
                      )
                    }
                    className="w-full appearance-none rounded-lg border border-gray-200 bg-white py-2.5 pl-9 pr-3 text-sm text-gray-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  >
                    {ACTION_OPTIONS.map(
                      (option) => (
                        <option
                          key={option}
                          value={option}
                        >
                          {option === "ALL"
                            ? "All actions"
                            : formatAction(
                                option,
                              )}
                        </option>
                      ),
                    )}
                  </select>
                </div>

                {/* Role */}
                <select
                  value={role}
                  onChange={(event) =>
                    handleRoleChange(
                      event.target.value,
                    )
                  }
                  className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                >
                  {ROLE_OPTIONS.map(
                    (option) => (
                      <option
                        key={option}
                        value={option}
                      >
                        {option === "ALL"
                          ? "All roles"
                          : formatRole(
                              option,
                            )}
                      </option>
                    ),
                  )}
                </select>

                {/* Entity */}
                <select
                  value={entity}
                  onChange={(event) =>
                    handleEntityChange(
                      event.target.value,
                    )
                  }
                  className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                >
                  {ENTITY_OPTIONS.map(
                    (option) => (
                      <option
                        key={option}
                        value={option}
                      >
                        {option === "ALL"
                          ? "All entities"
                          : option}
                      </option>
                    ),
                  )}
                </select>
              </div>

              {/* Critical Filter */}
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={
                    handleCriticalToggle
                  }
                  className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition ${
                    criticalOnly
                      ? "border-red-200 bg-red-50 text-red-700"
                      : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <ShieldAlert className="h-4 w-4" />

                  {criticalOnly
                    ? "Showing critical events"
                    : "Critical events only"}
                </button>

                {(search ||
                  action !== "ALL" ||
                  role !== "ALL" ||
                  entity !== "ALL" ||
                  criticalOnly) && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearch("");
                      setAction("ALL");
                      setRole("ALL");
                      setEntity("ALL");
                      setCriticalOnly(false);
                      setPage(1);
                    }}
                    className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
                  >
                    <X className="h-4 w-4" />
                    Clear filters
                  </button>
                )}
              </div>
            </div>

            {/* Table */}
            {logsLoading ? (
              <div className="flex min-h-[300px] items-center justify-center">
                <div className="flex items-center gap-3 text-gray-500">
                  <Loader2 className="h-5 w-5 animate-spin" />

                  <span>
                    Loading audit events...
                  </span>
                </div>
              </div>
            ) : logsError ? (
              <div className="p-5">
                <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="mt-0.5 h-5 w-5 text-red-600" />

                    <div>
                      <p className="font-medium text-red-800">
                        Unable to load audit events
                      </p>

                      <p className="mt-1 text-sm text-red-700">
                        {logsError}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : displayedLogs.length === 0 ? (
              <div className="flex min-h-[300px] flex-col items-center justify-center px-5 text-center">
                <ClipboardList className="h-10 w-10 text-gray-300" />

                <h3 className="mt-4 font-semibold text-gray-900">
                  No audit events found
                </h3>

                <p className="mt-1 max-w-md text-sm text-gray-500">
                  Try changing your search or filters to
                  find matching activity.
                </p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1000px] text-left">
                    <thead className="border-b border-gray-200 bg-gray-50">
                      <tr>
                        <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                          Event
                        </th>

                        <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                          User
                        </th>

                        <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                          Entity
                        </th>

                        <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                          Description
                        </th>

                        <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                          Timestamp
                        </th>

                        <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                          Details
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-gray-100">
                      {displayedLogs.map(
                        (log) => {
                          const critical =
                            isCriticalAction(
                              log.action,
                            );

                          return (
                            <tr
                              key={log.id}
                              className={`transition hover:bg-gray-50 ${
                                critical
                                  ? "bg-red-50/30"
                                  : "bg-white"
                              }`}
                            >
                              <td className="px-5 py-4">
                                <div className="flex items-center gap-2">
                                  {critical && (
                                    <ShieldAlert className="h-4 w-4 text-red-500" />
                                  )}

                                  <span
                                    className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${getActionBadgeClasses(
                                      log.action,
                                    )}`}
                                  >
                                    {formatAction(
                                      log.action,
                                    )}
                                  </span>
                                </div>
                              </td>

                              <td className="px-5 py-4">
                                {log.user ? (
                                  <div>
                                    <p className="font-medium text-gray-900">
                                      {log.user
                                        .name ??
                                        "Unknown User"}
                                    </p>

                                    <p className="mt-0.5 text-xs text-gray-500">
                                      {formatRole(
                                        log.user
                                          .role,
                                      )}
                                    </p>

                                    <p className="mt-0.5 text-xs text-gray-400">
                                      {log.user.email}
                                    </p>
                                  </div>
                                ) : (
                                  <span className="text-sm text-gray-400">
                                    System / Unknown
                                  </span>
                                )}
                              </td>

                              <td className="px-5 py-4">
                                <p className="text-sm font-medium text-gray-900">
                                  {log.entity}
                                </p>

                                {log.entityId && (
                                  <p className="mt-1 max-w-[180px] truncate font-mono text-xs text-gray-400">
                                    {log.entityId}
                                  </p>
                                )}
                              </td>

                              <td className="max-w-[300px] px-5 py-4">
                                <p className="truncate text-sm text-gray-700">
                                  {log.description ??
                                    "No description"}
                                </p>
                              </td>

                              <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-500">
                                {formatDateTime(
                                  log.createdAt,
                                )}
                              </td>

                              <td className="px-5 py-4 text-right">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setSelectedLog(
                                      log,
                                    )
                                  }
                                  className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                                >
                                  <Eye className="h-4 w-4" />
                                  View
                                </button>
                              </td>
                            </tr>
                          );
                        },
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="flex flex-col gap-3 border-t border-gray-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-gray-500">
                    Page{" "}
                    <span className="font-medium text-gray-900">
                      {page}
                    </span>{" "}
                    of{" "}
                    <span className="font-medium text-gray-900">
                      {totalPages}
                    </span>
                  </p>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={page <= 1}
                      onClick={() =>
                        setPage(
                          (current) =>
                            Math.max(
                              1,
                              current - 1,
                            ),
                        )
                      }
                      className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </button>

                    <button
                      type="button"
                      disabled={
                        page >= totalPages
                      }
                      onClick={() =>
                        setPage(
                          (current) =>
                            Math.min(
                              totalPages,
                              current + 1,
                            ),
                        )
                      }
                      className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </section>
        </>
      )}

      {/* Audit Details Modal */}
      {selectedLog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setSelectedLog(null);
            }
          }}
        >
          <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-gray-200 p-5">
              <div>
                <div className="flex items-center gap-2">
                  {isCriticalAction(
                    selectedLog.action,
                  ) && (
                    <ShieldAlert className="h-5 w-5 text-red-500" />
                  )}

                  <h2 className="text-xl font-semibold text-gray-900">
                    Audit Event Details
                  </h2>
                </div>

                <p className="mt-1 font-mono text-xs text-gray-400">
                  {selectedLog.id}
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedLog(null)
                }
                className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="overflow-y-auto p-5">
              <div className="grid gap-4 md:grid-cols-2">
                {/* Event Information */}
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <h3 className="text-sm font-semibold text-gray-900">
                    Event Information
                  </h3>

                  <div className="mt-4 space-y-3">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                        Action
                      </p>

                      <span
                        className={`mt-1 inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${getActionBadgeClasses(
                          selectedLog.action,
                        )}`}
                      >
                        {formatAction(
                          selectedLog.action,
                        )}
                      </span>
                    </div>

                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                        Entity
                      </p>

                      <p className="mt-1 text-sm font-medium text-gray-900">
                        {selectedLog.entity}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                        Entity ID
                      </p>

                      <p className="mt-1 break-all font-mono text-xs text-gray-600">
                        {selectedLog.entityId ??
                          "N/A"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                        Timestamp
                      </p>

                      <p className="mt-1 text-sm text-gray-700">
                        {formatDateTime(
                          selectedLog.createdAt,
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                {/* User Information */}
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <h3 className="text-sm font-semibold text-gray-900">
                    User Information
                  </h3>

                  <div className="mt-4 space-y-3">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                        Name
                      </p>

                      <p className="mt-1 text-sm font-medium text-gray-900">
                        {selectedLog.user
                          ?.name ??
                          "System / Unknown"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                        Email
                      </p>

                      <p className="mt-1 text-sm text-gray-700">
                        {selectedLog.user
                          ?.email ?? "N/A"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                        Role
                      </p>

                      <p className="mt-1 text-sm text-gray-700">
                        {selectedLog.user
                          ? formatRole(
                              selectedLog
                                .user
                                .role,
                            )
                          : "N/A"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                        IP Address
                      </p>

                      <p className="mt-1 font-mono text-xs text-gray-600">
                        {selectedLog.ipAddress ??
                          "N/A"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="mt-4 rounded-xl border border-gray-200 bg-white p-4">
                <h3 className="text-sm font-semibold text-gray-900">
                  Description
                </h3>

                <p className="mt-2 text-sm leading-6 text-gray-700">
                  {selectedLog.description ??
                    "No description recorded."}
                </p>
              </div>

              {/* Before / After */}
              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <div className="overflow-hidden rounded-xl border border-gray-200">
                  <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
                    <h3 className="text-sm font-semibold text-gray-900">
                      Before Data
                    </h3>
                  </div>

                  <pre className="max-h-[320px] overflow-auto bg-gray-950 p-4 text-xs leading-5 text-gray-200">
                    {formatJson(
                      selectedLog.beforeData,
                    )}
                  </pre>
                </div>

                <div className="overflow-hidden rounded-xl border border-gray-200">
                  <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
                    <h3 className="text-sm font-semibold text-gray-900">
                      After Data
                    </h3>
                  </div>

                  <pre className="max-h-[320px] overflow-auto bg-gray-950 p-4 text-xs leading-5 text-gray-200">
                    {formatJson(
                      selectedLog.afterData,
                    )}
                  </pre>
                </div>
              </div>

              {/* User Agent */}
              <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
                <h3 className="text-sm font-semibold text-gray-900">
                  Request Information
                </h3>

                <p className="mt-2 break-all font-mono text-xs leading-5 text-gray-500">
                  {selectedLog.userAgent ??
                    "User agent not recorded."}
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end border-t border-gray-200 bg-gray-50 px-5 py-4">
              <button
                type="button"
                onClick={() =>
                  setSelectedLog(null)
                }
                className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
