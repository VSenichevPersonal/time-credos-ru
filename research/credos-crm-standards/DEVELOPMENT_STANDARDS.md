# CredosCRM — Development Standards

LLM-first development standards for Claude Code & Cursor. March 2026.

---

## 💎 Platinum Rules — Security First (ABSOLUTE — cannot be overridden by any deadline or convenience)

Security violations in this tier are treated as production incidents. No exceptions.

### S1. Никаких секретов в коде или git-истории
- **Все** credentials (API keys, tokens, passwords, secrets) — только в Railway ENV Variables
- Не в коде, не в `.env`, не в БД, не в комментариях, не в тестах (используй `process.env.TEST_TOKEN ?? 'fake'`)
- Перед коммитом: `grep -rn "api_key\|secret\|password\|token" --include="*.ts" | grep -v "process.env\|keyof\|tokenPair\|TOKEN_SECRET\|AuthToken"` — должно быть пусто
- Если секрет попал в git: немедленно ротировать, запись в SIGNALS `[blocker]`, arch + DevOps

### S2. Все внешние входные данные — через Zod или явную валидацию
- Каждый `@Body()`, `@Param()`, `@Query()` в credos-контроллере обязан иметь валидацию
- UUID-параметры → `ParseUUIDPipe` (пример: `@Param('id', ParseUUIDPipe) id: string`)
- Тело запроса → Zod schema или class-validator
- Никаких `req.body.foo` без prior validation
- **Failsafe:** `BadRequestException` при невалидных данных (не `InternalServerErrorException`)

### S3. PII не логируется — никогда
- Запрещено в `logger.log/warn/error`: email, phone, ИНН, ФИО, JWT, сырые API-токены, пароли
- Допустимо: UUID, счётчики, статусы, первые 4 цифры ИНН (`INN:7700****`)
- `console.*` запрещён полностью в production-коде (только seeds / CLI scripts)
- Проверка: `grep -rn "logger\." src/credos/ | grep -i "email\|phone\|inn\|token\|password"` — должно быть пусто

### S4. Webhook без JWT → shared-secret validation — fail-secure
- Каждый публичный endpoint (не защищённый JWT) обязан иметь explicit auth механизм
- Паттерн Beeline: `if (!SECRET) throw UnauthorizedException` — если переменная не задана, reject (не accept)
- Паттерн 1С: `CredosOneCAuthGuard` — `InternalServerErrorException` если не настроен
- **НЕЛЬЗЯ:** `if (!secret) return true` — это auth bypass

### S5. Параметризованные SQL-запросы — без исключений
- `dataSource.query('SELECT * FROM t WHERE id = $1', [id])` — OK
- `dataSource.query(\`SELECT * FROM t WHERE id = '${id}'\`)` — СТОП, SQL injection
- Schema-name interpolation допустима только для значений из `uuidToBase36(workspaceId)` (alphanumeric only)
- Raw SQL допускается в DDL (CREATE TABLE) — но только с константными именами таблиц

### S6. CREDOS-маркеры обязательны для правок ядра Twenty
- Любая правка файла вне `credos/` namespace — маркер `// CREDOS: <зачем>` + запись в `core-changes.md`
- Без маркера → arch-nak при code review
- Аудит перед upstream merge: `grep -rn "CREDOS:" packages/ | grep -v credos/`

### S7. Новый secrettoken → документация в `.env.example`
- Каждая новая `CREDOS_*` переменная, добавленная в код, **немедленно** добавляется в `packages/twenty-server/.env.example` с комментарием
- Формат: `# CREDOS_BEELINE_WEBHOOK_SECRET=  # Required. Shared secret for Beeline webhook. Generate: openssl rand -hex 32`
- PR без этой записи → arch-nak

---

## 🥇 Gold Rules (MUST follow — never break)

### 1. Single Source of Truth (SSOT)
- Every piece of data has ONE authoritative source
- No duplicated business logic — extract to shared module
- Types defined once in `types.ts`, imported everywhere
- Constants in `constants.ts`, never inline magic values
- API contracts defined in one place (GraphQL schema or TypeScript interfaces)

