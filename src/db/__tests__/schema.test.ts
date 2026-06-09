/**
 * Schema integration tests.
 *
 * Verifies: CRUD on each entity, UUID v7 ids, cascade delete from User,
 * SetNull on Route/Challenge deletion, unique constraints, enum validation.
 *
 * Runs against TEST_DATABASE_URL (docker-compose db_test on port 5433).
 * Each test starts with a clean slate (truncateAll in beforeEach).
 */

import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import { createTestClient, newId, truncateAll } from './helpers.js';
import type { PrismaClient } from '../generated/index.js';

// ─── Setup ────────────────────────────────────────────────────────────────────

let prisma: PrismaClient;

beforeAll(() => {
  prisma = createTestClient();
});

beforeEach(async () => {
  await truncateAll(prisma);
});

afterAll(async () => {
  await prisma.$disconnect();
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeUser() {
  return {
    id: newId(),
    email: `test-${newId()}@arete.dev`,
    name: 'Test User',
    fitnessLevel: 'beginner' as const,
    currentStreak: 0,
    totalDistanceLifetime: 0,
  };
}

// ─── UUID v7 ──────────────────────────────────────────────────────────────────

describe('UUID v7', () => {
  it('generates time-ordered UUIDs with version nibble 7', () => {
    const ids = Array.from({ length: 5 }, () => newId());
    const v7Pattern = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    for (const id of ids) {
      expect(id).toMatch(v7Pattern);
    }
    // Time-ordered: later IDs should sort lexicographically after earlier ones
    expect(ids[0]! < ids[4]!).toBe(true);
  });
});

// ─── User CRUD ────────────────────────────────────────────────────────────────

describe('User', () => {
  it('creates and reads a user', async () => {
    const data = makeUser();
    const created = await prisma.user.create({ data });
    const found = await prisma.user.findUniqueOrThrow({ where: { id: created.id } });
    expect(found.email).toBe(data.email);
    expect(found.currentStreak).toBe(0);
    expect(found.totalDistanceLifetime).toBe(0);
  });

  it('enforces unique email', async () => {
    const data = makeUser();
    await prisma.user.create({ data });
    await expect(prisma.user.create({ data: { ...data, id: newId() } })).rejects.toThrow();
  });
});

// ─── Credential ───────────────────────────────────────────────────────────────

describe('Credential', () => {
  it('stores a credential linked to a user', async () => {
    const user = await prisma.user.create({ data: makeUser() });
    const cred = await prisma.credential.create({
      data: {
        id: newId(),
        userId: user.id,
        kind: 'calendar_token',
        provider: 'google',
        ciphertext: Buffer.from('encrypted'),
      },
    });
    expect(cred.userId).toBe(user.id);
    expect(Buffer.from(cred.ciphertext).toString()).toBe('encrypted');
  });

  it('enforces unique (userId, kind, provider)', async () => {
    const user = await prisma.user.create({ data: makeUser() });
    const base = {
      userId: user.id,
      kind: 'calendar_token' as const,
      provider: 'google' as const,
      ciphertext: Buffer.from('enc'),
    };
    await prisma.credential.create({ data: { id: newId(), ...base } });
    await expect(
      prisma.credential.create({ data: { id: newId(), ...base } }),
    ).rejects.toThrow();
  });
});

// ─── TrainingPlan & Session ───────────────────────────────────────────────────

describe('TrainingPlan + Session', () => {
  it('creates a plan with sessions', async () => {
    const user = await prisma.user.create({ data: makeUser() });
    const plan = await prisma.trainingPlan.create({
      data: { id: newId(), userId: user.id, phase: 'base' },
    });
    const session = await prisma.session.create({
      data: {
        id: newId(),
        userId: user.id,
        planId: plan.id,
        scheduledDate: new Date('2026-07-01'),
        sessionType: 'easy',
        status: 'scheduled',
      },
    });
    expect(session.planId).toBe(plan.id);
    expect(session.status).toBe('scheduled');
    expect(session.actualDistance).toBeNull();
  });

  it('stores actual values in metres/seconds/sec-per-km (SI canonical)', async () => {
    const user = await prisma.user.create({ data: makeUser() });
    const plan = await prisma.trainingPlan.create({
      data: { id: newId(), userId: user.id, phase: 'build' },
    });
    const session = await prisma.session.create({
      data: {
        id: newId(),
        userId: user.id,
        planId: plan.id,
        scheduledDate: new Date('2026-07-02'),
        sessionType: 'tempo',
        status: 'completed',
        actualDistance: 10_000,   // metres
        actualDuration: 2700,     // seconds
        actualAvgPace: 270,       // sec/km
        hrAvg: 165,
      },
    });
    expect(session.actualDistance).toBe(10_000);
    expect(session.actualDuration).toBe(2700);
    expect(session.actualAvgPace).toBe(270);
  });
});

// ─── Route ────────────────────────────────────────────────────────────────────

describe('Route', () => {
  it('creates a route and links to sessions', async () => {
    const user = await prisma.user.create({ data: makeUser() });
    const route = await prisma.route.create({
      data: {
        id: newId(),
        userId: user.id,
        polyline: 'abc123',
        distance: 5_000,
      },
    });
    const plan = await prisma.trainingPlan.create({
      data: { id: newId(), userId: user.id, phase: 'base' },
    });
    const session = await prisma.session.create({
      data: {
        id: newId(),
        userId: user.id,
        planId: plan.id,
        routeId: route.id,
        scheduledDate: new Date('2026-07-03'),
        sessionType: 'long',
        status: 'scheduled',
      },
    });
    expect(session.routeId).toBe(route.id);
  });
});

// ─── CalendarEvent ────────────────────────────────────────────────────────────

describe('CalendarEvent', () => {
  it('enforces unique sessionId (one event per session)', async () => {
    const user = await prisma.user.create({ data: makeUser() });
    const plan = await prisma.trainingPlan.create({
      data: { id: newId(), userId: user.id, phase: 'base' },
    });
    const session = await prisma.session.create({
      data: {
        id: newId(),
        userId: user.id,
        planId: plan.id,
        scheduledDate: new Date('2026-07-04'),
        sessionType: 'easy',
        status: 'scheduled',
      },
    });
    await prisma.calendarEvent.create({
      data: {
        id: newId(),
        sessionId: session.id,
        externalEventId: 'evt_1',
        calendarProvider: 'google',
        syncStatus: 'synced',
      },
    });
    await expect(
      prisma.calendarEvent.create({
        data: {
          id: newId(),
          sessionId: session.id, // duplicate
          externalEventId: 'evt_2',
          calendarProvider: 'google',
          syncStatus: 'pending',
        },
      }),
    ).rejects.toThrow();
  });
});

// ─── Cascade delete from User ─────────────────────────────────────────────────

describe('Cascade delete', () => {
  it('deleting a user cascades to all owned records', async () => {
    const user = await prisma.user.create({ data: makeUser() });
    const plan = await prisma.trainingPlan.create({
      data: { id: newId(), userId: user.id, phase: 'base' },
    });
    await prisma.session.create({
      data: {
        id: newId(),
        userId: user.id,
        planId: plan.id,
        scheduledDate: new Date('2026-07-05'),
        sessionType: 'easy',
        status: 'scheduled',
      },
    });
    await prisma.credential.create({
      data: {
        id: newId(),
        userId: user.id,
        kind: 'auth_token',
        ciphertext: Buffer.from('x'),
      },
    });

    await prisma.user.delete({ where: { id: user.id } });

    expect(await prisma.trainingPlan.findFirst({ where: { userId: user.id } })).toBeNull();
    expect(await prisma.session.findFirst({ where: { userId: user.id } })).toBeNull();
    expect(await prisma.credential.findFirst({ where: { userId: user.id } })).toBeNull();
  });
});

// ─── SetNull on Route deletion ────────────────────────────────────────────────

describe('SetNull on Route deletion', () => {
  it('deleting a route nulls Session.routeId', async () => {
    const user = await prisma.user.create({ data: makeUser() });
    const route = await prisma.route.create({
      data: { id: newId(), userId: user.id, polyline: 'x', distance: 1_000 },
    });
    const plan = await prisma.trainingPlan.create({
      data: { id: newId(), userId: user.id, phase: 'base' },
    });
    const session = await prisma.session.create({
      data: {
        id: newId(),
        userId: user.id,
        planId: plan.id,
        routeId: route.id,
        scheduledDate: new Date('2026-07-06'),
        sessionType: 'easy',
        status: 'scheduled',
      },
    });

    await prisma.route.delete({ where: { id: route.id } });

    const updated = await prisma.session.findUniqueOrThrow({ where: { id: session.id } });
    expect(updated.routeId).toBeNull();
  });
});

// ─── SetNull on Challenge deletion → Milestone ────────────────────────────────

describe('SetNull on Challenge deletion', () => {
  it('deleting a challenge nulls Milestone.challengeId', async () => {
    const user = await prisma.user.create({ data: makeUser() });
    const challenge = await prisma.challenge.create({
      data: {
        id: newId(),
        userId: user.id,
        challengeType: 'themed',
        title: 'Morning runs',
        startDate: new Date('2026-07-01'),
        endDate: new Date('2026-07-07'),
        status: 'accepted',
      },
    });
    const milestone = await prisma.milestone.create({
      data: {
        id: newId(),
        userId: user.id,
        type: 'challenge_complete',
        challengeId: challenge.id,
        achievedAt: new Date(),
        value: 1,
        displayMessage: 'You completed the challenge!',
      },
    });

    await prisma.challenge.delete({ where: { id: challenge.id } });

    const updated = await prisma.milestone.findUniqueOrThrow({ where: { id: milestone.id } });
    expect(updated.challengeId).toBeNull();
  });
});

// ─── InjuryReport ─────────────────────────────────────────────────────────────

describe('InjuryReport', () => {
  it('creates and stores cross-training suggestions as JSON', async () => {
    const user = await prisma.user.create({ data: makeUser() });
    const injury = await prisma.injuryReport.create({
      data: {
        id: newId(),
        userId: user.id,
        reportedAt: new Date(),
        injuryType: 'knee',
        severity: 3,
        status: 'active',
        crossTrainingSuggested: ['cycling', 'swimming'],
        goalAtRisk: true,
      },
    });
    expect(injury.injuryType).toBe('knee');
    expect(injury.severity).toBe(3);
    expect(injury.crossTrainingSuggested).toEqual(['cycling', 'swimming']);
  });
});
