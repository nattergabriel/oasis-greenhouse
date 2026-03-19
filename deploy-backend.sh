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

# 2. Build & push Docker image
docker build -t "$IMAGE" ./management-backend

# Extract account ID and login to ECR
ACCOUNT_ID=$(echo "$BACKEND_REPO" | cut -d'.' -f1)
aws.exe ecr get-login-password --region "$REGION" | docker login --username AWS --password-stdin "$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com"

docker push "$IMAGE"

echo "✅ Pushed $IMAGE — App Runner will auto-deploy."
