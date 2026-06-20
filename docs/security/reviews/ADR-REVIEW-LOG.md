# ADR Security-Review Log — CISO

Вердикты `[ciso-review ADR-NNNN approve|concern|block]` по архитектурным решениям. `block` останавливает arch (только при обоснованном риске). Пропорционально dev-среде.

| ADR | Дата | Вердикт | Резюме |
|---|---|---|---|
| 0001 — платформа/данные/auth | 2026-06-20 | **approve / concern** | Central IdP вместо общего APP_SECRET ✅. Данные в Twenty → RBAC/аудит наследуются ✅. Concern: (1) выбор IdP с учётом 152-ФЗ — Keycloak self-hosted предпочтительнее Entra-облака для ПДн сотрудников; (2) общий workspace с CRM → нужна RBAC-изоляция трудозатрат от пользователей CRM. |
| 0002 — SDK-app, изолир. репо | 2026-06-20 | **approve / concern** | Изоляция app, install-not-merge, свой scope ролей/API-ключа ✅ (хорошо для безопасности). Concern: при install scope `TWENTY_APP_ACCESS_TOKEN` минимизировать (least privilege), не админ-ключ. |
| 0003 — каталог + общие мастер-данные | 2026-06-20 | **concern** | ⚠️ Общий объект **Employee** (ФИО/email) делится между time / catalog / CRM/Sales. RBAC и владелец общих мастер-объектов — явно «Открыто» в ADR. **PII сотрудников станет видна продажам/каталогу без явного разграничения.** Требование: определить владельца + RBAC общих мастер-данных (особенно PII Employee) ДО того как catalog получит доступ. Зафиксировано как [CISO-004](../RISK_REGISTER.md). Не block (каталог — следующая итерация), но обязательно к решению до его старта. |
| 0004 — нейминг credosTime* | 2026-06-20 | **approve** | Без security-влияния. Плюс: переиспользование `WorkspaceMember` вместо дублирования личности сотрудника — минимизация ПДн ✅. Мелочь: `workspaceMemberRef` — loose TEXT-ссылка, не реляция → следить за целостностью при сравнении actor↔owner (см. [RBAC_APPROVAL](../specs/RBAC_APPROVAL.md)). |

## Процесс

Новый/изменённый ADR → CISO читает → вердикт в SIGNALS `[ciso-review ADR-NNNN ...]` + строка в эту таблицу. Concern не блокирует, но требует учёта; block — только обоснованный риск с записью в [RISK_REGISTER](../RISK_REGISTER.md).
