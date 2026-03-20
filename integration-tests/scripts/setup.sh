#!/bin/bash
# Start all test services via docker-compose

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "========================================="
echo "Setting up Integration Test Environment"
echo "========================================="

# Check if .env.test exists
if [ ! -f "$PROJECT_ROOT/.env.test" ]; then
    echo "❌ .env.test not found. Creating from example..."
    cp "$PROJECT_ROOT/.env.test.example" "$PROJECT_ROOT/.env.test"
    echo "✅ Created .env.test. Please review and customize if needed."
fi

# Load environment variables
set -a
source "$PROJECT_ROOT/.env.test"
set +a

echo ""
echo "Starting test services with docker-compose..."
cd "$PROJECT_ROOT"
docker-compose -f docker-compose.test.yml up -d

echo ""
echo "Waiting for services to be healthy..."
sleep 5

# Wait for PostgreSQL
echo "  → Waiting for PostgreSQL..."
timeout 60 bash -c 'until docker-compose -f docker-compose.test.yml exec -T postgres-test pg_isready -U test_user -d greenhouse_test; do sleep 2; done' || {
    echo "❌ PostgreSQL failed to start"
    exit 1
}
echo "  ✅ PostgreSQL is ready"

# Wait for Simulation Engine
echo "  → Waiting for Simulation Engine..."
timeout 60 bash -c 'until curl -sf http://localhost:8101/health > /dev/null; do sleep 2; done' || {
    echo "❌ Simulation Engine failed to start"
    exit 1
}
echo "  ✅ Simulation Engine is ready"

# Wait for Backend Orchestrator
echo "  → Waiting for Backend Orchestrator..."
timeout 60 bash -c 'until curl -sf http://localhost:8102/health > /dev/null; do sleep 2; done' || {
    echo "❌ Backend Orchestrator failed to start"
    exit 1
}
echo "  ✅ Backend Orchestrator is ready"

# Wait for Management Backend
echo "  → Waiting for Management Backend..."
timeout 60 bash -c 'until curl -sf http://localhost:8180/actuator/health > /dev/null; do sleep 2; done' || {
    echo "❌ Management Backend failed to start"
    exit 1
}
echo "  ✅ Management Backend is ready"

echo ""
echo "========================================="
echo "✅ All services are ready!"
echo "========================================="
echo ""
echo "Service URLs:"
echo "  Simulation Engine:    http://localhost:8101"
echo "  Backend Orchestrator: http://localhost:8102"
echo "  Management Backend:   http://localhost:8180"
echo "  PostgreSQL:           localhost:5532"
echo ""
echo "Run tests with: ./scripts/run_all.sh"
echo ""
