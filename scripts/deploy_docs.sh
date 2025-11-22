#!/bin/bash
set -e

# Configuration
ENVIRONMENT="${ENVIRONMENT:-dev}"
BUCKET_NAME="hla-compass-docs-${ENVIRONMENT}"
DISTRIBUTION_ID_PARAM="/hla-compass/${ENVIRONMENT}/docs/cloudfront-distribution-id"

# Check if mkdocs is installed
if ! command -v mkdocs &> /dev/null; then
    echo "mkdocs could not be found. Please install it using 'pip install mkdocs-material mkdocstrings[python]'"
    exit 1
fi

echo "Building documentation..."
mkdocs build

echo "Deploying to ${ENVIRONMENT} environment..."

# Check if bucket exists
if aws s3 ls "s3://${BUCKET_NAME}" 2>&1 | grep -q 'NoSuchBucket'; then
    echo "Error: Bucket ${BUCKET_NAME} does not exist. Please create it first via Terraform."
    exit 1
fi

# Sync files to S3
echo "Syncing files to s3://${BUCKET_NAME}..."
aws s3 sync site/ "s3://${BUCKET_NAME}" --delete

# Invalidate CloudFront cache if distribution ID is available
echo "Checking for CloudFront distribution ID..."
DISTRIBUTION_ID=$(aws ssm get-parameter --name "${DISTRIBUTION_ID_PARAM}" --query "Parameter.Value" --output text 2>/dev/null || echo "")

if [ -n "${DISTRIBUTION_ID}" ]; then
    echo "Invalidating CloudFront cache for distribution ${DISTRIBUTION_ID}..."
    aws cloudfront create-invalidation --distribution-id "${DISTRIBUTION_ID}" --paths "/*"
    echo "Deployment complete! Docs should be available shortly."
else
    echo "Warning: Could not find CloudFront distribution ID in SSM parameter ${DISTRIBUTION_ID_PARAM}."
    echo "Cache invalidation skipped. You may not see changes immediately."
fi
