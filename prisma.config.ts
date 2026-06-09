import path from 'node:path';
import { defineConfig } from 'prisma/config';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

// prisma.config.ts — Prisma 7 connection configuration.
// Used by `prisma migrate` and other CLI commands.
// The PrismaClient constructor also receives the adapter (see src/db/client.ts).

function makeAdapter(databaseUrl?: string) {
  const url = databaseUrl ?? process.env['DATABASE_URL'];
  if (!url) {
    throw new Error('DATABASE_URL environment variable is not set');
  }
  const pool = new pg.Pool({ connectionString: url });
  return new PrismaPg(pool);
}

export default defineConfig({
  schema: path.join('prisma', 'schema.prisma'),
  datasource: {
    url: process.env['DATABASE_URL'],
  },
  migrate: {
    async adapter() {
      return makeAdapter();
    },
  },
});

// Export the factory so src/db/client.ts can reuse it.
export { makeAdapter };
