# AWS Infrastructure - Fast Track Deployment

Deploy the Martian Greenhouse stack to AWS in **15 minutes**.

## Architecture

All services use **AWS App Runner** for consistent deployment:

| Service | Stack | Port | Purpose |
|---------|-------|------|---------|
| Management Backend | Spring Boot | 8080 | REST API, orchestration |
| Simulation Engine | FastAPI | 8000 | Physics simulation |
| Database | RDS Postgres | 5432 | State persistence |

## Prerequisites

- AWS CLI v2 configured with credentials
- Terraform 1.6+
- Docker
- Java 21 (for local Maven builds)
- Python 3.12+ (for simulation)

## Quick Start

### 1. Configure AWS

```bash
aws configure
# Enter: Access Key, Secret Key, Region (us-west-2)

# Verify
aws sts get-caller-identity
```

### 2. Create terraform.tfvars

```bash
cd infra/fast

cat > terraform.tfvars << 'EOF'
aws_region  = "us-west-2"

# Database
db_username = "postgres"
db_password = "<STRONG-PASSWORD>"

# Auth tokens (generate with: openssl rand -hex 32)
agent_token  = "<RANDOM-HEX-64-CHARS>"
system_token = "<RANDOM-HEX-64-CHARS>"
api_key      = "<RANDOM-HEX-32-CHARS>"

# Optional: Frontend deployment
github_repo = ""  # Leave empty to run frontend locally
EOF
```

**Generate tokens:**
```bash
openssl rand -hex 32  # agent_token
openssl rand -hex 32  # system_token
openssl rand -hex 16  # api_key
```

### 3. Deploy Infrastructure

```bash
terraform init
terraform apply
# Type 'yes' when prompted
```

**Takes ~10-15 minutes** (RDS provisioning is slow). Outputs ECR repository URLs and service endpoints.

### 4. Build & Push Docker Images

```bash
cd ../..
./deploy-all.sh
```

App Runner auto-deploys the new images (~2-3 minutes).

### 5. Verify Deployment

```bash
cd infra/fast
terraform output

# Test management backend
curl $(terraform output -raw management_backend_url)/actuator/health
# Expected: {"status":"UP"}

# Test simulation
curl $(terraform output -raw simulation_url)/docs
# Expected: FastAPI documentation page
```

## API Authentication

All API endpoints require the `X-API-Key` header:

```bash
curl -H "X-API-Key: YOUR-API-KEY" \
     https://your-api-gateway-url/api/health
```

Get your API key:
```bash
terraform output -raw api_key_demo
```

## Local Development

Run everything locally without AWS:

```bash
# Start Postgres + Management Backend
docker-compose up

# Run simulation locally
cd simulation
uvicorn src.main:app --port 8001 --reload

# Run frontend locally
cd frontend
npm install
echo "VITE_API_BASE_URL=http://localhost:8080" > .env.local
npm run dev
```

Services available at:
- Backend: http://localhost:8080
- Simulation: http://localhost:8001
- Frontend: http://localhost:5173
- Postgres: localhost:5432

## Subsequent Deployments

### Update Management Backend
```bash
./deploy-backend.sh
```

### Update Simulation
```bash
./deploy-simulation.sh
```

### Update Infrastructure
```bash
cd infra/fast
terraform apply
```

## Cost Estimate

| Service | Free Tier | Cost After |
|---------|-----------|------------|
| RDS db.t3.micro | 750 hrs/month | ~$15/month |
| App Runner (2 services) | 50 vCPU-hrs + 100 GB-hrs | ~$10/month |
| ECR | 500 MB | ~$0 |
| Secrets Manager | $0.40/secret/month | ~$2.40/month |

**Total: ~$0-5 for 2-day hackathon** (within free tier)

**Clean up:** `terraform destroy`

## Troubleshooting

### "ECR repository already exists"
```bash
aws ecr delete-repository --repository-name greenhouse-management-backend --force --region us-west-2
terraform apply
```

### "App Runner health check failing"
- Wait 2-3 minutes for startup
- Check logs: AWS Console → App Runner → Logs
- Verify image: `aws ecr describe-images --repository-name greenhouse-management-backend`

### "Permission denied" on deploy scripts
```bash
chmod +x deploy-*.sh
```

### "Terraform state conflicts"
Only one person should run `terraform apply`. Back up `terraform.tfstate` regularly.

## Security Features

- ✅ Database in private subnets with deletion protection
- ✅ All secrets in AWS Secrets Manager
- ✅ API key authentication required
- ✅ CORS restrictions (localhost + Amplify domains)
- ✅ ECR vulnerability scanning enabled
- ✅ Minimal logging (errors only)

## What Gets Deployed

- ECR repositories for Docker images
- RDS Postgres database (db.t3.micro)
- App Runner services with auto-deploy enabled
- Secrets Manager for credentials
- API Gateway with Lambda authorizer
- (Optional) Amplify for frontend hosting

---

**Total deployment time: ~20 minutes from zero to production**

For production architecture, see `../production/README.md`
