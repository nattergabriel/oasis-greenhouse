terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# ─── Local Values ────────────────────────────────────────────────────────────

locals {
  ecr_lifecycle_policy = jsonencode({
    rules = [{
      rulePriority = 1
      description  = "Keep only last 3 images"
      selection = {
        tagStatus   = "any"
        countType   = "imageCountMoreThan"
        countNumber = 3
      }
      action = {
        type = "expire"
      }
    }]
  })
}

# ─── ECR Repositories (Auto-Created) ────────────────────────────────────────

resource "aws_ecr_repository" "management_backend" {
  name                 = "martian-greenhouse-management-backend"
  image_tag_mutability = "MUTABLE"
  force_delete         = true

  image_scanning_configuration {
    scan_on_push = false  # Disabled for faster deployments
  }

  tags = {
    Project = var.project
  }
}

resource "aws_ecr_repository" "agent_backend" {
  name                 = "martian-greenhouse-agent-backend"
  image_tag_mutability = "MUTABLE"
  force_delete         = true

  image_scanning_configuration {
    scan_on_push = false
  }

  tags = {
    Project = var.project
  }
}

resource "aws_ecr_repository" "simulation" {
  name                 = "martian-greenhouse-simulation"
  image_tag_mutability = "MUTABLE"
  force_delete         = true

  image_scanning_configuration {
    scan_on_push = false
  }

  tags = {
    Project = var.project
  }
}

resource "aws_ecr_lifecycle_policy" "management_backend" {
  repository = aws_ecr_repository.management_backend.name
  policy     = local.ecr_lifecycle_policy
}

resource "aws_ecr_lifecycle_policy" "agent_backend" {
  repository = aws_ecr_repository.agent_backend.name
  policy     = local.ecr_lifecycle_policy
}

resource "aws_ecr_lifecycle_policy" "simulation" {
  repository = aws_ecr_repository.simulation.name
  policy     = local.ecr_lifecycle_policy
}

# ─── Secrets Manager ─────────────────────────────────────────────────────────

resource "aws_secretsmanager_secret" "db_url" {
  name = "${var.project}/db-url"
}

resource "aws_secretsmanager_secret_version" "db_url" {
  secret_id     = aws_secretsmanager_secret.db_url.id
  secret_string = "jdbc:postgresql://${aws_db_instance.postgres.endpoint}/${aws_db_instance.postgres.db_name}"
  depends_on    = [aws_db_instance.postgres]
}

resource "aws_secretsmanager_secret" "agent_token" {
  name = "${var.project}/agent-token"
}

resource "aws_secretsmanager_secret_version" "agent_token" {
  secret_id     = aws_secretsmanager_secret.agent_token.id
  secret_string = var.agent_token
}

resource "aws_secretsmanager_secret" "db_user" {
  name = "${var.project}/db-user"
}

resource "aws_secretsmanager_secret_version" "db_user" {
  secret_id     = aws_secretsmanager_secret.db_user.id
  secret_string = var.db_username
}

resource "aws_secretsmanager_secret" "db_pass" {
  name = "${var.project}/db-pass"
}

resource "aws_secretsmanager_secret_version" "db_pass" {
  secret_id     = aws_secretsmanager_secret.db_pass.id
  secret_string = var.db_password
}

resource "aws_secretsmanager_secret" "anthropic_key" {
  name = "${var.project}/anthropic-api-key"
}

resource "aws_secretsmanager_secret_version" "anthropic_key" {
  secret_id     = aws_secretsmanager_secret.anthropic_key.id
  secret_string = var.anthropic_api_key
}

resource "aws_secretsmanager_secret" "api_key" {
  name = "${var.project}/api-key"
}

resource "aws_secretsmanager_secret_version" "api_key" {
  secret_id     = aws_secretsmanager_secret.api_key.id
  secret_string = var.api_key
}

# ─── RDS PostgreSQL (private subnet — secured) ────────────────────────────────

resource "aws_db_instance" "postgres" {
  identifier     = "${var.project}-db"
  engine         = "postgres"
  engine_version = "16"
  instance_class = "db.t3.micro"
  db_name        = "greenhouse"
  username       = var.db_username
  password       = var.db_password

  allocated_storage   = 20
  storage_type        = "gp2"
  publicly_accessible = false  # Private: only accessible from App Runner via VPC
  skip_final_snapshot = true
  deletion_protection = true   # Enabled: Prevent accidental deletion of mission-critical database
  apply_immediately   = true   # Apply changes immediately (needed for AZ migration)
  availability_zone   = data.aws_availability_zones.available.names[0]  # us-west-2a

  # Use private subnets and App Runner security group
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]

  tags = {
    Name    = "${var.project}-db"
    Project = var.project
  }
}

# ─── IAM Role for App Runner ──────────────────────────────────────────────────

resource "aws_iam_role" "apprunner_instance" {
  name = "${var.project}-apprunner-instance-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "tasks.apprunner.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy" "apprunner_secrets" {
  name = "read-secrets"
  role = aws_iam_role.apprunner_instance.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = ["secretsmanager:GetSecretValue"]
      Resource = [
        aws_secretsmanager_secret.db_url.arn,
        aws_secretsmanager_secret.db_user.arn,
        aws_secretsmanager_secret.db_pass.arn,
        aws_secretsmanager_secret.agent_token.arn,
        aws_secretsmanager_secret.anthropic_key.arn,
        aws_secretsmanager_secret.api_key.arn,
      ]
    }]
  })
}

