import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { BottomNav } from "@/components/layout/bottom-nav";
import { Header } from "@/components/layout/header";
import { UserRole } from "@/types/database";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // In development / demo mode or until session is established, default to OWNER
  const role: UserRole = "OWNER";
  const userName = "Owner / Administrator";

  return (
    <div className="min-h-screen bg-background">
      <Sidebar role={role} userName={userName} />

      <div className="lg:pl-64 flex flex-col flex-1">
        <Header role={role} userName={userName} />
        <main className="flex-1 p-4 lg:p-8 pb-24 lg:pb-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      <BottomNav role={role} />
    </div>
  );
}
