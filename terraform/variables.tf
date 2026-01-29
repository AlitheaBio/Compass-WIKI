variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "eu-central-1"
}

variable "domain_name" {
  description = "Domain name for the documentation site"
  type        = string
  default     = "docs.alithea.bio"
}

variable "hosted_zone_id" {
  description = "Route53 hosted zone ID for alithea.bio"
  type        = string
  default     = "Z09039381LK9FZ76AA3OW"
}

variable "acm_certificate_arn" {
  description = "ACM certificate ARN (must be in us-east-1)"
  type        = string
  default     = "arn:aws:acm:us-east-1:803691999371:certificate/4c82f8a3-b7cc-4ebd-b2a0-cce3872014da"
}

variable "kms_key_arn" {
  description = "KMS key ARN for S3 encryption"
  type        = string
  default     = "arn:aws:kms:eu-central-1:803691999371:key/5a95576e-9de5-4e2d-8930-aedcc3f1745e"
}

variable "waf_web_acl_arn" {
  description = "WAF Web ACL ARN"
  type        = string
  default     = "arn:aws:wafv2:us-east-1:803691999371:global/webacl/hla-compass-dev-edge-waf/4bf0e86e-2140-4cec-b334-7c8cebf5f2c6"
}
