---
name: sql-query-safety
description: Use when adding filters, search, pagination, sorting, raw SQL, or Drizzle queries.
---

# SQL Query Safety

- Whitelist sortable columns.
- Clamp page sizes with the shared query-safety helpers.
- Validate cursors before using them in predicates.
- Escape LIKE patterns before building search conditions.
- Prefer Drizzle builders; use raw SQL only for narrow expressions that cannot
  be represented safely otherwise.
