# Production Track — Infrastructure Specification

This document describes the production-grade infrastructure for the Martian Greenhouse project. No Terraform files are provided here — implement this spec when graduating from the Fast Track.

---

## Architecture Overview

```
Internet
   │
   ├── AWS Amplify (React SPA, CDN-distributed)
   │
   ├── API Gateway (HTTP API)
   │   ├── /api/**   → Lambda: Spring Boot backend (SnapStart)
   │   └── /agent/** → Lambda: FastAPI agent (SnapStart)
   │
   └── EventBridge Scheduler
           └── Lambda: Python simulation tick
                   │
                   ▼
           Private VPC subnet
           ├── RDS Proxy
           │     └── Aurora PostgreSQL Serverless v2
           └── (NAT Gateway → Internet for outbound calls)
```

---

## VPC & Networking (`modules/networking`)

### Subnets
- **Public subnets** (2 AZs): NAT Gateway, Application Load Balancer (if needed)
- **Private subnets** (2 AZs): Lambda ENIs, RDS Proxy, Aurora cluster

### Components
- **NAT Gateway** — one per AZ for HA; single NAT is acceptable for cost savings in staging
- **Internet Gateway** — attached to the VPC for public subnet egress
- **Security Groups**
  - `sg-lambda`: allows outbound 443 (HTTPS) and 5432 (PostgreSQL via RDS Proxy); no inbound
  - `sg-rds-proxy`: allows inbound 5432 from `sg-lambda` only
  - `sg-aurora`: allows inbound 5432 from `sg-rds-proxy` only

### Route Tables
- Public route table: `0.0.0.0/0 → IGW`
- Private route table: `0.0.0.0/0 → NAT Gateway`

---

## Database (`modules/database`)

### Aurora PostgreSQL Serverless v2
- Engine: `aurora-postgresql`, compatible with PostgreSQL 16
- **Scales to zero** when idle — ideal for hackathon overnight downtime
- Min ACUs: `0` (scales to zero), Max ACUs: `8`
- Multi-AZ writer instance; optional reader for read-heavy workloads
- Deployed in **private subnets** only
- `deletion_protection = true` in production

### RDS Proxy
- Sits in front of the Aurora cluster
- Pools connections — critical because Lambda scales out rapidly
- Uses IAM authentication (no static password in env vars)
- Deployed in **private subnets**, accessible only from `sg-lambda`

### Secrets
- DB credentials stored in Secrets Manager; RDS Proxy rotates them automatically
- Lambda retrieves credentials via IAM + Secrets Manager (no hardcoded passwords)

---

## Backend Lambda (`modules/backend`)

### Runtime
- Java 21 (Spring Boot 3), packaged as a fat JAR
- **SnapStart enabled** — eliminates JVM cold start by snapshotting the initialized execution environment
- Memory: 1024 MB; Ephemeral storage: 512 MB

### API Gateway
- HTTP API (not REST API) — lower cost, lower latency
- `$default` stage with `$default` route → Lambda integration
- Payload format version 2.0
- Custom domain: `api.martian-greenhouse.example.com`

### VPC Configuration
- Lambda runs inside the private VPC subnet
- Connects to Aurora via RDS Proxy using the `sg-lambda` security group
- Outbound internet access via NAT Gateway (for Secrets Manager, CloudWatch)

### Environment Variables
- `DB_PROXY_ENDPOINT` — RDS Proxy endpoint
- `AGENT_TOKEN_SECRET_ARN` — Secrets Manager ARN (resolved at runtime)
- `SYSTEM_TOKEN_SECRET_ARN` — Secrets Manager ARN

---

## Agent Lambda (`modules/agent`)

### Runtime
- Python 3.12, packaged as a container image (ECR)
- **SnapStart** — available for Python container images via Lambda SnapStart (if supported at deploy time; otherwise use Provisioned Concurrency as fallback)
- Memory: 1024 MB; Timeout: 60 seconds

### API Gateway
- Same HTTP API as backend, different route prefix: `/agent/**`
- Or a dedicated HTTP API on a separate custom domain: `agent.martian-greenhouse.example.com`

### Environment Variables
- `BACKEND_URL` — internal ALB or Lambda function URL for backend
- `AGENT_TOKEN_SECRET_ARN`
- `ANTHROPIC_API_KEY_SECRET_ARN`

