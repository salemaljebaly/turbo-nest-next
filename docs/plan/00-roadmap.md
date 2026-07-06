# Roadmap

This starter is intentionally small but production-oriented. Keep roadmap items
generic and product-neutral until an application forks the template.

## Foundation

- API envelope, typed errors, and OpenAPI contract checks.
- Better Auth, organization RBAC, and resource scoping.
- Drizzle migrations, Postgres, Redis, queues, worker schedules.
- Dashboard shell, copyable `projects` module, typed frontend API client.

## Next Product Work

1. Replace the `projects` example with the first real domain module.
2. Decide whether tenant records are scoped by `userId` or `organizationId`.
3. Add production providers for email, SMS, notifications, storage, and AI.
4. Configure CI/CD, backups, restore drills, and observability before launch.
