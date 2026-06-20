# APIs

> Источник: https://docs.twenty.com/developers/extend/api

Twenty offers powerful APIs that adapt to your custom data model through four distinct API types.

## API Types

### Core API (`/rest/` или `/graphql/`)

Manages actual records — creating, reading, updating, and deleting entities like People, Companies, and Opportunities.

### Metadata API (`/rest/metadata/` или `/metadata/`)

Handles workspace configuration and data model management through object and field operations.

Both are available in **REST** and **GraphQL** formats. GraphQL offers additional batch upsert capabilities.

---

## Authentication

Every request requires:

```
Authorization: Bearer YOUR_API_KEY
```

Create keys via **Settings → APIs & Webhooks**, then assign roles for granular permission control.

> **Security:** Your API key grants access to sensitive data. Don't share it with untrusted services.

---

## Key Features

- **No long IDs required** — use your object and field names directly in endpoints
- **Batch operations** — up to 60 records per request
- **Interactive playground** — built-in REST and GraphQL testing interface
- **Rate limits** — 100 calls/minute maximum

---

## Workspace-specific Documentation

Since Twenty generates APIs that match your custom data model, the documentation is unique to your workspace. Access it from **Settings → APIs & Webhooks**.
