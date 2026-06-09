/**
 * Test helpers — shared client factory and table-truncation utility.
 */

import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/index.js';
import { uuidv7 } from 'uuidv7';

export function newId(): string {
  return uuidv7();
}

export function createTestClient(): PrismaClient {
  const url = process.env['TEST_DATABASE_URL'];
  if (!url) throw new Error('TEST_DATABASE_URL not set');
  const pool = new pg.Pool({ connectionString: url });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter } as ConstructorParameters<typeof PrismaClient>[0]);
}

/** Truncate all application tables in dependency-safe order. */
export async function truncateAll(prisma: PrismaClient): Promise<void> {
  // Delete in reverse FK order to avoid constraint violations.
  await prisma.calendarEvent.deleteMany();
  await prisma.milestone.deleteMany();
  await prisma.injuryReport.deleteMany();
  await prisma.challenge.deleteMany();
  await prisma.session.deleteMany();
  await prisma.route.deleteMany();
  await prisma.trainingPlan.deleteMany();
  await prisma.credential.deleteMany();
  await prisma.user.deleteMany();
}
