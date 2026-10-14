resource "aws_s3_object" "application" {
  bucket       = aws_s3_bucket.artifacts.id
  key          = "releases/application.zip"
  source       = var.artifact_path
  source_hash  = filesha256(var.artifact_path)
  content_type = "application/zip"
  # A stable key creates a new S3 version on update; old revision bytes remain.
  depends_on = [aws_s3_bucket_versioning.artifacts, aws_s3_bucket_server_side_encryption_configuration.artifacts]
}
