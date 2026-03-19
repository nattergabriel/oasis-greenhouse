# Quick fix for RDS permission error
# This script reverts deletion_protection and applies changes

$ErrorActionPreference = "Stop"

Write-Host "🔧 Applying infrastructure with RDS permission fix..." -ForegroundColor Cyan
Write-Host ""

# Check if in correct directory
if (-not (Test-Path "main.tf")) {
    Write-Host "❌ ERROR: Run this from infra/fast directory" -ForegroundColor Red
    exit 1
}

Write-Host "📝 Changes applied:" -ForegroundColor Green
Write-Host "   ✅ CORS circular dependency fixed" -ForegroundColor Gray
Write-Host "   ✅ Event-based logging removed" -ForegroundColor Gray
Write-Host "   ✅ RDS deletion_protection reverted to false" -ForegroundColor Gray
Write-Host "   ✅ Lambda authorizer rebuilt with minimal logging" -ForegroundColor Gray
Write-Host ""

Write-Host "🚀 Running terraform apply..." -ForegroundColor Cyan
Write-Host ""

terraform apply

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Deployment successful!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📊 Outputs:" -ForegroundColor Cyan
    terraform output
    Write-Host ""
    Write-Host "🔑 To view API key:" -ForegroundColor Cyan
    Write-Host "   terraform output -raw api_key_demo" -ForegroundColor Gray
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "❌ Deployment failed" -ForegroundColor Red
    Write-Host ""
    Write-Host "See FIX-RDS-PERMISSION-ERROR.md for detailed troubleshooting" -ForegroundColor Yellow
    exit 1
}
