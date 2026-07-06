import type { ErrorCode } from "@repo/types";

export const locales = ["en"] as const;
export type Locale = (typeof locales)[number];

export const messages = {
  en: {
    appName: "Template Admin",
    appSubtitle: "Production starter",
    dashboard: "Dashboard",
    overview: "Overview",
    projects: "Projects",
    settings: "Settings",
    account: "Account",
    appearance: "Appearance",
    light: "Light",
    dark: "Dark",
    system: "System",
    signOut: "Sign out",
    search: "Search",
    columns: "Columns",
    actions: "Actions",
    page: "Page",
    of: "of",
    rows: "rows",
    previousPage: "Previous page",
    nextPage: "Next page",
    firstPage: "First page",
    lastPage: "Last page",
    noData: "No data",
    loading: "Loading",
    retry: "Retry",
    createProject: "Create project",
    approve: "Approve",
    exportCsv: "Export CSV",
    projectName: "Project name",
    projectStatus: "Status",
    projectOwner: "Owner",
    projectSearch: "Search projects",
    projectsEmpty: "No projects found.",
    projectCreated: "Project created.",
    projectApproved: "Project approved.",
    requestFailed: "Request failed",
  },
} satisfies Record<Locale, Record<string, string>>;

export const errorMessages: Record<
  Locale,
  Partial<Record<ErrorCode, string>>
> = {
  en: {
    VALIDATION_FAILED: "Check the highlighted fields and try again.",
    NOT_FOUND: "The requested record could not be found.",
    FORBIDDEN: "You do not have permission to perform this action.",
    CONFLICT: "This change conflicts with the current record state.",
    RATE_LIMITED: "Too many requests. Try again shortly.",
    IDEMPOTENCY_CONFLICT:
      "This request key was already used with different data.",
    INVALID_CURSOR: "The pagination cursor is invalid.",
    INVALID_LIMIT: "The requested page size is invalid.",
    INTERNAL_SERVER_ERROR: "Something went wrong. Try again later.",
    PROJECT_NOT_FOUND: "The project could not be found.",
    PROJECT_ARCHIVED: "This project is archived.",
    SEPARATION_OF_DUTIES_VIOLATION:
      "A different person must approve this action.",
    STORAGE_NOT_CONFIGURED: "Storage is not configured for this environment.",
    STORAGE_VALIDATION_FAILED: "The file does not meet upload requirements.",
  },
};

export function dirForLocale(locale: Locale) {
  return locale === "en" ? "ltr" : "rtl";
}

export function translateError(
  code: string,
  fallback: string,
  locale: Locale = "en",
) {
  return errorMessages[locale][code as ErrorCode] ?? fallback;
}
