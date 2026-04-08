#!/bin/sh
set -e

echo "[entrypoint] Running database migrations..."
npx prisma migrate deploy

echo "[entrypoint] Checking if seed is needed..."
SUBJECT_COUNT=$(node -e "
const { PrismaClient } = require('./src/generated/prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });
prisma.subject.count().then(n => { console.log(n); prisma.\$disconnect(); }).catch(() => { console.log(0); });
")

if [ "$SUBJECT_COUNT" = "0" ]; then
  echo "[entrypoint] Seeding database..."
  npx prisma db seed
else
  echo "[entrypoint] Database already seeded ($SUBJECT_COUNT subjects), skipping."
fi

echo "[entrypoint] Starting application..."
exec node server.js
