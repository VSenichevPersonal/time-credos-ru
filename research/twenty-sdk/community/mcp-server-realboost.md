# RealBoost Twenty CRM MCP Server

> Источник: https://github.com/realboost/realboost-twenty-mcp-server
> MCP SDK: `@modelcontextprotocol/sdk ^1.22.0`
> Transport: Streamable HTTP (не stdio), Express на порту 5008
> Обновлено: 2026-01-21

---

## Что это

MCP (Model Context Protocol) сервер для взаимодействия AI-агентов с Twenty CRM через GraphQL и REST API.

---

## Доступные MCP Tools (11 штук)

### Person Tools (5)

| Tool | Description | Input |
|------|-------------|-------|
| `create-person` | Создать Person | `firstName` (req), `lastName` (req), `email`, `phone`, `city`, `companyId`, `position` |
| `get-person` | Получить по ID | `id` (req) |
| `update-person` | Обновить | `id` (req), остальные optional |
| `delete-person` | Удалить | `id` (req) |
| `list-persons` | Список с фильтрацией | `limit` (default 20), `offset`, `companyId` |

### Company Tools (3)

| Tool | Description | Input |
|------|-------------|-------|
| `create-company` | Создать Company | `name` (req), `domainName`, `address`, `employees` |
| `get-company` | Получить по ID | `id` (req) |
| `list-companies` | Список | `limit` (default 20), `offset` |

### Opportunity Tools (3)

| Tool | Description | Input |
|------|-------------|-------|
| `create-opportunity` | Создать Opportunity | `name` (req), `amountMicros`, `currencyCode`, `closeDate`, `stage`, `companyId`, `pointOfContactId` |
| `get-opportunity` | Получить по ID | `id` (req) |
| `list-opportunities` | Список | `limit` (default 20), `offset`, `companyId` |

> **Примечание:** README упоминает Note и Task tools, но они НЕ реализованы в коде.

---

## Конфигурация

### Environment Variables (`.env`)

```bash
# Required
TWENTY_API_URL=https://api.twenty.com    # или self-hosted URL
TWENTY_API_KEY=your_api_key_here

# Optional
PORT=5008

# Agent Gateway (optional)
AGENT_GATEWAY_URL=                        # Gateway URL for service discovery
AGENT_GATEWAY_API_KEY=                    # Gateway auth
AGENT_NAME=twenty-crm-mcp-server
AGENT_VERSION=1.0.0
AGENT_DESCRIPTION=Twenty CRM MCP Server with GraphQL and REST API support
MCP_ENDPOINT=http://localhost:5008/mcp
HEALTH_ENDPOINT=http://localhost:5008/health
AGENT_REGISTRATION_INTERVAL=60000         # ms, heartbeat interval
```

### MCP Client Configuration (`mcp.json`)

```json
{
    "mcpServers": {
        "twenty-crm": {
            "url": "http://localhost:5008/mcp"
        }
    }
}
```

### Аутентификация

Bearer token через `Authorization` header. API key создаётся в Twenty: **Settings → APIs & Webhooks → Create key**.

---

## HTTP Endpoints

| Endpoint | Method | Назначение |
|----------|--------|-----------|
| `/` | GET | Интерактивный веб-интерфейс |
| `/mcp` | POST | MCP protocol (JSON-RPC over HTTP) |
| `/mcp` | GET | SSE stream для нотификаций |
| `/health` | GET | Health check (status, uptime, version) |

### Session Management

1. POST `/mcp` без session ID с `initialize` → создаёт сессию, возвращает `mcp-session-id` header
2. Последующие POST включают `mcp-session-id` header
3. GET `/mcp` с session ID устанавливает SSE stream

---

## Архитектура

```
src/
  application/
    mcp-handlers.ts              # MCP protocol handlers
    tools/
      tool-registry.ts           # Central registry
      person-tool.ts             # Person CRUD (5 tools, GraphQL)
      company-tool.ts            # Company CRUD (3 tools, GraphQL)
      opportunity-tool.ts        # Opportunity CRUD (3 tools, GraphQL)
  domain/
    twenty-types.ts              # TS interfaces: Person, Company, Opportunity
    types.ts                     # ToolDefinition, ToolResult, HealthStatus
  infrastructure/
    clients/
      twenty-graphql-client.ts   # GraphQL client (graphql-request)
      twenty-rest-client.ts      # REST client (fetch) — НЕ используется
    gateway/
      agent-gateway-client.ts    # Optional Agent Gateway registration
    http/
      session-manager.ts         # StreamableHTTPServerTransport sessions
      request-validator.ts       # Request validation
    logging/
      logger.ts                  # Structured logging
  server.ts                      # MCPServer orchestrator
  index.ts                       # Express app entry point
```

---

## GraphQL Examples

### Create Person

```graphql
mutation CreatePerson(
  $firstName: String!, $lastName: String!,
  $email: String, $phone: String, $city: String,
  $companyId: ID, $position: String
) {
  createPerson(data: {
    name: { firstName: $firstName, lastName: $lastName }
    email: $email
    phone: $phone
    city: $city
    companyId: $companyId
    position: $position
  }) {
    id
    name { firstName lastName }
    email phone city companyId position
    createdAt updatedAt
  }
}
```

### List Persons (with pagination)

```graphql
query ListPersons($limit: Int, $filter: PersonFilterInput) {
  people(first: $limit, filter: $filter) {
    edges {
      node {
        id
        name { firstName lastName }
        emails { primaryEmail }
        phones { primaryPhoneNumber primaryPhoneCountryCode }
        city companyId position
        createdAt updatedAt
      }
    }
    pageInfo { hasNextPage endCursor }
  }
}
```

---

## Установка

```bash
# Option 1: Makefile
make setup        # installs deps, creates .env
nano .env         # add TWENTY_API_KEY
make dev          # starts dev server

# Option 2: npm
npm install
cp .env.example .env
npm run build
npm run mcp       # starts server + MCP Inspector

# Docker
npm run docker-build
npm run docker-run    # maps 5008:8080
```

---

## Dependencies

```json
{
  "@modelcontextprotocol/sdk": "^1.22.0",
  "dotenv": "^17.2.3",
  "express": "^5.1.0",
  "graphql": "^16.9.0",
  "graphql-request": "^7.1.2",
  "zod": "^3.24.1",
  "zod-to-json-schema": "^3.24.1"
}
```

---

## Важные заметки

1. **Transport:** StreamableHTTPServerTransport (HTTP-based, не stdio)
2. **Tool refresh:** Сервер отправляет `notifications/tools/list_changed` всем сессиям каждые 5 секунд
3. **Input validation:** Zod schemas → JSON Schema для MCP tool definitions
4. **REST client не используется:** Все операции идут через GraphQL
5. **Note/Task tools не реализованы:** Только Person, Company, Opportunity
6. **Agent Gateway:** Опциональная service discovery с heartbeat каждые 60 секунд

---

## Применимость для CredosCRM

Этот MCP-сервер можно использовать как отправную точку для создания собственного
MCP-сервера для CredosCRM. Потребуется:
- Добавить tools для credos-объектов (credosTender, credosContact, credosActivity)
- Добавить DaData enrichment tool
- Добавить tools для интеграций (Exchange, АТС Билайн, 1С УНФ)
- Реализовать Note и Task tools (не реализованы в оригинале)
