/**
 * Shared database connection configuration.
 *
 * Single source of truth consumed by all three DB entry points:
 *   - ForgeDB extension  (index.ts)
 *   - Drizzle ORM client (src/db/index.ts)
 *   - Drizzle Kit migrations (drizzle.config.ts)
 *
 * Default port is 5435 to match the ecosystem / Docker setup.
 */

export const DB_CONFIG = {
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_HOST_PORT ?? 5435),
  user: process.env.POSTGRES_USER ?? 'postgres',
  password: process.env.POSTGRES_PASSWORD ?? process.env.POSTGRESPASSWORD ?? '',
  database: process.env.POSTGRES_DB ?? 'nationdex',
} as const;

/** Builds a postgresql:// URL from the shared config, honouring DATABASE_URL if set. */
export function getConnectionString(): string {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  const { host, port, user, password, database } = DB_CONFIG;
  return `postgresql://${user}:${encodeURIComponent(password)}@${host}:${port}/${database}`;
}
