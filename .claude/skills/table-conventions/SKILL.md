---
name: table-conventions
description: Use when building dashboard tables, record lists, audit logs, or admin data views.
---

# Table Conventions

- Use `apps/web/components/ui/admin-table.tsx` for growing data sets.
- `searchKey` and `searchPlaceholder` are required.
- Include pagination and avoid unbounded plain lists.
- Gate row actions with `can(roles, resource, action)`.
- Keep table rows dense, scan-friendly, and backed by typed API wrappers.
