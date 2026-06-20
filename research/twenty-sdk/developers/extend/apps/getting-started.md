# Apps: Getting Started

> Источник: https://docs.twenty.com/developers/extend/apps/getting-started

> **Alpha:** This feature is in alpha testing.

Extend Twenty with custom objects, fields, logic functions, AI skills, and UI components — all managed as code.

## Prerequisites

- **Node.js 24+** and **Yarn 4**
- Access to a Twenty workspace with an API key (Settings → APIs & Webhooks)

---

## Quick Start

### Scaffold a new app

```bash
npx create-twenty-app@latest my-twenty-app
```

### Start development mode

```bash
yarn twenty app:dev
```

Development mode provides automatic workspace synchronization.

### Scaffolding options:

- **Default mode** — includes all example files across multiple entity types
- **Minimal mode** — provides only core configuration files

---

## Available Commands

| Command | Назначение |
|---------|-----------|
| `yarn twenty entity:add` | Guided entity creation |
| `yarn twenty function:logs` | Monitor function execution |
| `yarn twenty function:execute` | Run specific functions with parameters |
| `yarn twenty app:uninstall` | Remove application from workspace |
| `yarn twenty auth:login` | Authenticate with workspace |
| `yarn twenty auth:switch` | Switch between workspace profiles |

---

## Project Structure

```
src/
├── application-config.ts    # Required configuration file
├── roles/                   # Access control definitions
├── objects/                 # Custom object schemas
├── logic-functions/         # Business logic handlers
├── front-components/        # UI component definitions
├── skills/                  # AI agent capabilities
public/                      # Static assets
```

---

## Entity Detection

The SDK uses **AST-based** scanning to identify entities through TypeScript export patterns:

```typescript
export default define<Entity>({...})
```

File organization is flexible — the framework locates entities by export syntax, not directory structure.

---

## Authentication

```bash
yarn twenty auth:login
```

Credentials stored locally. Multiple workspace profiles supported via `yarn twenty auth:switch`.

---

## Alternative Setup (Manual)

Add `twenty-sdk` as a development dependency and create a single `package.json` script entry.
