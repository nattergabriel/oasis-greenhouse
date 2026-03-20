#!/bin/bash
# Start backend with real AWS credentials for Bedrock testing

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "==========================================="
echo "Starting Backend with Real AWS Credentials"
echo "==========================================="

# Check if AWS CLI is available
if command -v aws.exe &> /dev/null; then
    AWS_CMD="aws.exe"
elif command -v aws &> /dev/null; then
    AWS_CMD="aws"
else
    echo "❌ AWS CLI not found"
    exit 1
fi

# Get AWS credentials - check environment first, then aws configure
echo "Fetching AWS credentials..."

if [ -z "$AWS_ACCESS_KEY_ID" ]; then
    export AWS_ACCESS_KEY_ID=$($AWS_CMD configure get aws_access_key_id 2>/dev/null || echo "")
fi
if [ -z "$AWS_SECRET_ACCESS_KEY" ]; then
    export AWS_SECRET_ACCESS_KEY=$($AWS_CMD configure get aws_secret_access_key 2>/dev/null || echo "")
fi
if [ -z "$AWS_SESSION_TOKEN" ]; then
    export AWS_SESSION_TOKEN=$($AWS_CMD configure get aws_session_token 2>/dev/null || echo "")
fi
if [ -z "$AWS_REGION" ]; then
    export AWS_REGION=$($AWS_CMD configure get region 2>/dev/null || echo "us-west-2")
fi
export USE_MOCK_BEDROCK=false

if [ -z "$AWS_ACCESS_KEY_ID" ]; then
    echo "❌ AWS credentials not found in environment or aws configure"
    echo "Make sure AWS credentials are set:"
    echo "  export AWS_ACCESS_KEY_ID=..."
    echo "  export AWS_SECRET_ACCESS_KEY=..."
    echo "  export AWS_SESSION_TOKEN=..."
    exit 1
fi

echo "✅ AWS Account: $($AWS_CMD sts get-caller-identity --query Account --output text)"
echo "✅ AWS Region: $AWS_REGION"

# Stop existing backend
echo "Stopping existing backend container..."
docker stop greenhouse-backend-test 2>/dev/null || true
docker rm greenhouse-backend-test 2>/dev/null || true

# Start backend with real credentials
echo "Starting backend with real AWS credentials..."
cd "$PROJECT_ROOT"

docker-compose -f docker-compose.test.yml up -d backend-test

# Wait for backend to be ready
echo "Waiting for backend to start..."
sleep 10

# Verify backend is running
if curl -sf http://localhost:8102/ > /dev/null; then
    echo "✅ Backend is running"
else
    echo "❌ Backend failed to start"
    docker logs greenhouse-backend-test | tail -20
    exit 1
fi

# Check if credentials are accessible
docker exec greenhouse-backend-test printenv | grep AWS_ACCESS_KEY_ID >/dev/null && echo "✅ AWS credentials are set in container" || echo "⚠️  AWS credentials not found in container"

echo ""
echo "==========================================="
echo "✅ Backend ready for Bedrock testing"
echo "==========================================="
echo ""
echo "Run Bedrock tests with:"
echo "  pytest tests/test_real_bedrock.py -v -m real_bedrock"
echo ""
