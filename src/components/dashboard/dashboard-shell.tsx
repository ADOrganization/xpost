"use client";

import { Sidebar, MobileSidebarContent } from "@/components/dashboard/sidebar";
import { Header } from "@/components/dashboard/header";
import { useSidebar } from "@/hooks/use-sidebar";
import { Sheet, SheetContent } from "@/components/ui/sheet";

interface DashboardShellProps {
  workspaceName: string;
  children: React.ReactNode;
}

export function DashboardShell({ workspaceName, children }: DashboardShellProps) {
  const { collapsed, toggle, mobileOpen, openMobile, closeMobile } = useSidebar();

  return (
    <div className="flex h-screen">
      {/* Desktop sidebar */}
      <Sidebar collapsed={collapsed} onToggle={toggle} />

      {/* Mobile sidebar drawer */}
      <Sheet open={mobileOpen} onOpenChange={(open) => (open ? openMobile() : closeMobile())}>
        <SheetContent side="left" className="w-60 p-0">
          <MobileSidebarContent onClose={closeMobile} />
        </SheetContent>
      </Sheet>

      {/* Main area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header workspaceName={workspaceName} onMobileMenuToggle={openMobile} />
        <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