resource "aws_iam_role_policy" "apprunner_bedrock" {
  name = "invoke-bedrock"
  role = aws_iam_role.apprunner_instance.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "bedrock:InvokeModel",
        "bedrock:InvokeModelWithResponseStream"
      ]
      Resource = [
        "arn:aws:bedrock:${var.aws_region}::foundation-model/anthropic.claude-*",
        "arn:aws:bedrock:${var.aws_region}::foundation-model/anthropic.claude-3-*",
        "arn:aws:bedrock:${var.aws_region}::foundation-model/anthropic.claude-sonnet-*"
      ]
    }]
  })
}

resource "aws_iam_role" "apprunner_access" {
  name = "${var.project}-apprunner-access-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "build.apprunner.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy_attachment" "apprunner_ecr" {
  role       = aws_iam_role.apprunner_access.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSAppRunnerServicePolicyForECRAccess"
}

# ─── App Runner — Management Backend (Spring Boot) ───────────────────────────

resource "aws_apprunner_service" "management_backend" {
  service_name = "${var.project}-management-backend"

  source_configuration {
    image_repository {
      image_identifier      = "${aws_ecr_repository.management_backend.repository_url}:latest"
      image_repository_type = "ECR"
      image_configuration {
        port = "8080"
        runtime_environment_variables = var.management_backend_python_url != "" ? {
          PYTHON_BACKEND_URL = var.management_backend_python_url
        } : {}
        runtime_environment_secrets = {
          DB_URL      = aws_secretsmanager_secret.db_url.arn
          DB_USER     = aws_secretsmanager_secret.db_user.arn
          DB_PASS     = aws_secretsmanager_secret.db_pass.arn
          AGENT_TOKEN = aws_secretsmanager_secret.agent_token.arn
          API_KEY     = aws_secretsmanager_secret.api_key.arn
        }
      }
    }
    authentication_configuration {
      access_role_arn = aws_iam_role.apprunner_access.arn
    }
    auto_deployments_enabled = true
  }

  network_configuration {
    egress_configuration {
      egress_type       = "VPC"
      vpc_connector_arn = aws_apprunner_vpc_connector.main.arn
    }
  }

  instance_configuration {
    instance_role_arn = aws_iam_role.apprunner_instance.arn
    cpu               = "1024"
    memory            = "2048"
  }

  health_check_configuration {
    protocol = "HTTP"
    path     = "/actuator/health"
  }

  tags = {
    Name    = "${var.project}-management-backend"
    Project = var.project
  }
}

# ─── App Runner — Agent Backend (Python/FastAPI + LangGraph) ─────────────────

resource "aws_apprunner_service" "agent_backend" {
  service_name = "${var.project}-agent-backend"

  source_configuration {
    image_repository {
      image_identifier      = "${aws_ecr_repository.agent_backend.repository_url}:latest"
      image_repository_type = "ECR"
      image_configuration {
        port = "8000"
        runtime_environment_variables = var.agent_sim_url != "" && var.agent_management_url != "" ? {
          SIM_ENGINE_URL         = var.agent_sim_url
          MANAGEMENT_BACKEND_URL = var.agent_management_url
        } : {}
        runtime_environment_secrets = {
          AGENT_TOKEN       = aws_secretsmanager_secret.agent_token.arn
          ANTHROPIC_API_KEY = aws_secretsmanager_secret.anthropic_key.arn
          API_KEY           = aws_secretsmanager_secret.api_key.arn
        }
      }
    }
    authentication_configuration {
      access_role_arn = aws_iam_role.apprunner_access.arn
    }
    auto_deployments_enabled = true
  }

  network_configuration {
    egress_configuration {
      egress_type       = "VPC"
      vpc_connector_arn = aws_apprunner_vpc_connector.main.arn
    }
  }

  instance_configuration {
    instance_role_arn = aws_iam_role.apprunner_instance.arn
    cpu               = "1024"
    memory            = "2048"
  }

  health_check_configuration {
    protocol = "HTTP"
    path     = "/"
    interval = 10
    timeout  = 5
    healthy_threshold   = 1
    unhealthy_threshold = 3
  }

  tags = {
    Name    = "${var.project}-agent-backend"
    Project = var.project
  }
}

# ─── App Runner — Simulation (FastAPI) ────────────────────────────────────────

resource "aws_apprunner_service" "simulation" {
  service_name = "${var.project}-simulation"

  source_configuration {
    image_repository {
      image_identifier      = "${aws_ecr_repository.simulation.repository_url}:latest"
      image_repository_type = "ECR"
      image_configuration {
        port = "8000"
        runtime_environment_variables = var.simulation_backend_url != "" ? {
          BACKEND_URL = var.simulation_backend_url
        } : {}
        runtime_environment_secrets = {
          API_KEY = aws_secretsmanager_secret.api_key.arn
        }
      }
    }
    authentication_configuration {
      access_role_arn = aws_iam_role.apprunner_access.arn
    }
    auto_deployments_enabled = true
  }

  network_configuration {
    egress_configuration {
      egress_type       = "VPC"
      vpc_connector_arn = aws_apprunner_vpc_connector.main.arn
    }
  }

  instance_configuration {
    instance_role_arn = aws_iam_role.apprunner_instance.arn
    cpu               = "1024"
    memory            = "2048"
  }

  health_check_configuration {
    protocol = "HTTP"
    path     = "/health"
    interval = 10
    timeout  = 5
    healthy_threshold   = 1
    unhealthy_threshold = 3
  }

  tags = {
    Name    = "${var.project}-simulation"
    Project = var.project
  }
}

# ─── Frontend (S3 + CloudFront) ──────────────────────────────────────────────
# Frontend infrastructure is defined in frontend.tf
# Deploy with: ./deploy-frontend.sh
