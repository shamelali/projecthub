#!/usr/bin/env bash
# Guard against committing credentials that should never be in the repo.
#
# A demo password was committed in bd23e2a as a seed fallback and became a live
# production credential. This catches that class of mistake before code leaves
# the machine. Patterns are deliberately narrow to avoid false positives on the
# empty placeholder values in .env.example.

set -euo pipefail

fail=0

# Checked only in tracked files, so local gitignored secrets never trip it.
# Patterns are deliberately narrow to avoid false positives on the placeholder
# values in .env.example.
LEAK_PATTERNS=(
  # Split so this denylist does not itself match.
  'projecthub-demo-'"2026"
  # An assigned DEMO_PASSWORD. Comment lines are excluded so usage docs in
  # set-demo-password.ts are not flagged.
  '^[^#*]*DEMO_PASSWORD="[^"]'
  "^[^#*]*DEMO_PASSWORD='[^']"
)

echo ""
echo "=== secret scan ==="

for pattern in "${LEAK_PATTERNS[@]}"; do
  if git grep -nEI -- "$pattern" -- . >/dev/null 2>&1; then
    echo "FAIL: matched '$pattern' in tracked files:"
    git grep -nEI -- "$pattern" -- . | head -5
    fail=1
  fi
done

if [ "$fail" -ne 0 ]; then
  echo ""
  echo "Secret scan failed. Remove the value or move it to ~/.secrets."
  exit 1
fi

echo "PASS: secret scan"
