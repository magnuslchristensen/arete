/**
 * prisma/seed.ts — Local development seed.
 *
 * Populates all 9 tables with representative data so engineers can
 * start the app and explore real entities immediately.
 *
 * Run:  npx prisma db seed
 * Reset: npx prisma migrate reset  (drops + re-migrates + re-seeds)
 *
 * Idempotency: The seed is keyed on the fixed SEED_USER_EMAIL.
 * If that user already exists the script skips creation (upsert pattern).
 * Re-running is safe.
 *
 * All distances in metres, durations in seconds, pace in sec/km (FR-13).
 */

import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/db/generated/index.js';
import { uuidv7 } from 'uuidv7';

function newId() {
  return uuidv7();
}

const DATABASE_URL = process.env['DATABASE_URL'];
if (!DATABASE_URL) throw new Error('DATABASE_URL is not set');

const pool = new pg.Pool({ connectionString: DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter } as ConstructorParameters<typeof PrismaClient>[0]);

const SEED_USER_EMAIL = 'seed@arete.dev';

async function main() {
  console.log('🌱 Seeding database...');

  // ── User ──────────────────────────────────────────────────────────────────
  const userId = newId();
  const user = await prisma.user.upsert({
    where: { email: SEED_USER_EMAIL },
    update: {},
    create: {
      id: userId,
      email: SEED_USER_EMAIL,
      name: 'Alex Seed',
      fitnessLevel: 'goal_oriented',
      weeklyAvailability: 5,
      goalEvent: 'Berlin Marathon 2027',
      goalDate: new Date('2027-09-28'),
      calendarProvider: 'google',
      age: 32,
      hrMaxEstimated: 188,
      restingHr: 52,
      estimatedThresholdPace: 285, // ~4:45/km
      currentStreak: 4,
      totalDistanceLifetime: 342_000, // 342 km
    },
  });
  console.log(`  ✓ User: ${user.email} (${user.id})`);

  // ── Credential (dummy placeholder — real tokens encrypted in production) ──
  const credId = newId();
  await prisma.credential.upsert({
    where: { userId_kind_provider: { userId: user.id, kind: 'calendar_token', provider: 'google' } },
    update: {},
    create: {
      id: credId,
      userId: user.id,
      kind: 'calendar_token',
      provider: 'google',
      ciphertext: Buffer.from('SEED_PLACEHOLDER_NOT_A_REAL_TOKEN'),
    },
  });
  console.log('  ✓ Credential (placeholder calendar token)');

  // ── Route ─────────────────────────────────────────────────────────────────
  const routeId = newId();
  const route = await prisma.route.create({
    data: {
      id: routeId,
      userId: user.id,
      polyline: 'u{~vFvyys@fC_yrpBiL', // placeholder encoded polyline
      distance: 10_200, // 10.2 km
      elevationGain: 85,
      surfaceType: 'road',
      source: 'osm',
      generatedAt: new Date(),
      saved: true,
      savedName: 'Riverside Loop',
    },
  });
  console.log(`  ✓ Route: ${route.savedName} (${route.distance}m)`);

  // ── TrainingPlan ──────────────────────────────────────────────────────────
  const planId = newId();
  const plan = await prisma.trainingPlan.create({
    data: {
      id: planId,
      userId: user.id,
      goal: 'Berlin Marathon 2027',
      phase: 'base',
      cycleLabel: 'Build your base — Summer 2026',
    },
  });
  console.log(`  ✓ TrainingPlan: ${plan.cycleLabel}`);

  // ── Sessions (mixed statuses) ─────────────────────────────────────────────
  const sessions = await Promise.all([
    prisma.session.create({
      data: {
        id: newId(),
        userId: user.id,
        planId: plan.id,
        scheduledDate: new Date('2026-06-05'),
        sessionType: 'easy',
        status: 'completed',
        targetDistance: 8_000,
        targetPaceZone: 'z2',
        actualDistance: 8_200,
        actualAvgPace: 330, // 5:30/km
        actualDuration: 2706,
        hrAvg: 142,
        notes: 'Felt comfortable throughout.',
      },
    }),
    prisma.session.create({
      data: {
        id: newId(),
        userId: user.id,
        planId: plan.id,
        routeId: route.id,
        scheduledDate: new Date('2026-06-07'),
        sessionType: 'tempo',
        status: 'completed',
        targetDistance: 10_000,
        targetPaceZone: 'z3',
        actualDistance: 10_200,
        actualAvgPace: 285,
        actualDuration: 2907,
        hrAvg: 168,
      },
    }),
    prisma.session.create({
      data: {
        id: newId(),
        userId: user.id,
        planId: plan.id,
        scheduledDate: new Date('2026-06-09'),
        sessionType: 'intervals',
        status: 'scheduled',
        targetDistance: 12_000,
        targetPaceZone: 'z4',
      },
    }),
    prisma.session.create({
      data: {
        id: newId(),
        userId: user.id,
        planId: plan.id,
        scheduledDate: new Date('2026-06-03'),
        sessionType: 'long',
        status: 'missed',
        targetDistance: 18_000,
        targetPaceZone: 'z2',
        notes: 'Skipped — travel.',
      },
    }),
  ]);
  console.log(`  ✓ ${sessions.length} Sessions (completed x2, scheduled x1, missed x1)`);

  // ── CalendarEvent ─────────────────────────────────────────────────────────
  const scheduledSession = sessions.find((s) => s.status === 'scheduled');
  if (scheduledSession) {
    await prisma.calendarEvent.create({
      data: {
        id: newId(),
        sessionId: scheduledSession.id,
        externalEventId: 'google_evt_abc123',
        calendarProvider: 'google',
        syncStatus: 'synced',
      },
    });
    console.log('  ✓ CalendarEvent (linked to upcoming intervals session)');
  }

  // ── Challenge ─────────────────────────────────────────────────────────────
  const challengeId = newId();
  const challenge = await prisma.challenge.create({
    data: {
      id: challengeId,
      userId: user.id,
      challengeType: 'time_trial',
      title: 'Riverside Loop time trial',
      description: 'Beat your best time on the Riverside Loop route.',
      startDate: new Date('2026-06-12'),
      endDate: new Date('2026-06-12'),
      targetMetric: 'pace',
      targetValue: 280, // 4:40/km target
      linkedRouteId: route.id,
      status: 'offered',
    },
  });
  console.log(`  ✓ Challenge: ${challenge.title}`);

  // ── Milestone ─────────────────────────────────────────────────────────────
  const milestone = await prisma.milestone.create({
    data: {
      id: newId(),
      userId: user.id,
      type: 'distance_pb',
      achievedAt: new Date('2026-05-25'),
      value: 21_097, // half marathon distance in metres
      displayMessage: "You ran your first half marathon distance — you're a runner.",
    },
  });
  console.log(`  ✓ Milestone: ${milestone.type} (${Number(milestone.value)}m)`);

  // ── InjuryReport ──────────────────────────────────────────────────────────
  const injury = await prisma.injuryReport.create({
    data: {
      id: newId(),
      userId: user.id,
      reportedAt: new Date('2026-05-10'),
      injuryType: 'shin',
      severity: 2,
      estimatedDurationDays: 7,
      status: 'resolved',
      recoveryTargetDate: new Date('2026-05-17'),
      affectedPlanId: plan.id,
      crossTrainingSuggested: ['cycling', 'swimming'],
      goalAtRisk: false,
      notes: 'Mild shin splints — reduced load for one week.',
    },
  });
  console.log(`  ✓ InjuryReport: ${injury.injuryType} (severity ${injury.severity}, resolved)`);

  console.log('\n✅ Seed complete.');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
