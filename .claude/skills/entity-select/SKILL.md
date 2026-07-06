---
name: entity-select
description: Use when a form selects a related record, owner, organization, project, file, or other foreign key.
---

# Entity Select

- Use `AutocompleteSelect` plus `useEntityOptions` for foreign-key fields.
- Never use free text inputs for identifiers that refer to another record.
- Options should be loaded from a typed API wrapper and cached with TanStack
  Query.
- Store the identifier as the form value and show a human-readable label.
