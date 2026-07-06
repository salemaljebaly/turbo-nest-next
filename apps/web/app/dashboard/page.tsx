"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { ExternalLink, HeartPulse, Layers, Plus } from "lucide-react";
import { AppSidebar, type DashboardSection } from "@/components/app-sidebar";
import { Navbar } from "@/components/navbar";
import { SettingsDialog } from "@/components/settings-dialog";
import { AdminTable, type ColumnDef } from "@/components/ui/admin-table";
import { AutocompleteSelect } from "@/components/ui/autocomplete-select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/state";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useEntityOptions } from "@/hooks/use-entity-options";
import { can, parseRoles, type StaffRole } from "@/lib/auth/permissions";
import { signOut, useSession } from "@/lib/auth/client";
import { dashboardApi, rows, text, type AnyRecord } from "@/lib/dashboard-api";
import { messages, type Locale } from "@/lib/i18n";
import { apiErrorToast } from "@/lib/toast";

const API_URL =
  process.env["NEXT_PUBLIC_API_URL"] ?? "http://localhost:3001/api";
const locale: Locale = "en";

const QUICK_LINKS = [
  {
    icon: ExternalLink,
    title: "API documentation",
    description: "Browse the generated OpenAPI contract.",
    href: `${API_URL}/docs`,
  },
  {
    icon: HeartPulse,
    title: "Health",
    description: "Check database, Redis, worker, and storage indicators.",
    href: `${API_URL}/health`,
  },
  {
    icon: Layers,
    title: "Metrics",
    description: "Prometheus endpoint protected by METRICS_TOKEN.",
    href: `${API_URL}/metrics`,
  },
];

export default function DashboardPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [activeSection, setActiveSection] =
    React.useState<DashboardSection>("overview");
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const [settingsTab, setSettingsTab] = React.useState<"general" | "account">(
    "general",
  );

  async function handleSignOut() {
    await signOut({
      fetchOptions: {
        onSuccess: () => router.push("/"),
      },
    });
  }

  if (isPending) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <LoadingState title="Loading dashboard" />
      </main>
    );
  }

  if (!session) return null;

  const user = {
    name: session.user.name ?? "Template user",
    email: session.user.email ?? "user@example.com",
  };
  const roles = parseRoles(
    (session.user as { role?: unknown; roles?: unknown }).roles ??
      (session.user as { role?: unknown }).role,
  );
  const effectiveRoles = roles.length > 0 ? roles : (["owner"] as StaffRole[]);
  const t = messages[locale];

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar
        activeSection={activeSection}
        locale={locale}
        roles={effectiveRoles}
        user={user}
        onSelectSection={setActiveSection}
        onSignOut={handleSignOut}
        onOpenSettings={(tab) => {
          setSettingsTab(tab);
          setSettingsOpen(true);
        }}
      />
      <div className="min-w-0 flex-1">
        <Navbar
          title={
            activeSection === "projects"
              ? t.projects
              : activeSection === "settings"
                ? t.settings
                : t.dashboard
          }
          onOpenSettings={() => {
            setSettingsTab("general");
            setSettingsOpen(true);
          }}
        />
        <main className="mx-auto max-w-6xl px-4 py-6">
          {activeSection === "overview" ? (
            <OverviewPanel userName={user.name} />
          ) : null}
          {activeSection === "projects" ? (
            <ProjectsPanel roles={effectiveRoles} />
          ) : null}
          {activeSection === "settings" ? (
            <EmptyState
              title="Workspace settings"
              description="Use the settings button to open the shared settings dialog."
              action={
                <Button onClick={() => setSettingsOpen(true)}>
                  Open settings
                </Button>
              }
            />
          ) : null}
        </main>
      </div>
      <SettingsDialog
        locale={locale}
        open={settingsOpen}
        defaultTab={settingsTab}
        user={user}
        onOpenChange={setSettingsOpen}
      />
    </div>
  );
}

function OverviewPanel({ userName }: { userName: string }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">
          Welcome back, {userName.split(" ")[0] ?? "there"}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          This dashboard shell is ready for feature modules, RBAC-gated nav, API
          errors, and generated clients.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {QUICK_LINKS.map((item) => {
          const Icon = item.icon;
          return (
            <a
              key={item.href}
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <Card className="h-full transition-colors hover:bg-muted/30">
                <CardHeader>
                  <div className="flex size-8 items-center justify-center border bg-muted">
                    <Icon className="size-4" />
                  </div>
                  <CardTitle>{item.title}</CardTitle>
                  <CardDescription>{item.description}</CardDescription>
                </CardHeader>
              </Card>
            </a>
          );
        })}
      </div>
    </div>
  );
}

