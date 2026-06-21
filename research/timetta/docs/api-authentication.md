# Аутентификация — Timetta API

## Обзор

Timetta API использует протокол **OAuth 2.0** для аутентификации. Система включает четыре ключевых компонента:

- **Client** — интегрируемое приложение
- **Resource server** — Timetta API
- **Authorization server** — Timetta Passport
- **Tokens** — access-токены (срок действия 1 час) и refresh-токены (срок действия 15 дней)

## Два метода аутентификации

### 1. API Token

Сгенерируйте статический токен сроком действия один год через системные настройки. Метод подходит для закрытых сред, однако обеспечивает меньшую безопасность из-за отсутствия ротации токенов.

### 2. OAuth 2.0 Resource Owner Password Grant

Рекомендуемый подход для интеграций — использует учётные данные (email и пароль).

## Получение access-токенов

**Первоначальный запрос токена:**

```
POST https://auth.timetta.com/connect/token
Content-Type: application/x-www-form-urlencoded

client_id=external&scope=all offline_access&grant_type=password&username=*&password=*
```

**Обновление токена:**

```
POST https://auth.timetta.com/connect/token
Content-Type: application/x-www-form-urlencoded

client_id=external&scope=all offline_access&grant_type=refresh_token&refresh_token=*
```

## Использование API

Включите access-токен в заголовки запроса:

```
Authorization: Bearer ACCESS_TOKEN
```

**Примечание:** Для повышения безопасности сохраняйте refresh-токены вместо учётных данных.
