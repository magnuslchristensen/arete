/**
 * src/db/client.ts
 *
 * Exports a singleton PrismaClient (via the PrismaPg adapter) and a
 * `newId()` helper that generates UUID v7 strings for use as primary keys.
 *
 * Usage:
 *   import { prisma, newId } from './client.js';
 *
 * UUID v7 rationale: time-ordered (good index locality) and
 * client-generatable (supports offline record creation per arete-spec §12).
 */

import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './generated/index.js';
import { uuidv7 } from 'uuidv7';

function createPrismaClient(connectionString?: string): PrismaClient {
  const url = connectionString ?? process.env['DATABASE_URL'];
  if (!url) {
    throw new Error('DATABASE_URL environment variable is not set');
  }
  const pool = new pg.Pool({ connectionString: url });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter } as ConstructorParameters<typeof PrismaClient>[0]);
}

// Singleton — reuse across hot reloads in dev (via globalThis cache).
const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma: PrismaClient =
  globalForPrisma.prisma ?? createPrismaClient();

if (process.env['NODE_ENV'] !== 'production') {
  globalForPrisma.prisma = prisma;
}

/**
 * Generate a new UUID v7 primary key.
 * Call this whenever creating a new record instead of relying on DB defaults.
 *
 * @example
 *   const user = await prisma.user.create({ data: { id: newId(), ... } });
 */
export function newId(): string {
  return uuidv7();
}
