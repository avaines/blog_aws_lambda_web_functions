provider "aws" {
  region = var.aws_region
  default_tags {
    tags = {
      Project   = "fin-and-feast"
      ManagedBy = "Terraform"
      Hosting   = "amplify"
    }
  }
}
