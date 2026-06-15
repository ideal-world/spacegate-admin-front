#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if [[ -s "${NVM_DIR:-$HOME/.nvm}/nvm.sh" ]]; then
  # Match the project Node version before resolving pnpm/corepack shims.
  # shellcheck source=/dev/null
  source "${NVM_DIR:-$HOME/.nvm}/nvm.sh"
  nvm use >/dev/null 2>&1 || nvm use node >/dev/null
fi

echo "[spacegate-admin-front] node: $(node --version)"

NODE_MAJOR="$(node -p "Number(process.versions.node.split('.')[0])")"
if (( NODE_MAJOR < 18 )); then
  echo "[spacegate-admin-front] Node >= 18 is required. Current: $(node --version)" >&2
  exit 1
fi

if ! command -v pnpm >/dev/null 2>&1; then
  echo "[spacegate-admin-front] pnpm is required. Install via corepack or npm." >&2
  exit 1
fi

PNPM_VERSION="$(pnpm --version)"
echo "[spacegate-admin-front] pnpm: ${PNPM_VERSION}"

if [[ "${SKIP_INSTALL:-0}" != "1" ]]; then
  if [[ "${FROZEN_LOCKFILE:-1}" == "1" ]]; then
    pnpm install --frozen-lockfile
  else
    pnpm install
  fi
else
  echo "[spacegate-admin-front] skip install"
fi

pnpm run build

if [[ "${RUN_DOCS:-0}" == "1" ]]; then
  DOCS_PORT="${DOCS_PORT:-5173}"
  API_BASE="${VITE_API_BASE_PATH:-http://localhost:3000/admin}"
  echo "[spacegate-admin-front] docs: http://localhost:${DOCS_PORT}"
  VITE_API_BASE_PATH="$API_BASE" pnpm exec vitepress dev docs --host 0.0.0.0 --port "$DOCS_PORT"
fi
