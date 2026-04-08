#!/usr/bin/env bash
set -euo pipefail

# VPS Auto-Deploy — polls git for new commits and runs deploy.sh
# Intended to be called via cron:
#   */2 * * * * ~/learnforge/vps-autodeploy.sh >> /var/log/learnforge-deploy.log 2>&1

REPO_DIR="$(cd "$(dirname "$0")" && pwd)"
BRANCH="main"
LOCK_FILE="/tmp/learnforge-deploy.lock"

# Prevent concurrent runs
if [ -f "$LOCK_FILE" ]; then
  LOCK_PID=$(cat "$LOCK_FILE" 2>/dev/null || true)
  if kill -0 "$LOCK_PID" 2>/dev/null; then
    echo "[autodeploy] $(date -Iseconds) Already running (pid $LOCK_PID), skipping."
    exit 0
  fi
  rm -f "$LOCK_FILE"
fi
echo $$ > "$LOCK_FILE"
trap 'rm -f "$LOCK_FILE"' EXIT

cd "$REPO_DIR"

# Fetch latest
git fetch origin "$BRANCH" --quiet

LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse "origin/$BRANCH")

if [ "$LOCAL" = "$REMOTE" ]; then
  echo "[autodeploy] $(date -Iseconds) Up to date ($LOCAL). Nothing to do."
  exit 0
fi

echo "[autodeploy] $(date -Iseconds) New commits: $LOCAL -> $REMOTE"
git reset --hard "origin/$BRANCH"

# Run project-specific deploy
bash "$REPO_DIR/deploy.sh"

echo "[autodeploy] $(date -Iseconds) Deploy complete."
