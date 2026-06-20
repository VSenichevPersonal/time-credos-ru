# Twenty CRM — Каталог документации для разработчика

> Полная база знаний по Twenty CRM для проекта CredosCRM.
> Используй этот файл как точку входа для поиска информации.

---

## Как пользоваться

**Ищешь «как кастомизировать Twenty»?** → `developers/extend/`
**Ищешь «как деплоить»?** → `developers/self-host/`
**Ищешь «как устроена архитектура»?** → `community/deepwiki/`
**Ищешь «UI компоненты»?** → `twenty-docs-main/twenty-ui/`
**Ищешь «workflows, views, data model»?** → `twenty-docs-main/user-guide/`
**Ищешь «MCP сервер»?** → `community/mcp-server-realboost.md` + `twenty-docs-main/mcp-server/`
**Ищешь «AI agents, skills, activation»?** → `twenty-docs-main/TWENTY_AI_*.md`
**Ищешь «workflow шаблоны»?** → `twenty-docs-main/WORKFLOW_TEMPLATES.md`
**Ищешь «AI-автоматизации (serverless)»?** → `twenty-docs-main/ai-automations/`
**Ищешь «K8s / GCloud деплой»?** → `twenty-docs-main/k8s/` + `GCLOUD_MIGRATION_PLAN.md`
**Ищешь «style guide / coding rules»?** → `twenty-docs-main/AGENT_docs/style_guide.md`

---

## 1. Официальная документация (docs.twenty.com)

### Self-Host (6 файлов)

| Файл | Содержание |
|------|-----------|
| [developers/self-host/self-host.md](developers/self-host/self-host.md) | Overview: зачем self-host |
| [developers/self-host/setup.md](developers/self-host/setup.md) | Env vars, Gmail/Microsoft 365, cron jobs, SMTP |
| [developers/self-host/docker-compose.md](developers/self-host/docker-compose.md) | Docker установка, конфигурация, backup/restore |
| [developers/self-host/cloud-providers.md](developers/self-host/cloud-providers.md) | Railway, Coolify, K8s, EasyPanel, Sealos |
| [developers/self-host/troubleshooting.md](developers/self-host/troubleshooting.md) | Решение проблем: DB, email, Docker, reverse proxy |
| [developers/self-host/upgrade-guide.md](developers/self-host/upgrade-guide.md) | Апгрейд v0.21 → v1.0, все версии |

### Extend — API, Webhooks, Apps SDK (5 файлов)

| Файл | Содержание |
|------|-----------|
| [developers/extend/api.md](developers/extend/api.md) | REST/GraphQL API, auth, rate limits |
| [developers/extend/webhooks.md](developers/extend/webhooks.md) | Webhook events, payload, HMAC validation |
| [developers/extend/apps/getting-started.md](developers/extend/apps/getting-started.md) | Apps SDK: scaffolding, CLI, project structure |
| [developers/extend/apps/building.md](developers/extend/apps/building.md) | Objects, functions, roles, AI tools, front components |
| [developers/extend/apps/publishing.md](developers/extend/apps/publishing.md) | npm/internal publishing, CI/CD |

---

## 2. DeepWiki — глубокий анализ архитектуры (10 файлов)

> Источник: deepwiki.com/twentyhq/twenty — AI-сгенерированный анализ кодовой базы

