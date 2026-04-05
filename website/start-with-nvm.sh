#!/bin/bash
# Admin panel startup script with Node version detection and nvm support
# This script ensures Node.js >= 20.9.0 is used before running Next.js

set -e

REQUIRED_NODE_VERSION=20
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# ── Function to check Node version ────────────────────────────────────────────
check_node_version() {
  local node_bin="$1"
  local current_version=$("$node_bin" --version 2>/dev/null | cut -d'v' -f2 | cut -d'.' -f1)
  if [ -z "$current_version" ]; then
    return 1
  fi
  if [ "$current_version" -lt "$REQUIRED_NODE_VERSION" ]; then
    return 1
  fi
  return 0
}

# ── Try to use nvm if available ───────────────────────────────────────────────
if [ -s "$HOME/.nvm/nvm.sh" ]; then
  export NVM_DIR="$HOME/.nvm"
  \. "$NVM_DIR/nvm.sh"
  if command -v nvm &> /dev/null; then
    nvm use --lts > /dev/null 2>&1 || nvm use node > /dev/null 2>&1 || true
  fi
fi

# ── Verify Node version ───────────────────────────────────────────────────────
NODE_BIN=$(command -v node)
if ! check_node_version "$NODE_BIN"; then
  CURRENT_VERSION=$("$NODE_BIN" --version 2>/dev/null || echo "unknown")
  cat >&2 << EOF
ERROR: Node.js version is insufficient!

Current: $CURRENT_VERSION
Required: Node.js >= ${REQUIRED_NODE_VERSION}.9.0

To fix this:
  1. Install Node.js ${REQUIRED_NODE_VERSION}.9.0+ from https://nodejs.org
  2. For nvm users:
     export NVM_DIR="\$HOME/.nvm"
     [ -s "\$NVM_DIR/nvm.sh" ] && \. "\$NVM_DIR/nvm.sh"
     nvm install --lts
     nvm use --lts
  3. Ensure the correct Node is in \$PATH before starting BM2
  4. Try running: node --version

EOF
  exit 1
fi

echo "[admin-panel] Using Node.js version: $($NODE_BIN --version)"

# Run the start script with bun
exec bun run "$SCRIPT_DIR/start.ts"
