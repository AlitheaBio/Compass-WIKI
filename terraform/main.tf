terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket = "alithea-terraform-state"
    key    = "compass-wiki/terraform.tfstate"
    region = "eu-central-1"
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project    = "compass-wiki"
      Service    = "documentation"
      ManagedBy  = "terraform"
      Repository = "AlitheaBio/Compass-WIKI"
    }
  }
}

# Provider for CloudFront (must be us-east-1 for ACM certificates)
provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"

  default_tags {
    tags = {
      Project    = "compass-wiki"
      Service    = "documentation"
      ManagedBy  = "terraform"
      Repository = "AlitheaBio/Compass-WIKI"
    }
  }
}
