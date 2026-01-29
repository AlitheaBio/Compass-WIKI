# CloudFront Origin Access Control
resource "aws_cloudfront_origin_access_control" "docs" {
  name                              = "compass-wiki-docs-oac"
  description                       = "OAC for Compass-WIKI documentation S3 bucket"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# CloudFront Function for URL rewriting
resource "aws_cloudfront_function" "url_rewrite" {
  name    = "compass-wiki-url-rewrite"
  runtime = "cloudfront-js-2.0"
  comment = "Append index.html to directory requests"
  publish = true
  code    = file("${path.module}/functions/url-rewrite.js")
}

# CloudFront Distribution
resource "aws_cloudfront_distribution" "docs" {
  enabled             = true
  is_ipv6_enabled     = true
  comment             = "Compass-WIKI documentation site"
  default_root_object = "index.html"
  aliases             = [var.domain_name]
  price_class         = "PriceClass_100"
  http_version        = "http2"
  web_acl_id          = var.waf_web_acl_arn

  origin {
    domain_name              = aws_s3_bucket.docs.bucket_regional_domain_name
    origin_id                = "S3-${aws_s3_bucket.docs.id}"
    origin_access_control_id = aws_cloudfront_origin_access_control.docs.id
  }

  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-${aws_s3_bucket.docs.id}"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    compress               = true
    min_ttl                = 0
    default_ttl            = 3600
    max_ttl                = 86400

    function_association {
      event_type   = "viewer-request"
      function_arn = aws_cloudfront_function.url_rewrite.arn
    }
  }

  custom_error_response {
    error_code            = 404
    response_code         = 200
    response_page_path    = "/index.html"
    error_caching_min_ttl = 300
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    acm_certificate_arn      = var.acm_certificate_arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }

  logging_config {
    include_cookies = false
    bucket          = "hla-compass-logs-dev.s3.amazonaws.com"
    prefix          = "cloudfront/docs/"
  }
}
