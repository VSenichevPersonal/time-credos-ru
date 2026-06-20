# infra/dev-server

Dev-сервер Twenty 2.x развёрнут на **Railway** (community-шаблон TwentyCRM v2), отдельный проект «Twenty Credos Time».

**Все devops-пути, доступы, команды:** `../../docs/devops/DEV_SERVER.md`.

Секреты (токен, URL) — в `.env` в корне репо (gitignored).

> Эта папка — задел под infra-as-code (docker-compose с официальным образом `twentycrm/twenty`) на случай, если понадобится воспроизводимый деплой без community-шаблона. Сейчас используется Railway-шаблон — см. devops-док.
