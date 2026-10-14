resource "aws_iam_role_policy" "web_function_logs" {
  name = "write-web-function-logs"
  role = aws_iam_role.web_function.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["logs:CreateLogStream", "logs:PutLogEvents"]
      Resource = "${aws_cloudwatch_log_group.web_function.arn}:*"
    }]
  })
}
