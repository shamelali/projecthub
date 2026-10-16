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

# Pull env vars (writes .env.vercel — gitignored, never commit)
vercel env pull .env.vercel

echo ""
echo "✅ Vercel linked"
echo "Apply production migrations with:"
echo "  set -a && . ./.env.vercel && set +a && pnpm db:migrate:deploy"
echo ""
echo "Then deploy:"
echo "  vercel --prod"
