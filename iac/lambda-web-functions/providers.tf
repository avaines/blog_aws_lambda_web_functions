provider "aws" {
  region = var.aws_region
  default_tags {
    tags = {
      Project   = "fin-and-feast"
      ManagedBy = "Terraform"
      Hosting   = "lambda-web-functions"
    }
  }
}

provider "awscc" {
  region = var.aws_region
}
