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

echo "🔄 5/5 Refreshing API Gateway integrations with Terraform..."
cd infra/fast
terraform.exe apply -auto-approve -target=aws_apigatewayv2_integration.management_backend -target=aws_apigatewayv2_integration.agent_backend -target=aws_apigatewayv2_integration.simulation
cd ../..
echo "✅ API Gateway integrations refreshed"
echo

echo "✅ All services deployed!"
echo
echo "App Runner will automatically deploy the new images (~2-3 minutes)."
echo "CloudFront deployment complete (cache invalidated)."
echo
echo "Get all connection details (frontend URL + API endpoints + API key):"
echo "  cd infra/fast && ./get-api-info.sh"
