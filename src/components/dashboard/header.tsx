"use client";

import { signOut, useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { LogOut, Menu, Settings, ChevronRight } from "lucide-react";
import { NotificationBell } from "@/components/notifications/notification-bell";
import Link from "next/link";

const BREADCRUMB_MAP: Record<string, string> = {
  "/dashboard": "Queue",
  "/dashboard/drafts": "Drafts",
  "/dashboard/calendar": "Calendar",
  "/dashboard/analytics": "Analytics",
  "/dashboard/activity": "Activity",
  "/dashboard/team": "Team",
  "/dashboard/settings": "Settings",
};

interface HeaderProps {
  workspaceName: string;
  onMobileMenuToggle: () => void;
}

export function Header({ workspaceName, onMobileMenuToggle }: HeaderProps) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const email = session?.user?.email ?? "";
  const name = session?.user?.name ?? email;
  const initials = (name || email).charAt(0).toUpperCase();

  const pageLabel = BREADCRUMB_MAP[pathname] ?? "Dashboard";

  return (
    <header className="flex h-14 items-center justify-between border-b border-border px-4 md:px-6">
      {/* Left: mobile menu + breadcrumbs */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden h-8 w-8"
          onClick={onMobileMenuToggle}
        >
          <Menu className="size-4" />
        </Button>
        <nav className="flex items-center gap-1.5 text-sm">
          <span className="text-muted-foreground hidden sm:inline">{workspaceName}</span>
          <ChevronRight className="size-3 text-muted-foreground hidden sm:inline" />
          <span className="font-medium">{pageLabel}</span>
        </nav>
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-1">
        <NotificationBell />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-full outline-none ml-1">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium">{name}</p>
              <p className="text-xs text-muted-foreground">{email}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/dashboard/settings">
                <Settings className="mr-2 size-4" />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/" })}>
              <LogOut className="mr-2 size-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
