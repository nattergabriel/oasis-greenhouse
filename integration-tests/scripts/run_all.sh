#!/bin/bash
# Run all integration tests

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "========================================="
echo "Running All Integration Tests"
echo "========================================="

# Check if services are healthy
"$SCRIPT_DIR/health_check.sh" || exit 1

echo ""
echo "Running tests..."
cd "$PROJECT_ROOT"

# Run pytest with all tests
pytest tests/ -v --tb=short

exit_code=$?

echo ""
if [ $exit_code -eq 0 ]; then
    echo "========================================="
    echo "✅ All tests passed!"
    echo "========================================="
else
    echo "========================================="
    echo "❌ Some tests failed"
    echo "========================================="
fi

exit $exit_code
