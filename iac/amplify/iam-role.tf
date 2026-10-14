data "aws_caller_identity" "current" {}
data "aws_partition" "current" {}

resource "aws_iam_role" "amplify_service" {
  name_prefix = "fin-feast-amplify-"
  description = "Amplify Hosting SSR service role for Fin & Feast"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "amplify.amazonaws.com" }
      Action    = "sts:AssumeRole"
      Condition = {
        StringEquals = { "aws:SourceAccount" = data.aws_caller_identity.current.account_id }
        ArnLike = {
          "aws:SourceArn" = "arn:${data.aws_partition.current.partition}:amplify:${var.aws_region}:${data.aws_caller_identity.current.account_id}:apps/*"
        }
      }
    }]
  })
}
