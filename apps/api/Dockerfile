# syntax=docker/dockerfile:1

# --- Base ---
ARG NODE_VERSION=22
FROM node:${NODE_VERSION}-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@10.33.0 --activate
WORKDIR /app

# --- Dependencies ---
FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json .npmrc ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY apps/worker/package.json apps/worker/package.json
COPY packages/db/package.json packages/db/package.json
COPY packages/jobs/package.json packages/jobs/package.json
COPY packages/observability/package.json packages/observability/package.json
COPY packages/types/package.json packages/types/package.json
COPY packages/ui/package.json packages/ui/package.json
COPY packages/typescript-config/package.json packages/typescript-config/package.json
COPY packages/eslint-config/package.json packages/eslint-config/package.json
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

# --- Build ---
FROM deps AS build
COPY . .
RUN pnpm --filter=@repo/db build && \
    pnpm --filter=@repo/api build
# Prune dev dependencies after build
RUN CI=true pnpm prune --prod --ignore-scripts

# --- Production ---
FROM base AS runner
ENV NODE_ENV=production
LABEL org.opencontainers.image.source="https://github.com/salemaljebaly/turbo-nest-next"
LABEL org.opencontainers.image.description="turbo-nest-next API"

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nestjs

COPY --from=build --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=build --chown=nestjs:nodejs /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=build --chown=nestjs:nodejs /app/packages/db/node_modules ./packages/db/node_modules
COPY --from=build --chown=nestjs:nodejs /app/packages/observability/node_modules ./packages/observability/node_modules
COPY --from=build --chown=nestjs:nodejs /app/packages/types/node_modules ./packages/types/node_modules
COPY --from=build --chown=nestjs:nodejs /app/apps/api/dist ./apps/api/dist
COPY --from=build --chown=nestjs:nodejs /app/packages/db/dist ./packages/db/dist
COPY --from=build --chown=nestjs:nodejs /app/packages/observability/dist ./packages/observability/dist
COPY --from=build --chown=nestjs:nodejs /app/packages/types/src ./packages/types/src
COPY --from=build --chown=nestjs:nodejs /app/apps/api/package.json ./apps/api/package.json
COPY --from=build --chown=nestjs:nodejs /app/packages/db/package.json ./packages/db/package.json
COPY --from=build --chown=nestjs:nodejs /app/packages/observability/package.json ./packages/observability/package.json
COPY --from=build --chown=nestjs:nodejs /app/packages/types/package.json ./packages/types/package.json
COPY --from=build --chown=nestjs:nodejs /app/package.json /app/pnpm-workspace.yaml ./

USER nestjs
EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/api/health || exit 1

CMD ["node", "apps/api/dist/main"]
