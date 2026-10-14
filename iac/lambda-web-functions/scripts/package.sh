#!/usr/bin/env bash
set -euo pipefail

root_dir="$(cd "$(dirname "$0")/.." && pwd)"
repo_dir="$(cd "$root_dir/../.." && pwd)"

command -v docker >/dev/null || { echo 'Docker with Linux ARM64 support is required.' >&2; exit 1; }
command -v python3 >/dev/null || { echo 'Python 3 is required to assemble the zip.' >&2; exit 1; }
build_context="$(mktemp -d)"

trap 'rm -rf "$build_context"' EXIT

# Copy only build inputs. Never bring host node_modules, .next or secrets along.
python3 "$root_dir/scripts/prepare_build.py" "$repo_dir/app" "$build_context"

mkdir -p "$build_context/export"

docker run --rm --platform linux/arm64 \
  --mount "type=bind,source=$build_context,target=/input,readonly" \
  --mount "type=bind,source=$build_context/export,target=/export" \
  -w /work -e NEXT_TELEMETRY_DISABLED=1 node:24-bookworm \
  sh -c 'cp -R /input/. /work/ && npm ci && npm run lint && npm run build:standalone && cp -R .next/standalone /export/standalone'

mkdir -p "$root_dir/build"

python3 "$root_dir/scripts/package_artifact.py" "$build_context/export/standalone" "$root_dir"
