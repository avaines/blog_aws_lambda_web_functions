variable "aws_region" {
  description = "AWS region for this deployment; confirm service availability before applying."
  type        = string
}

variable "app_name" {
  description = "Amplify Hosting app name."
  type        = string
  default     = "fin-and-feast-amplify"
}

variable "repository_url" {
  description = "HTTPS URL of the GitHub repository Amplify will build."
  type        = string
  default     = "https://github.com/avaines/blog_aws_lambda_web_functions"
}

variable "branch_name" {
  description = "Repository branch to deploy."
  type        = string
  default     = "main"
}

variable "github_access_token" {
  description = "GitHub token required for every plan and apply because Amplify app updates require a non-empty access token. Supply through TF_VAR_github_access_token."
  type        = string
  sensitive   = true
}

variable "enable_auto_build" {
  description = "Build on pushes to the configured branch. Disabled for controlled comparison runs; use an explicit release job."
  type        = bool
  default     = false
}
