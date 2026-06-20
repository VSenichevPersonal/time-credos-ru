# Чек-лист безопасности — перед коммитом/push/sync

Лёгкий gate. Запускают Dev 2 (схема/сид), arch (push), DevOps (sync). CISO ревьюит сид-фикстуры и RBAC-изменения.

## Секреты (всегда)

- [ ] Нет хардкода токенов/ключей/паролей — только `process.env.*` / CI `secrets.*`.
- [ ] `.env`, `.env.*`, `**/secrets/**` в `.gitignore` (проверка: `git check-ignore .env`).
- [ ] Нет реальных Railway/API-токенов в diff.

```bash
git diff --cached | grep -nE "(APP_SECRET|RAILWAY_TOKEN|ACCESS_TOKEN|API_KEY|Bearer [A-Za-z0-9_-]{12,})" | grep -vE "process\.env|secrets\.|\.env\.example"
```

## ПДн / 152-ФЗ (при правке сида/тестов/фикстур)

- [ ] Нет реальных ФИО сотрудников Кредо-С в трекаемых файлах.
- [ ] Нет реальных корп-email (`@credos.ru`), ИНН, СНИЛС, телефонов.
- [ ] Демо-данные — синтетика + `@example.test`.

```bash
git diff --cached -- 'apps/time/scripts/*' '**/*.test.ts' | grep -nE "@credos\.ru|[0-9]{10,12}|[А-ЯЁ][а-яё]+ +[А-ЯЁ][а-яё]+ +[А-ЯЁ][а-яё]"
```

## RBAC (при правке roles/ или logic-functions согласования)

- [ ] Logic-function под сервис-токеном проверяет авторизацию вызывающего сама.
- [ ] Согласование: actor != owner (separation of duties).
- [ ] Роль даёт минимум прав (`canDestroyAllObjectRecords`/`canUpdateAllSettings` = false).
- [ ] При изменении RBAC approval → ping CISO.

## ADR

- [ ] Новый/изменённый ADR → запросить `[ciso-review ADR-NNNN ...]` у CISO.