| Файл | Содержание |
|------|-----------|
| [community/deepwiki/01-overview.md](community/deepwiki/01-overview.md) | Stack, ключевые принципы |
| [community/deepwiki/02-architecture.md](community/deepwiki/02-architecture.md) | Three-tier, multi-tenant, security layers |
| [community/deepwiki/03-database-orm.md](community/deepwiki/03-database-orm.md) | PostgreSQL schemas, custom ORM, query builders, composite fields |
| [community/deepwiki/04-permission-system.md](community/deepwiki/04-permission-system.md) | RBAC, field-level, row-level security (RLS) |
| [community/deepwiki/05-metadata-system.md](community/deepwiki/05-metadata-system.md) | Object/field metadata, GraphQL mutations (полный список!), caching |
| [community/deepwiki/06-graphql-api.md](community/deepwiki/06-graphql-api.md) | Dual schema, guards, REST endpoints, rate limiting |
| [community/deepwiki/07-frontend.md](community/deepwiki/07-frontend.md) | Jotai state, twenty-ui, i18n Lingui (28 locales) |
| [community/deepwiki/08-backend.md](community/deepwiki/08-backend.md) | NestJS, three-process runtime, flat entity maps |
| [community/deepwiki/09-deployment-config.md](community/deepwiki/09-deployment-config.md) | Docker/K8s, env vars, feature flags, config pipeline |
| [community/deepwiki/10-apps-extensibility.md](community/deepwiki/10-apps-extensibility.md) | Apps SDK, logic functions, triggers, AI agents/skills |

---

## 3. GitHub twenty-docs (jacob-split/twenty-docs) — 170+ файлов

> Полная копия официальной документации + AGENT_docs + AI планы

### Корневые файлы (ключевые!)

| Файл | Содержание |
|------|-----------|
| [twenty-docs-main/AGENT.md](twenty-docs-main/AGENT.md) | Инструкции для AI-агента по Twenty |
| [twenty-docs-main/twenty-crm-expert-subagent.md](twenty-docs-main/twenty-crm-expert-subagent.md) | Экспертный sub-agent для Twenty |
| [twenty-docs-main/TWENTY_AI_CAPABILITIES_AUDIT.md](twenty-docs-main/TWENTY_AI_CAPABILITIES_AUDIT.md) | Аудит AI-возможностей Twenty |
| [twenty-docs-main/TWENTY_AI_ACTIVATION_PLAN.md](twenty-docs-main/TWENTY_AI_ACTIVATION_PLAN.md) | План активации AI в Twenty |
| [twenty-docs-main/WORKFLOW_TEMPLATES.md](twenty-docs-main/WORKFLOW_TEMPLATES.md) | Шаблоны Workflow |
| [twenty-docs-main/MIGRATION.md](twenty-docs-main/MIGRATION.md) | Миграция данных |
| [twenty-docs-main/GCLOUD_MIGRATION_PLAN.md](twenty-docs-main/GCLOUD_MIGRATION_PLAN.md) | План миграции на GCloud |

### AGENT_docs/ (13 файлов — документы для AI-агентов)

| Файл | Содержание |
|------|-----------|
| [twenty-docs-main/AGENT_docs/API.md](twenty-docs-main/AGENT_docs/API.md) | API reference |
| [twenty-docs-main/AGENT_docs/Extend_abilities.md](twenty-docs-main/AGENT_docs/Extend_abilities.md) | Расширение возможностей |
| [twenty-docs-main/AGENT_docs/Folder Architecture.md](twenty-docs-main/AGENT_docs/Folder%20Architecture.md) | Архитектура папок |
| [twenty-docs-main/AGENT_docs/Twenty Apps.md](twenty-docs-main/AGENT_docs/Twenty%20Apps.md) | Twenty Apps SDK |
| [twenty-docs-main/AGENT_docs/Twenty Webhooks.md](twenty-docs-main/AGENT_docs/Twenty%20Webhooks.md) | Webhooks |
| [twenty-docs-main/AGENT_docs/custom_objects.md](twenty-docs-main/AGENT_docs/custom_objects.md) | Custom objects |
| [twenty-docs-main/AGENT_docs/hotkeys.md](twenty-docs-main/AGENT_docs/hotkeys.md) | Горячие клавиши |
| [twenty-docs-main/AGENT_docs/local_install.md](twenty-docs-main/AGENT_docs/local_install.md) | Локальная установка |
| [twenty-docs-main/AGENT_docs/setup.md](twenty-docs-main/AGENT_docs/setup.md) | Настройка |
| [twenty-docs-main/AGENT_docs/style_guide.md](twenty-docs-main/AGENT_docs/style_guide.md) | Style guide |
| [twenty-docs-main/AGENT_docs/troubleshooting.md](twenty-docs-main/AGENT_docs/troubleshooting.md) | Troubleshooting |
| [twenty-docs-main/AGENT_docs/work with Figma.md](twenty-docs-main/AGENT_docs/work%20with%20Figma.md) | Работа с Figma |
| [twenty-docs-main/AGENT_docs/self_hosted_to_cloud_migration.md](twenty-docs-main/AGENT_docs/self_hosted_to_cloud_migration.md) | Миграция self-hosted → cloud |

