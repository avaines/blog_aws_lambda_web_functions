output "app_directory" {
  description = "Shared Next.js source directory; not a deployed endpoint."
  value       = local.app_directory
}

output "url" {
  description = "Public HTTPS endpoint; smoke-test after deploying."
  value       = "https://${awscc_lambda_web_function_endpoint.demo.domain_name}"
}

output "function_arn" {
  value = awscc_lambda_web_function.demo.function_arn
}

output "revision_id" {
  value = awscc_lambda_web_function_revision.demo.revision_id
}

output "log_group" {
  value = aws_cloudwatch_log_group.web_function.name
}
