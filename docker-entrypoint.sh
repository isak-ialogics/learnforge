#!/bin/sh
set -e

echo "[entrypoint] Pushing database schema..."
npx prisma db push

echo "[entrypoint] Checking if seed is needed..."
SUBJECT_COUNT=$(node -e "
const { Client } = require('pg');
const client = new Client({ connectionString: process.env.DATABASE_URL });
client.connect()
  .then(() => client.query('SELECT COUNT(*) FROM \"Subject\"'))
  .then(r => { console.log(r.rows[0].count); return client.end(); })
  .catch(() => { console.log('0'); process.exit(0); });
")

if [ "$SUBJECT_COUNT" = "0" ]; then
  echo "[entrypoint] Seeding database..."
  npx prisma db seed
else
  echo "[entrypoint] Database already seeded ($SUBJECT_COUNT subjects), skipping."
fi

echo "[entrypoint] Starting application..."
exec node server.js
