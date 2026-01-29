output "s3_bucket_name" {
  description = "Name of the S3 bucket"
  value       = aws_s3_bucket.docs.id
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID"
  value       = aws_cloudfront_distribution.docs.id
}

output "cloudfront_domain_name" {
  description = "CloudFront distribution domain name"
  value       = aws_cloudfront_distribution.docs.domain_name
}

output "website_url" {
  description = "Website URL"
  value       = "https://${var.domain_name}"
}
