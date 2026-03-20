#!/bin/bash
# Run end-to-end tests

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "========================================="
echo "Running End-to-End Tests"
echo "========================================="
echo ""
echo "⚠️  E2E tests are slow (10+ minutes)"
echo ""

# Check if services are healthy
"$SCRIPT_DIR/health_check.sh" || exit 1

echo ""
echo "Running tests..."
cd "$PROJECT_ROOT"

# Run e2e tests
pytest tests/test_e2e.py -v -m e2e --tb=short

exit_code=$?

echo ""
if [ $exit_code -eq 0 ]; then
    echo "========================================="
    echo "✅ E2E tests passed!"
    echo "========================================="
else
    echo "========================================="
    echo "❌ Some tests failed"
    echo "========================================="
fi

exit $exit_code
