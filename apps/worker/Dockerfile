# syntax=docker/dockerfile:1

ARG NODE_VERSION=22
FROM node:${NODE_VERSION}-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@10.33.0 --activate
WORKDIR /app

FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json .npmrc ./
COPY apps/worker/package.json apps/worker/package.json
COPY packages/jobs/package.json packages/jobs/package.json
COPY packages/typescript-config/package.json packages/typescript-config/package.json
COPY packages/eslint-config/package.json packages/eslint-config/package.json
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile --filter=@repo/worker...

FROM deps AS build
COPY apps/worker apps/worker
COPY packages/jobs packages/jobs
COPY packages/typescript-config packages/typescript-config
RUN pnpm --filter=@repo/worker build && \
    pnpm deploy --legacy --filter=@repo/worker --prod /prod/worker

FROM node:${NODE_VERSION}-alpine AS runner
ENV NODE_ENV=production
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 worker

COPY --from=build --chown=worker:nodejs /prod/worker ./

USER worker

CMD ["node", "dist/main.js"]
