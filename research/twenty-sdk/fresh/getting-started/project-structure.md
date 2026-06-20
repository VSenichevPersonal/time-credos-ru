> Источник: https://docs.twenty.com/developers/extend/apps/getting-started/project-structure.md — скачано 2026-06-20

# Project Structure

A Twenty app generated via `npx create-twenty-app` contains a standardized layout with essential configuration files, source code, and testing infrastructure.

## Directory Layout

The scaffolded app includes:

- **`src/application-config.ts`** — Required entry point for app configuration
- **`src/default-role.ts`** — Default permissions controlling logic function access
- **`src/constants/universal-identifiers.ts`** — Auto-generated UUIDs and metadata
- **`src/__tests__/`** — Integration test examples and setup
- **`public/`** — Static assets like images and fonts
- **Configuration files** — `vitest.config.ts`, `tsconfig.json`, `.github/workflows/ci.yml`, and various tool configs

## Key Points

The documentation notes that "file organization is up to you" and folder structures shown are conventions. The SDK discovers entities through AST analysis of `export default defineEntity(...)` calls regardless of file location.

Both Twenty packages must be `devDependencies`:

- **`twenty-sdk`** provides CLI and build tooling (development-only)
- **`twenty-client-sdk`** is imported by app code but provided at runtime, so the installed copy serves only typechecking and build purposes

Runtime dependencies (libraries actually imported by logic functions) belong under `dependencies`. The build process warns if either Twenty package appears in `dependencies`.
