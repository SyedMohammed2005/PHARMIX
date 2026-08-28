"use client";

import { LogOut, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

type DashboardHeaderProps = {
  role: string;
};

export function DashboardHeader({
  role,
}: DashboardHeaderProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    try {
      setLoading(true);

      await fetch("/api/auth/logout", {
        method: "POST",
      });

      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <header className="flex h-16 items-center justify-between border-b bg-white px-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">
          Dashboard
        </h2>

        <p className="text-sm text-gray-500">
          Pharmacy management overview
        </p>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <User size={20} />

          <span className="text-sm font-medium">
            {role}
          </span>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
        >
          <LogOut size={18} />

          {loading ? "Logging out..." : "Logout"}
        </button>
      </div>
    </header>
  );
}