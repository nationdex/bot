/**
 * Admin panel BM2 entry point
 *
 * In production mode, checks for a .next build directory and runs
 * `next build` first if missing. This prevents the crash loop that
 * occurs when BM2 restarts a production start against an unbuilt app.
 */

import { existsSync } from 'node:fs';
import { join } from 'node:path';

// ── Node version validation ───────────────────────────────────────────────────
const REQUIRED_NODE_VERSION = 20; // Next.js requires Node >= 20.9.0
const currentVersion = parseInt(process.versions.node.split('.')[0], 10);

if (currentVersion < REQUIRED_NODE_VERSION) {
  const errorMsg = `[admin-panel] ERROR: Node.js version ${process.versions.node} detected.\nNext.js requires Node.js >= ${REQUIRED_NODE_VERSION}.9.0\n\nTo fix this:\n  1. Install Node.js ${REQUIRED_NODE_VERSION}.9.0 or later from https://nodejs.org\n  2. For nvm users: run 'nvm install --lts' and 'nvm use lts'\n  3. Ensure the correct Node version is in your system PATH before starting BM2`;
  console.error(errorMsg);
  process.exit(1);
}

// Ensure the correct Node version is used by prepending nvm's node to PATH
const home = process.env.HOME ?? '/home/arielaram';
const nvmNodePath = join(home, '.nvm', 'versions', 'node', `v${currentVersion}.14.1`, 'bin');
if (existsSync(nvmNodePath)) {
  process.env.PATH = `${nvmNodePath}:${process.env.PATH}`;
}

const isDev = process.env.NODE_ENV !== 'production';
const port = process.env.PORT ?? '3000';
const siteDir = import.meta.dir;

console.log(
  `[admin-panel] Starting Next.js in ${isDev ? 'development' : 'production'} mode on port ${port}`
);
console.log(`[admin-panel] Node.js version: ${process.versions.node}`);

// In production, ensure the app has been built before starting.
if (!isDev) {
  const buildDir = join(siteDir, '.next');
  console.log(`[admin-panel] website root: ${siteDir}`);
  console.log(`[admin-panel] buildDir: ${buildDir}`);
  if (!existsSync(buildDir)) {
    console.log('[admin-panel] No .next build found — running next build first...');
    const build = Bun.spawn(['bun', 'next', 'build', '.'], {
      cwd: siteDir,
      stdio: ['inherit', 'inherit', 'inherit'],
      env: { ...process.env, NODE_ENV: 'production' },
    });
    const buildCode = await build.exited;
    if (buildCode !== 0) {
      console.error(`[admin-panel] next build failed with exit code ${buildCode}`);
      process.exit(buildCode ?? 1);
    }
    console.log('[admin-panel] next build completed successfully.');
  }
}

const cmd = isDev ? 'dev' : 'start';
const proc = Bun.spawn(['bun', 'next', cmd, '.', '--port', port], {
  cwd: siteDir,
  stdio: ['inherit', 'inherit', 'inherit'],
  env: { ...process.env, PORT: port, NODE_ENV: isDev ? process.env.NODE_ENV : 'production' },
});

function shutdown(signal: number) {
  proc.kill(signal);
  // Force-kill the child after 6s in case Next.js's graceful shutdown stalls.
  // Must fire before bm2's killTimeout (8s) so the port is free on restart.
  const forceKill = setTimeout(() => {
    try {
      proc.kill(9);
    } catch {
      /* already dead */
    }
  }, 6_000);
  // Don't let this timer keep Bun alive if proc exits quickly.
  if (typeof forceKill.unref === 'function') forceKill.unref();
}

process.on('SIGTERM', () => shutdown(15)); // 15 = SIGTERM
process.on('SIGINT', () => shutdown(2)); // 2  = SIGINT

const code = await proc.exited;
process.exit(code ?? 0);
