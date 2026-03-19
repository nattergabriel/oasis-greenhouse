# ─── API Gateway for API Key Authentication ──────────────────────────────────

# Get current AWS account ID for IAM policies
data "aws_caller_identity" "current" {}

# HTTP API (simpler, cheaper, perfect for hackathon)
resource "aws_apigatewayv2_api" "main" {
  name          = "${var.project}-api"
  protocol_type = "HTTP"
  description   = "Martian Greenhouse API with API key authentication"

  cors_configuration {
    # Allow localhost for development
    # For production: Update CORS after Amplify deployment to add the specific domain
    allow_origins = ["http://localhost:5173", "http://localhost:3000", "http://localhost:5174"]
    allow_methods = ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    allow_headers = ["*"]
    expose_headers = ["*"]
    max_age = 3600
  }

  tags = {
    Name    = "${var.project}-api"
    Project = var.project
  }
}

# SQS Dead Letter Queue for Lambda authorizer failures
resource "aws_sqs_queue" "lambda_authorizer_dlq" {
  name                      = "${var.project}-authorizer-dlq"
  message_retention_seconds = 1209600 # 14 days

  tags = {
    Name    = "${var.project}-authorizer-dlq"
    Project = var.project
  }
}

# Lambda Authorizer for API Key validation
resource "aws_lambda_function" "api_key_authorizer" {
  filename      = "${path.module}/lambda/authorizer.zip"
  function_name = "${var.project}-api-key-authorizer"
  role          = aws_iam_role.lambda_authorizer.arn
  handler       = "index.handler"
  runtime       = "nodejs20.x"
  timeout       = 10

  # Dead Letter Queue for failed invocations
  dead_letter_config {
    target_arn = aws_sqs_queue.lambda_authorizer_dlq.arn
  }

  environment {
    variables = {
      API_KEY_SECRET_ARN = aws_secretsmanager_secret.api_key.arn
    }
  }

  tags = {
    Name    = "${var.project}-api-key-authorizer"
    Project = var.project
  }
}

# IAM role for Lambda authorizer
resource "aws_iam_role" "lambda_authorizer" {
  name = "${var.project}-lambda-authorizer-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy" "lambda_authorizer_secrets" {
  name = "read-api-key"
  role = aws_iam_role.lambda_authorizer.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = ["secretsmanager:GetSecretValue"]
        Resource = [aws_secretsmanager_secret.api_key.arn]
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        # Scoped to specific log group (least privilege)
        Resource = [
          "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:log-group:/aws/lambda/${var.project}-api-key-authorizer:*"
        ]
      },
      {
        Effect = "Allow"
        Action = ["sqs:SendMessage"]
        Resource = [aws_sqs_queue.lambda_authorizer_dlq.arn]
      }
    ]
  })
}

# API Gateway Authorizer
resource "aws_apigatewayv2_authorizer" "api_key" {
  api_id           = aws_apigatewayv2_api.main.id
  authorizer_type  = "REQUEST"
  name             = "${var.project}-api-key-auth"
  authorizer_uri   = aws_lambda_function.api_key_authorizer.invoke_arn
  identity_sources = ["$request.header.X-API-Key"]

  authorizer_payload_format_version = "2.0"
  enable_simple_responses            = true
  authorizer_result_ttl_in_seconds   = 60  # Reduced to 1 minute for faster key rotation
}

# Lambda permission for API Gateway
resource "aws_lambda_permission" "api_gateway" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.api_key_authorizer.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}

# ─── Integrations to App Runner Services ──────────────────────────────────────

# Management Backend Integration
resource "aws_apigatewayv2_integration" "management_backend" {
  api_id             = aws_apigatewayv2_api.main.id
  integration_type   = "HTTP_PROXY"
  integration_method = "ANY"
  integration_uri    = "https://${aws_apprunner_service.management_backend.service_url}"

  payload_format_version = "1.0"
  timeout_milliseconds   = 10000 # 10 seconds
}

resource "aws_apigatewayv2_route" "management_backend" {
  api_id             = aws_apigatewayv2_api.main.id
  route_key          = "ANY /api/{proxy+}"
  target             = "integrations/${aws_apigatewayv2_integration.management_backend.id}"
  authorizer_id      = aws_apigatewayv2_authorizer.api_key.id
  authorization_type = "CUSTOM"
}

# Agent Backend Integration
resource "aws_apigatewayv2_integration" "agent_backend" {
  api_id             = aws_apigatewayv2_api.main.id
  integration_type   = "HTTP_PROXY"
  integration_method = "ANY"
  integration_uri    = "https://${aws_apprunner_service.agent_backend.service_url}"

  payload_format_version = "1.0"
  timeout_milliseconds   = 30000 # 30 seconds (agent may need more time)
}

resource "aws_apigatewayv2_route" "agent_backend" {
  api_id             = aws_apigatewayv2_api.main.id
  route_key          = "ANY /agent/{proxy+}"
  target             = "integrations/${aws_apigatewayv2_integration.agent_backend.id}"
  authorizer_id      = aws_apigatewayv2_authorizer.api_key.id
  authorization_type = "CUSTOM"
}

# Simulation Integration
resource "aws_apigatewayv2_integration" "simulation" {
  api_id             = aws_apigatewayv2_api.main.id
  integration_type   = "HTTP_PROXY"
  integration_method = "ANY"
  integration_uri    = "https://${aws_apprunner_service.simulation.service_url}"

  payload_format_version = "1.0"
  timeout_milliseconds   = 30000 # 30 seconds (simulation may need more time)
}

resource "aws_apigatewayv2_route" "simulation" {
  api_id             = aws_apigatewayv2_api.main.id
  route_key          = "ANY /sim/{proxy+}"
  target             = "integrations/${aws_apigatewayv2_integration.simulation.id}"
  authorizer_id      = aws_apigatewayv2_authorizer.api_key.id
  authorization_type = "CUSTOM"
}

# ─── API Gateway Stage ────────────────────────────────────────────────────────

resource "aws_apigatewayv2_stage" "prod" {
  api_id      = aws_apigatewayv2_api.main.id
  name        = "prod"
  auto_deploy = true

  # Rate limiting to prevent brute force and DDoS attacks
  default_route_settings {
    throttling_rate_limit  = 100  # requests per second
    throttling_burst_limit = 200  # burst capacity
  }

  tags = {
    Name    = "${var.project}-api-prod"
    Project = var.project
  }
}
