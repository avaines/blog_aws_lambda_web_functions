resource "aws_amplify_app" "demo" {
  name                 = var.app_name
  description          = "Fin & Feast Next.js SSR hosting comparison"
  repository           = var.repository_url
  access_token         = var.github_access_token
  platform             = "WEB_COMPUTE"
  iam_service_role_arn = aws_iam_role.amplify_service.arn
  build_spec           = file("${path.module}/build-spec.yml")

  enable_auto_branch_creation = false
  enable_branch_auto_deletion = false
  enable_branch_auto_build    = var.enable_auto_build

  environment_variables = {
    AMPLIFY_MONOREPO_APP_ROOT = "app"
    AMPLIFY_DIFF_DEPLOY       = "false"
    NEXT_TELEMETRY_DISABLED   = "1"
  }

  # Keep cookies available to personalised SSR routes.
  cache_config {
    type = "AMPLIFY_MANAGED"
  }

  # No SPA rewrite: Next.js handles its routes, API endpoints and 404 responses.
  depends_on = [aws_iam_role_policy.amplify_logs]
}