function ProjectsPanel({ roles }: { roles: StaffRole[] }) {
  const t = messages[locale];
  const queryClient = useQueryClient();
  const [search, setSearch] = React.useState("");
  const [projectName, setProjectName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const debouncedSearch = useDebouncedValue(search, 250);
  const canCreate = can(roles, "projects", "create");
  const canApprove = can(roles, "projects", "approve");
  const canExport = can(roles, "projects", "export");

  const projectsQuery = useQuery({
    queryKey: ["projects", debouncedSearch],
    queryFn: () =>
      dashboardApi.projects({
        search: debouncedSearch,
        sort: "createdAt:desc",
        limit: 50,
      }),
  });

  const projectRows = rows(projectsQuery.data).flatMap((record) => {
    const nested = rows(record["rows"]);
    return nested.length > 0 ? nested : [record];
  });

  const ownerOptionsQuery = useEntityOptions({
    queryKey: [
      "project-owner-options",
      projectRows.map((row) => row["ownerId"]).join(","),
    ],
    queryFn: async () =>
      projectRows.map((row) => ({
        value: text(row["ownerId"], "current-user"),
        label: text(row["ownerId"], "Current user"),
      })),
  });

  const createProject = useMutation({
    mutationFn: () =>
      dashboardApi.createProject({
        name: projectName.trim(),
        description: description.trim() || undefined,
      }),
    onSuccess: () => {
      setProjectName("");
      setDescription("");
      window.alert(t.projectCreated);
      void queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
    onError: (error) => {
      const toast = apiErrorToast(error, locale);
      window.alert(
        `${toast.title}${toast.description ? ` (${toast.description})` : ""}`,
      );
    },
  });

  const approveProject = useMutation({
    mutationFn: (id: string) => dashboardApi.approveProject(id),
    onSuccess: () => {
      window.alert(t.projectApproved);
      void queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
    onError: (error) => {
      const toast = apiErrorToast(error, locale);
      window.alert(
        `${toast.title}${toast.description ? ` (${toast.description})` : ""}`,
      );
    },
  });

  const columns: ColumnDef<AnyRecord>[] = [
    {
      accessorKey: "name",
      header: t.projectName,
      cell: (row) => <span className="font-medium">{text(row["name"])}</span>,
    },
    {
      accessorKey: "status",
      header: t.projectStatus,
      cell: (row) => (
        <Badge variant={row["status"] === "approved" ? "default" : "secondary"}>
          {text(row["status"])}
        </Badge>
      ),
    },
    {
      accessorKey: "ownerId",
      header: t.projectOwner,
      cell: (row) => (
        <span className="font-mono text-[11px]">{text(row["ownerId"])}</span>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Created",
      cell: (row) => formatDate(row["createdAt"]),
    },
    {
      id: "actions",
      header: t.actions,
      enableSorting: false,
      cell: (row) =>
        canApprove && row["status"] !== "approved" ? (
          <Button
            variant="outline"
            size="sm"
            disabled={approveProject.isPending}
            onClick={(event) => {
              event.stopPropagation();
              approveProject.mutate(text(row["id"]));
            }}
          >
            {t.approve}
          </Button>
        ) : null,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">{t.projects}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Copy this module when starting a tenant-aware feature.
          </p>
        </div>
        {canExport ? (
          <Button
            variant="outline"
            onClick={() => void dashboardApi.exportProjects()}
          >
            {t.exportCsv}
          </Button>
        ) : null}
      </div>

      {canCreate ? (
        <Card>
          <CardHeader>
            <CardTitle>{t.createProject}</CardTitle>
            <CardDescription>
              Demonstrates idempotent create, envelope errors, and typed API
              calls.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-[1fr_1fr_13rem_auto]">
            <input
              value={projectName}
              onChange={(event) => setProjectName(event.target.value)}
              placeholder={t.projectName}
              className="h-8 border bg-background px-2 text-xs outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
            <input
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Description"
              className="h-8 border bg-background px-2 text-xs outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
            <AutocompleteSelect
              value={ownerOptionsQuery.data?.[0]?.value ?? ""}
              onValueChange={() => {}}
              options={ownerOptionsQuery.data ?? []}
              placeholder="Owner"
              loading={ownerOptionsQuery.isLoading}
            />
            <Button
              disabled={!projectName.trim() || createProject.isPending}
              onClick={() => createProject.mutate()}
            >
              <Plus className="size-3.5" />
              Create
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Project records</CardTitle>
          <CardDescription>
            Search, sort, pagination, RBAC-gated actions, and CSV export.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t.projectSearch}
            className="mb-3 h-8 w-full max-w-xs border bg-background px-2 text-xs outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
          {projectsQuery.isLoading ? <LoadingState /> : null}
          {projectsQuery.isError ? (
            <ErrorState
              title={apiErrorToast(projectsQuery.error, locale).title}
              description={
                apiErrorToast(projectsQuery.error, locale).description
              }
              onRetry={() => void projectsQuery.refetch()}
            />
          ) : null}
          {projectsQuery.isSuccess ? (
            <AdminTable
              columns={columns}
              data={projectRows}
              pageSize={8}
              searchKey="name"
              searchPlaceholder={t.projectSearch}
              labels={{
                noResults: t.projectsEmpty,
                page: t.page,
                of: t.of,
                rows: t.rows,
                previous: t.previousPage,
                next: t.nextPage,
                search: t.search,
              }}
            />
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

function formatDate(value: unknown) {
  const date = typeof value === "string" ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
