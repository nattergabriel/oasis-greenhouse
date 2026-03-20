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

# Validate AWS credentials
if ! aws.exe sts get-caller-identity &>/dev/null; then
  echo "❌ Error: AWS credentials expired or invalid. Please authenticate."
  exit 1
fi

# Track deployment status
FAILED_SERVICES=()

echo "📦 1/4 Building and pushing management-backend (Spring Boot)..."
if ! ./deploy-backend.sh; then
  echo "⚠️  Management backend deployment failed"
  FAILED_SERVICES+=("management-backend")
fi
echo

echo "📦 2/4 Building and pushing agent-backend (Python/LangGraph)..."
if ! ./deploy-agent.sh; then
  echo "⚠️  Agent backend deployment failed"
  FAILED_SERVICES+=("agent-backend")
fi
echo

echo "📦 3/4 Building and pushing simulation (FastAPI)..."
if ! ./deploy-simulation.sh; then
  echo "⚠️  Simulation deployment failed"
  FAILED_SERVICES+=("simulation")
fi
echo

echo "📦 4/4 Building and deploying frontend (Next.js → S3 + CloudFront)..."
if ! ./deploy-frontend.sh; then
  echo "⚠️  Frontend deployment failed"
  FAILED_SERVICES+=("frontend")
fi
echo

# Report results
if [ ${#FAILED_SERVICES[@]} -eq 0 ]; then
  echo "✅ All services deployed successfully!"
  echo "CloudFront deployment complete (cache invalidated)."
  echo
  echo "Get all connection details (frontend URL + API endpoints + API key):"
  echo "  cd infra/fast && ./get-api-info.sh"
else
  echo "❌ Deployment completed with errors:"
  for service in "${FAILED_SERVICES[@]}"; do
    echo "   - $service"
  done
  echo
  echo "Fix the failed services and re-run deployment."
  exit 1
fi
