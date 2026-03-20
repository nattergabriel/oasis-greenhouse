#!/bin/bash

echo "=== AWS Deployment URLs ==="
echo ""

API_URL=$(terraform.exe output -raw api_gateway_url 2>/dev/null)
API_KEY=$(terraform.exe output -raw api_key_demo 2>/dev/null)
FRONTEND_URL=$(terraform.exe output -raw frontend_url_with_key 2>/dev/null)
FRONTEND_DOMAIN=$(terraform.exe output -raw frontend_cloudfront_domain 2>/dev/null)

# Extract just the key value
KEY_VALUE="${API_KEY##*: }"

echo "=== Frontend (CloudFront) ==="
echo "Frontend URL:  $FRONTEND_URL"
echo ""
echo "Note: Frontend requires ?api_key=xxx in URL"
echo ""

echo "=== Backend APIs (API Gateway) ==="
echo "Base URL:      $API_URL"
echo "Management:    $API_URL/api/"
echo "Agent:         $API_URL/agent/"
echo "Simulation:    $API_URL/sim/"
echo ""
echo "OpenAPI JSON:  $API_URL/api/v3/api-docs"
echo "OpenAPI YAML:  $API_URL/api/v3/api-docs.yaml"
echo "Swagger UI:    $API_URL/api/swagger-ui.html"
echo ""

echo "=== Authentication ==="
echo "API Key:       $KEY_VALUE"
echo ""
echo "Frontend:      https://$FRONTEND_DOMAIN?api_key=$KEY_VALUE"
echo "Backend APIs:  X-API-Key: $KEY_VALUE"
echo ""

echo "=== Example cURL ==="
echo "curl -H \"X-API-Key: $KEY_VALUE\" ${API_URL}/api/actuator/health"
echo ""
