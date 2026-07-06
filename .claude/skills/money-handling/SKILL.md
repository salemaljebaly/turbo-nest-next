---
name: money-handling
description: Use when introducing prices, balances, payments, refunds, invoices, or financial reports.
---

# Money Handling

- Store money as integer minor units.
- Keep currency explicit.
- Do not use floating point arithmetic for persisted amounts.
- Financial side effects must be idempotent and auditable.
- Use maker-checker approval when one person should not create and approve the
  same financial action.
