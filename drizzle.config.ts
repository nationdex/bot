import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url:
      process.env.DATABASE_URL ??
      `postgresql://${process.env.POSTGRES_USER ?? 'postgres'}:${
        process.env.POSTGRES_PASSWORD ?? process.env.POSTGRESPASSWORD ?? ''
      }@${process.env.DB_HOST ?? 'localhost'}:${process.env.DB_HOST_PORT ?? 5433}/${
        process.env.POSTGRES_DB ?? 'nationdex'
      }`,
  },
});
