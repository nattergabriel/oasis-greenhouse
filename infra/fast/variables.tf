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

variable "anthropic_api_key" {
  sensitive = true
}

variable "api_key" {
  description = "API key for demo access control"
  sensitive   = true
}

# Cross-service URLs (set after initial deployment to break circular dependency)
variable "management_backend_python_url" {
  description = "Agent backend URL for management backend"
  default     = ""
}

variable "agent_sim_url" {
  description = "Simulation URL for agent backend"
  default     = ""
}

variable "agent_management_url" {
  description = "Management backend URL for agent backend"
  default     = ""
}

variable "simulation_backend_url" {
  description = "Management backend URL for simulation"
  default     = ""
}
