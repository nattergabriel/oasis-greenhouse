# ─── API Gateway (Use this for all API calls) ────────────────────────────────

output "api_gateway_url" {
  value       = "${aws_apigatewayv2_stage.prod.invoke_url}"
  description = "API Gateway URL - use this with X-API-Key header"
}

output "api_key_demo" {
  value       = "Set X-API-Key: ${var.api_key}"
  description = "Demo API key for accessing the API"
  sensitive   = true
}

# ─── Direct Service URLs (Not publicly accessible) ───────────────────────────

output "management_backend_url_internal" {
  value       = "https://${aws_apprunner_service.management_backend.service_url}"
  description = "Internal App Runner URL (access via API Gateway instead)"
}

output "agent_backend_url_internal" {
  value       = "https://${aws_apprunner_service.agent_backend.service_url}"
  description = "Internal App Runner URL (access via API Gateway instead)"
}

output "simulation_url_internal" {
  value       = "https://${aws_apprunner_service.simulation.service_url}"
  description = "Internal App Runner URL (access via API Gateway instead)"
}

output "frontend_url" {
  value       = "https://${aws_cloudfront_distribution.frontend.domain_name}"
  description = "CloudFront URL for frontend"
}

output "frontend_s3_bucket" {
  value       = aws_s3_bucket.frontend.id
  description = "S3 bucket name for frontend static files"
}

output "db_endpoint" {
  value     = aws_db_instance.postgres.endpoint
  sensitive = true
}

output "db_url_secret_arn" {
  value = aws_secretsmanager_secret.db_url.arn
}

output "ecr_management_backend_repository" {
  value       = aws_ecr_repository.management_backend.repository_url
  description = "ECR repository URL for management backend images"
}

output "ecr_agent_backend_repository" {
  value       = aws_ecr_repository.agent_backend.repository_url
  description = "ECR repository URL for agent backend images"
}

output "ecr_simulation_repository" {
  value       = aws_ecr_repository.simulation.repository_url
  description = "ECR repository URL for simulation images"
}
