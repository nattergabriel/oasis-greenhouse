#!/usr/bin/env bash
set -euo pipefail

REGION="us-west-2"

# Get ECR repository URL from Terraform output
cd infra/fast
BACKEND_REPO=$(terraform.exe output -raw ecr_management_backend_repository 2>/dev/null || echo "")
cd ../..

if [ -z "$BACKEND_REPO" ]; then
  echo "❌ Error: ECR repository not found. Run 'terraform apply' first to create ECR repos."
  exit 1
fi

IMAGE="$BACKEND_REPO:latest"

echo "Building and pushing management-backend to $IMAGE..."

# 1. Build JAR
cd management-backend
./mvnw package -DskipTests -q
cd ..

# 2. Build & push Docker image (NO CACHE - always fresh build)
docker build --no-cache -t "$IMAGE" ./management-backend

# Extract account ID and login to ECR
ACCOUNT_ID=$(echo "$BACKEND_REPO" | cut -d'.' -f1)
aws.exe ecr get-login-password --region "$REGION" | docker login --username AWS --password-stdin "$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com"

docker push "$IMAGE"

echo "✅ Pushed $IMAGE"
echo ""
echo "🚀 Forcing immediate App Runner deployment..."
cd infra/fast
terraform.exe apply -auto-approve -target=aws_apprunner_service.management_backend
BACKEND_URL=$(terraform.exe output -raw management_backend_url_internal)
cd ../..

echo ""
echo "⏳ Waiting for deployment to become healthy..."
for i in {1..60}; do
  if curl -sf "$BACKEND_URL/actuator/health" > /dev/null 2>&1; then
    echo "✅ Management backend is healthy and deployed!"
    exit 0
  fi
  echo "   Attempt $i/60: waiting for health check..."
  sleep 5
done

echo "❌ ERROR: Management backend failed to become healthy after 5 minutes!"
echo "   Check logs: aws.exe logs tail /aws/apprunner/martian-greenhouse-management-backend --follow"
exit 1
