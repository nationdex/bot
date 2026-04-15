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

// ── Runtime detection ─────────────────────────────────────────────────────────

type Runtime = 'docker' | 'podman' | 'native';

function detectRuntime(): Runtime {
  // Allow explicit override via env: DB_RUNTIME=docker|podman|native
  const override = process.env.DB_RUNTIME?.toLowerCase();
  if (override === 'docker' || override === 'podman' || override === 'native') {
    return override as Runtime;
  }

  // Auto-detect: prefer docker → podman → native postgres
  const docker = Bun.spawnSync(['docker', 'version'], { stdio: ['ignore', 'ignore', 'ignore'] });
  if (docker.exitCode === 0) return 'docker';

  const podman = Bun.spawnSync(['podman', 'version'], { stdio: ['ignore', 'ignore', 'ignore'] });
  if (podman.exitCode === 0) return 'podman';

  return 'native';
}

const RUNTIME = detectRuntime();
console.log(`[db] Runtime: ${RUNTIME}`);

// ── Helpers ───────────────────────────────────────────────────────────────────

function run(args: string[], label: string): boolean {
  const result = Bun.spawnSync(args, { stdio: ['inherit', 'inherit', 'inherit'] });
  if (!result.success) {
    console.error(`[db] ${label} failed (exit ${result.exitCode}).`);
  }
  return result.success;
}

function inspectContainer(format: string): string {
  const r = Bun.spawnSync([RUNTIME, 'inspect', '--format', format, CONTAINER]);
  return new TextDecoder().decode(r.stdout).trim();
}

function pgReady(): boolean {
  // Try pg_isready first (ships with postgres-client)
  const via = Bun.spawnSync(
    ['pg_isready', '-h', 'localhost', '-p', HOST_PORT, '-U', PG_USER, '-d', PG_DB],
    { stdio: ['ignore', 'ignore', 'ignore'] }
  );
  if (via.exitCode === 0) return true;

  // Fall back to a psql ping
  const psql = Bun.spawnSync(
    ['psql', '-h', 'localhost', '-p', HOST_PORT, '-U', PG_USER, '-d', PG_DB, '-c', 'SELECT 1'],
    { stdio: ['ignore', 'ignore', 'ignore'] }
  );
  return psql.exitCode === 0;
}

// ── Container / native lifecycle ──────────────────────────────────────────────

if (RUNTIME === 'native') {
  // No container runtime — verify a local postgres is reachable and skip
  // container management entirely.
  console.log('[db] Native mode: skipping container management.');
  if (!pgReady()) {
    console.error(
      `[db] PostgreSQL is not reachable on localhost:${HOST_PORT}.\n` +
        '[db] Please start your local PostgreSQL service before running this script.\n' +
        '[db] If you want to use Docker or Podman instead, install one and re-run,\n' +
        '[db] or set DB_RUNTIME=docker|podman to force a specific runtime.'
    );
    process.exit(1);
  }
  console.log(`[db] PostgreSQL is up on localhost:${HOST_PORT}.`);
} else {
  const status = inspectContainer('{{.State.Status}}');

  if (status === 'running') {
    console.log(`[db] Container "${CONTAINER}" is already running — attaching watcher.`);
  } else if (status === 'exited' || status === 'created') {
    console.log(`[db] Container "${CONTAINER}" exists but is stopped — restarting...`);
    if (!run([RUNTIME, 'start', CONTAINER], `${RUNTIME} start`)) process.exit(1);
  } else {
    // Container does not exist — build image and run fresh container
    console.log(`[db] No existing container found. Building image "${IMAGE}" from Dockerfile...`);
    if (!run([RUNTIME, 'build', '-t', IMAGE, '.'], `${RUNTIME} build`)) process.exit(1);

    console.log(`[db] Starting new container "${CONTAINER}" on host port ${HOST_PORT}...`);
    const ok = run(
      [
        RUNTIME,
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
      `${RUNTIME} run`
    );
    if (!ok) process.exit(1);
  }

  console.log(`[db] PostgreSQL is up on host port ${HOST_PORT} (container: ${CONTAINER}).`);
}

// ── Health watcher ────────────────────────────────────────────────────────────

const POLL_MS = 10_000;

const watcher = setInterval(() => {
  const running =
    RUNTIME === 'native'
      ? pgReady()
      : inspectContainer('{{.State.Status}}') === 'running';

  if (!running) {
    clearInterval(watcher);
    console.error(
      RUNTIME === 'native'
        ? `[db] PostgreSQL on localhost:${HOST_PORT} is no longer reachable. Exiting.`
        : `[db] Container "${CONTAINER}" is no longer running (runtime: ${RUNTIME}). Exiting so the parent process can restart.`
    );
    process.exit(1);
  }
}, POLL_MS);

// Graceful shutdown on SIGTERM/SIGINT
function shutdown(signal: string) {
  clearInterval(watcher);
  if (RUNTIME === 'native') {
    console.log(`[db] Received ${signal} — shutting down watcher.`);
    process.exit(0);
  }
  console.log(`[db] Received ${signal} — stopping container "${CONTAINER}"...`);
  // --time 3: give Postgres 3 s to flush WAL before SIGKILL
  Bun.spawnSync([RUNTIME, 'stop', '--time', '3', CONTAINER], {
    stdio: ['inherit', 'inherit', 'inherit'],
  });
  process.exit(0);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
