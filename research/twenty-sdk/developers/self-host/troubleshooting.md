# Troubleshooting

> Источник: https://docs.twenty.com/developers/self-host/capabilities/troubleshooting

---

## Self-Hosting Issues

### Database Password Authentication Failure (Fresh Installs Only)

For new installations, if you need to change the default PostgreSQL password, you must **remove the existing database volume** before applying changes.

> **Warning:** Following steps will PERMANENTLY DELETE all database data! Only proceed without existing production data.

### Windows Line Break Issues

Git's `autocrlf` setting can cause CR line break problems on Windows:

```bash
git config --global core.autocrlf false
```

Then re-clone the repository.

### Missing Database Schemas

Ensure provisioning creates both `default` and `metadata` schemas. Verify no multiple PostgreSQL instances are running simultaneously.

### Module and Package Errors

Build the `twenty-emails` package before database initialization:

```bash
yarn
npx nx server:dev twenty-server
```

### Memory Issues with `npx nx start`

Run only necessary services instead of all commands. On WSL:

```bash
export NODE_OPTIONS="--max-old-space-size=8192"
```

Disable memory-intensive VSCode extensions if needed.

### Email Not Sending

Most of the time, it's because the `worker` is not running:

```bash
npx nx worker twenty-server
```

### Microsoft 365 Connection Failures

- Verify the admin has enabled Microsoft 365 licensing
- Error code `AADSTS50020` indicates personal accounts aren't supported

### Worker Status Verification

Test webhooks using webhook-test.com to confirm worker functionality:
1. Create a test webhook
2. Trigger a company record creation
3. Verify POST request receipt

### Frontend Startup Error TS5042

Comment out the checker plugin in `packages/twenty-ui/vite-config.ts`.

### Admin Panel Access

Grant admin access via SQL:

```sql
UPDATE core."user"
SET "canAccessFullAdminPanel" = TRUE
WHERE email = 'you@yourdomain.com';
```

---

## Docker Compose Issues

### Login Problems

Reset the database:

```bash
docker exec -it twenty-server-1 npx nx database:reset --configuration=no-seed
```

Then restart containers.

### Reverse Proxy Connection Issues

- Verify `SERVER_URL` matches your external URL with correct protocol
- Ensure reverse proxy forwards `X-Forwarded-For` and `X-Forwarded-Proto` headers

### Image Upload Permission Errors

Change data folder ownership from root to another user and group.

---

## Getting Help

- Access logs: `docker compose logs`
- GitHub issues
- Discord community
