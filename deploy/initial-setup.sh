#!/bin/bash
# LearnForge - Initial VPS Deployment Setup
# Run this once on the VPS (or via SSH) to create the database and app services.
#
# Prerequisites:
#   - SSH access: ssh -i ~/.ssh/vps_ed25519 paperclip@192.168.100.38
#   - Docker Swarm with traefik-public overlay network
#   - GHCR image already pushed: ghcr.io/isak-ialogics/learnforge:latest

set -euo pipefail

DOMAIN="learnforge.mplace.co.za"
SERVICE_NAME="learnforge"
DB_SERVICE="${SERVICE_NAME}-db"
DB_NAME="learnforge"
DB_USER="learnforge"
DB_PASSWORD="$(openssl rand -hex 16)"
IMAGE="ghcr.io/isak-ialogics/learnforge:latest"

echo "=== LearnForge VPS Deployment ==="
echo "Domain: ${DOMAIN}"
echo "DB Password: ${DB_PASSWORD}"
echo ""

# 1. Create PostgreSQL service
echo "Creating PostgreSQL service..."
docker service create \
  --name "${DB_SERVICE}" \
  --network traefik-public \
  --replicas 1 \
  --env POSTGRES_DB="${DB_NAME}" \
  --env POSTGRES_USER="${DB_USER}" \
  --env POSTGRES_PASSWORD="${DB_PASSWORD}" \
  --mount type=volume,source="${SERVICE_NAME}-pgdata",target=/var/lib/postgresql/data \
  postgres:16-alpine

echo "Waiting for database to be ready..."
sleep 10

# 2. Create LearnForge app service
echo "Creating LearnForge app service..."
docker service create \
  --name "${SERVICE_NAME}" \
  --network traefik-public \
  --replicas 1 \
  --env DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@${DB_SERVICE}:5432/${DB_NAME}" \
  --env NODE_ENV=production \
  "${IMAGE}"

# 3. Add Traefik routing
echo ""
echo "=== MANUAL STEP: Add Traefik routing ==="
echo "Edit /opt/traefik/dynamic.yml and add:"
echo ""
cat <<YAML
# Under http.routers:
    ${SERVICE_NAME}:
      rule: "Host(\`${DOMAIN}\`)"
      entryPoints:
        - websecure
      service: ${SERVICE_NAME}
      tls:
        certResolver: letsencrypt

# Under http.services:
    ${SERVICE_NAME}:
      loadBalancer:
        servers:
          - url: "http://${SERVICE_NAME}:3000"
YAML

echo ""
echo "=== IMPORTANT: Save the DB password ==="
echo "DB_PASSWORD=${DB_PASSWORD}"
echo ""
echo "After adding Traefik config, verify at: https://${DOMAIN}"
