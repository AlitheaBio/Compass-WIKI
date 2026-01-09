#!/usr/bin/env bash
set -euo pipefail

ENV_FILE=".env.devkit"
TEMPLATE_FILE=".env.example"

if [[ -f "$ENV_FILE" ]]; then
  echo "$ENV_FILE already exists. Skipping."
  exit 0
fi

if [[ ! -f "$TEMPLATE_FILE" ]]; then
  echo "Missing $TEMPLATE_FILE. Cannot initialize dev environment." >&2
  exit 1
fi

if ! command -v openssl >/dev/null 2>&1; then
  echo "openssl is required to generate credentials." >&2
  exit 1
fi

generate_secret() {
  openssl rand -base64 48 | tr -dc 'a-zA-Z0-9' | head -c 24
}

DB_PASSWORD="$(generate_secret)"
S3_SECRET="$(generate_secret)"

cp "$TEMPLATE_FILE" "$ENV_FILE"
chmod 600 "$ENV_FILE"

sed -i.bak \
  -e "s/^DEVKIT_DB_PASSWORD=.*/DEVKIT_DB_PASSWORD=${DB_PASSWORD}/" \
  -e "s/^DEVKIT_S3_SECRET_KEY=.*/DEVKIT_S3_SECRET_KEY=${S3_SECRET}/" \
  "$ENV_FILE"

rm -f "${ENV_FILE}.bak"
echo "Generated secure credentials in $ENV_FILE"
