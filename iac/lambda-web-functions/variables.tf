variable "aws_region" {
  description = "AWS region for this deployment; confirm service availability before applying."
  type        = string
}

variable "function_name" {
  description = "Name of the demo Web Function."
  type        = string
  default     = "fin-and-feast-web"
  validation {
    condition     = can(regex("^[A-Za-z0-9]([A-Za-z0-9_-]{0,62}[A-Za-z0-9])?$", var.function_name))
    error_message = "Use 1–64 letters, numbers, hyphens or underscores, with alphanumeric first and last characters."
  }
}

variable "artifact_path" {
  description = "Linux ARM64 standalone zip produced by scripts/package.sh. Build before planning; relative to this Terraform root."
  type        = string
  default     = "build/application.zip"
  validation {
    condition     = fileexists(var.artifact_path)
    error_message = "Build the application first with bash scripts/package.sh, or supply an existing Linux ARM64 artifact_path."
  }
}
