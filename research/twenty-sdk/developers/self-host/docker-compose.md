# 1-Click w/ Docker Compose

> Источник: https://docs.twenty.com/developers/self-host/capabilities/docker-compose

> **Warning:** Docker containers are for production hosting or self-hosting.
> For contributing, please check the Local Setup guide.

## Overview

This guide provides step-by-step instructions to install and configure the Twenty application using Docker Compose.

**Important:** Only modify settings explicitly mentioned in this guide. Altering other configurations may lead to issues.

See [Setup Environment Variables](setup.md) for advanced configuration.

## System Requirements

- **RAM:** Ensure your environment has at least 2GB of RAM
- **Docker & Docker Compose:** Make sure both are installed and up-to-date

---

## Option 1: One-line script

Install the latest stable version:

```bash
bash <(curl -sL https://raw.githubusercontent.com/twentyhq/twenty/main/packages/twenty-docker/scripts/install.sh)
```

To install a specific version or branch:

```bash
VERSION=vx.y.z BRANCH=branch-name bash <(curl -sL https://raw.githubusercontent.com/twentyhq/twenty/main/packages/twenty-docker/scripts/install.sh)
```

---

## Option 2: Manual steps

### Step 1: Set Up the Environment File

1. **Create the .env File**

```bash
curl -o .env https://raw.githubusercontent.com/twentyhq/twenty/refs/heads/main/packages/twenty-docker/.env.example
```

2. **Generate Secret Tokens**

```bash
openssl rand -base64 32
```

**Important:** Keep this value secret / do not share it.

3. **Update the `.env`**

```ini
APP_SECRET=first_random_string
```

4. **Set the Postgres Password**

```ini
PG_DATABASE_PASSWORD=my_strong_password
```

Use a strong password **without special characters**.

### Step 2: Obtain the Docker Compose File

```bash
curl -o docker-compose.yml https://raw.githubusercontent.com/twentyhq/twenty/refs/heads/main/packages/twenty-docker/docker-compose.yml
```

### Step 3: Launch the Application

```bash
docker compose up -d
```

### Step 4: Access the Application

If you host on your own computer:
- Open browser → [http://localhost:3000](http://localhost:3000)

If you host on a server:

```bash
curl http://localhost:3000
```

---

## Configuration

### Expose Twenty to External Access

By default, Twenty runs on `localhost:3000`. Configure `SERVER_URL` in `.env`:

#### Understanding `SERVER_URL`

- **Protocol:** `http` (no SSL) or `https` (with SSL)
- **Domain/IP:** Domain name or IP address
- **Port:** Include if not using default (80/443)

### SSL Requirements

SSL (HTTPS) is required for certain browser features (clipboard API, etc.). We strongly recommend setting up Twenty behind a reverse proxy with SSL termination.

#### Configuring `SERVER_URL`

**Without Reverse Proxy (Direct Access):**

```ini
SERVER_URL=http://your-domain-or-ip:3000
```

**With Reverse Proxy (Standard Ports):**

```ini
SERVER_URL=https://your-domain-or-ip
```

**With Reverse Proxy (Custom Ports):**

```ini
SERVER_URL=https://your-domain-or-ip:custom-port
```

After changes, restart:

```bash
docker compose down
docker compose up -d
```

#### Considerations

- Ensure reverse proxy forwards requests to port 3000
- Open necessary firewall ports
- `SERVER_URL` must match how users access the app in their browsers

#### Persistence

- Docker Compose uses volumes for database and server storage
- For stateless environments, configure external storage

---

## Backup and Restore

### Create a Database Backup

```bash
docker exec twenty-postgres pg_dump -U postgres twenty > backup_$(date +%Y%m%d).sql
```

### Automate Daily Backups

Add to crontab (`crontab -e`):

```bash
0 2 * * * docker exec twenty-postgres pg_dump -U postgres twenty > /backups/twenty_$(date +\%Y\%m\%d).sql
```

### Restore from Backup

1. Stop the application:

```bash
docker compose stop twenty-server twenty-front
```

2. Restore the database:

```bash
docker exec -i twenty-postgres psql -U postgres twenty < backup_20240115.sql
```

3. Restart services:

```bash
docker compose up -d
```

### Backup Best Practices

- **Test restores regularly** — verify backups actually work
- **Store backups off-site** — use cloud storage (S3, GCS, etc.)
- **Encrypt sensitive data** — protect backups with encryption
- **Retain multiple copies** — keep daily, weekly, and monthly backups
