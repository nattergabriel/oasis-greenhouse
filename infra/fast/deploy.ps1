# Martian Greenhouse Infrastructure Deployment Script
# Run this from PowerShell in the infra/fast directory

$ErrorActionPreference = "Stop"

Write-Host "🚀 Martian Greenhouse - Secure Infrastructure Deployment" -ForegroundColor Cyan
Write-Host ""

# Check if terraform.exe exists
if (-not (Get-Command terraform.exe -ErrorAction SilentlyContinue)) {
    Write-Host "❌ ERROR: terraform.exe not found in PATH" -ForegroundColor Red
    Write-Host "   Download from: https://developer.hashicorp.com/terraform/install" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ terraform.exe found" -ForegroundColor Green

# Check if Lambda authorizer is built
if (-not (Test-Path "lambda/authorizer.zip")) {
    Write-Host "❌ ERROR: Lambda authorizer not built" -ForegroundColor Red
    Write-Host "   Run: cd lambda && ./build.sh" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Lambda authorizer built" -ForegroundColor Green

# Check if terraform.tfvars exists
if (-not (Test-Path "terraform.tfvars")) {
    Write-Host "❌ ERROR: terraform.tfvars not found" -ForegroundColor Red
    Write-Host "   Copy terraform.tfvars.example and fill in your values" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ terraform.tfvars found" -ForegroundColor Green
Write-Host ""

# Initialize Terraform
Write-Host "📦 Initializing Terraform..." -ForegroundColor Cyan
terraform.exe init

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Terraform init failed" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Untaint management backend if needed
Write-Host "🔧 Checking for tainted resources..." -ForegroundColor Cyan
$taintCheck = terraform.exe show -json 2>&1 | ConvertFrom-Json
if ($taintCheck.values.root_module.resources | Where-Object { $_.address -eq "aws_apprunner_service.management_backend" -and $_.status -eq "tainted" }) {
    Write-Host "   Untainting management_backend service..." -ForegroundColor Yellow
    terraform.exe untaint aws_apprunner_service.management_backend
}

Write-Host ""

# Show plan
Write-Host "📋 Generating deployment plan..." -ForegroundColor Cyan
Write-Host ""
terraform.exe plan -out=tfplan

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Terraform plan failed" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "⚠️  Review the plan above carefully!" -ForegroundColor Yellow
Write-Host ""
$confirm = Read-Host "Do you want to apply this plan? (yes/no)"

if ($confirm -ne "yes") {
    Write-Host "❌ Deployment cancelled" -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "🚀 Deploying infrastructure..." -ForegroundColor Cyan
terraform.exe apply tfplan

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Deployment failed" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✅ Deployment successful!" -ForegroundColor Green
Write-Host ""

# Show outputs
Write-Host "📊 Deployment Outputs:" -ForegroundColor Cyan
Write-Host ""
terraform.exe output

Write-Host ""
Write-Host "🔑 To view API key:" -ForegroundColor Cyan
Write-Host "   terraform.exe output -raw api_key_demo" -ForegroundColor Gray
Write-Host ""
Write-Host "✅ Infrastructure deployment complete!" -ForegroundColor Green
Write-Host ""

# Check if Amplify was deployed
$frontendUrl = terraform.exe output -raw frontend_url 2>$null
if ($frontendUrl -ne "Not deployed (run frontend locally)" -and $frontendUrl) {
    Write-Host "⚠️  IMPORTANT: Amplify Deployed" -ForegroundColor Yellow
    Write-Host "   CORS is currently configured for localhost only." -ForegroundColor Gray
    Write-Host "   To allow requests from Amplify:" -ForegroundColor Gray
    Write-Host "   1. Add $frontendUrl to CORS in api-gateway.tf" -ForegroundColor Gray
    Write-Host "   2. Run terraform apply again" -ForegroundColor Gray
    Write-Host "   See: CIRCULAR-DEPENDENCY-FIX.md for details" -ForegroundColor Gray
    Write-Host ""
}

Write-Host "📝 Next steps:" -ForegroundColor Cyan
Write-Host "   1. Build and push Docker images (run deploy-all.sh)" -ForegroundColor Gray
Write-Host "   2. Verify services are healthy in AWS Console" -ForegroundColor Gray
Write-Host "   3. Test API Gateway endpoint with X-API-Key header" -ForegroundColor Gray
Write-Host ""
