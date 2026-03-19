#!/usr/bin/env bash
# Update CORS to include Amplify domain after deployment
# Run this AFTER Amplify is deployed if using github_repo

set -euo pipefail

echo "🔧 Updating CORS to include Amplify domain..."

# Get Amplify domain from terraform output
AMPLIFY_URL=$(terraform output -raw frontend_url 2>/dev/null || echo "")

if [ "$AMPLIFY_URL" == "Not deployed (run frontend locally)" ] || [ -z "$AMPLIFY_URL" ]; then
    echo "❌ Amplify not deployed. CORS already configured for localhost only."
    exit 0
fi

echo "✅ Amplify URL: $AMPLIFY_URL"
echo ""
echo "To add this domain to CORS, edit api-gateway.tf:"
echo ""
echo "  cors_configuration {"
echo "    allow_origins = ["
echo "      \"http://localhost:5173\","
echo "      \"http://localhost:3000\","
echo "      \"http://localhost:5174\","
echo "      \"$AMPLIFY_URL\"  # <-- Add this line"
echo "    ]"
echo "    ..."
echo "  }"
echo ""
echo "Then run: terraform apply"
