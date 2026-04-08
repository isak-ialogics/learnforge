#!/usr/bin/env bash
set -euo pipefail

# Project-specific deploy script for LearnForge
# Called by vps-autodeploy.sh after detecting a new commit

IMAGE="learnforge:latest"
SERVICE="learnforge"

echo "[deploy] Building $IMAGE ..."
docker build -t "$IMAGE" .

echo "[deploy] Updating swarm service $SERVICE ..."
docker service update --image "$IMAGE" --force "$SERVICE"

echo "[deploy] Done."
