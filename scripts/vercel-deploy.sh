#!/usr/bin/env bash
set -euo pipefail

echo "🚀 Vercel Deploy Check"

# Check login
vercel whoami || { echo "Run 'vercel login' first"; exit 1; }

# Link project if needed
if [ ! -f .vercel/project.json ]; then
  echo "Linking Vercel project..."
  vercel link --yes
fi

# Pull env vars
vercel env pull .env.vercel

echo "✅ Vercel ready"
echo "Run: vercel --prod"