---

## Simulation Lambda (`modules/simulation`)

### Runtime
- Python 3.12, zip deploy
- Triggered by EventBridge Scheduler: `rate(1 minute)` = 1 mission day
- No VPC needed if it only calls the backend/agent over HTTPS
- Timeout: 60 seconds

### Environment Variables
- `BACKEND_URL`
- `AGENT_URL`
- `SYSTEM_TOKEN_SECRET_ARN`
- `ACTIVE_SIMULATION_ID` — updated via Lambda environment variable update (or SSM Parameter Store for dynamic config)

### Operational Note
Use SSM Parameter Store for `ACTIVE_SIMULATION_ID` instead of a Lambda env var — env var updates require a new function version and cause a brief unavailability window.

---

## Frontend (`modules/frontend`)

### AWS Amplify (same as Fast Track)
- Connected to GitHub, auto-deploys on push to `main`
- Build output: `frontend/dist`
- Custom domain: `martian-greenhouse.example.com`
- Environment variable `VITE_API_BASE_URL` points to the API Gateway custom domain

---

## Modular Terraform Structure

```
infra/production/
├── main.tf                  # Root module: calls all child modules
├── variables.tf             # Top-level inputs
├── outputs.tf               # Aggregated outputs
├── backend.tf               # Remote state config (S3 + DynamoDB)
└── modules/
    ├── networking/
    │   ├── main.tf          # VPC, subnets, IGW, NAT, route tables, SGs
    │   ├── variables.tf
    │   └── outputs.tf       # vpc_id, private_subnet_ids, sg_lambda_id, etc.
    ├── database/
    │   ├── main.tf          # Aurora Serverless v2, RDS Proxy, Secrets Manager
    │   ├── variables.tf
    │   └── outputs.tf       # proxy_endpoint, db_secret_arn
    ├── backend/
    │   ├── main.tf          # Lambda (SnapStart), API Gateway, IAM
    │   ├── variables.tf
    │   └── outputs.tf       # api_gateway_url
    ├── agent/
    │   ├── main.tf          # Lambda (container), API Gateway or route, IAM
    │   ├── variables.tf
    │   └── outputs.tf       # agent_url
    ├── simulation/
    │   ├── main.tf          # Lambda, EventBridge Scheduler, IAM
    │   ├── variables.tf
    │   └── outputs.tf
    └── frontend/
        ├── main.tf          # Amplify app, branch, custom domain
        ├── variables.tf
        └── outputs.tf       # frontend_url
```

---

## Remote Terraform State

### S3 Bucket
```hcl
# backend.tf (production)
terraform {
  backend "s3" {
    bucket         = "martian-greenhouse-tfstate"
    key            = "production/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "martian-greenhouse-tfstate-lock"
  }
}
```

### DynamoDB Lock Table
- Table name: `martian-greenhouse-tfstate-lock`
- Partition key: `LockID` (String)
- Billing mode: PAY_PER_REQUEST

### Bootstrap
Run once before `terraform init`:
```bash
aws s3api create-bucket --bucket martian-greenhouse-tfstate --region us-east-1
aws s3api put-bucket-versioning --bucket martian-greenhouse-tfstate \
  --versioning-configuration Status=Enabled
aws s3api put-bucket-encryption --bucket martian-greenhouse-tfstate \
  --server-side-encryption-configuration '{"Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"AES256"}}]}'
aws dynamodb create-table --table-name martian-greenhouse-tfstate-lock \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST
```

---

## GitHub Actions CI/CD Pipeline

### Workflow: Backend Deploy (`.github/workflows/backend.yml`)
```
trigger: push to main, paths: backend/**

jobs:
  build-and-push:
    1. Build Docker image (or JAR)
    2. Authenticate to ECR
    3. Push image to ECR with :latest and :<git-sha> tags

  deploy:
    needs: build-and-push
    1. terraform init
    2. terraform apply -auto-approve \
         -var ecr_backend_image=<new-image-uri>
    # OR for Lambda: aws lambda update-function-code
```

### Workflow: Agent Deploy (`.github/workflows/agent.yml`)
```
trigger: push to main, paths: agent/**

jobs:
  build-and-push:
    1. Build container image
    2. Push to ECR

  deploy:
    needs: build-and-push
    1. aws lambda update-function-code \
         --function-name martian-greenhouse-agent \
         --image-uri <new-image-uri>
    2. aws lambda publish-version (for SnapStart)
    3. Update alias to point to new version
```

