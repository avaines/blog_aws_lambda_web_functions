resource "awscc_lambda_web_function" "demo" {
  function_name = var.function_name
  tags = [
    { key = "Project", value = "fin-and-feast" },
    { key = "ManagedBy", value = "Terraform" }
  ]
}
