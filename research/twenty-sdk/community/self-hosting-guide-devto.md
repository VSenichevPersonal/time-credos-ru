# Self-Hosting Twenty CRM: A Complete Guide

> Источник: https://dev.to/raju_gangitla_91920e1427f/self-hosting-twenty-crm-a-complete-guide-559n
> Автор: Raju Gangitla | Октябрь 2024

---

## Overview

Guide explains how to self-host Twenty CRM — open-source CRM tool.
Self-hosting provides greater control over data, privacy, and customization.

---

## Step 1: Prepare Your Environment

**System Requirements:**
- Minimum 2GB RAM
- Docker and Docker Compose (up-to-date versions)

**Quick Start:**

```bash
bash <(curl -sL https://git.new/20)
```

**Manual Setup — generate secure tokens:**

```bash
openssl rand -base64 32
```

---

## Step 2: Download Configuration Files

```bash
curl -O https://raw.githubusercontent.com/twentyhq/twenty/main/packages/twenty-docker/docker-compose.yml
```

Configure `.env` file: database passwords, server URLs.

---

## Step 3: Launch the Application

```bash
docker-compose up -d
```

Check status:

```bash
docker-compose ps
```

Review logs:

```bash
docker-compose logs
```

---

## Step 4: Access and Configure

**Local:** `http://localhost:3000`

**External Access:** Modify `SERVER_URL` in `.env`, then:

```bash
docker-compose down && docker-compose up -d
```

Ensure port 3000 is open.

---

## Troubleshooting

- **Unable to Log In:** Run database reset commands
- **Reverse Proxy Issues:** Set `X-Forwarded-For` and `X-Forwarded-Proto` headers, restart proxy + CRM
- **Server URL Conflicts:** Verify `SERVER_URL` matches access URL (especially with SSL)
- **General:** Review Docker Compose logs
