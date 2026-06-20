# Twenty CRM — Overview

> Источник: https://deepwiki.com/twentyhq/twenty + /1-overview

---

## Общее описание

Twenty — open-source CRM платформа, full-stack TypeScript monorepo. Yarn workspaces, управление через Nx.

### Core Applications

| Package | Назначение |
|---------|-----------|
| `twenty-front` | React SPA (фронтенд) |
| `twenty-server` | NestJS API (бэкенд) |
| `twenty-ui` | Component library |
| `twenty-shared` | Types/utilities |
| `twenty-sdk` | Client SDK |
| `twenty-emails` | Email templates |

---

## Technology Stack

### Frontend
- React 18.3.1
- Vite 7.0.0
- Jotai 2.17.1 (state management)
- Apollo Client 3.13.8 (GraphQL)
- Linaria CSS (zero-runtime)
- Vercel AI SDK

### Backend
- NestJS 11.1.15
- GraphQL Yoga 4.0.5
- PostgreSQL с TypeORM 0.3.20
- Redis (ioredis/BullMQ)
- ClickHouse (optional analytics)
- Multiple AI SDKs (OpenAI, Anthropic, Google, Groq, Mistral, XAI)
- Passport authentication

### Infrastructure
- PostgreSQL
- Redis
- ClickHouse
- AWS S3
- Nx 22.5.4
- Yarn 4.9.2
- Node 24.5.0

---

## Ключевые архитектурные принципы

- **Hybrid multi-tenant** — separate workspace databases sharing core metadata
- **Schema-first GraphQL** — backend schemas drive code generation
- **Metadata-driven data model** — runtime customization без перекомпиляции
- **Permission-aware ORM** — `WorkspaceEntityManager` с проверкой прав
- **Event-driven processing** — BullMQ для фоновых задач
- **Twenty Apps extensibility** — SDK для расширений
- **AI agent integration** — поддержка OpenAI, Anthropic, Google, Groq, Mistral, XAI
