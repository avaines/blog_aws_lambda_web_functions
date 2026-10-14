resource "aws_amplify_branch" "demo" {
  app_id      = aws_amplify_app.demo.id
  branch_name = var.branch_name
  framework   = "Next.js - SSR"
  stage       = "PRODUCTION"

  enable_auto_build           = var.enable_auto_build
  enable_pull_request_preview = false
  enable_performance_mode     = false
}
