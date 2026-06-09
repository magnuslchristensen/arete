import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Run tests sequentially — they share a real Postgres DB and must not
    // interfere with each other via concurrent transactions.
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
    // Each test file gets an isolated setup; the global setup handles
    // migration + teardown at the suite level (see src/db/__tests__/setup.ts).
    globalSetup: ['src/db/__tests__/setup.ts'],
    testTimeout: 30_000,
  },
});
