import { NextRequest, NextResponse } from "next/server";
import {
  AuditAction,
  UserRole,
} from "@/src/generated/prisma/client";
import {
  getCurrentUser,
  hasRole,
} from "@/lib/authorization";
import {
  getAuditLogs,
  getAuditLogById,
  getAuditStats,
  getAuditActivityByUser,
} from "@/services/audit.service";

const AUDIT_VIEW_ROLES = [
  UserRole.ADMIN,
  UserRole.BUSINESS_ANALYST,
];

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        {
          success: false,
          message: "Not authenticated",
        },
        { status: 401 },
      );
    }

    const allowed = hasRole(
      currentUser.role,
      AUDIT_VIEW_ROLES,
    );

    if (!allowed) {
      return NextResponse.json(
        {
          success: false,
          message:
            "You are not authorized to view audit logs",
        },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(request.url);

    const id = searchParams.get("id");

    if (id) {
      const log = await getAuditLogById(id);

      if (!log) {
        return NextResponse.json(
          {
            success: false,
            message: "Audit log not found",
          },
          { status: 404 },
        );
      }

      return NextResponse.json({
        success: true,
        data: log,
      });
    }

    const statsRequested =
      searchParams.get("stats") === "true";

    if (statsRequested) {
      const stats = await getAuditStats();

      return NextResponse.json({
        success: true,
        data: stats,
      });
    }

    const activityByUserRequested =
  searchParams.get("byUser") === "true";

if (activityByUserRequested) {
  const activityByUser =
    await getAuditActivityByUser();

  return NextResponse.json({
    success: true,
    data: activityByUser,
  });
}

    const userId =
      searchParams.get("userId") || undefined;

    const entity =
      searchParams.get("entity") || undefined;

    const entityId =
      searchParams.get("entityId") || undefined;

    const search =
      searchParams.get("search") || undefined;

    // -----------------------------
    // Action filter
    // -----------------------------

    const actionParam =
      searchParams.get("action");

    let action: AuditAction | undefined;

    if (actionParam) {
      if (
        Object.values(AuditAction).includes(
          actionParam as AuditAction,
        )
      ) {
        action = actionParam as AuditAction;
      } else {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid audit action",
          },
          { status: 400 },
        );
      }
    }

    // -----------------------------
    // Role filter
    // -----------------------------

    const roleParam =
      searchParams.get("role");

    let role: UserRole | undefined;

    if (roleParam) {
      if (
        Object.values(UserRole).includes(
          roleParam as UserRole,
        )
      ) {
        role = roleParam as UserRole;
      } else {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid user role",
          },
          { status: 400 },
        );
      }
    }

    // -----------------------------
    // Date filters
    // -----------------------------

    const fromParam =
      searchParams.get("from");

    const toParam =
      searchParams.get("to");

    let from: Date | undefined;
    let to: Date | undefined;

    if (fromParam) {
      const parsedFrom = new Date(
        `${fromParam}T00:00:00`,
      );

      if (Number.isNaN(parsedFrom.getTime())) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Invalid from date. Use YYYY-MM-DD format",
          },
          { status: 400 },
        );
      }

      from = parsedFrom;
    }

    if (toParam) {
      const parsedTo = new Date(
        `${toParam}T23:59:59.999`,
      );

      if (Number.isNaN(parsedTo.getTime())) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Invalid to date. Use YYYY-MM-DD format",
          },
          { status: 400 },
        );
      }

      to = parsedTo;
    }

    if (from && to && from > to) {
      return NextResponse.json(
        {
          success: false,
          message:
            "The from date cannot be later than the to date",
        },
        { status: 400 },
      );
    }

    // -----------------------------
    // Pagination
    // -----------------------------

    const pageParam = Number(
      searchParams.get("page") || "1",
    );

    const limitParam = Number(
      searchParams.get("limit") || "20",
    );

    const page =
      Number.isInteger(pageParam) &&
      pageParam > 0
        ? pageParam
        : 1;

    const limit =
      Number.isInteger(limitParam) &&
      limitParam > 0 &&
      limitParam <= 100
        ? limitParam
        : 20;

    // -----------------------------
    // Fetch audit logs
    // -----------------------------

    const result = await getAuditLogs({
      userId,
      role,
      action,
      entity,
      entityId,
      search,
      from,
      to,
      page,
      limit,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error(
      "GET /api/audit-logs error:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch audit logs",
      },
      { status: 500 },
    );
  }
}