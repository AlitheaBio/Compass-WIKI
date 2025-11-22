#!/bin/bash

# Health check for the devkit container
# Checks both PostgreSQL and MinIO are running

POSTGRES_HEALTHY=0
MINIO_HEALTHY=0

# Check PostgreSQL
if pg_isready -U postgres -d hla_compass -h localhost -p 5432 >/dev/null 2>&1; then
    POSTGRES_HEALTHY=1
fi

# Check MinIO
if curl -f http://localhost:9000/minio/health/ready >/dev/null 2>&1; then
    MINIO_HEALTHY=1
fi

# Both services must be healthy
if [ $POSTGRES_HEALTHY -eq 1 ] && [ $MINIO_HEALTHY -eq 1 ]; then
    echo "✓ All services healthy"
    exit 0
else
    echo "✗ Service check failed"
    [ $POSTGRES_HEALTHY -eq 0 ] && echo "  - PostgreSQL: not responding"
    [ $MINIO_HEALTHY -eq 0 ] && echo "  - MinIO: not responding"
    exit 1
fi