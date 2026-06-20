# Runbook — Инцидент: сервер недоступен / health != 200

**Триггер:** `health.sh` вернул FAIL; `/healthz` не 200; 5xx; таймауты; монитор loop поймал деградацию.

## Триаж (по порядку)

1. **Подтвердить с двух точек** (не ложное срабатывание сети):
   ```bash
   set -a; source .env; set +a
   curl -s -m 15 -o /dev/null -w '%{http_code} %{time_total}s\n' "$TWENTY_DEV_URL/healthz"
   ./infra/scripts/health.sh
   ```
2. **Статус Railway**:
   ```bash
   RAILWAY_TOKEN="$RAILWAY_TOKEN" railway status
   RAILWAY_TOKEN="$RAILWAY_TOKEN" railway logs --service Twenty | tail -50
   ```
   Смотреть: рестарт-петля, OOM, ошибка миграции при старте, падение Postgres/Redis.
3. **Классифицировать причину:**

| Симптом в логах | Причина | Действие |
|---|---|---|
| `LOGIC_FUNCTION_EXECUTION_ERROR` / «execution disabled» | сброшен `LOGIC_FUNCTION_TYPE` | Railway → выставить `LOGIC_FUNCTION_TYPE=LOCAL` (Twenty + Worker), redeploy |
| migration error при старте | битая миграция / схема | `DISABLE_DB_MIGRATIONS` ситуативно; эскалация arch |
| Postgres unreachable | БД-сервис down/restart | проверить сервис Postgres в Railway, volume |
| OOM / рестарт-петля | ресурсы | Railway resources; эскалация arch |
| 200 но `/rest/metadata` 403 | протух/сменился API-ключ | обновить `TWENTY_DEV_API_KEY` (админский) в .env + Railway |

4. **Эскалация:** длительный down или нужен доступ к Railway-настройкам вне токена → `[blocker]` в SIGNALS, arch P0.

## После восстановления
- `./infra/scripts/health.sh` → все 200.
- `[infra-ok]` в SIGNALS: причина + что сделано + время простоя.
- Если правился env/секрет — отразить в `.env.example` (без значений) и DEV_SERVER.md.
</content>