### developers/ (28 файлов)

Полная копия docs.twenty.com/developers — self-host, extend, contribute.

### user-guide/ (104 файла)

Полная копия docs.twenty.com/user-guide:
- `workflows/` — triggers, actions, branches, credits, versions, how-tos
- `views-pipelines/` — table/kanban/calendar views, filters, sorting
- `data-model/` — objects, fields, relations, custom objects
- `data-migration/` — CSV import, API import, error handling
- `settings/` — workspace, profile, members, domains
- `calendar-emails/` — Gmail, Outlook, mailbox
- `dashboards/` — widgets, charts
- `permissions-access/` — SSO, roles
- `ai/` — agents, chatbot
- `billing/` — plans, credits

### twenty-ui/ (25 файлов)

UI компоненты Twenty:
- `display/` — icons, chip, tag, checkmark, tooltip
- `input/` — buttons, checkbox, radio, select, text, toggle, color-scheme, icon-picker
- `navigation/` — breadcrumb, links, menu-item, navigation-bar, step-bar
- `progress-bar.mdx`

### mcp-server/ (полная реализация — 37 MCP tools!)

MCP-сервер для Twenty CRM (Split LLC). **37 tools** — значительно больше, чем RealBoost (11):

| Категория | Tools |
|-----------|-------|
| Record CRUD | `twenty_list_records`, `twenty_get_record`, `twenty_create_record`, `twenty_update_record`, `twenty_delete_record` |
| Batch | `twenty_batch_create`, `twenty_batch_update`, `twenty_batch_delete` |
| Search | `twenty_search`, `twenty_aggregate`, `twenty_find_duplicates` |
| Tasks/Notes | `twenty_create_task`, `twenty_create_note` |
| Pipeline | `twenty_list_pipeline_stages`, `twenty_move_opportunity_stage` |
| Workflow | `twenty_create_workflow`, `twenty_trigger_workflow`, `twenty_list_workflow_runs`, `twenty_activate_workflow`, `twenty_deactivate_workflow` |
| Views | `twenty_create_view`, `twenty_list_views` |
| Dashboard | `twenty_create_dashboard` |
| Schema | `twenty_list_objects`, `twenty_get_object_schema`, `twenty_create_custom_object`, `twenty_create_custom_field` |
| Calendar | `twenty_list_calendar_events` |
| Members | `twenty_list_workspace_members` |
| Webhooks | `twenty_create_webhook` |

Транспорт: stdio (стандартный MCP) + HTTP/SSE. Docker + Cloud Build для GCP.

### ai-automations/ (5 serverless functions)

| Файл | Триггер | Назначение |
|------|---------|-----------|
| `auto-pipeline-assignment.ts` | opportunity.created | Сегментация: enterprise/midMarket/smb по размеру сделки |
| `auto-task-generator.ts` | person/company/opportunity events | Автосоздание задач по шаблонам (4 задачи на person, 4 на company) |
| `auto-opportunity-scoring.ts` | opportunity.created/updated + cron 6AM | Скоринг 0-100 (deal size 25%, company fit 20%, engagement 25%) |
| `auto-contact-enrichment.ts` | person.created | Анализ должности: seniority, department, decision-maker |
| `daily-activity-summary.ts` | cron 8AM | Ежедневный отчёт: метрики, топ сделки, stale deals (14+ дней) |

### k8s/ (4 manifests)

| Файл | Содержание |
|------|-----------|
| `configmap.yaml` | ENV переменные (SERVER_URL, STORAGE, Gmail, Calendar) |
| `deployment-server.yaml` | Server: 256Mi-1Gi RAM, liveness/readiness probes |
| `deployment-worker.yaml` | Worker: `yarn worker:prod`, DISABLE_DB_MIGRATIONS=true |
| `ingress.yaml` | GKE Ingress + ManagedCertificate |

