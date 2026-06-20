# Twenty CRM — Deployment & Configuration

> Источник: https://deepwiki.com/twentyhq/twenty/8-deployment + /9-configuration + /9.1 + /9.2

---

## Docker Deployment

- Environment variables via `docker-compose.yml` with `${VAR:-default}`
- `entrypoint.sh` for server/worker mode switching

## Kubernetes Deployment

- Deployment specs
- Secrets for sensitive values
- ConfigMaps for non-sensitive

---

## Configuration System

### ConfigVariables Class

Decorators:
- `@group` — category
- `@description` — description
- `@type` — STRING, BOOLEAN, NUMBER, ENUM, ARRAY
- `@isSensitive` — hide in UI
- `@isEnvOnly` — env-only, not in DB

### Priority

```
database → env vars → defaults
```

(when `IS_CONFIG_VARIABLES_IN_DB_ENABLED=true`)

---

## Required Environment Variables

| Variable | Назначение |
|----------|-----------|
| `PG_DATABASE_URL` | PostgreSQL connection |
| `REDIS_URL` | Redis connection |
| `APP_SECRET` | JWT signing secret |
| `FRONTEND_URL` | Frontend URL |

### Categories

| Category | Examples |
|----------|---------|
| Auth & Security | `APP_SECRET`, OAuth credentials |
| Storage | Local / S3 (`STORAGE_TYPE`, `STORAGE_S3_*`) |
| External Integrations | Gmail, Google Calendar, Microsoft, IMAP/SMTP/CalDAV |
| Observability | Sentry, logger, analytics |

---

## Five-Stage Config Pipeline

```
.env load → TwentyConfigService → ClientConfigService
  → ClientConfigController → Frontend Recoil atoms
```

### Test Environment

`.env.test` — separate test database with disabled external integrations.

---

## Feature Flags

### Storage

`featureFlag` table with workspace isolation.

### Types

| Type | Visibility |
|------|-----------|
| Public | Exposed in Lab settings UI, available via /client-config |
| Internal | Backend only |

### Backend Access

`WorkspaceInternalContext.featureFlagsMap`

### Frontend Access

Recoil atoms:
- `canManageFeatureFlagsState`
- `labPublicFeatureFlagsState`

`ClientConfigProviderEffect` loads on mount.

### Categories

| Category | Flags |
|----------|-------|
| Integrations | Airtable, PostgreSQL, Stripe |
| Data Modeling | Unique indexes, JSON filtering |
| AI Features | AI enabled, agents |
| UI Capabilities | Layouts, dashboards, command menu |
| Domains | Custom domains |
| Workflows | Workflow features |
| Migrations | Data migrations |
| Infrastructure | Performance, caching |

### Default Flags

```
IS_AIRTABLE_INTEGRATION_ENABLED
IS_AI_ENABLED
IS_DASHBOARD_V2_ENABLED
```

---

## ClientConfigService

Aggregates for `/client-config` endpoint:
- Auth providers
- Billing
- AI models
- Integrations
- Public feature flags
- UI settings

Exposed at `GET /client-config` (no auth). Only non-sensitive data.
