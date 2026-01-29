# SSM Parameters for deployment pipeline
resource "aws_ssm_parameter" "s3_bucket" {
  name        = "/compass-wiki/s3-bucket"
  description = "S3 bucket name for Compass-WIKI documentation"
  type        = "String"
  value       = aws_s3_bucket.docs.id
}

resource "aws_ssm_parameter" "cloudfront_distribution_id" {
  name        = "/compass-wiki/cloudfront-distribution-id"
  description = "CloudFront distribution ID for Compass-WIKI documentation"
  type        = "String"
  value       = aws_cloudfront_distribution.docs.id
}
