resource "aws_cloudwatch_log_group" "web_function" {
  name              = "/fin-and-feast/web-functions/${var.function_name}"
  retention_in_days = 7
}
