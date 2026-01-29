# Compass-WIKI Infrastructure

Terraform configuration for the documentation site infrastructure.

## Resources Managed

- **S3 Bucket**: `compass-wiki-docs` - Static site hosting with KMS encryption
- **CloudFront Distribution**: CDN with custom domain, compression, and WAF
- **CloudFront Function**: URL rewriting for directory paths
- **Route53 Records**: DNS A and AAAA records
- **SSM Parameters**: Configuration for CI/CD pipeline

## Prerequisites

1. AWS CLI configured with appropriate credentials
2. Terraform >= 1.5.0
3. Existing resources (referenced by ARN):
   - ACM certificate in us-east-1
   - KMS key for encryption
   - WAF Web ACL
   - Route53 hosted zone

## Usage

```bash
# Initialize
terraform init

# Plan changes
terraform plan

# Apply changes
terraform apply
```

## Import Existing Resources

If migrating from manually created resources:

```bash
terraform import aws_s3_bucket.docs hla-compass-docs-dev
terraform import aws_cloudfront_distribution.docs EW7RK49FVAG82
terraform import aws_cloudfront_origin_access_control.docs EUXK59M2RN4DZ
terraform import aws_route53_record.docs_a Z09039381LK9FZ76AA3OW_docs.alithea.bio_A
terraform import aws_route53_record.docs_aaaa Z09039381LK9FZ76AA3OW_docs.alithea.bio_AAAA
```

## Notes

- The S3 bucket uses KMS encryption; ensure the KMS key policy allows CloudFront access
- CloudFront function handles URL rewriting for MkDocs directory structure
- WAF provides protection against common web attacks
