const CONTAINER = process.env.DB_CONTAINER_NAME ?? 'nationdex-postgres';
const IMAGE = process.env.DB_IMAGE_NAME ?? 'nationdex-db';
const HOST_PORT = process.env.DB_HOST_PORT ?? '5432';
const PG_PASS = process.env.POSTGRES_PASSWORD ?? process.env.POSTGRESPASSWORD;
const PG_USER = process.env.POSTGRES_USER ?? 'postgres';
const PG_DB = process.env.POSTGRES_DB ?? 'nationdex';

if (!PG_PASS) {
  console.error('[db] POSTGRES_PASSWORD or POSTGRESPASSWORD is not set. Aborting.');
  process.exit(1);
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function run(args: string[], label: string): boolean {
  const result = Bun.spawnSync(args, { stdio: ['inherit', 'inherit', 'inherit'] });
  if (!result.success) {
    console.error(`[db] ${label} failed (exit ${result.exitCode}).`);
  }
  return result.success;
}

function inspect(format: string): string {
  const r = Bun.spawnSync(['docker', 'inspect', '--format', format, CONTAINER]);
  return new TextDecoder().decode(r.stdout).trim();
}

// ── Container lifecycle ───────────────────────────────────────────────────────

const status = inspect('{{.State.Status}}');

if (status === 'running') {
  console.log(`[db] Container "${CONTAINER}" is already running — attaching watcher.`);
} else if (status === 'exited' || status === 'created') {
  console.log(`[db] Container "${CONTAINER}" exists but is stopped — restarting...`);
  if (!run(['docker', 'start', CONTAINER], 'docker start')) process.exit(1);
} else {
  // Container does not exist — build image and run fresh container
  console.log(`[db] No existing container found. Building image "${IMAGE}" from Dockerfile...`);
  if (!run(['docker', 'build', '-t', IMAGE, '.'], 'docker build')) process.exit(1);

  console.log(`[db] Starting new container "${CONTAINER}" on host port ${HOST_PORT}...`);
  const ok = run(
    [
      'docker',
      'run',
      '--name',
      CONTAINER,
      '--detach',
      '--restart',
      'unless-stopped',
      '-p',
      `${HOST_PORT}:5432`,
      '-e',
      `POSTGRES_PASSWORD=${PG_PASS}`,
      '-e',
      `POSTGRES_USER=${PG_USER}`,
      '-e',
      `POSTGRES_DB=${PG_DB}`,
      IMAGE,
    ],
    'docker run'
  );
  if (!ok) process.exit(1);
}

console.log(`[db] PostgreSQL is up on host port ${HOST_PORT} (container: ${CONTAINER}).`);

// ── Health watcher ────────────────────────────────────────────────────────────

const POLL_MS = 10_000;

const watcher = setInterval(() => {
  const s = inspect('{{.State.Status}}');
  if (s !== 'running') {
    clearInterval(watcher);
    console.error(
      `[db] Container "${CONTAINER}" is no longer running (status: "${s}"). Signalling BM2 to restart.`
    );
    process.exit(1);
  }
}, POLL_MS);

// Graceful shutdown: stop the container when BM2 sends SIGTERM/SIGINT
function shutdown(signal: string) {
  clearInterval(watcher);
  console.log(`[db] Received ${signal} — stopping container "${CONTAINER}"...`);
  // --time 3: give Postgres 3 s to flush WAL, then SIGKILL. Keeps total
  // shutdown under bm2's killTimeout so the process exits cleanly.
  Bun.spawnSync(['docker', 'stop', '--time', '3', CONTAINER], { stdio: ['inherit', 'inherit', 'inherit'] });
  process.exit(0);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
