terraform {
  required_version = ">= 1.7, < 2.0"
  required_providers {
    awscc = {
      source  = "hashicorp/awscc"
      version = ">= 1.105.0, < 2.0"
    }
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
  }
}
