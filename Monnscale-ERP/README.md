# Moonscale ERP

TypeScript / Mongo port of the Uccello CRM, designed as the foundation of a full ERP.

## Stack

- **Backend** : NestJS 11 + Prisma (MongoDB)
- **Frontend** : Vite + React 19 + Material UI + TanStack Query + React Router
- **Auth** : JWT access + refresh tokens
- **Architecture** : Clean Architecture (Domain / Application / Infrastructure)
- **Multi-tenant** : Team-scoped (fail-closed), RBAC enum-based
- **Monorepo** : pnpm workspaces + Turborepo

## Workspace layout

```
Moonscale-ERP/
├── apps/
│   ├── backend/     NestJS API
│   └── frontend/    React SPA
└── packages/
    └── shared/      Shared TS types, enums, DTOs (consumed by both)
```

## Modules ported from Uccello CRM

Auth · Teams (multi-tenant + invitations + RBAC) · Companies · Contacts · Deals + Pipelines + Stages (Kanban) · Tasks · Activities (polymorphic timeline) · CustomFields (dynamic per team+entity) · Picklists · Dashboard (KPIs + charts) · Assistant IA (Anthropic tool-calling) · Settings (profile, locale, security).

## Quick start

```bash
# 1. Install
pnpm install

# 2. Copy env
cp .env.example .env

# 3. Start a Mongo replica set (required for Prisma transactions)
docker run -d -p 27017:27017 --name mongo-rs mongo:7 --replSet rs0
docker exec mongo-rs mongosh --eval "rs.initiate()"

# 4. Generate Prisma client
pnpm db:generate

# 5. Push schema to Mongo
pnpm db:push

# 6. Seed (optional)
pnpm db:seed

# 7. Run both apps
pnpm dev
```

Backend → http://localhost:3000 · Frontend → http://localhost:5173
