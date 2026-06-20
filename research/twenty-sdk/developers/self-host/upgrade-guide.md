# Upgrade Guide

> Источник: https://docs.twenty.com/developers/self-host/capabilities/upgrade-guide

---

## General Guidelines

### Database Backup (ОБЯЗАТЕЛЬНО)

Always back up your database before upgrading:

```bash
docker exec -it {db_container_name_or_id} pg_dumpall -U {postgres_user} > databases_backup.sql
```

To restore:

```bash
cat databases_backup.sql | docker exec -i {db_container_name_or_id} psql -U {postgres_user}
```

---

## Docker Compose Upgrade Steps

1. Stop Twenty: `docker compose down`
2. Change the `TAG` value in your `.env` file (recommended format: `major.minor`)
3. Restart: `docker compose up -d`

> **Important:** Upgrade sequentially through versions. For example, upgrading from v0.33.0 to v0.35.0 requires intermediate steps through v0.34.0.

Maintain verified backups after each version upgrade.

---

## Version-Specific Instructions

### v1.0

Twenty v1.0 release!

### v0.60

Performance enhancements — metadata API caching optimized.

If runtime issues occur post-upgrade:

```bash
yarn command:prod cache:flush
```

### v0.55

New images automatically handle all required migrations.

**Authorization Error Resolution:**

```bash
yarn command:prod cache:flush
```

### v0.54

No manual actions required since v0.53.

**Metadata Schema Changes:** The `metadata` schema merged into `core`. The `migrate` command integrated into `upgrade` — avoid running migrate manually.

### Since v0.53

Upgrades execute programmatically within the Dockerfile. Sequential upgrades remain mandatory.

**Workspace Version Verification:**

Check workspace versions in the `core.workspace` database table. Access admin panel at `/settings/admin-panel` or:

```bash
echo $APP_VERSION
```

**auditLog Removal:** Standard auditLog object eliminated, reducing backup sizes.

### v0.51 → v0.52

```bash
yarn database:migrate:prod
yarn command:prod upgrade
```

> **Note:** Versions 0.52.0-0.52.6 were removed from DockerHub. If stuck, manually update workspace version to `0.51.0` in DB, then upgrade using v0.52.11.

### v0.50 → v0.51

```bash
yarn database:migrate:prod
yarn command:prod upgrade
```

### v0.44.0 → v0.50.0

```bash
yarn database:migrate:prod
yarn command:prod upgrade
```

**Docker-compose Update:** Worker service requires access to `server-local-data` volume. Update docker-compose.yml from [v0.50.0 reference](https://github.com/twentyhq/twenty/blob/v0.50.0/packages/twenty-docker/docker-compose.yml).

### v0.43.0 → v0.44.0

```bash
yarn database:migrate:prod
yarn command:prod upgrade
```

### v0.42.0 → v0.43.0

```bash
yarn database:migrate:prod
yarn command:prod upgrade
```

**PostgreSQL Update to Version 16:**

**Option 1:** Keep existing postgres-spilo; freeze docker-compose.yml to v0.43.0.

**Option 2:** Migrate to postgres:16:

1. Dump existing database:

```bash
docker exec -it twenty-db-1 sh
pg_dump -U {YOUR_POSTGRES_USER} -d {YOUR_POSTGRES_DB} > databases_backup.sql
exit
docker cp twenty-db-1:/home/postgres/databases_backup.sql .
```

2. Update docker-compose.yml to postgres:16

3. Restore to new container:

```bash
docker cp databases_backup.sql twenty-db-1:/databases_backup.sql
docker exec -it twenty-db-1 sh
psql -U {YOUR_POSTGRES_USER} -d {YOUR_POSTGRES_DB} -f databases_backup.sql
exit
```

### v0.41.0 → v0.42.0

```bash
yarn database:migrate:prod
yarn command:prod upgrade-0.42
```

**Environment Variables:**

| Removed | Added |
|---------|-------|
| `FRONT_PORT` | `FRONTEND_URL` |
| `FRONT_PROTOCOL` | `NODE_PORT` |
| `FRONT_DOMAIN` | `MAX_NUMBER_OF_WORKSPACES_DELETED_PER_EXECUTION` |
| `PORT` | `MESSAGING_PROVIDER_MICROSOFT_ENABLED` |
| | `CALENDAR_PROVIDER_MICROSOFT_ENABLED` |
| | `IS_MICROSOFT_SYNC_ENABLED` |

### v0.40.0 → v0.41.0

```bash
yarn database:migrate:prod
yarn command:prod upgrade-0.41
```

**Removed:** `AUTH_MICROSOFT_TENANT_ID`

### v0.35.0 → v0.40.0

```bash
yarn database:migrate:prod
yarn command:prod upgrade-0.40
```

**Added:** `IS_EMAIL_VERIFICATION_REQUIRED`, `EMAIL_VERIFICATION_TOKEN_EXPIRES_IN`, `WORKFLOW_EXEC_THROTTLE_LIMIT`, `WORKFLOW_EXEC_THROTTLE_TTL`

### v0.34.0 → v0.35.0

```bash
yarn database:migrate:prod
yarn command:prod upgrade-0.35
```

**Changed:** `ENABLE_DB_MIGRATIONS` → `DISABLE_DB_MIGRATIONS` (default: `false`)

### v0.33.0 → v0.34.0

```bash
yarn database:migrate:prod
yarn command:prod upgrade-0.34
```

**Removed:** `FRONT_BASE_URL`
**Added:** `FRONT_DOMAIN`, `FRONT_PROTOCOL`, `FRONT_PORT`

### v0.32.0 → v0.33.0

```bash
yarn command:prod cache:flush
yarn database:migrate:prod
yarn command:prod upgrade-0.33
```

twenty-postgres deprecated; twenty-postgres-spilo replaced it.

### v0.31.0 → v0.32.0

```bash
yarn database:migrate:prod
yarn command:prod upgrade-0.32
```

**Redis Variables:**

| Removed | Added |
|---------|-------|
| `REDIS_HOST` | `REDIS_URL` |
| `REDIS_PORT` | |
| `REDIS_USERNAME` | |
| `REDIS_PASSWORD` | |

**JWT Token Variables:**

| Removed | Added |
|---------|-------|
| `ACCESS_TOKEN_SECRET` | `APP_SECRET` |
| `LOGIN_TOKEN_SECRET` | |
| `REFRESH_TOKEN_SECRET` | |
| `FILE_TOKEN_SECRET` | |

Enable [People API](https://developers.google.com/people) in Google Admin console for email/calendar sync.

### v0.30.0 → v0.31.0

```bash
yarn database:migrate:prod
yarn command:prod upgrade-0.31
```

### v0.24.0 → v0.30.0

**Breaking Change — Redis Required:**

```ini
REDIS_HOST={your-redis-host}
REDIS_PORT={your-redis-port}
CACHE_STORAGE_TYPE=redis
```

```bash
yarn database:migrate:prod
yarn command:prod upgrade-0.30
```

### v0.23.0 → v0.24.0

```bash
yarn database:migrate:prod
yarn command:prod upgrade-0.24
```

### v0.22.0 → v0.23.0

```bash
yarn database:migrate:prod
yarn command:prod upgrade-0.23
```

Activity-to-tasks/notes data migration.

### v0.21.0 → v0.22.0

```bash
yarn database:migrate:prod
yarn command:prod workspace:sync-metadata -f
yarn command:prod upgrade-0.22
```
