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

echo "📦 1/3 Building and pushing management-backend (Spring Boot)..."
./deploy-backend.sh
echo

echo "📦 2/3 Building and pushing agent-backend (Python/LangGraph)..."
./deploy-agent.sh
echo

echo "📦 3/3 Building and pushing simulation (FastAPI)..."
./deploy-simulation.sh
echo

echo "✅ All services deployed!"
echo
echo "App Runner will automatically deploy the new images (~2-3 minutes)."
echo
echo "Check status:"
echo "  cd infra/fast"
echo "  terraform.exe output"
echo
echo "Test endpoints:"
echo "  curl \$(cd infra/fast && terraform.exe output -raw management_backend_url)/actuator/health"
echo "  curl \$(cd infra/fast && terraform.exe output -raw agent_backend_url)/health"
echo "  curl \$(cd infra/fast && terraform.exe output -raw simulation_url)/docs"
