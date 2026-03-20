# 🚀 Martian Greenhouse Command Center

AI-powered greenhouse management system for Mars surface missions. Full-stack application with agent-based decision making.

## 🏗️ Architecture

**Frontend:** Next.js 16 + React 19 + Tailwind CSS → CloudFront + S3
**Backend:** Spring Boot (Java) → AWS App Runner
**Agent:** Python + LangGraph + AWS Bedrock → AWS App Runner
**Simulation:** FastAPI → AWS App Runner
**Database:** PostgreSQL on AWS RDS
**API:** AWS API Gateway with Lambda authorizer

## ⚡ Quick Deploy

**Prerequisites:** AWS CLI, Terraform, Docker, Node.js 18+

### 1. Infrastructure Setup
```bash
cd infra/fast
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your secrets
terraform init
terraform apply
```

### 2. Configure Service URLs (Two-Stage Deployment)
```bash
./configure-service-urls.sh
```
*This sets cross-service environment variables after initial creation*

### 3. Deploy Services
```bash
cd ../..
./deploy-all.sh       # Deploy all services
# OR deploy individually:
./deploy-backend.sh   # Management backend
./deploy-agent.sh     # Agent backend
./deploy-simulation.sh
./deploy-frontend.sh
```

### 4. Verify
```bash
./verify-deployment.sh
```

## 🔑 Get Frontend URL & API Key
```bash
cd infra/fast
terraform output frontend_url
terraform output -raw api_key_demo
```

## 📦 Services

| Service | Path | Description |
|---------|------|-------------|
| Frontend | `/` | Next.js web interface |
| Management | `/api/greenhouses` | CRUD for greenhouse data |
| Agent | `/run` | AI decision engine |
| Simulation | `/health` | Greenhouse simulation |

## 🛠️ Development

**Local Frontend:**
```bash
cd frontend
npm install
npm run dev  # http://localhost:3000
```

**Local Backend:**
```bash
cd management-backend
./mvnw spring-boot:run
```

## 🔧 Troubleshooting

**Services won't start?** Run stage 2: `cd infra/fast && ./configure-service-urls.sh`
**Frontend 403?** Run: `bash deploy-frontend.sh` (invalidates CloudFront cache)
**Health checks fail?** Check logs: `aws logs tail /aws/apprunner/martian-greenhouse-<service> --follow`

## 📁 Project Structure

```
infra/fast/          Terraform infrastructure
management-backend/  Spring Boot REST API
backend/            Python LangGraph agent
simulation/         FastAPI simulation engine
frontend/           Next.js web app
deploy-*.sh         Deployment scripts
verify-deployment.sh System health check
```

## 🌍 Deployed URLs (from Terraform output)
- Frontend: CloudFront distribution
- API Gateway: `/prod` endpoint with API key auth
- Direct service URLs: Internal App Runner URLs
