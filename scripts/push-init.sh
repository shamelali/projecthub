#!/usr/bin/env bash
set -euo pipefail

echo "🚀 Pushing ProjectHub to GitHub"

if ! git remote | grep -q origin; then
  read -rp "Enter GitHub repo URL: " repo_url
  git remote add origin "$repo_url"
fi

git branch -M main

echo "Pushing to origin/main..."
git push -u origin main

echo "✅ Push complete"
echo "Remote: $(git remote get-url origin)"
echo ""
echo "Next: Connect repo to Vercel at https://vercel.com/new"
