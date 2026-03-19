#!/usr/bin/env bash
set -euo pipefail

REGION="us-west-2"

# Get ECR repository URL from Terraform output
cd infra/fast
SIMULATION_REPO=$(terraform.exe output -raw ecr_simulation_repository 2>/dev/null || echo "")
cd ../..

if [ -z "$SIMULATION_REPO" ]; then
  echo "❌ Error: ECR repository not found. Run 'terraform apply' first to create ECR repos."
  exit 1
fi

IMAGE="$SIMULATION_REPO:latest"

echo "Building and pushing simulation to $IMAGE..."

# Build Docker image
docker build -t "$IMAGE" ./simulation

# Extract account ID and login to ECR
ACCOUNT_ID=$(echo "$SIMULATION_REPO" | cut -d'.' -f1)
aws.exe ecr get-login-password --region "$REGION" | docker login --username AWS --password-stdin "$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com"

docker push "$IMAGE"

echo "✅ Pushed $IMAGE — App Runner will auto-deploy."
