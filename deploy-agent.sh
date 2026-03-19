#!/usr/bin/env bash
set -euo pipefail

REGION="us-west-2"

# Get ECR repository URL from Terraform output
cd infra/fast
AGENT_REPO=$(terraform.exe output -raw ecr_agent_backend_repository 2>/dev/null || echo "")
cd ../..

if [ -z "$AGENT_REPO" ]; then
  echo "❌ Error: ECR repository not found. Run 'terraform apply' first to create ECR repos."
  exit 1
fi

IMAGE="$AGENT_REPO:latest"

echo "Building and pushing agent-backend to $IMAGE..."

# Build Docker image
docker build -t "$IMAGE" ./backend

# Extract account ID and login to ECR
ACCOUNT_ID=$(echo "$AGENT_REPO" | cut -d'.' -f1)
aws.exe ecr get-login-password --region "$REGION" | docker login --username AWS --password-stdin "$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com"

docker push "$IMAGE"

echo "✅ Pushed $IMAGE — App Runner will auto-deploy."
echo ""
echo "🔄 Refreshing API Gateway integration with Terraform..."
cd infra/fast
terraform.exe apply -auto-approve -target=aws_apigatewayv2_integration.agent_backend
cd ../..
echo "✅ API Gateway integration refreshed"
