#!/usr/bin/env bash
set -euo pipefail

echo "🚀 ProjectHub Dev Setup"

# Check prerequisites
command -v docker >/dev/null 2>&1 || { echo "Docker required"; exit 1; }
command -v pnpm >/dev/null 2>&1 || { echo "pnpm required"; exit 1; }

# Start Postgres
if ! docker compose ps db | grep -q "Up"; then
  echo "Starting Postgres..."
  docker compose up -d db
  echo "Waiting for Postgres healthcheck..."
  sleep 5
fi

# Copy env if missing
if [ ! -f .env ]; then
  echo "Creating .env from .env.local.example"
  cp .env.local.example .env
fi

# Install deps
echo "Installing dependencies..."
pnpm install

# Prisma
echo "Generating Prisma client..."
pnpm db:generate

echo "Running migrations..."
pnpm db:migrate

# Optional seed
if [ "${SEED:-true}" = "true" ]; then
  echo "Seeding database..."
  pnpm db:seed
fi

echo "✅ Dev setup complete"
echo "Run: pnpm dev"
