# Publishing Twenty Apps

> Источник: https://docs.twenty.com/developers/extend/apps/publishing

## Distribution Channels

### 1. npm Marketplace (Public)

**Requirements:**
- npm account
- Package name must use `twenty-app-` prefix (e.g., `twenty-app-postcard-sender`)

**Build:**

```bash
yarn twenty app:build
```

**Publish:**

```bash
npx twenty app:publish
```

**Auto-discovery:** Packages with `twenty-app-` prefix are automatically discovered by the Twenty marketplace catalog and appear within minutes.

### 2. Internal Distribution (Tarball)

Deploy directly to specific servers:

```bash
npx twenty app:publish --server <server-url>
```

Apps available only to workspaces on that server.

**Version Updates:** Update `version` in `package.json`, then push a new tarball.

---

## CI/CD (GitHub Actions)

The scaffolded project includes a workflow that triggers on release events:

```yaml
steps:
  - yarn install --immutable
  - npx twenty app:build
  - npm publish --provenance --access public
```

Working directory: `.twenty/output`
Required secret: `NODE_AUTH_TOKEN`

For other CI systems, use the same three commands.

---

## npm Provenance

Publishing with `--provenance` flag adds a trust badge to npm listings, verifying packages were built from specific commits in public CI.

---

## App Categories

| Category | Description |
|----------|------------|
| Development | Local dev mode via `yarn twenty app:dev` |
| Published | npm-distributed, visible in marketplace |
| Internal | Server-specific tarball, not publicly visible |
