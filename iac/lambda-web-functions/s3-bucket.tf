resource "aws_s3_bucket" "artifacts" {
  bucket_prefix = "fin-feast-web-code-"
  # This dedicated demo bucket is removed, including old versions, on destroy.
  force_destroy = true
}
