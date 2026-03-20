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

# ─── Service URLs ─────────────────────────────────────────────────────────────

output "management_backend_url_internal" {
  value       = "https://${aws_apprunner_service.management_backend.service_url}"
  description = "Management backend URL"
}

output "agent_backend_url_internal" {
  value       = "https://${aws_apprunner_service.agent_backend.service_url}"
  description = "Agent backend URL"
}

output "simulation_url_internal" {
  value       = "https://${aws_apprunner_service.simulation.service_url}"
  description = "Simulation URL"
}

output "frontend_url" {
  value       = "https://${aws_cloudfront_distribution.frontend.domain_name}"
  description = "Frontend CloudFront URL"
}

output "frontend_s3_bucket" {
  value       = aws_s3_bucket.frontend.id
  description = "S3 bucket name for frontend static files"
}

output "frontend_cloudfront_id" {
  value       = aws_cloudfront_distribution.frontend.id
  description = "CloudFront distribution ID for cache invalidation"
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

