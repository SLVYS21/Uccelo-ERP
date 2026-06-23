# syntax=docker/dockerfile:1.7

# ============================================================
# Stage 1 — install workspace deps
# ============================================================
FROM node:22-slim AS deps
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /repo

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/frontend/package.json ./apps/frontend/

RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile --filter @Moonscale/shared... --filter @Moonscale/frontend...

# ============================================================
# Stage 2 — build Vite SPA
# ============================================================
FROM node:22-slim AS build
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /repo

COPY --from=deps /repo/node_modules ./node_modules
COPY --from=deps /repo/packages/shared/node_modules ./packages/shared/node_modules
COPY --from=deps /repo/apps/frontend/node_modules ./apps/frontend/node_modules

COPY tsconfig.base.json ./
COPY packages/shared ./packages/shared
COPY apps/frontend ./apps/frontend

# Build-time injection of the API URL (same-origin → empty)
ARG VITE_API_URL=""
ENV VITE_API_URL=$VITE_API_URL

RUN pnpm --filter @Moonscale/shared build
RUN pnpm --filter @Moonscale/frontend build

# ============================================================
# Stage 3 — nginx serving static SPA with /api proxy to backend
# ============================================================
FROM nginx:1.27-alpine AS runtime
COPY apps/frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /repo/apps/frontend/dist /usr/share/nginx/html
EXPOSE 80
