# Twenty CRM - GCloud Migration Plan

## Overview
Migration from local Docker deployment to Google Cloud Platform (GKE).

## Current State
- Twenty v1.14.0 running locally via Docker Compose
- PostgreSQL database in container
- Redis cache in container
- 9 Twenty Apps deployed (serverless functions)
- Google OAuth integration pending (credentials needed)

## Target Architecture on GCP

### Option A: GKE (Google Kubernetes Engine) - Recommended
```
┌─────────────────────────────────────────────────────────┐
│                    Cloud Load Balancer                   │
│                    (HTTPS, SSL Certificate)              │
└────────────────────────┬────────────────────────────────┘
                         │
┌────────────────────────┼────────────────────────────────┐
│                   GKE Cluster                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │ twenty-     │  │ twenty-     │  │ twenty-     │     │
│  │ server      │  │ worker      │  │ server      │     │
│  │ (replica 1) │  │ (replica 1) │  │ (replica 2) │     │
│  └─────────────┘  └─────────────┘  └─────────────┘     │
└────────────────────────┬────────────────────────────────┘
                         │
         ┌───────────────┼───────────────┐
         │               │               │
┌────────┴────────┐ ┌────┴────┐  ┌──────┴──────┐
│   Cloud SQL     │ │ Memory- │  │ Cloud       │
│   (PostgreSQL)  │ │ store   │  │ Storage     │
└─────────────────┘ │ (Redis) │  │ (Files/S3)  │
                    └─────────┘  └─────────────┘
```

### Option B: Cloud Run (Simpler, Serverless)
- Cloud Run for server and worker
- Cloud SQL for PostgreSQL
- Memorystore for Redis
- Cloud Storage for files

## Migration Steps

### Phase 1: Infrastructure Setup

1. **Create GKE Cluster**
```bash
# Set project
gcloud config set project split-12-08-25

# Create cluster
gcloud container clusters create twenty-cluster \
  --zone us-central1-a \
  --num-nodes 2 \
  --machine-type e2-medium \
  --enable-autoscaling \
  --min-nodes 1 \
  --max-nodes 4

# Get credentials
gcloud container clusters get-credentials twenty-cluster --zone us-central1-a
```

2. **Create Cloud SQL PostgreSQL**
```bash
gcloud sql instances create twenty-postgres \
  --database-version=POSTGRES_16 \
  --tier=db-g1-small \
  --region=us-central1 \
  --root-password=<SECURE_PASSWORD>

gcloud sql databases create default --instance=twenty-postgres
```

3. **Create Memorystore Redis**
```bash
gcloud redis instances create twenty-redis \
  --size=1 \
  --region=us-central1 \
  --redis-version=redis_7_0
```

4. **Create Cloud Storage Bucket**
```bash
gsutil mb -l us-central1 gs://twenty-crm-storage-split
```

### Phase 2: Data Migration

1. **Export PostgreSQL Data**
```bash
# From local
docker exec twenty-db-1 pg_dump -U postgres default > twenty_backup.sql
```

2. **Import to Cloud SQL**
```bash
# Upload to Cloud Storage
gsutil cp twenty_backup.sql gs://twenty-crm-storage-split/backups/

# Import to Cloud SQL
gcloud sql import sql twenty-postgres \
  gs://twenty-crm-storage-split/backups/twenty_backup.sql \
  --database=default
```

### Phase 3: Kubernetes Deployment

1. **Create Namespace and Secrets**
```bash
kubectl create namespace twentycrm

kubectl create secret generic twenty-secrets -n twentycrm \
  --from-literal=APP_SECRET=$(openssl rand -base64 32) \
  --from-literal=PG_DATABASE_PASSWORD=<CLOUD_SQL_PASSWORD> \
  --from-literal=AUTH_GOOGLE_CLIENT_ID=<YOUR_CLIENT_ID> \
  --from-literal=AUTH_GOOGLE_CLIENT_SECRET=<YOUR_CLIENT_SECRET>
```

2. **Apply Terraform or K8s Manifests**
```bash
cd packages/twenty-docker/k8s/terraform
terraform init
terraform apply -var="twentycrm_pgdb_admin_password=<PASSWORD>" \
  -var="twentycrm_app_hostname=https://crm.split-llc.com"
```

### Phase 4: DNS and SSL

1. **Reserve Static IP**
```bash
gcloud compute addresses create twenty-ip --global
```

2. **Create Managed Certificate**
```bash
# Create certificate resource in GKE
kubectl apply -f - <<EOF
apiVersion: networking.gke.io/v1
kind: ManagedCertificate
metadata:
  name: twenty-cert
  namespace: twentycrm
spec:
  domains:
    - crm.split-llc.com
EOF
```

3. **Configure DNS**
- Point crm.split-llc.com to the static IP

### Phase 5: Verification

1. Test application access
2. Verify database connectivity
3. Test Google OAuth integration
4. Verify all 9 Twenty Apps function correctly
5. Test email/calendar sync

## Environment Variables for GCP

```yaml
# In ConfigMap or Secrets
SERVER_URL: https://crm.split-llc.com
PG_DATABASE_URL: postgres://postgres:<PASSWORD>@<CLOUD_SQL_IP>/default
REDIS_URL: redis://<MEMORYSTORE_IP>:6379
STORAGE_TYPE: s3  # Use S3-compatible for Cloud Storage
STORAGE_S3_ENDPOINT: https://storage.googleapis.com
STORAGE_S3_REGION: us-central1
STORAGE_S3_NAME: twenty-crm-storage-split

# Google OAuth
MESSAGING_PROVIDER_GMAIL_ENABLED: "true"
CALENDAR_PROVIDER_GOOGLE_ENABLED: "true"
AUTH_GOOGLE_CLIENT_ID: <YOUR_CLIENT_ID>
AUTH_GOOGLE_CLIENT_SECRET: <YOUR_CLIENT_SECRET>
AUTH_GOOGLE_CALLBACK_URL: https://crm.split-llc.com/auth/google/redirect
AUTH_GOOGLE_APIS_CALLBACK_URL: https://crm.split-llc.com/auth/google-apis/get-access-token
```

## Estimated Resources

| Service | Tier | Estimated Cost/Month |
|---------|------|---------------------|
| GKE Cluster (2 nodes) | e2-medium | ~$100 |
| Cloud SQL PostgreSQL | db-g1-small | ~$30 |
| Memorystore Redis | 1GB | ~$35 |
| Cloud Storage | 10GB | ~$1 |
| Load Balancer | Standard | ~$20 |
| **Total** | | **~$186/month** |

## Next Steps

1. Confirm domain name for production (crm.split-llc.com?)
2. Get Google OAuth credentials (browser opened)
3. Choose deployment option (GKE vs Cloud Run)
4. Execute Phase 1 infrastructure setup
5. Perform data migration
6. Deploy and verify