### Workflow: Simulation Deploy (`.github/workflows/simulation.yml`)
```
trigger: push to main, paths: simulation/**

jobs:
  deploy:
    1. cd simulation && zip -r simulation.zip .
    2. aws lambda update-function-code \
         --function-name martian-greenhouse-simulation \
         --zip-file fileb://simulation.zip
```

### Workflow: Frontend (handled by Amplify)
Amplify auto-builds on push — no separate GitHub Actions workflow needed.

### Required GitHub Secrets
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_REGION`
- `ECR_REGISTRY` (e.g., `123456789.dkr.ecr.us-east-1.amazonaws.com`)

---

## Cost Estimates

### Fast Track (approximate monthly)
| Service | Config | Est. Cost |
|---|---|---|
| RDS PostgreSQL | db.t3.micro, 20 GB gp2 | ~$15 |
| App Runner (backend) | 1 vCPU / 2 GB, ~50% utilization | ~$30 |
| App Runner (agent) | 1 vCPU / 2 GB, ~20% utilization | ~$15 |
| Lambda (simulation) | 60s × 1440/day, 512 MB | ~$1 |
| Secrets Manager | 4 secrets | ~$2 |
| Amplify | Build minutes + hosting | ~$5 |
| CloudWatch Logs | ~5 GB/month | ~$3 |
| **Total** | | **~$71/month** |

> Fast Track has no data transfer savings from VPC — App Runner instances run 24/7 unless scaled to 0 manually.

### Production Track (approximate monthly)
| Service | Config | Est. Cost |
|---|---|---|
| Aurora Serverless v2 | 0–8 ACUs, scales to zero | ~$10–40 (usage-based) |
| RDS Proxy | 0.015/hour per vCPU | ~$11 |
| Lambda (backend) | SnapStart, 1024 MB, ~10K req/day | ~$2 |
| Lambda (agent) | Container, 1024 MB, ~1K req/day | ~$1 |
| Lambda (simulation) | 60s × 1440/day, 512 MB | ~$1 |
| API Gateway | HTTP API, ~11K req/day | ~$1 |
| NAT Gateway | ~10 GB/month data | ~$35 |
| Amplify | Same as Fast Track | ~$5 |
| Secrets Manager | 4 secrets + rotation | ~$3 |
| CloudWatch Logs | ~5 GB/month | ~$3 |
| **Total** | | **~$72–102/month** |

> The NAT Gateway dominates production costs. For a hackathon or low-traffic deployment, consider a single NAT Gateway (not one per AZ) to save ~$35/month.

---

## Migration Path: Fast Track → Production Track

### Phase 1 — Prepare state and modules (no downtime)
1. Bootstrap S3 + DynamoDB for remote state.
2. Write the modular Terraform under `infra/production/`.
3. Do NOT destroy Fast Track resources yet.

### Phase 2 — Database migration
1. Provision Aurora Serverless v2 + RDS Proxy in the new VPC.
2. Use `pg_dump` / `pg_restore` or AWS DMS to migrate data from the public RDS instance.
3. Validate data integrity in Aurora.

### Phase 3 — Redeploy services
1. Migrate backend from App Runner → Lambda + API Gateway (SnapStart).
2. Migrate agent from App Runner → Lambda (container).
3. Update `BACKEND_URL` and `AGENT_URL` in simulation Lambda.
4. Update Amplify `VITE_API_BASE_URL` to point to the new API Gateway endpoint.

### Phase 4 — DNS cutover
1. Point custom domain DNS records to the new API Gateway and Amplify endpoints.
2. Wait for TTL to expire.
3. Validate all endpoints are healthy.

### Phase 5 — Decommission Fast Track
1. Run `terraform destroy` in `infra/fast/`.
2. Delete the public RDS instance after confirming zero traffic.

### Key considerations
- The database schema is identical between tracks — no schema migration needed, only a data copy.
- App Runner → Lambda requires adapting the Spring Boot app to use the AWS Lambda Web Adapter or restructuring as a handler; plan for this effort.
- All secrets remain in Secrets Manager — only ARNs change, so update references in Terraform.
