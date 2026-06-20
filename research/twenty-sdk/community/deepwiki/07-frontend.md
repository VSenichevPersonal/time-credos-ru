# Twenty CRM — Frontend Architecture

> Источник: https://deepwiki.com/twentyhq/twenty/5-frontend + /5.1 + /5.2 + /5.3

---

## Stack

| Library | Version |
|---------|---------|
| React | 18.2.0 |
| TypeScript | 5.9.2 |
| Vite | 7.0.0 |
| Apollo Client | 3.13.8 |
| Recoil | 0.7.7 |
| React Router | 6.4.4 |
| Lingui | 5.1.2 |
| Emotion | 11.11.0 |

---

## Module Organization

```
src/modules/
├── auth/
├── object-metadata/
├── object-record/
├── navigation/
├── settings/
├── ui/
├── client-config/
└── support/
```

---

## State Management (Jotai v2.17.1)

### Four-Layer Strategy

| Layer | Technology | Назначение |
|-------|-----------|-----------|
| Atomic State | Jotai | Component/global state |
| Server Data | Apollo Client | GraphQL cache |
| Persistence | Browser APIs | localStorage, sessionStorage |
| Navigation | React Router | URL state |

### Patterns

- Component-scoped atoms co-located with consumers
- Global atoms for auth/preferences
- Provider-scoped via `IconsProvider` pattern
- `useAtomStateValue` custom hook
- V2 suffix for versioned implementations

### Performance

- Minimal re-renders
- Atomic updates
- Lazy evaluation
- Dependency tracking

---

## Component Library (twenty-ui)

### Icons

- ~400 curated Tabler Icons
- Custom brand icons
- Illustration icons
- 240+ currency code → icon mappings
- `IconsProvider` for dynamic icon registration

### Avatar System

- `invalidAvatarUrlsState` tracking
- Fallback rendering

### AppTooltip

- Controlled positioning
- Multiple trigger modes

### TypeScript

- Type-safe icon usage
- `CatalogDecorator` for Storybook testing

### Dependencies

```
@tabler/icons-react, twenty-shared, React, Emotion
```

---

## i18n (Lingui)

### Scope

- **28 locales** supported
- PO file format with js-lingui-id hash-based IDs
- Variable interpolation: `{variableName}`
- Plural forms: from 1 (Japanese) to 6 (Arabic)
- Ordinal number formatting
- Crowdin integration

### Frontend Translations

Location: `packages/twenty-front/src/locales/`

### Backend Translations

Location: `packages/twenty-server/src/engine/core-modules/i18n/locales/`

### Exception Message Categories

- Validation
- Metadata
- Authentication
- Permission
- Business Logic
- System

### CI/CD Pipeline

| Workflow | Trigger | Action |
|----------|---------|--------|
| `i18n-push.yaml` | Every push to main | Upload to Crowdin |
| `i18n-pull.yaml` | Every 2 hours | Download from Crowdin |

### Best Practices

- Full sentences (not fragments)
- Descriptive variable names
- Avoid concatenation
- Consider plural forms

---

## GraphQL Code Generation

```json
{
  "@graphql-codegen/cli": "3.3.1",
  "@graphql-codegen/client-preset": "4.1.0",
  "@graphql-codegen/typescript": "3.0.4"
}
```

---

## Client Config

- Loaded from `/client-config` REST endpoint (no auth)
- State: Recoil atoms for `currentUserState`, `currentWorkspaceState`, `billingState`
- `ClientConfigProviderEffect` loads on mount

---

## Settings Navigation

Feature-conditional navigation via `useSettingsNavigationItems`.
