/**
 * Vitest global setup — runs once before/after the entire test suite.
 *
 * Uses the TEST_DATABASE_URL (docker-compose db_test on :5433) so tests
 * never touch the dev database.
 *
 * On setup: applies pending migrations to the test DB.
 * On teardown: drops all public tables so the next run starts clean.
 */

import { execSync } from 'node:child_process';

export async function setup() {
  const url = process.env['TEST_DATABASE_URL'];
  if (!url) {
    throw new Error(
      'TEST_DATABASE_URL is not set. Copy .env.example to .env and fill in values.',
    );
  }
  // Apply migrations to the test DB (non-interactive, no prompts).
  execSync('npx prisma migrate deploy', {
    env: { ...process.env, DATABASE_URL: url },
    stdio: 'inherit',
  });
}

export async function teardown() {
  // Nothing needed — the test suite truncates tables between tests.
}
