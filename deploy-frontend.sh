#!/usr/bin/env bash
set -euo pipefail

REGION="us-west-2"

# Get S3 bucket and CloudFront distribution from Terraform output
cd infra/fast
S3_BUCKET=$(terraform.exe output -raw frontend_s3_bucket 2>/dev/null || echo "")
CLOUDFRONT_URL=$(terraform.exe output -raw frontend_url 2>/dev/null || echo "")
CLOUDFRONT_ID=$(terraform.exe output -json frontend_url 2>/dev/null | grep -o 'd[a-z0-9]*\.cloudfront\.net' | cut -d'.' -f1 || echo "")
cd ../..

if [ -z "$S3_BUCKET" ]; then
  echo "❌ Error: S3 bucket not found. Run 'terraform apply' first to create infrastructure."
  exit 1
fi

echo "🚀 Deploying frontend to S3 + CloudFront..."
echo ""
echo "S3 Bucket:     $S3_BUCKET"
echo "CloudFront ID: $CLOUDFRONT_ID"
echo ""

# 1. Generate .env.local with API URL and key
echo "🔧 Generating .env.local..."
cd infra/fast
API_URL=$(terraform.exe output -raw api_gateway_url 2>/dev/null || echo "")
API_KEY=$(terraform.exe output -raw api_key_demo 2>/dev/null | sed 's/Set X-API-Key: //' || echo "")
cd ../..

cat > frontend/.env.local << EOF
NEXT_PUBLIC_API_URL=${API_URL}
NEXT_PUBLIC_API_KEY=${API_KEY}
EOF

echo "✅ Environment configured"

# 2. Build Next.js static export
echo ""
echo "📦 Building Next.js app..."
# Use Windows npm from bash (fixes native module issues on Windows filesystem)
cd frontend
powershell.exe -Command "npm run build"
cd ..

# 2. Sync to S3
echo ""
echo "☁️  Uploading to S3..."
aws.exe s3 sync frontend/out/ s3://$S3_BUCKET/ \
  --region $REGION \
  --delete \
  --cache-control "public, max-age=31536000, immutable" \
  --exclude "*.html" \
  --quiet

# Upload HTML files with shorter cache
aws.exe s3 sync frontend/out/ s3://$S3_BUCKET/ \
  --region $REGION \
  --exclude "*" \
  --include "*.html" \
  --cache-control "public, max-age=0, must-revalidate" \
  --content-type "text/html" \
  --quiet

echo "✅ Uploaded to S3"

# 3. Invalidate CloudFront cache
if [ -n "$CLOUDFRONT_ID" ]; then
  echo ""
  echo "🔄 Invalidating CloudFront cache..."
  aws.exe cloudfront create-invalidation \
    --distribution-id $CLOUDFRONT_ID \
    --paths "/*" \
    --region $REGION \
    --query 'Invalidation.Id' \
    --output text > /dev/null
  echo "✅ CloudFront cache invalidated"
fi

echo ""
echo "✅ Frontend deployed!"
echo ""

# Clean up .env.local (contains API key)
rm -f frontend/.env.local

echo "Frontend URL: $CLOUDFRONT_URL"
echo ""
echo "Note: CloudFront distribution may take 5-10 minutes to fully propagate."
