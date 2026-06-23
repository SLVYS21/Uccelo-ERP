# syntax=docker/dockerfile:1.7

# ============================================================
# Stage 1 — install deps (cached layer, only re-runs on lock change)
# ============================================================
FROM node:22-slim AS deps
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /repo

# Copy only manifests for the install layer
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/backend/package.json ./apps/backend/

RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile --filter @Moonscale/shared... --filter @Moonscale/backend...

# ============================================================
# Stage 2 — build shared + backend
# ============================================================
FROM node:22-slim AS build
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /repo

COPY --from=deps /repo/node_modules ./node_modules
COPY --from=deps /repo/packages/shared/node_modules ./packages/shared/node_modules
COPY --from=deps /repo/apps/backend/node_modules ./apps/backend/node_modules

COPY tsconfig.base.json ./
COPY packages/shared ./packages/shared
COPY apps/backend ./apps/backend

# Generate Prisma client + build shared + build backend
RUN pnpm --filter @Moonscale/shared build
RUN pnpm --filter @Moonscale/backend exec prisma generate
RUN pnpm --filter @Moonscale/backend build

# ============================================================
# Stage 3 — runtime (minimal, prod deps only)
# ============================================================
FROM node:22-slim AS runtime
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates tini && rm -rf /var/lib/apt/lists/*
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

ENV NODE_ENV=production
ENV PORT=3000
WORKDIR /app

# Bring manifests for prod install
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/backend/package.json ./apps/backend/

RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
    pnpm install --prod --frozen-lockfile --filter @Moonscale/shared... --filter @Moonscale/backend...

# Compiled artifacts
COPY --from=build /repo/packages/shared/dist ./packages/shared/dist
COPY --from=build /repo/apps/backend/dist ./apps/backend/dist
COPY --from=build /repo/apps/backend/prisma ./apps/backend/prisma

# Re-run prisma generate in the runtime image so the engine binary matches the OS
WORKDIR /app/apps/backend
RUN pnpm exec prisma generate

EXPOSE 3000
ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["node", "dist/main.js"]
