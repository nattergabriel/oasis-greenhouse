#!/usr/bin/env bash
set -euo pipefail

REGION="us-west-2"

# Validate AWS credentials
if ! aws.exe sts get-caller-identity &>/dev/null; then
  echo "❌ Error: AWS credentials expired or invalid. Please authenticate."
  exit 1
fi

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

echo "✅ Pushed $IMAGE"
echo ""
echo "🚀 Forcing immediate App Runner deployment..."
cd infra/fast
terraform.exe apply -auto-approve -target=aws_apprunner_service.simulation
SIMULATION_URL=$(terraform.exe output -raw simulation_url_internal)
cd ../..

echo ""
echo "⏳ Waiting for deployment to become healthy..."
ATTEMPT=0
MAX_ATTEMPTS=30
SLEEP_TIME=5

while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
  ATTEMPT=$((ATTEMPT + 1))

  if curl -sf "$SIMULATION_URL/health" > /dev/null 2>&1; then
    echo "✅ Simulation is healthy and deployed!"
    exit 0
  fi

  echo "   Attempt $ATTEMPT/$MAX_ATTEMPTS: waiting ${SLEEP_TIME}s..."
  sleep $SLEEP_TIME

  # Exponential backoff: increase wait time after 10 attempts
  if [ $ATTEMPT -eq 10 ] || [ $ATTEMPT -eq 20 ]; then
    SLEEP_TIME=$((SLEEP_TIME * 2))
  fi
done

echo "❌ ERROR: Simulation failed to become healthy after $((MAX_ATTEMPTS * 5 / 60)) minutes!"
echo "   Check logs: aws.exe logs tail /aws/apprunner/martian-greenhouse-simulation --follow"
exit 1
