#!/usr/bin/env bun
/**
 * Nationdex development startup script
 *
 * Runs bot (with file watching) and admin panel (with hot reload) as a single
 * Bun-managed process pair.
 * The database is expected to already be running (via Docker or docker-compose).
 *
 * Usage:
 *   bun scripts/start-all-dev.ts
 */

const PANEL_PORT = process.env.PANEL_PORT ?? '3005';

console.log('');
console.log('═══════════════════════════════════════════════════════════');
console.log('  Nationdex Development Mode');
console.log('═══════════════════════════════════════════════════════════');
console.log('');
console.log(`Platform: ${process.platform}`);
console.log('');
console.log('Starting services (with hot reload):');
console.log('  1. Discord bot (file watching enabled)');
console.log('  2. Admin panel (hot reload enabled)');
console.log('');

// ── Process management ─────────────────────────────────────────────────────────
type ProcessRecord = { name: string; process: ReturnType<typeof Bun.spawn> };
const processes: ProcessRecord[] = [];
let isShuttingDown = false;

async function shutdown(signal: string) {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log(`\n[${signal}] Shutting down gracefully...`);
  console.log('');

  for (const { name, process: proc } of processes) {
    try {
      console.log(`Stopping ${name}...`);
      proc.kill('SIGTERM');
    } catch {
      /* already dead */
    }
  }

  let exited = 0;
  const timeout = setTimeout(() => {
    console.warn('Force-killing remaining processes...');
    for (const { process: proc } of processes) {
      try {
        proc.kill('SIGKILL');
      } catch {
        /* already dead */
      }
    }
  }, 10000);

  for (const { process: proc } of processes) {
    try {
      await proc.exited;
      exited++;
    } catch {
      /* error waiting */
    }
  }

  clearTimeout(timeout);
  console.log(`\n✓ All services stopped (${exited}/${processes.length} exited cleanly)`);
  process.exit(0);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// ── Start Discord Bot (with --watch flag for hot reload) ──────────────────────
const botProc = Bun.spawn(['bun', 'run', '--watch', 'src/index.ts'], {
  stdio: ['inherit', 'inherit', 'inherit'],
  env: {
    ...process.env,
    NODE_ENV: 'development',
  },
});
processes.push({ name: 'Discord Bot (watching)', process: botProc });
console.log('✓ Discord Bot starting (file watching enabled)...');

// ── Start Next.js Admin Panel (dev mode) ──────────────────────────────────────
const panelProc = Bun.spawn(['bun', 'run', 'website/start.ts'], {
  stdio: ['inherit', 'inherit', 'inherit'],
  env: {
    ...process.env,
    NODE_ENV: 'development',
    PORT: PANEL_PORT,
  },
  cwd: process.cwd(),
});
processes.push({ name: 'Admin Panel (hot reload)', process: panelProc });
console.log('✓ Admin Panel starting (hot reload enabled)...');

console.log('');
console.log('═══════════════════════════════════════════════════════════');
console.log('All services started in development mode.');
console.log('Press Ctrl+C to stop.');
console.log('═══════════════════════════════════════════════════════════');
console.log('');
console.log('Services:');
console.log(`  Admin Panel: http://localhost:${PANEL_PORT}`);
console.log('  Bot:         Running (Discord)');
console.log('');
console.log('Auto-reload enabled for:');
console.log('  Bot:   TypeScript files in src/');
console.log('  Panel: Next.js files in website/');
console.log('');

// Wait for all processes
Promise.all(processes.map((p) => p.process.exited)).then(() => {
  console.log('All services have stopped');
  process.exit(0);
});
