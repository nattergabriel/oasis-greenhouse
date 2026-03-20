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

# Build Docker image (NO CACHE - always fresh build)
docker build --no-cache -t "$IMAGE" ./backend

# Extract account ID and login to ECR
ACCOUNT_ID=$(echo "$AGENT_REPO" | cut -d'.' -f1)
aws.exe ecr get-login-password --region "$REGION" | docker login --username AWS --password-stdin "$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com"

docker push "$IMAGE"

echo "✅ Pushed $IMAGE"
echo ""
echo "🚀 Forcing immediate App Runner deployment..."
cd infra/fast
terraform.exe apply -auto-approve -target=aws_apprunner_service.agent_backend
AGENT_URL=$(terraform.exe output -raw agent_backend_url_internal)
cd ../..

echo ""
echo "⏳ Waiting for deployment to become healthy..."
for i in {1..60}; do
  if curl -sf "$AGENT_URL/health" > /dev/null 2>&1; then
    echo "✅ Agent backend is healthy and deployed!"
    exit 0
  fi
  echo "   Attempt $i/60: waiting for health check..."
  sleep 5
done

echo "❌ ERROR: Agent backend failed to become healthy after 5 minutes!"
echo "   Check logs: aws.exe logs tail /aws/apprunner/martian-greenhouse-agent-backend --follow"
exit 1
