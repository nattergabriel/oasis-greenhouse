#!/usr/bin/env bash
set -euo pipefail

echo "Building Lambda authorizer..."
cd "$(dirname "$0")"

# Install dependencies
npm install --production

# Create deployment package
zip -r authorizer.zip index.js node_modules/ package.json

echo "✅ Lambda authorizer built: authorizer.zip"