### 2. File Size Limits
| File type | Max lines | Action if exceeded |
|-----------|----------|-------------------|
| Component (.tsx) | **150** | Split into sub-components |
| Hook (.ts) | **100** | Extract helper functions |
| Service/util (.ts) | **200** | Split by domain |
| Module (.module.ts) | **80** | Keep thin, delegate |
| Test (.test.ts) | **300** | Split by feature |
| Types (types.ts) | **150** | Split by entity |

### 3. Thin Services / Thin Components
- Components: **render only**. No business logic in JSX.
- Hooks: **orchestrate**. Call services, manage state.
- Services: **business logic**. Pure functions, no UI awareness.
- Modules (NestJS): **wiring only**. Imports, providers, exports.

```
Component (view) → Hook (orchestration) → Service (logic) → Repository (data)
```

### 4. Strict TypeScript
- `strict: true` in tsconfig
- No `any` — use `unknown` + type guards
- No `as` type assertions without comment explaining why
- All function params and returns explicitly typed
- Discriminated unions over optional fields

### 5. JSDoc on Every Export
```typescript
/**
 * Fetches pipeline stages for a given pipeline ID.
 * Returns stages sorted by position.
 *
 * @param pipelineId - UUID of the pipeline
 * @returns Sorted array of pipeline stages
 * @throws {NotFoundError} When pipeline doesn't exist
 */
export const getPipelineStages = async (pipelineId: string): Promise<PipelineStage[]> => { ... }
```

Required on:
- All exported functions
- All exported types/interfaces
- All exported constants
- All React components (brief description of purpose + props)

### 6. Component Reuse — DRY UI
- **Never** create a one-off component if Twenty UI or shadcn/ui has an equivalent
- Check Twenty's `twenty-ui` package first → then shadcn/ui → then build custom
- Custom components must be generic and reusable
- Wrap third-party components in our own thin wrapper for future flexibility

### 7. Code Economy
- Prefer composition over inheritance
- Prefer declarative over imperative
- If a function takes >3 params → use an options object
- If a conditional has >2 branches → use a map/record lookup
- If code is repeated 2+ times → extract immediately
- Delete dead code — don't comment it out

---

## 🥈 Silver Rules (SHOULD follow — break only with justification)

### 8. Directory Structure per Module
```
credos/<module>/
├── index.ts                 # Barrel export (public API)
├── types.ts                 # All types for this module
├── constants.ts             # Constants and enums
├── components/
│   ├── ModuleComponent.tsx
│   └── ModuleComponent.test.tsx
├── hooks/
│   ├── useModule.ts
│   └── useModule.test.ts
├── services/
│   ├── moduleService.ts
│   └── moduleService.test.ts
└── utils/
    └── helpers.ts
```

### 9. Naming Conventions
| Entity | Pattern | Example |
|--------|---------|---------|
| Component | PascalCase | `PipelineKanban.tsx` |
| Hook | useCamelCase | `usePipelines.ts` |
| Service | camelCase + Service | `pipelineService.ts` |
| Type/Interface | PascalCase | `PipelineStage` |
| Constant | UPPER_SNAKE | `MAX_PIPELINE_STAGES` |
| Event handler | handle + Action | `handleStageChange` |
| Boolean | is/has/should prefix | `isLoading`, `hasAccess` |
| GraphQL query | UPPER_SNAKE | `GET_PIPELINES` |
| Test describe | Module → Function → Case | `describe('pipelineService')` |

### 10. Co-located Tests
- Test file next to source: `module.ts` → `module.test.ts`
- Unit tests for services and hooks
- Integration tests for API endpoints
- No test files in separate `__tests__/` directories

### 11. Error Handling Strategy
- Backend: NestJS exception filters, typed error classes
- Frontend: Error boundaries per credos module
- Never swallow errors silently — log at minimum
- User-facing errors in Russian via i18n

### 12. State Management
- Server state: GraphQL + Apollo Client (follows Twenty patterns)
- Local UI state: Jotai atoms (follows Twenty patterns)
- Form state: React Hook Form or controlled components
- No Redux, no Zustand — stay consistent with Twenty

### 13. API Design (credos-integrations)
- RESTful endpoints with OpenAPI/Swagger docs
- Versioned: `/api/v1/exchange/...`, `/api/v1/beeline/...`, `/api/v1/onec/...`
- Consistent error format: `{ error: string, code: string, details?: object }`
- Auth: shared API key between Twenty and integrations service
- Health check: `GET /health`

