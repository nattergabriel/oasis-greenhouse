#!/bin/bash
# Check if all test services are responding

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Load environment variables
if [ -f "$PROJECT_ROOT/.env.test" ]; then
    set -a
    source "$PROJECT_ROOT/.env.test"
    set +a
fi

SIM_ENGINE_URL=${SIM_ENGINE_URL:-http://localhost:8101}
BACKEND_URL=${BACKEND_URL:-http://localhost:8102}
MANAGEMENT_URL=${MANAGEMENT_BACKEND_URL:-http://localhost:8180}

echo "========================================="
echo "Health Check"
echo "========================================="

all_healthy=true

# Check Simulation Engine
echo -n "Simulation Engine ($SIM_ENGINE_URL/health): "
if curl -sf "$SIM_ENGINE_URL/health" > /dev/null; then
    echo "✅ Healthy"
else
    echo "❌ Unhealthy"
    all_healthy=false
fi

# Check Backend Orchestrator
echo -n "Backend Orchestrator ($BACKEND_URL/health): "
if curl -sf "$BACKEND_URL/health" > /dev/null; then
    echo "✅ Healthy"
else
    echo "❌ Unhealthy"
    all_healthy=false
fi

# Check Management Backend
echo -n "Management Backend ($MANAGEMENT_URL/actuator/health): "
if curl -sf "$MANAGEMENT_URL/actuator/health" > /dev/null; then
    echo "✅ Healthy"
else
    echo "❌ Unhealthy"
    all_healthy=false
fi

# Check PostgreSQL
echo -n "PostgreSQL (localhost:5532): "
if docker-compose -f "$PROJECT_ROOT/docker-compose.test.yml" exec -T postgres-test pg_isready -U test_user -d greenhouse_test > /dev/null 2>&1; then
    echo "✅ Healthy"
else
    echo "❌ Unhealthy"
    all_healthy=false
fi

echo ""
if [ "$all_healthy" = true ]; then
    echo "========================================="
    echo "✅ All services are healthy"
    echo "========================================="
    exit 0
else
    echo "========================================="
    echo "❌ Some services are unhealthy"
    echo "========================================="
    echo ""
    echo "Run './scripts/setup.sh' to start services"
    echo "Check logs with: docker-compose -f docker-compose.test.yml logs"
    exit 1
fi
