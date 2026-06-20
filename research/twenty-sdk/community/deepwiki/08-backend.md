# Twenty CRM — Backend Architecture

> Источник: https://deepwiki.com/twentyhq/twenty/6-backend

---

## Stack

| Technology | Version |
|-----------|---------|
| NestJS | 11 |
| GraphQL Yoga | 4.0.5 |
| TypeORM | 0.3.20 (patched) |
| BullMQ | 5.40.0 |
| @ptc-org/nestjs-query-graphql | Auto-generates CRUD resolvers |

---

## Three-Process Runtime

| Process | Entry Point | Port | Назначение |
|---------|------------|------|-----------|
| API Server | `main.ts` | 3000 | HTTP API |
| Worker | `queue-worker.ts` | — | Background jobs |
| CLI | `command.ts` | — | Admin commands |

> **Worker:** запускается с `DISABLE_DB_MIGRATIONS=true`

---

## Flat Entity Maps

- Fetches ALL workspace metadata in single query
- Transforms to O(1) lookup maps
- Cached in Redis
- Per-workspace isolation

---

## Auto-Generated CRUD

`@ptc-org/nestjs-query-graphql` generates:
- findMany / findOne queries
- create / update / delete mutations
- Filter / sort / pagination input types

All operations go through `WorkspaceRepository` → permission enforcement.
