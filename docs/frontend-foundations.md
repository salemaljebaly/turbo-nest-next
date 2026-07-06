# Frontend Foundations

The web app ships with a copyable dashboard foundation in `apps/web`.

## Dashboard Shell

The shell is made of:

- `components/app-sidebar.tsx` for config-driven navigation.
- `components/nav-main.tsx` for RBAC-filtered nav items.
- `components/nav-user.tsx` for the authenticated user block.
- `components/navbar.tsx` for the dashboard top bar and public marketing nav.
- `components/settings-dialog.tsx` for theme and account settings.

Navigation items can declare `resource` and `action`. The shell calls
`can(roles, resource, action)` from `apps/web/lib/auth/permissions.ts`, which
mirrors the backend permission vocabulary from `packages/types`.

## AdminTable

Use `components/ui/admin-table.tsx` for operational lists. `searchKey` and
`searchPlaceholder` are required so every table has a predictable search
experience. Keep row actions permission-gated in the feature page.

## EntitySelect

Use `components/ui/autocomplete-select.tsx` plus
`hooks/use-entity-options.ts` for related-record selection. Do not use plain text
inputs for foreign keys in admin workflows.

## API Client

`lib/api.ts` wraps the generated OpenAPI types, sends Better Auth cookies, and
unwraps the standard API envelope. It throws `ApiError` with `status`, `code`,
`message`, and `details`.

Feature pages should add thin wrappers in `lib/dashboard-api.ts` rather than
calling raw paths everywhere. `rows()`, `text()`, and `isRecord()` are the
runtime guards for envelope and table data.

## Error Messages And I18n

`lib/i18n.ts` ships English strings and `errors.<CODE>`-style mappings through
`translateError()`. It also exposes `dirForLocale()` so RTL locales can be added
without changing layout plumbing.

## Example Module UI

`app/dashboard/page.tsx` includes the `projects` reference UI. It demonstrates:

- Dashboard shell composition.
- `AdminTable` search, sorting, and pagination.
- `AutocompleteSelect` for related entity selection.
- Typed API wrappers.
- RBAC-gated create, approve, and CSV export actions.
- API envelope error handling via `apiErrorToast()`.
