#!/bin/bash
set -e

echo "Starting HLA-Compass Devkit Container..."
echo "========================================="

# Ensure proper permissions for PostgreSQL
if [ -z "$(ls -A /var/lib/postgresql/data)" ]; then
    echo "Initializing PostgreSQL data directory..."
    chown -R postgres:postgres /var/lib/postgresql/data
fi

# Ensure MinIO data directory has proper permissions
if [ ! -d "/data/.minio.sys" ]; then
    echo "Initializing MinIO data directory..."
    mkdir -p /data
fi

# Check if we need to initialize the database
INIT_FLAG="/var/lib/postgresql/data/pgdata/.hla_compass_initialized"

if [ ! -f "$INIT_FLAG" ]; then
    echo "First run detected. Database will be initialized with seed data."
    
    # Create initialization script
    cat > /docker-entrypoint-initdb.d/00-init.sql << 'EOF'
-- Create necessary schemas
CREATE SCHEMA IF NOT EXISTS platform;
CREATE SCHEMA IF NOT EXISTS scientific;
CREATE SCHEMA IF NOT EXISTS analytics;

-- Grant permissions
GRANT ALL ON SCHEMA platform TO postgres;
GRANT ALL ON SCHEMA scientific TO postgres;
GRANT ALL ON SCHEMA analytics TO postgres;

-- Set search path
ALTER DATABASE hla_compass SET search_path TO platform, scientific, analytics, public;

-- Create initialization flag
CREATE TABLE IF NOT EXISTS platform.initialization_flag (
    initialized_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO platform.initialization_flag DEFAULT VALUES;
EOF
    
    # If seed file exists, add it to initialization
    if [ -f "/docker-entrypoint-initdb.d/peptide_dataset_10k.sql" ]; then
        echo "Seed data found, will be loaded during initialization."
    else
        echo "No seed data found. Container will start with empty database."
        echo "To add seed data later, run:"
        echo "  docker cp seed.sql <container>:/tmp/seed.sql"
        echo "  docker exec <container> psql -U postgres -d hla_compass -f /tmp/seed.sql"
    fi
fi

# Start supervisor to manage both services
echo ""
echo "Starting services..."
echo "  PostgreSQL on port 5432"
echo "  MinIO API on port 9000"
echo "  MinIO Console on port 9001"
echo ""
echo "Default credentials:"
echo "  PostgreSQL: postgres/postgres"
echo "  MinIO: minioadmin/minioadmin"
echo "========================================="

# Create buckets after MinIO starts
(
    sleep 10
    if command -v mc >/dev/null 2>&1; then
        echo "Configuring MinIO buckets..."
        mc alias set local http://localhost:9000 minioadmin minioadmin 2>/dev/null || true
        mc mb local/hla-compass-modules 2>/dev/null || true
        mc mb local/hla-compass-results 2>/dev/null || true
        echo "MinIO buckets created: hla-compass-modules, hla-compass-results"
    fi
) &

# Run supervisord
exec /usr/bin/supervisord -c /etc/supervisor/supervisord.conf