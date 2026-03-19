variable "aws_region" {
  default = "us-west-2"
}

variable "project" {
  default = "martian-greenhouse"
}

variable "db_username" {
  sensitive = true
}

variable "db_password" {
  sensitive = true
}

variable "agent_token" {
  sensitive = true
}

variable "system_token" {
  sensitive = true
}

variable "anthropic_api_key" {
  sensitive = true
}

variable "api_key" {
  description = "API key for demo access control"
  sensitive   = true
}

variable "github_repo" {
  description = "GitHub repo for Amplify: owner/repo (leave empty to skip frontend deployment)"
  default     = ""
}

variable "github_branch" {
  default = "main"
}
