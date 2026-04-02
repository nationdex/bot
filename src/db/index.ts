/**
 * Drizzle ORM client
 */
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString =
  process.env.DATABASE_URL ??
  `postgresql://${process.env.POSTGRES_USER ?? 'postgres'}:${
    process.env.POSTGRES_PASSWORD ?? process.env.POSTGRESPASSWORD ?? ''
  }@${process.env.DB_HOST ?? 'localhost'}:${process.env.DB_HOST_PORT ?? 5433}/${
    process.env.POSTGRES_DB ?? 'nationdex'
  }`;

const client = postgres(connectionString);

export const db = drizzle(client, { schema });
export * from './schema';
