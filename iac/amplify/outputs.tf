output "app_directory" {
  description = "Shared Next.js source directory; not a deployed endpoint."
  value       = local.app_directory
}

output "app_id" {
  description = "Amplify app ID for release jobs and console inspection."
  value       = aws_amplify_app.demo.id
}

output "branch_name" {
  description = "Connected source branch."
  value       = aws_amplify_branch.demo.branch_name
}

output "url" {
  description = "Default branch URL, available after a successful deployment."
  value       = "https://${aws_amplify_branch.demo.branch_name}.${aws_amplify_app.demo.default_domain}"
}

output "service_role_arn" {
  description = "Amplify SSR logging service role."
  value       = aws_iam_role.amplify_service.arn
}
