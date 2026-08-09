import { UserRole } from "@/src/generated/prisma/client";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";

export function hasRole(
  userRole: UserRole,
  allowedRoles: UserRole[]
) {
  return allowedRoles.includes(userRole);
}

export async function getCurrentUser() {
  const cookieStore = await cookies();

  const token = cookieStore.get("auth_token")?.value;

  if (!token) {
    return null;
  }

  try {
    const payload = await verifyToken(token);

    return {
      userId: payload.userId as string,
      role: payload.role as UserRole,
    };
  } catch {
    return null;
  }
}