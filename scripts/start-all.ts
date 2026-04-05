#!/usr/bin/env bun

/**
 * Cross-platform startup script for Nationdex
 *
 * Runs all three services simultaneously:
 * - PostgreSQL database
 * - Discord bot
 * - Next.js admin panel
 *
 * Works on Windows, macOS, and Linux
 * (Use this if BM2 is not available on your platform)
 *
 * Usage:
 *   bun scripts/start-all.ts
 */

// ── Configuration ─────────────────────────────────────────────────────────────
const REQUIRED_NODE_VERSION = 20;
const PANEL_PORT = process.env.PANEL_PORT ?? '3001';

// ── Node version check ─────────────────────────────────────────────────────────
const currentVersion = parseInt(process.versions.node.split('.')[0] ?? '0', 10);
if (currentVersion < REQUIRED_NODE_VERSION) {
  console.error(
    `[ERROR] Node.js v${process.versions.node} is too old.\n` +
      `Next.js requires Node.js >= ${REQUIRED_NODE_VERSION}.9.0\n` +
      `Please upgrade: https://nodejs.org`
  );
  process.exit(1);
}

console.log('');
console.log('═══════════════════════════════════════════════════════════');
console.log('  Nationdex Multi-Process Startup');
console.log('═══════════════════════════════════════════════════════════');
console.log('');
console.log(`Platform: ${process.platform}`);
console.log(`Node.js: ${process.versions.node}`);
console.log('');
console.log('Starting services:');
console.log('  1. PostgreSQL database');
console.log('  2. Discord bot');
console.log('  3. Next.js admin panel');
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

  // Kill all processes
  for (const { name, process: proc } of processes) {
    try {
      console.log(`Stopping ${name}...`);
      proc.kill('SIGTERM');
    } catch {
      /* already dead */
    }
  }

  // Wait for processes to exit (max 10 seconds)
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

  // Wait for all processes to finish
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

// Handle termination signals
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// ── Start PostgreSQL ──────────────────────────────────────────────────────────
const dbProc = Bun.spawn(['bun', 'run', 'scripts/start-db.ts'], {
  stdio: ['inherit', 'inherit', 'inherit'],
  env: {
    ...process.env,
    POSTGRES_PASSWORD: process.env.POSTGRES_PASSWORD ?? '',
    POSTGRES_USER: 'postgres',
    POSTGRES_DB: 'nationdex',
    DB_HOST_PORT: '5433',
    DB_CONTAINER_NAME: 'nationdex-postgres',
    DB_IMAGE_NAME: 'nationdex-db',
  },
});
processes.push({ name: 'PostgreSQL', process: dbProc });
console.log('✓ PostgreSQL starting...');

// Wait a bit for database to be ready before starting bot
await new Promise((resolve) => setTimeout(resolve, 2000));

// ── Start Discord Bot ─────────────────────────────────────────────────────────
const botProc = Bun.spawn(['bun', 'run', 'index.ts'], {
  stdio: ['inherit', 'inherit', 'inherit'],
  env: {
    ...process.env,
    NODE_ENV: 'production',
    POSTGRES_PASSWORD: process.env.POSTGRES_PASSWORD ?? '',
    POSTGRES_USER: 'postgres',
    POSTGRES_DB: 'nationdex',
    DB_HOST: 'localhost',
    DB_HOST_PORT: '5433',
  },
});
processes.push({ name: 'Discord Bot', process: botProc });
console.log('✓ Discord Bot starting...');

// ── Start Next.js Admin Panel ─────────────────────────────────────────────────
const panelProc = Bun.spawn(['bun', 'run', 'website/start.ts'], {
  stdio: ['inherit', 'inherit', 'inherit'],
  env: {
    ...process.env,
    NODE_ENV: 'production',
    PORT: PANEL_PORT,
  },
});
processes.push({ name: 'Admin Panel', process: panelProc });
console.log('✓ Admin Panel starting...');

console.log('');
console.log('═══════════════════════════════════════════════════════════');
console.log('All services started. Press Ctrl+C to stop.');
console.log('═══════════════════════════════════════════════════════════');
console.log('');
console.log('Services:');
console.log(`  Admin Panel: http://localhost:${PANEL_PORT}`);
console.log('  Database:    localhost:5433');
console.log('  Bot:         Running (Discord)');
console.log('');

// Wait for all processes
Promise.all(processes.map((p) => p.process.exited)).then(() => {
  console.log('All services have stopped');
  process.exit(0);
});
