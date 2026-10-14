resource "awscc_lambda_web_function_revision" "demo" {
  function_name = awscc_lambda_web_function.demo.function_name
  description   = "Next.js standalone ${filesha256(var.artifact_path)}"
  build_config = {
    code_config = {
      s3_object = {
        bucket     = aws_s3_object.application.bucket
        key        = aws_s3_object.application.key
        version_id = aws_s3_object.application.version_id
      }
    }
    runtime_config = { runtime = "nodejs24.x" }
  }
  service_config = {
    execution_role_arn              = aws_iam_role.web_function.arn
    timeout_seconds                 = 30
    max_concurrency_per_environment = 16
    environment_variables = {
      NODE_ENV                = "production"
      NEXT_TELEMETRY_DISABLED = "1"
    }
    telemetry_config = {
      logging_config = { log_group = aws_cloudwatch_log_group.web_function.name }
    }
  }
  lifecycle {
    # The endpoint must move off the old immutable revision before it is deleted.
    create_before_destroy = true
  }
  depends_on = [aws_s3_bucket_policy.artifacts, aws_iam_role_policy.web_function_logs]
}
