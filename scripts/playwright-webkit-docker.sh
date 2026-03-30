#!/usr/bin/env bash

set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)"

if ! command -v docker >/dev/null 2>&1; then
  echo "docker is required to run WebKit in a supported environment" >&2
  exit 1
fi

if ! command -v pnpm >/dev/null 2>&1; then
  echo "pnpm is required on the host to resolve the local Playwright version" >&2
  exit 1
fi

playwright_version="${PLAYWRIGHT_DOCKER_VERSION:-$(
  cd "$repo_root" && pnpm exec playwright --version | awk '{ print $2 }'
)}"
docker_image="${PLAYWRIGHT_DOCKER_IMAGE:-mcr.microsoft.com/playwright:v${playwright_version}-noble}"

echo "Running WebKit tests in ${docker_image}" >&2

exec docker run \
  --rm \
  --ipc=host \
  --user "$(id -u):$(id -g)" \
  -e CI="${CI:-1}" \
  -e HOME=/tmp/playwright-docker-home \
  -v "$repo_root:/work" \
  -w /work \
  "$docker_image" \
  bash -lc 'mkdir -p "$HOME"; corepack enable >/dev/null 2>&1 || true; pnpm exec playwright test --project=webkit "$@"' \
  bash \
  "$@"
