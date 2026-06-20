# CISO-001 — Реальные ПДн сотрудников в git (P1)

**Статус:** MITIGATING · **Severity:** P1 · **Owner устранения:** CISO (gitignore ✅) / Dev 2 (сид) / arch (история) · **Дата:** 2026-06-20

## Суть

Реальные ПДн сотрудников Кредо-С в git двумя путями:

**(а) Сырые дампы-источники** (tracked, не код):
- `research/directum5/trudozatraty-dir5.xlsx` — выгрузка Директум5, ~13k строк трудозатрат с ФИО.
- `research/directum5/bitrix-users/roster.csv` — 72 сотрудника (ФИО + подразделение + email).
- `research/directum5/bitrix-users/users-bitrix.html` — экспорт Bitrix-юзеров (@credos.ru).
- `research/timetta/raw-odata-Users-deep.json` — содержит @credos.ru.

**(б) Хардкод в коде:** `apps/time/scripts/seed-real.mjs` (коммит `56bc320`) — **42 сотрудника** ФИО + `@credos.ru` + отделы.

> Прочие `research/timetta/raw-*.json` (~40 дампов конкурента Timetta) и md-доки содержат 1× собственный аккаунт исследователя — не реестр третьих лиц, пропорционально оставлены. Токенов в `raw-session.json` нет.

## Сделано (CISO, 2026-06-20)

Дампы (а) сняты с tracking, gitignore поставлен (файлы на диске сохранены):
```bash
git rm --cached research/directum5/trudozatraty-dir5.xlsx \
  research/directum5/bitrix-users/{roster.csv,users-bitrix.html} \
  research/timetta/raw-odata-Users-{deep,expand}.json
# + .gitignore: секция «ПДн / 152-ФЗ» + конвенция **/pii/**, **/pdn/**, roster*.csv
```
Проверено: `git check-ignore` = ДА, `git ls-files` = пусто, файлы на диске целы. Изменения **staged, не закоммичены** — push по батчу arch.

⚠️ **История git** всё ещё содержит файлы (`git rm --cached` чистит только будущие коммиты). Решение по `filter-repo`/BFG — за arch (internal-repo, пропорционально).

## Репро

```bash
git ls-files apps/time/scripts/seed-real.mjs        # tracked
grep -cE "@credos\.ru" apps/time/scripts/seed-real.mjs   # 42
git log --oneline -1 -- apps/time/scripts/seed-real.mjs  # 56bc320
```

## Риск

- **152-ФЗ:** реальные ПДн (ФИО+email) в системе контроля версий без обоснования обработки. Попадают в каждый клон репо + историю.
- **Правило команды** (INTERACTION.md §9): «Реальные ФИО/ИНН сотрудников — не в git, координировать с CISO». Нарушено.
- Severity **P1** (не P0): репозиторий приватный internal, dev-среда, наружу не утекло. Но данные в истории и правило нарушено.

## Требование

1. **Обезличить `seed-real.mjs`:** синтетические ФИО + домен `@example.test`. Детерминированный генератор уже есть в скрипте — расширить на ФИО.
2. **Реальные данные — в рантайме:** грузить ФИО/email из `research/directum5/*.xlsx` (gitignored) или `.env`, не хардкодить в трекаемом файле.
3. **История git:** internal-repo → переписывание опционально, на усмотрение arch (пропорционально риску). Минимум — новые коммиты без реальных ПДн.
4. Проверить остальные сид-скрипты (`seed-calendar.mjs`, `reseed-codes.mjs`) на ПДн — там вторичные данные, ФИО не найдено.

## DoD

- `grep -rE "[А-ЯЁ][а-яё]+ +[А-ЯЁ][а-яё]+|@credos\.ru" apps/time/scripts/` не находит реальных сотрудников.
- Сид по-прежнему работает (из внешнего источника или синтетики).
