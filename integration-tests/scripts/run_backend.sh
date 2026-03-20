#!/bin/bash
# Run backend integration tests

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "========================================="
echo "Running Backend Integration Tests"
echo "========================================="

# Check if services are healthy
"$SCRIPT_DIR/health_check.sh" || exit 1

echo ""
echo "Running tests..."
cd "$PROJECT_ROOT"

# Run backend and orchestration tests
pytest tests/test_backend_sim.py tests/test_orchestration.py -v -m backend --tb=short

exit_code=$?

echo ""
if [ $exit_code -eq 0 ]; then
    echo "========================================="
    echo "✅ Backend tests passed!"
    echo "========================================="
else
    echo "========================================="
    echo "❌ Some tests failed"
    echo "========================================="
fi

exit $exit_code
