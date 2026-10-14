resource "awscc_lambda_web_function_endpoint" "demo" {
  function_name = awscc_lambda_web_function.demo.function_name
  endpoint_name = "demo"
  endpoint_type = "HomeRegion"
  # The fictional shop is publicly accessible after apply.
  auth_type = "ApplicationManaged"
  revision_weights = [{
    revision_id = awscc_lambda_web_function_revision.demo.revision_id
    weight      = 100
  }]
  scaling_config  = { max_environments = 2 }
  throttle_config = { rate_limit = 100 }
}
