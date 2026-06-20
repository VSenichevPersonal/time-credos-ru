# Setup Environment Variables

> Источник: https://docs.twenty.com/developers/self-host/capabilities/setup

## Configuration Modes

### Admin Panel Configuration (Default)

- Set `IS_CONFIG_VARIABLES_IN_DB_ENABLED=true`
- Access configuration through **Settings → Admin Panel → Configuration Variables**
- Changes take effect within 15 seconds
- Accessible only to users with `canAccessFullAdminPanel: true`
- Supports: Authentication, Email, Storage, Integrations, Workflow settings

### Environment-Only Configuration

- Set `IS_CONFIG_VARIABLES_IN_DB_ENABLED=false`
- All settings managed via `.env` file
- Requires container restart for changes
- Admin panel displays values but cannot modify them

---

## Multi-Workspace Mode

### Single-Workspace (Default)

- `IS_MULTIWORKSPACE_ENABLED=false`
- One workspace per instance
- First user becomes admin automatically
- Simple URL structure

### Multi-Workspace Mode

- `IS_MULTIWORKSPACE_ENABLED=true`
- Multiple independent workspaces on same instance
- Each workspace uses subdomain (e.g., `sales.your-domain.com`)
- Configure DNS: `*.your-domain.com -> your-server-ip`
- Restrict creation with `IS_WORKSPACE_CREATION_LIMITED_TO_SERVER_ADMINS=true`

---

## Gmail & Google Calendar Integration

### Setup steps:

1. Enable APIs: Gmail, Google Calendar, People API
2. Create OAuth 2.0 Client ID with redirect URIs:
   - `https://{your-domain}/auth/google/redirect`
   - `https://{your-domain}/auth/google-apis/get-access-token`
3. Configure variables:
   - `MESSAGING_PROVIDER_GMAIL_ENABLED`
   - `CALENDAR_PROVIDER_GOOGLE_ENABLED`
   - Client credentials (ID + Secret)

---

## Microsoft 365 Integration

### Requirements:

- Users need Microsoft 365 License
- Enable APIs: Mail.ReadWrite, Mail.Send, Calendars.Read, User.Read, plus openid/email/profile/offline_access
- Redirect URIs:
  - `https://{your-domain}/auth/microsoft/redirect`
  - `https://{your-domain}/auth/microsoft/get-access-token`

### Configuration variables:

- `MESSAGING_PROVIDER_MICROSOFT_ENABLED`
- `CALENDAR_PROVIDER_MICROSOFT_ENABLED`
- Client credentials (ID + Secret)

---

## Background Jobs (Cron)

Register these cron jobs in worker container for calendar/messaging sync:

| Cron Job | Назначение |
|----------|-----------|
| `cron:messaging:messages-import` | Импорт сообщений |
| `cron:messaging:message-list-fetch` | Получение списка сообщений |
| `cron:calendar:calendar-event-list-fetch` | Получение списка событий календаря |
| `cron:calendar:calendar-events-import` | Импорт событий календаря |
| `cron:messaging:ongoing-stale` | Очистка устаревших sync |
| `cron:calendar:ongoing-stale` | Очистка устаревших sync календаря |
| `cron:workflow:automated-cron-trigger` | Триггеры Workflow по расписанию |

---

## Email Configuration (SMTP)

Configure SMTP settings (Gmail, Office365, or smtp4dev) through Admin Panel → Email section or `.env` file.

---

## Logic Functions & Code Interpreter

| Feature | Production Default | Development Default | Drivers |
|---------|-------------------|-------------------|---------|
| Logic Functions | DISABLED | LOCAL | DISABLED, LOCAL, LAMBDA |
| Code Interpreter | DISABLED | LOCAL | DISABLED, LOCAL, E2B |

> **Security note:** LOCAL driver has no sandboxing; use LAMBDA or E2B for production.
