#!/bin/bash

echo "=== AWS Deployment URLs ==="
echo ""

API_URL=$(terraform.exe output -raw api_gateway_url 2>/dev/null)
API_KEY=$(terraform.exe output -raw api_key_demo 2>/dev/null)

echo "Base URL:      $API_URL"
echo "Management:    $API_URL/api/"
echo "Agent:         $API_URL/agent/"
echo "Simulation:    $API_URL/sim/"
echo ""
echo "OpenAPI JSON:  $API_URL/api/v3/api-docs"
echo "OpenAPI YAML:  $API_URL/api/v3/api-docs.yaml"
echo "Swagger UI:    $API_URL/api/swagger-ui.html"
echo ""
echo "=== Authentication Header ==="
echo ""
echo "$API_KEY"
echo ""
echo "Example cURL:"
echo "curl -H \"X-API-Key: ${API_KEY##*: }\" ${API_URL}/api/actuator/health"
