#!/bin/bash
# Stop all test services and clean up

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "========================================="
echo "Tearing Down Integration Test Environment"
echo "========================================="

cd "$PROJECT_ROOT"

echo "Stopping services..."
docker-compose -f docker-compose.test.yml down

echo ""
read -p "Remove volumes? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Removing volumes..."
    docker-compose -f docker-compose.test.yml down -v
    echo "✅ Volumes removed"
else
    echo "Volumes preserved"
fi

echo ""
echo "========================================="
echo "✅ Teardown complete"
echo "========================================="
