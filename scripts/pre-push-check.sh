#!/usr/bin/env bash
# Local pre-push quality gate.
#
# GitHub Actions is currently blocked account-wide by a billing lock, so this
# runs the same checks as .github/workflows/ci.yml before code leaves your machine.
# Once Actions is re-enabled, this can stay or be removed — CI remains authoritative.

set -euo pipefail

fail=0

run() {
  local name="$1"
  shift
  echo ""
  echo "=== $name ==="
  if "$@"; then
    echo "PASS: $name"
  else
    echo "FAIL: $name"
    fail=1
  fi
}

run "typecheck" pnpm typecheck
run "lint" pnpm lint
run "test" pnpm test

echo ""
if [ "$fail" -ne 0 ]; then
  echo "Pre-push aborted: failing checks above."
  exit 1
fi

echo "All checks passed."