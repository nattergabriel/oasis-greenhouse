#!/usr/bin/env bash
set -euo pipefail

# Configures App Runner services with cross-service URLs
# Run AFTER: terraform apply (stage 2 of deployment)

echo "🔗 Configuring service-to-service URLs..."
echo ""

REGION="us-west-2"
PROJECT="martian-greenhouse"

# Get service URLs from Terraform
MANAGEMENT_URL=$(terraform.exe output -raw management_backend_url_internal)
AGENT_URL=$(terraform.exe output -raw agent_backend_url_internal)
SIMULATION_URL=$(terraform.exe output -raw simulation_url_internal)

# Get ECR repos from Terraform
MANAGEMENT_REPO=$(terraform.exe output -raw ecr_management_backend_repository)
AGENT_REPO=$(terraform.exe output -raw ecr_agent_backend_repository)
SIMULATION_REPO=$(terraform.exe output -raw ecr_simulation_repository)

echo "Discovered services:"
echo "  Management: $MANAGEMENT_URL"
echo "  Agent:      $AGENT_URL"
echo "  Simulation: $SIMULATION_URL"
echo ""

# Get App Runner service ARNs
echo "🔍 Finding App Runner service ARNs..."
MANAGEMENT_ARN=$(aws.exe apprunner list-services --region $REGION --query "ServiceSummaryList[?ServiceName=='$PROJECT-management-backend'].ServiceArn" --output text)
AGENT_ARN=$(aws.exe apprunner list-services --region $REGION --query "ServiceSummaryList[?ServiceName=='$PROJECT-agent-backend'].ServiceArn" --output text)
SIMULATION_ARN=$(aws.exe apprunner list-services --region $REGION --query "ServiceSummaryList[?ServiceName=='$PROJECT-simulation'].ServiceArn" --output text)

if [ -z "$MANAGEMENT_ARN" ] || [ -z "$AGENT_ARN" ] || [ -z "$SIMULATION_ARN" ]; then
  echo "❌ Error: Could not find all App Runner services. Ensure terraform apply completed successfully."
  exit 1
fi

echo "✅ Found all services"
echo ""

# Update via Terraform (simpler and safer)
echo "📝 Updating services via Terraform with environment variables..."

# Create tfvars file with URLs (keep for future deployments)
cat > service-urls.auto.tfvars << EOF
management_backend_python_url = "$AGENT_URL"
agent_sim_url = "$SIMULATION_URL"
agent_management_url = "$MANAGEMENT_URL"
simulation_backend_url = "$MANAGEMENT_URL"
EOF

echo ""
echo "⚠️  IMPORTANT: service-urls.auto.tfvars created."
echo "   This file must be kept and committed to git for deploy-*.sh scripts to work."
echo ""

# Re-apply Terraform with the new variables
terraform.exe apply -auto-approve

echo ""
echo "✅ All services configured!"
echo ""
echo "Services will redeploy automatically with new environment variables (~2-3 minutes)."
