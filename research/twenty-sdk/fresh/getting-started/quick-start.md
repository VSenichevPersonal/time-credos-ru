> Источник: https://docs.twenty.com/developers/extend/apps/getting-started/quick-start.md — скачано 2026-06-20

# Twenty Quick Start Guide

## Overview

Twenty's app development follows three distinct phases: scaffolding the project, running a local server, and syncing changes during development.

## Prerequisites

Building a Twenty app requires:
- Node.js 24 or later
- Yarn 4 (enabled via Corepack)
- Docker (for running the local Twenty server)

## The Three Development Phases

| Phase | Purpose | Tool | Output |
|-------|---------|------|--------|
| Scaffold | Generate source code | `npx create-twenty-app` | TypeScript project |
| Server | Start Twenty instance | Docker + `yarn twenty server` | Running Twenty on localhost |
| Sync | Live-update code changes | `yarn twenty dev` | Changes reflected in UI |

## Phase 1: Project Scaffolding

Run this command to generate a new app:

```bash
npx create-twenty-app@latest my-twenty-app
```

The scaffolder creates a TypeScript project with starter configuration, default role, CI workflow, and integration tests.

## Phase 2: Local Server Setup

The scaffolder prompts whether to set up a local Twenty instance. Selecting yes (recommended) launches `twentycrm/twenty-app-dev` Docker image on port 2020.

After startup, sign in using the demo credentials:
- **Email:** tim@apple.dev
- **Password:** tim@apple.dev

Then authorize CLI access on the subsequent screen.

## Phase 3: Development Loop

Start the development watcher:

```bash
cd my-twenty-app
yarn twenty dev
```

This watches source files, rebuilds on changes, and syncs to the server automatically. Changes typically appear within seconds.

### Sync Commands

- `yarn twenty dev` — Continuous watching and syncing
- `yarn twenty dev --once` — Single build and sync (useful for CI)
- `yarn twenty dev --once --dry-run` — Preview changes without applying them

## Buildable Components

Apps comprise entities including custom data objects and fields, server-side logic functions, React front components, AI skills and agents, views with navigation, and custom page layouts.

## Additional Resources

Comprehensive documentation covers configuration, data modeling, business logic, layouts, and deployment operations through dedicated reference sections.
