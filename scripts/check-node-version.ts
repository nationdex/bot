#!/usr/bin/env bun
/**
 * Node.js version checker for Nationdex deployment
 *
 * This script verifies that the system has the minimum required Node.js version
 * for running the admin panel with Next.js. Run this before starting BM2.
 *
 * Usage:
 *   bun scripts/check-node-version.ts
 */

const REQUIRED_MAJOR_VERSION = 20;
const REQUIRED_MINOR_VERSION = 9;

const nodeVersion = process.versions.node;
const [major, minor] = nodeVersion.split('.').map(Number);

if (major === undefined || minor === undefined) {
  console.error(`[ERROR] Could not parse Node.js version: ${nodeVersion}`);
  process.exit(1);
}

const isValid =
  major > REQUIRED_MAJOR_VERSION ||
  (major === REQUIRED_MAJOR_VERSION && minor >= REQUIRED_MINOR_VERSION);

console.log('');
console.log('═══════════════════════════════════════════════════════════');
console.log('  Node.js Version Check for Nationdex');
console.log('═══════════════════════════════════════════════════════════');
console.log('');
console.log(`Current Node.js version:  v${nodeVersion}`);
console.log(`Required Node.js version: >= v${REQUIRED_MAJOR_VERSION}.${REQUIRED_MINOR_VERSION}.0`);
console.log('');

if (isValid) {
  console.log('✅ Node.js version is compatible!');
  console.log('');
  console.log('You can now start the application with:');
  console.log('  bun run pm  (background mode)');
  console.log('  bun run pm:fg  (foreground mode)');
  console.log('');
  process.exit(0);
} else {
  console.error(`❌ Node.js version v${nodeVersion} is TOO OLD!`);
  console.error('');
  console.error('How to fix:');
  console.error('');
  console.error('Option 1: Using nvm (recommended)');
  console.error('  export NVM_DIR="$HOME/.nvm"');
  console.error('  [ -s "$NVM_DIR/nvm.sh" ] && \\. "$NVM_DIR/nvm.sh"');
  console.error('  nvm install --lts');
  console.error('  nvm use --lts');
  console.error('');
  console.error('Option 2: Install from nodejs.org');
  console.error(`  Visit: https://nodejs.org/en/download`);
  console.error(`  Download and install Node.js ${REQUIRED_MAJOR_VERSION}.x (LTS)`);
  console.error('');
  console.error('Option 3: Using package manager (Linux/macOS)');
  console.error('  apt install nodejs  (Debian/Ubuntu)');
  console.error('  brew install node   (macOS with Homebrew)');
  console.error('');
  process.exit(1);
}
