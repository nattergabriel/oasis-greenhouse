#!/usr/bin/env bash
set -euo pipefail

echo "🚀 Deploying all services to AWS"
echo "================================"
echo

# Check Terraform is applied first
if [ ! -f "infra/fast/terraform.tfstate" ]; then
  echo "❌ Error: Terraform not applied yet"
  echo "   Run: cd infra/fast && terraform apply"
  exit 1
fi

echo "📦 1/4 Building and pushing management-backend (Spring Boot)..."
./deploy-backend.sh
echo

echo "📦 2/4 Building and pushing agent-backend (Python/LangGraph)..."
./deploy-agent.sh
echo

echo "📦 3/4 Building and pushing simulation (FastAPI)..."
./deploy-simulation.sh
echo

echo "📦 4/4 Building and deploying frontend (Next.js → S3 + CloudFront)..."
./deploy-frontend.sh
echo

echo "✅ All services deployed immediately!"
echo "CloudFront deployment complete (cache invalidated)."
echo
echo "Get all connection details (frontend URL + API endpoints + API key):"
echo "  cd infra/fast && ./get-api-info.sh"
