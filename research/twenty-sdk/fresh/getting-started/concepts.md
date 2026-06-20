> Источник: https://docs.twenty.com/developers/extend/apps/getting-started/concepts.md — скачано 2026-06-20

# Twenty Apps Concepts Documentation

## Overview

According to the documentation, "Twenty apps are TypeScript packages that extend your workspace with custom objects, logic, UI components, and AI capabilities."

## Core Architecture

Apps function as collections of entities declared using `defineEntity()` functions from the `twenty-sdk` package. The SDK employs AST analysis during build time to detect these declarations and generate a manifest describing the app's additions to a workspace.

## Entity Types Available

The platform supports 13 entity types:

- **Application** — App identity and configuration
- **Role** — Permission management for objects and fields
- **Object** — Custom record types with fields
- **Field** — Extensions to existing objects
- **Relation** — Bidirectional object connections
- **Logic Function** — Server-side TypeScript with triggers
- **Skill** — Reusable AI agent instructions
- **Agent** — AI assistants with custom prompts
- **Connection Provider** — OAuth credential management
- **View** — Pre-configured record list views
- **Navigation Menu Item** — Sidebar entries
- **Page Layout** — Detail page tabs and widgets
- **Front Component** — Sandboxed React UI

## Security Model

The documentation emphasizes three layers: "Logic functions run in isolated Node.js processes on the server" with scoped API access, "Front components run in Web Workers using Remote DOM," and "Permissions are enforced at the API level."

## Development Workflow

Development begins with `npx create-twenty-app`, followed by `yarn twenty dev` for live syncing. Deployment uses `yarn twenty dev:build` for compilation, then `yarn twenty app:publish` for distribution.
