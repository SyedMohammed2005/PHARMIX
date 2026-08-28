import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/authorization";
import { Sidebar } from "@/components/layout/sidebar";
import { DashboardHeader } from "@/components/layout/dashboard-header";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar role={currentUser.role} />

      <div className="flex min-w-0 flex-1 flex-col">
        <DashboardHeader role={currentUser.role} />

        <main className="flex-1 bg-gray-50 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}