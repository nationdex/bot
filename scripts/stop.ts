#!/usr/bin/env bun
/**
 * Nationdex stop script
 *
 * Gracefully stops all Nationdex processes — even those started in other
 * terminals or shells outside your control.
 *
 * Usage:
 *   bun run stop          ← SIGTERM, waits 5 s, then SIGKILL if needed
 *   bun run stop:force    ← SIGKILL immediately (no wait)
 *
 * Env:
 *   STOP_FORCE=1          ← same as stop:force, useful in scripts
 */

const FORCE = process.argv.includes('--force') || process.env.STOP_FORCE === '1';

// Patterns that identify Nationdex-owned bun processes.
// Specific enough not to collide with other bun projects.
const PATTERNS = [
  'src/index.ts',
  'scripts/start-all-dev.ts',
  'scripts/start-all.ts',
  'scripts/start-db.ts',
  'website/start.ts',
];

function findPids(pattern: string): string[] {
  const r = Bun.spawnSync(['pgrep', '-f', pattern], {
    stdio: ['ignore', 'pipe', 'ignore'],
  });
  return new TextDecoder()
    .decode(r.stdout)
    .trim()
    .split('\n')
    .filter(Boolean)
    // Exclude our own PID so the stop script doesn't kill itself
    .filter((pid) => pid !== String(process.pid));
}

function sendSignal(pattern: string, sig: 'SIGTERM' | 'SIGKILL'): number {
  const pids = findPids(pattern);
  if (pids.length === 0) return 0;
  Bun.spawnSync(['pkill', sig === 'SIGKILL' ? '-9' : '-15', '-f', pattern], {
    stdio: ['ignore', 'ignore', 'ignore'],
  });
  return pids.length;
}

// ── Force-kill path ───────────────────────────────────────────────────────────

if (FORCE) {
  let killed = 0;
  for (const p of PATTERNS) killed += sendSignal(p, 'SIGKILL');
  if (killed === 0) {
    console.log('[stop] No Nationdex processes found.');
  } else {
    console.log(`[stop] Force-killed ${killed} process(es).`);
  }
  process.exit(0);
}

// ── Graceful path: SIGTERM → wait 5 s → SIGKILL survivors ────────────────────

let total = 0;
for (const p of PATTERNS) {
  const n = sendSignal(p, 'SIGTERM');
  if (n > 0) {
    console.log(`[stop] SIGTERM → ${n} process(es) matching "${p}"`);
    total += n;
  }
}

if (total === 0) {
  console.log('[stop] No Nationdex processes found.');
  process.exit(0);
}

console.log('[stop] Waiting up to 5 s for clean shutdown...');
await Bun.sleep(5_000);

let survivors = 0;
for (const p of PATTERNS) {
  const remaining = findPids(p);
  if (remaining.length === 0) continue;
  console.log(`[stop] ${remaining.length} process(es) still alive — force-killing "${p}"...`);
  sendSignal(p, 'SIGKILL');
  survivors += remaining.length;
}

if (survivors > 0) {
  console.log(`[stop] Force-killed ${survivors} stubborn process(es).`);
} else {
  console.log('[stop] All processes stopped cleanly.');
}
