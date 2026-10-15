#!/usr/bin/env bash
set -euo pipefail

echo "🌱 Seeding ProjectHub database..."

if [ ! -f .env ]; then
  echo "No .env found, copying from .env.local.example"
  cp .env.local.example .env
fi

# Wait for DB
echo "Checking database connection..."
sleep 2

pnpm db:generate
pnpm db:push
pnpm db:seed

echo "✅ Seed complete"
echo "Demo login: demo@projecthub.dev"