---

## 4. Сторонние источники

| Файл | Источник | Содержание |
|------|---------|-----------|
| [community/self-hosting-guide-devto.md](community/self-hosting-guide-devto.md) | dev.to | Quickstart self-hosting (4 шага) |
| [community/twenty-overview-typevar.md](community/twenty-overview-typevar.md) | typevar.dev | Обзор + пример custom field (React/GraphQL) |
| [community/mcp-server-realboost.md](community/mcp-server-realboost.md) | GitHub | MCP-сервер: 11 tools, GraphQL, архитектура |

---

## 5. Ранее созданная документация (до парсинга)

| Файл | Содержание |
|------|-----------|
| [extensibility-guide.md](extensibility-guide.md) | API, custom objects, webhooks, Apps SDK |
| [twenty-platform-reference.md](twenty-platform-reference.md) | Platform reference |
| [twenty-self-hosting-guide.md](twenty-self-hosting-guide.md) | Self-hosting guide |
| [twenty-user-guide.md](twenty-user-guide.md) | User guide |

---

## Быстрый поиск по задаче

| Задача | Где искать |
|--------|-----------|
| Создать custom object | `deepwiki/05-metadata-system.md`, `AGENT_docs/custom_objects.md` |
| Настроить permissions/RBAC | `deepwiki/04-permission-system.md` |
| Добавить кнопку в UI | `deepwiki/10-apps-extensibility.md` (front components) |
| Workflow автоматизация | `twenty-docs-main/user-guide/workflows/`, `WORKFLOW_TEMPLATES.md` |
| Workflow шаблоны (6 готовых) | `twenty-docs-main/WORKFLOW_TEMPLATES.md` |
| GraphQL API запросы | `deepwiki/06-graphql-api.md`, `AGENT_docs/API.md` |
| Деплой на Railway | `developers/self-host/cloud-providers.md` |
| Docker Compose setup | `developers/self-host/docker-compose.md` |
| Kubernetes деплой | `twenty-docs-main/k8s/`, `GCLOUD_MIGRATION_PLAN.md` |
| Env переменные | `developers/self-host/setup.md`, `deepwiki/09-deployment-config.md` |
| Upgrade версии | `developers/self-host/upgrade-guide.md` |
| i18n / локализация | `deepwiki/07-frontend.md` |
| State management (Jotai) | `deepwiki/07-frontend.md` |
| Database / ORM | `deepwiki/03-database-orm.md` |
| MCP-сервер (11 tools) | `community/mcp-server-realboost.md` |
| MCP-сервер (37 tools!) | `twenty-docs-main/mcp-server/` |
| AI agents / skills | `deepwiki/10-apps-extensibility.md`, `TWENTY_AI_CAPABILITIES_AUDIT.md` |
| AI activation (feature flags) | `twenty-docs-main/TWENTY_AI_ACTIVATION_PLAN.md` |
| AI capabilities audit (50+ tools) | `twenty-docs-main/TWENTY_AI_CAPABILITIES_AUDIT.md` |
| AI-автоматизации (serverless) | `twenty-docs-main/ai-automations/` (5 functions) |
| AI sub-agent system prompt | `twenty-docs-main/twenty-crm-expert-subagent.md` (19KB) |
| Scoring / enrichment | `twenty-docs-main/ai-automations/auto-opportunity-scoring.ts` |
| Twenty UI компоненты | `twenty-docs-main/twenty-ui/` |
| Style guide / coding rules | `twenty-docs-main/AGENT_docs/style_guide.md` |
| Импорт данных (CSV/API) | `twenty-docs-main/user-guide/data-migration/` |
| Webhook signature validation | `twenty-docs-main/twenty-crm-expert-subagent.md` |

---

> Каталог подготовлен для проекта CredosCRM (ИТ-компания «Кредо-С»).
> Обновлено: 2026-03-15
