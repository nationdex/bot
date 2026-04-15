/**
 * Admin panel entry point
 *
 * In production mode, checks for a .next build directory and runs
 * `next build` first if missing. This prevents a crash on first start
 * against an unbuilt app.
 */

import { existsSync } from 'node:fs';
import { join } from 'node:path';

const isDev = process.env.NODE_ENV !== 'production';
const port = process.env.PORT ?? '3000';
const siteDir = import.meta.dir;

console.log(
  `[admin-panel] Starting Next.js in ${isDev ? 'development' : 'production'} mode on port ${port}`
);

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
  const forceKill = setTimeout(() => {
    try {
      proc.kill(9);
    } catch {
      /* already dead */
    }
  }, 6_000);
  if (typeof forceKill.unref === 'function') forceKill.unref();
}

process.on('SIGTERM', () => shutdown(15));
process.on('SIGINT', () => shutdown(2));

const code = await proc.exited;
process.exit(code ?? 0);
