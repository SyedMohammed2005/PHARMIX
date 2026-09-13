
import { NextRequest, NextResponse } from "next/server";
import { AuditAction, UserRole } from "@/src/generated/prisma/client";
import { getCurrentUser, hasRole } from "@/lib/authorization";
import {
  getAuditLogs,
  getAuditLogById,
  getAuditStats,
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

    const userId =
      searchParams.get("userId") || undefined;

    const entity =
      searchParams.get("entity") || undefined;

    const entityId =
      searchParams.get("entityId") || undefined;

    const search =
      searchParams.get("search") || undefined;

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

    const pageParam = Number(
      searchParams.get("page") || "1",
    );

    const limitParam = Number(
      searchParams.get("limit") || "20",
    );

    const page =
      Number.isInteger(pageParam) && pageParam > 0
        ? pageParam
        : 1;

    const limit =
      Number.isInteger(limitParam) &&
      limitParam > 0 &&
      limitParam <= 100
        ? limitParam
        : 20;

    const result = await getAuditLogs({
      userId,
      action,
      entity,
      entityId,
      search,
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
