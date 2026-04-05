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
next_dir="$(mktemp -d "${TMPDIR:-/tmp}/calendarcn-webkit-next.XXXXXX")"
playwright_args=("$@")

if [[ ${#playwright_args[@]} -gt 0 && "${playwright_args[0]}" == "--" ]]; then
  playwright_args=("${playwright_args[@]:1}")
fi

cleanup() {
  rm -rf "$next_dir"
}

trap cleanup EXIT

echo "Running WebKit tests in ${docker_image}" >&2

exec docker run \
  --rm \
  --ipc=host \
  --user "$(id -u):$(id -g)" \
  -e CI="${CI:-1}" \
  -e COREPACK_ENABLE_DOWNLOAD_PROMPT=0 \
  -e HOME=/tmp/playwright-docker-home \
  -v "$repo_root:/work" \
  -v "$next_dir:/work/.next" \
  -w /work \
  "$docker_image" \
  bash -lc 'mkdir -p "$HOME/.local/bin"; corepack enable --install-directory "$HOME/.local/bin" pnpm >/dev/null 2>&1; export PATH="$HOME/.local/bin:$PATH"; pnpm exec playwright test --project=webkit "$@"' \
  bash \
  "${playwright_args[@]}"
