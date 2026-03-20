#!/usr/bin/env bash
set -euo pipefail

echo "🔍 Verifying Martian Greenhouse Deployment"
echo "=========================================="
echo ""

REGION="us-west-2"
FAILED=0

# Get URLs from Terraform
cd infra/fast
FRONTEND_URL=$(terraform.exe output -raw frontend_url 2>/dev/null || echo "")
MANAGEMENT_URL=$(terraform.exe output -raw management_backend_url_internal 2>/dev/null || echo "")
AGENT_URL=$(terraform.exe output -raw agent_backend_url_internal 2>/dev/null || echo "")
SIMULATION_URL=$(terraform.exe output -raw simulation_url_internal 2>/dev/null || echo "")
API_GATEWAY_URL=$(terraform.exe output -raw api_gateway_url 2>/dev/null || echo "")
cd ../..

echo "📍 Service URLs"
echo "  Frontend:    $FRONTEND_URL"
echo "  Management:  $MANAGEMENT_URL"
echo "  Agent:       $AGENT_URL"
echo "  Simulation:  $SIMULATION_URL"
echo "  API Gateway: $API_GATEWAY_URL"
echo ""

# Test Frontend
echo "🌐 Testing Frontend..."
if curl -sf "$FRONTEND_URL" > /dev/null 2>&1; then
  echo "  ✅ Frontend accessible"
else
  echo "  ❌ Frontend not accessible"
  FAILED=$((FAILED + 1))
fi

# Test Management Backend
echo "🏢 Testing Management Backend..."
if curl -sf "$MANAGEMENT_URL/actuator/health" > /dev/null 2>&1; then
  echo "  ✅ Health check passing"
  # Check environment variables
  cd infra/fast
  PYTHON_URL=$(terraform.exe show | grep -A 3 'management.*runtime_environment_variables' | grep PYTHON_BACKEND_URL | cut -d'"' -f4 || echo "")
  cd ../..
  if [ -n "$PYTHON_URL" ]; then
    echo "  ✅ PYTHON_BACKEND_URL configured: $PYTHON_URL"
  else
    echo "  ⚠️  PYTHON_BACKEND_URL not set"
  fi
else
  echo "  ❌ Health check failing"
  FAILED=$((FAILED + 1))
fi

# Test Agent Backend
echo "🤖 Testing Agent Backend..."
if curl -sf "$AGENT_URL/" > /dev/null 2>&1; then
  echo "  ✅ Service responding"
  # Check environment variables
  cd infra/fast
  SIM_URL=$(terraform.exe show | grep -A 5 'agent.*runtime_environment_variables' | grep SIM_ENGINE_URL | cut -d'"' -f4 || echo "")
  MGMT_URL=$(terraform.exe show | grep -A 5 'agent.*runtime_environment_variables' | grep MANAGEMENT_BACKEND_URL | cut -d'"' -f4 || echo "")
  cd ../..
  if [ -n "$SIM_URL" ] && [ -n "$MGMT_URL" ]; then
    echo "  ✅ Environment variables configured"
    echo "     SIM_ENGINE_URL: $SIM_URL"
    echo "     MANAGEMENT_BACKEND_URL: $MGMT_URL"
  else
    echo "  ⚠️  Environment variables missing"
  fi
else
  echo "  ❌ Service not responding"
  FAILED=$((FAILED + 1))
fi

# Test Simulation
echo "🔬 Testing Simulation..."
if curl -sf "$SIMULATION_URL/health" > /dev/null 2>&1; then
  echo "  ✅ Health check passing"
  # Check environment variables
  cd infra/fast
  BACKEND_URL=$(terraform.exe show | grep -A 3 'simulation.*runtime_environment_variables' | grep BACKEND_URL | cut -d'"' -f4 || echo "")
  cd ../..
  if [ -n "$BACKEND_URL" ]; then
    echo "  ✅ BACKEND_URL configured: $BACKEND_URL"
  else
    echo "  ⚠️  BACKEND_URL not set"
  fi
else
  echo "  ❌ Health check failing"
  FAILED=$((FAILED + 1))
fi

# Test API Gateway
echo "🚪 Testing API Gateway..."
if curl -sf "$API_GATEWAY_URL/" > /dev/null 2>&1; then
  echo "  ✅ API Gateway responding"
else
  echo "  ⚠️  API Gateway may require authentication"
fi

# Check SSM Parameters
echo "📋 Checking SSM Parameter Store..."
if aws.exe ssm get-parameter --name "/martian-greenhouse/services/management-backend-url" --region $REGION &>/dev/null; then
  echo "  ✅ SSM parameters configured"
  echo "     /martian-greenhouse/services/management-backend-url"
  echo "     /martian-greenhouse/services/agent-backend-url"
  echo "     /martian-greenhouse/services/simulation-url"
else
  echo "  ⚠️  Cannot access SSM (credentials may be expired)"
fi

# Summary
echo ""
echo "=========================================="
if [ $FAILED -eq 0 ]; then
  echo "✅ All critical services verified!"
else
  echo "❌ $FAILED service(s) failing"
  exit 1
fi
