/**
 * BM2 Ecosystem Configuration — Nationdex
 */

// ── Local BM2 type definitions ────────────────────────────────────────────────
interface AppConfig {
  name: string;
  script: string;
  args?: string[];
  cwd?: string;
  interpreter?: string;
  instances?: number | 'max';
  execMode?: 'fork' | 'cluster';
  autorestart?: boolean;
  maxRestarts?: number;
  minUptime?: number;
  restartDelay?: number;
  killTimeout?: number;
  watch?: boolean | string[];
  ignoreWatch?: string[];
  env?: Record<string, string>;
  outFile?: string;
  errorFile?: string;
  mergeLogs?: boolean;
  logMaxSize?: string | number;
  logRetain?: number;
  logCompress?: boolean;
  healthCheckUrl?: string;
  healthCheckInterval?: number;
  healthCheckTimeout?: number;
  healthCheckMaxFails?: number;
}

interface EcosystemConfig {
  apps: AppConfig[];
}

// Read sensitive values from .env (Bun loads .env automatically)
const PG_PASSWORD = process.env.POSTGRES_PASSWORD ?? process.env.POSTGRESPASSWORD ?? '';
const PANEL_PORT = process.env.PANEL_PORT ?? '3000';

if (!PG_PASSWORD) {
  console.warn(
    '[ecosystem] Warning: POSTGRES_PASSWORD or POSTGRESPASSWORD is not set in .env — the database process will fail to start.'
  );
}

const config: EcosystemConfig = {
  apps: [
    // ── 1. PostgreSQL ─────────────────────────────────────────────────────────
    {
      name: 'postgres',
      script: './scripts/start-db.ts',
      interpreter: 'bun',
      instances: 1, // Always run exactly one database instance
      execMode: 'fork',
      autorestart: true,
      maxRestarts: 5,
      minUptime: 3000,
      restartDelay: 5000,
      killTimeout: 6000, // docker stop --time 3 (3s) + 3s margin
      outFile: './logs/db-out.log',
      errorFile: './logs/db-error.log',
      env: {
        POSTGRES_PASSWORD: PG_PASSWORD,
        POSTGRES_USER: 'postgres',
        POSTGRES_DB: 'nationdex',
        DB_HOST_PORT: '5433',
        DB_CONTAINER_NAME: 'nationdex-postgres',
        DB_IMAGE_NAME: 'nationdex-db',
      },
    },

    // ── 2. Nationdex bot ──────────────────────────────────────────────────────
    {
      name: 'nationdex',
      script: './index.ts',
      interpreter: 'bun',
      instances: 1, // Never run more than one bot process — multiple instances
      execMode: 'fork', // share the same token and race on every interaction event
      autorestart: true,
      maxRestarts: 10,
      minUptime: 5000,
      restartDelay: 3000,
      killTimeout: 3000, // Bun exits fast on SIGTERM
      watch: false,
      outFile: './logs/bot-out.log',
      errorFile: './logs/bot-error.log',
      env: {
        NODE_ENV: 'production',
        POSTGRES_PASSWORD: PG_PASSWORD,
        POSTGRES_USER: 'postgres',
        POSTGRES_DB: 'nationdex',
        DB_HOST: 'localhost',
        DB_HOST_PORT: '5433',
      },
    },

    // ── 3. Admin panel ────────────────────────────────────────────────────────
    {
      name: 'admin-panel',
      script: './start.ts',
      interpreter: 'bun',
      cwd: './website',
      instances: 1, // Always run exactly one admin panel instance
      execMode: 'fork',
      autorestart: true,
      maxRestarts: 10,
      minUptime: 5000,
      restartDelay: 3000,
      killTimeout: 8000, // Next.js needs ~5s to drain, start.ts force-kills after 10s anyway
      watch: false,
      outFile: './logs/panel-out.log',
      errorFile: './logs/panel-error.log',
      env: {
        NODE_ENV: 'production',
        PORT: PANEL_PORT,
      },
    },
  ],
};

export default config;
