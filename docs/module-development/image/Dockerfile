# HLA-Compass Devkit Container
# Single container with PostgreSQL 15 and MinIO for external module development
FROM postgres:15-alpine

# Install required packages
RUN apk add --no-cache \
    curl \
    bash \
    supervisor \
    ca-certificates \
    wget \
    && mkdir -p /var/log/supervisor /etc/supervisor/conf.d /data /scripts

# Download and install MinIO and MinIO client
RUN wget -q https://dl.min.io/server/minio/release/linux-amd64/minio -O /usr/local/bin/minio \
    && chmod +x /usr/local/bin/minio \
    && wget -q https://dl.min.io/client/mc/release/linux-amd64/mc -O /usr/local/bin/mc \
    && chmod +x /usr/local/bin/mc

# Environment variables for PostgreSQL
ENV POSTGRES_USER=postgres \
    POSTGRES_PASSWORD=postgres \
    POSTGRES_DB=hla_compass \
    PGDATA=/var/lib/postgresql/data/pgdata

# Environment variables for MinIO
ENV MINIO_ROOT_USER=minioadmin \
    MINIO_ROOT_PASSWORD=minioadmin \
    MINIO_DATA_DIR=/data \
    MINIO_CONSOLE_ADDRESS=:9001

# Copy configuration files
COPY supervisord.conf /etc/supervisor/supervisord.conf
COPY entrypoint.sh /scripts/entrypoint.sh
COPY health-check.sh /scripts/health-check.sh

# Make scripts executable
RUN chmod +x /scripts/*.sh

# Create necessary directories
RUN mkdir -p /var/lib/postgresql/data /data /docker-entrypoint-initdb.d

# Copy seed data if it exists (will be added later)
# COPY peptide_dataset_10k.sql /docker-entrypoint-initdb.d/

# Expose ports
# PostgreSQL: 5432
# MinIO API: 9000
# MinIO Console: 9001
EXPOSE 5432 9000 9001

# Volumes for data persistence
VOLUME ["/var/lib/postgresql/data", "/data"]

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD /scripts/health-check.sh || exit 1

# Use custom entrypoint
ENTRYPOINT ["/scripts/entrypoint.sh"]