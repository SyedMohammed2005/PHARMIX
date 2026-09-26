import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/authorization";
import { Sidebar } from "@/components/layout/sidebar";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import CopilotWidget from "@/components/copilot/copilot-widget";

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
    <div className="relative flex min-h-screen bg-gray-50">
      {/* Fixed icon sidebar */}
      <Sidebar role={currentUser.role} />

      {/* Main application area */}
      <div className="flex min-w-0 flex-1 flex-col pl-[56px]">
        <DashboardHeader role={currentUser.role} />

        <main className="flex-1 bg-gray-50 p-6">
          {children}
        </main>
      </div>

      {/* Global floating Copilot */}
      <CopilotWidget />
    </div>
  );
}

