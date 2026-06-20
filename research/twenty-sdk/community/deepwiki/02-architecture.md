# Twenty CRM — Architecture

> Источник: https://deepwiki.com/twentyhq/twenty/2-architecture

---

## Three-Tier Architecture

```
┌─────────────────┐
│  Frontend App   │  React SPA (twenty-front)
│  (Browser)      │
└────────┬────────┘
         │ GraphQL / REST
┌────────▼────────┐
│  Backend API    │  NestJS (twenty-server, port 3000)
│  Server         │
└────────┬────────┘
         │ BullMQ
┌────────▼────────┐
│  Background     │  Worker Process (queue-worker.ts)
│  Worker         │
└─────────────────┘
```

---

## Multi-Tenant Model

- Каждый workspace = независимый CRM-инстанс
- Изолированные данные через PostgreSQL schemas: `workspace_{id}`
- Metadata динамически генерирует schema и business logic

---

## Security Layers

1. **Workspace-level membership** — принадлежность к workspace
2. **RBAC** — Role-Based Access Control
3. **Object-level permissions** — на уровне объектов
4. **Field-level permissions** — на уровне полей
5. **Row-level permissions (RLS)** — на уровне записей

---

## Monorepo Structure

- Yarn 4 + Nx 22
- 14+ packages
- Strict hierarchy preventing circular dependencies

### Key Packages

| Package | Role |
|---------|------|
| `twenty-front` | Frontend SPA |
| `twenty-server` | Backend API + Worker |
| `twenty-ui` | UI component library |
| `twenty-shared` | Shared types/utils |
| `twenty-sdk` | Client SDK |
| `twenty-emails` | Email templates |

---

## Twenty Apps Ecosystem

- `create-twenty-app` — scaffolding
- `twenty-sdk` — `define*()` helpers
- `twenty` CLI — управление
- Entity detection via AST scanning: `export default define<Entity>({...})`
- Auth stored in `~/.twenty/config.json`
- Development: `yarn twenty app:dev` с continuous sync
