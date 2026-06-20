# Runbook — Секреты и ПДн (утечка/риск, ротация)

**Триггер:** CISO `[ciso-finding]` про секреты/ПДн; secret-scan поймал; подозрение на утечку токена.

## Профилактика (постоянно)
- Все секреты — только в `.env` (gitignored). Шаблон без значений — `.env.example`.
- Pre-commit guard включён: `git config core.hooksPath infra/git-hooks` → `secret-scan.sh` блокирует токены и `@credos.ru` в коммите.
- Ручная проверка перед push:
  ```bash
  ./infra/scripts/secret-scan.sh           # staged
  ./infra/scripts/secret-scan.sh --all     # всё дерево
  ```

## Если ПДн уже в git (напр. CISO-001: реальные @credos.ru в seed-real.mjs)
1. **Обезличить источник** (задача Dev 2): синтетические ФИО + домен `@example.test`; реальные значения грузить из gitignored-источника (`research/*.xlsx` или `.env`) в рантайме, не хардкодить.
2. **Остановить распространение:** pre-commit guard не даёт добавлять новые. Уже в истории — для приватного internal-repo переписывание истории **опционально** (решает arch, пропорционально риску).
3. Зафиксировать в `docs/security/RISK_REGISTER.md` (ведёт CISO) статус remediation.

## Ротация скомпрометированного токена
| Токен | Где ротировать |
|---|---|
| `TWENTY_DEV_API_KEY` | Twenty → Settings → API & Webhooks → revoke + создать новый (админ-роль) → обновить `.env` |
| `RAILWAY_TOKEN` | Railway → Project Settings → Tokens → revoke + создать project-token → обновить `.env` |
| `APP_SECRET` (сервер) | Railway env (Twenty) → сменить → redeploy (инвалидирует сессии) — согласовать с arch (downtime) |

После ротации: `./infra/scripts/health.sh` → 200; `[infra-ok]` в SIGNALS (без значений токенов!).
</content>
