#!/bin/bash
# Local deployment script for Compass-WIKI documentation
# For CI/CD, use the GitHub Actions workflow instead
set -euo pipefail

echo "=== Compass-WIKI Documentation Deployment ==="
echo "Target: https://docs.alithea.bio"
echo ""

# Check prerequisites
command -v mkdocs &>/dev/null || { echo "Error: mkdocs not installed. Run: pip install mkdocs-material mkdocstrings[python]"; exit 1; }
command -v aws &>/dev/null || { echo "Error: AWS CLI not installed"; exit 1; }

# Get config from SSM
BUCKET=$(aws ssm get-parameter --name "/compass-wiki/s3-bucket" --query "Parameter.Value" --output text)
DISTRIBUTION_ID=$(aws ssm get-parameter --name "/compass-wiki/cloudfront-distribution-id" --query "Parameter.Value" --output text)

echo "Bucket: ${BUCKET}"
echo "Distribution: ${DISTRIBUTION_ID}"
echo ""

# Build
echo "[1/3] Building documentation..."
mkdocs build --strict

# Deploy to S3
echo "[2/3] Syncing to S3..."
aws s3 sync site/ "s3://${BUCKET}" --delete

# Invalidate CloudFront
echo "[3/3] Invalidating CloudFront cache..."
aws cloudfront create-invalidation --distribution-id "${DISTRIBUTION_ID}" --paths "/*" --query "Invalidation.Id" --output text

echo ""
echo "✅ Deployed to https://docs.alithea.bio"
