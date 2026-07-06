---
name: deployment-env
description: Use when adding environment variables, deploy scripts, Docker Compose services, or production setup docs.
---

# Deployment Environment

- Every new env var goes in `.env.example` and API config validation when used
  by the API.
- Keep deploy scripts env-driven and avoid hard-coded project names.
- Document manual setup in `docs/single-server.md`, `docs/observability.md`, or
  the relevant runbook.
- Secrets belong in `.env`, GitHub Actions secrets, or the host secret store,
  never in committed files.
