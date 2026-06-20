# DevOps Runbooks — time.credos.ru

Пошаговые регламенты операций и инцидентов. Дополняют [PLAYBOOK.md](../PLAYBOOK.md) (общий цикл) и [DEV_SERVER.md](../DEV_SERVER.md) (пути/доступы).

| Runbook | Когда |
|---|---|
| [deploy-sync.md](deploy-sync.md) | Накат изменений app на dev-сервер (`yarn twenty dev --once`) |
| [rollback.md](rollback.md) | Откат неудачного наката схемы/кода |
| [sdk-bump.md](sdk-bump.md) | Поднятие версии twenty-sdk при апдейте сервера |
| [incident-health.md](incident-health.md) | Сервер недоступен / health != 200 / 5xx |
| [secrets-pii.md](secrets-pii.md) | Утечка/риск секретов или ПДн (CISO-findings), ротация |

## Операционные скрипты ([infra/scripts/](../../../infra/scripts/))

| Скрипт | Назначение |
|---|---|
| `health.sh` | Прозвон health (healthz/metadata/graphql/mcp). `--quiet` для loop. |
| `secret-scan.sh` | Скан секретов + ПДн (@credos.ru). `--all` по всему дереву, по умолчанию — staged. |
| `sync.sh` | Безопасный накат: dry-run → подтверждение → apply. |

Pre-commit guard: `infra/git-hooks/pre-commit` (вызывает secret-scan). Включить: `git config core.hooksPath infra/git-hooks`.
</content>
