"use client";

import Link from "next/link";
import { FolderKanban, Gauge, Settings } from "lucide-react";
import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import {
  can,
  type PermissionAction,
  type PermissionResource,
  type StaffRole,
} from "@/lib/auth/permissions";
import { messages, type Locale } from "@/lib/i18n";

export type DashboardSection = "overview" | "projects" | "settings";

export type NavItem = {
  id: DashboardSection;
  title: string;
  description: string;
  icon: React.ReactNode;
  resource?: PermissionResource;
  action?: PermissionAction;
};

export function dashboardNav(locale: Locale): NavItem[] {
  const t = messages[locale];
  return [
    {
      id: "overview",
      title: t.overview,
      description: t.dashboard,
      icon: <Gauge className="size-4" />,
    },
    {
      id: "projects",
      title: t.projects,
      description: "Example resource module",
      icon: <FolderKanban className="size-4" />,
      resource: "projects",
      action: "list",
    },
    {
      id: "settings",
      title: t.settings,
      description: "Workspace preferences",
      icon: <Settings className="size-4" />,
    },
  ];
}

export function AppSidebar({
  activeSection,
  locale,
  roles,
  user,
  onSelectSection,
  onSignOut,
  onOpenSettings,
}: {
  activeSection: DashboardSection;
  locale: Locale;
  roles: StaffRole[];
  user: { name: string; email: string };
  onSelectSection: (section: DashboardSection) => void;
  onSignOut: () => void;
  onOpenSettings: (tab: "general" | "account") => void;
}) {
  const t = messages[locale];
  const items = dashboardNav(locale).filter((item) => {
    if (!item.resource || !item.action) return true;
    return can(roles, item.resource, item.action);
  });

  return (
    <aside className="hidden w-64 shrink-0 border-r bg-sidebar p-3 text-sidebar-foreground md:flex md:flex-col">
      <Link
        href="/dashboard"
        className="mb-5 flex items-center gap-2 px-1 py-2"
      >
        <span className="flex size-8 items-center justify-center bg-sidebar-primary text-sidebar-primary-foreground">
          T
        </span>
        <span className="grid">
          <span className="text-sm font-semibold">{t.appName}</span>
          <span className="text-[11px] text-muted-foreground">
            {t.appSubtitle}
          </span>
        </span>
      </Link>
      <div className="flex-1">
        <NavMain
          activeSection={activeSection}
          items={items}
          label={t.dashboard}
          onSelectSection={onSelectSection}
        />
      </div>
      <NavUser
        user={user}
        onSignOut={onSignOut}
        onOpenSettings={onOpenSettings}
      />
    </aside>
  );
}