### 14. Ready-Made Components Priority
When building UI, check in this order:
1. **Twenty UI** (`twenty-ui` package) — buttons, inputs, tables, kanban, etc.
2. **Twenty patterns** — copy existing patterns from twenty-front
3. **shadcn/ui** — for components Twenty doesn't have
4. **Custom** — last resort, must be generic

---

## 🥉 Bronze Rules (NICE to follow — for code excellence)

### 15. Performance
- Memoize expensive computations (`useMemo`, `useCallback`)
- Lazy load credos modules (`React.lazy`)
- Paginate lists >50 items
- Debounce search inputs (300ms)
- Use GraphQL fragments to avoid over-fetching

### 16. Accessibility
- All interactive elements: keyboard accessible
- ARIA labels on icon-only buttons
- Color contrast ratios meet WCAG AA
- Focus management on modals/dialogs

### 17. i18n (Internationalization)
- All UI strings through Lingui (Twenty's i18n framework)
- Never hardcode Russian strings in components
- Translation keys: `credos.<module>.<key>` namespace
- Dates/numbers: use `Intl` formatters

### 18. Git Hygiene
- Feature branches: `feature/credos-<module>-<description>`
- Small, atomic commits (one logical change per commit)
- PR description: what + why + how to test
- Squash merge to main

### 19. Documentation
- README.md in each credos module with: purpose, usage, API
- Architecture Decision Records (ADR) for non-obvious choices in `credos/docs/adr/`
- API docs auto-generated from JSDoc + OpenAPI

### 20. Session Documentation (MANDATORY)
Every development session that adds fields, integrations, modules, or significant changes
MUST produce a dev report:

**Dev Report format:** `credos/docs/dev-reports/NNN-YYYY-MM-DD-description.md`
- Incremental number (001, 002, 003...)
- Contents: goal, what was done, files created/changed, APIs used, testing, limitations

**After each session update:**
1. `credos/docs/dev-reports/NNN-...md` — new dev report
2. `credos/docs/CREDOS_MODULES.md` — update module status, add files, checklist
3. `credos/docs/core-changes.md` — if any core Twenty files were modified

Template: see `credos/docs/dev-reports/001-2026-03-14-dadata-integration.md`

### 21. Security (Bronze checklist — Platinum rules above take precedence)

**Каждый PR, затрагивающий backend или integrations, должен пройти этот checklist:**

- [ ] Нет секретов в коде (Platinum S1)
- [ ] Входные данные валидируются (Platinum S2)
- [ ] PII не логируется (Platinum S3)
- [ ] Публичные webhook endpoints — fail-secure auth (Platinum S4)
- [ ] SQL: только параметризованные запросы (Platinum S5)
- [ ] Правки ядра Twenty помечены CREDOS-маркером (Platinum S6)
- [ ] Новые ENV vars задокументированы в .env.example (Platinum S7)
- [ ] CORS: только prod domain (`APP_FRONT_BASE_URL`)
- [ ] Rate-limiting на endpoints с внешними API-вызовами
- [ ] Записи в RISK_REGISTER.md если найдены новые риски

---

## LLM-First Development Methodology (2026)

### Context Engineering

Context is the most precious resource. LLM performance degrades as context fills.

**Principles:**
- Use `/clear` between unrelated tasks — don't pollute context
- Use `/compact` with custom instructions when context fills
- Use subagents for investigation — keep main context focused on implementation
- Prefer pointers (`see file X, line Y`) over embedding full code in docs

**File Organization for LLM Comprehension:**
- LLMs perform best when relevant info is at the **beginning or end** of input (lost-in-the-middle problem)
- Each token consumes "attention budget" — smaller files = better comprehension
- Use `index.ts` barrel exports as "table of contents" for each module
- Put types/interfaces at TOP of files — LLMs read top-down

### Workflow: Explore → Plan → Code → Verify

```
1. EXPLORE  — Read existing code, understand patterns (Plan Mode / subagents)
2. PLAN     — Create implementation plan, get alignment
3. CODE     — Implement ONE thing at a time, incremental changes
4. VERIFY   — Run tests, typecheck, verify output matches expectations
```

- Each prompt implements exactly ONE step — not a full feature
- Never ask LLM "does this work?" — verification must produce pass/fail artifacts
- The agent cannot negotiate with a failing test

### Verification Protocol

Every code change MUST be verified:
```bash
yarn typecheck        # Types correct
yarn lint             # Style correct
yarn test --related   # Tests pass
```

**Mutation testing > coverage:** A suite with 100% coverage but 4% mutation score misses 96% of bugs. Focus on test quality, not quantity.

### Incremental Modification Pattern

```
BAD:  "Rewrite the entire pipeline module"
GOOD: "Add a pipelineType field to the Pipeline entity"
GOOD: "Create a PipelineSelector component that lists available pipelines"
GOOD: "Wire PipelineSelector into the Kanban board header"
```

Each step is small enough to verify and revert.

---

## LLM Tool Configuration

### For Claude Code
- `CLAUDE.md` — project context, build commands, architecture (under 200 lines!)
- `.claude/rules/` — modular rules by topic (path-scoped, load on demand)
- Memory system — persistent context across sessions
- Hooks — auto-format, protect files, verify on stop

### For Cursor
- `.cursorrules` — project rules (links to DEVELOPMENT_STANDARDS.md)
- `.cursor/rules/*.mdc` — modular rules with path matchers
- MCPs — external tool integrations
- Auto-run — project startup commands

### Recommended Hooks

**Auto-format after edit** (`.claude/settings.json`):
```json
{
  "hooks": {
    "PostToolUse": [{
      "matcher": "Edit|Write",
      "hooks": [{"type": "command", "command": "npx prettier --write $(echo $TOOL_INPUT | jq -r '.file_path')"}]
    }]
  }
}
```

**Verify on stop** — agent checks tests before finishing:
```json
{
  "hooks": {
    "Stop": [{
      "hooks": [{"type": "prompt", "prompt": "Are all tests passing? Run yarn typecheck and check."}]
    }]
  }
}
```

### Recommended `.claude/rules/` Structure

```
.claude/
├── rules/
│   ├── code-style.md          # TypeScript conventions
│   ├── testing.md             # Test patterns and requirements
│   ├── react-components.md    # Component architecture (path: src/**/*.tsx)
│   ├── nestjs-modules.md      # Backend patterns (path: src/**/*.module.ts)
│   ├── integrations.md        # credos-integrations rules
│   └── security.md            # Security requirements
```

Path-scoped rules load ONLY when working in matching directories — saves context.

---

## Code Review Checklist (for LLM-generated code)

### Correctness
- [ ] Solves the stated problem (not a hallucinated requirement)?
- [ ] Handles edge cases?
- [ ] Error paths properly handled?
- [ ] No unnecessary abstractions or over-engineering?

### Standards Compliance
- [ ] File under line limit (150 component / 200 service)?
- [ ] JSDoc on all exports?
- [ ] Types explicit, no `any`?
- [ ] SSOT respected — no duplicated state or logic?
- [ ] Constants extracted, no magic values?
- [ ] No business logic in components (thin service pattern)?

### Reuse & Economy
- [ ] Reuses Twenty UI / shadcn components?
- [ ] No duplicate code (DRY)?
- [ ] Dead code deleted (not commented out)?

### Quality
- [ ] Tests co-located and meaningful?
- [ ] i18n for all UI strings?
- [ ] Error boundaries in place?
- [ ] Follows existing Twenty patterns?

### Security (Platinum Rules — любое нарушение = reject)
- [ ] Нет hardcoded secrets (S1)?
- [ ] Все @Body/@Param/@Query валидируются (S2)?
- [ ] PII не в логах (S3)?
- [ ] Публичный endpoint → fail-secure auth (S4)?
- [ ] Raw SQL → только $1,$2 параметры (S5)?
- [ ] Правки ядра → CREDOS-маркер + core-changes.md (S6)?
- [ ] Новые CREDOS_* vars → .env.example (S7)?

---

## Key References

- [Anthropic — Claude Code Best Practices](https://code.claude.com/docs/en/best-practices)
- [Addy Osmani — LLM Coding Workflow 2026](https://addyosmani.com/blog/ai-coding-workflow/)
- [shadcn/ui — Copy-and-own Components](https://ui.shadcn.com/)
- [Anthropic — How Teams Use Claude Code](https://www-cdn.anthropic.com/58284b19e702b49db9302d5b6f135ad8871e7658.pdf)
