#!/bin/bash
# Builds the Next.js app for the OpenNext Cloudflare adapter.
#
# Workaround: Next 15.5's standalone-output step crashes on a clean build with
# `ENOENT: copyfile .next/server/edge-instrumentation.js -> .next/standalone/...`
# because the destination directory is not created before the instrumentation
# copy runs. Pre-creating it lets the copy succeed (matches the state a
# previous build would have left behind). Remove once on a Next version that
# fixes the ordering.
set -euo pipefail
cd "$(dirname "$0")/.."

mkdir -p .next/standalone/.next/server

exec pnpm exec opennextjs-cloudflare build "$@"
