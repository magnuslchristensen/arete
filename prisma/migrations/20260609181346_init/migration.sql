-- CreateEnum
CREATE TYPE "FitnessLevel" AS ENUM ('beginner', 'casual', 'goal_oriented');

-- CreateEnum
CREATE TYPE "CalendarProvider" AS ENUM ('google', 'apple');

-- CreateEnum
CREATE TYPE "CredentialKind" AS ENUM ('auth_token', 'calendar_token');

-- CreateEnum
CREATE TYPE "PlanPhase" AS ENUM ('base', 'build', 'peak', 'taper');

-- CreateEnum
CREATE TYPE "SessionType" AS ENUM ('easy', 'tempo', 'intervals', 'long', 'recovery', 'cross', 'rest');

-- CreateEnum
CREATE TYPE "PaceZone" AS ENUM ('z1', 'z2', 'z3', 'z4', 'z5');

-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('scheduled', 'completed', 'missed', 'skipped');

-- CreateEnum
CREATE TYPE "RouteSurface" AS ENUM ('road', 'trail', 'track', 'treadmill', 'mixed');

-- CreateEnum
CREATE TYPE "RouteSource" AS ENUM ('osm', 'google', 'user');

-- CreateEnum
CREATE TYPE "CalendarSyncStatus" AS ENUM ('pending', 'synced', 'conflict', 'failed');

-- CreateEnum
CREATE TYPE "MilestoneType" AS ENUM ('distance_pb', 'pace_pb', 'streak', 'total_km', 'challenge_complete');

-- CreateEnum
CREATE TYPE "InjuryType" AS ENUM ('knee', 'shin', 'calf', 'hip', 'foot', 'fatigue', 'illness', 'other');

-- CreateEnum
CREATE TYPE "InjuryStatus" AS ENUM ('active', 'recovering', 'resolved');

-- CreateEnum
CREATE TYPE "ChallengeType" AS ENUM ('time_trial', 'distance_pb_attempt', 'themed');

-- CreateEnum
CREATE TYPE "ChallengeTargetMetric" AS ENUM ('distance', 'pace', 'sessions_count');

-- CreateEnum
CREATE TYPE "ChallengeStatus" AS ENUM ('offered', 'accepted', 'completed', 'declined', 'expired');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "fitnessLevel" "FitnessLevel" NOT NULL,
    "weeklyAvailability" INTEGER,
    "goalEvent" TEXT,
    "goalDate" DATE,
    "calendarProvider" "CalendarProvider",
    "age" INTEGER,
    "hrMaxEstimated" INTEGER,
    "restingHr" INTEGER,
    "estimatedThresholdPace" INTEGER,
    "currentStreak" INTEGER NOT NULL DEFAULT 0,
    "totalDistanceLifetime" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "credentials" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" "CredentialKind" NOT NULL,
    "provider" "CalendarProvider",
    "ciphertext" BYTEA NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "credentials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "training_plans" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "goal" TEXT,
    "phase" "PlanPhase" NOT NULL,
    "cycleLabel" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "training_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "routeId" TEXT,
    "scheduledDate" DATE NOT NULL,
    "sessionType" "SessionType" NOT NULL,
    "status" "SessionStatus" NOT NULL DEFAULT 'scheduled',
    "targetDistance" INTEGER,
    "targetPaceZone" "PaceZone",
    "actualDistance" INTEGER,
    "actualAvgPace" INTEGER,
    "actualDuration" INTEGER,
    "hrAvg" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "routes" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "polyline" TEXT NOT NULL,
    "distance" INTEGER NOT NULL,
    "elevationGain" INTEGER,
    "surfaceType" "RouteSurface",
    "source" "RouteSource",
    "generatedAt" TIMESTAMP(3),
    "saved" BOOLEAN NOT NULL DEFAULT false,
    "savedName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "routes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calendar_events" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "externalEventId" TEXT NOT NULL,
    "calendarProvider" "CalendarProvider" NOT NULL,
    "syncStatus" "CalendarSyncStatus" NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "calendar_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "milestones" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "MilestoneType" NOT NULL,
    "challengeId" TEXT,
    "achievedAt" TIMESTAMP(3) NOT NULL,
    "value" DECIMAL(65,30) NOT NULL,
    "displayMessage" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "milestones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "injury_reports" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reportedAt" TIMESTAMP(3) NOT NULL,
    "injuryType" "InjuryType" NOT NULL,
    "severity" INTEGER NOT NULL,
    "estimatedDurationDays" INTEGER,
    "status" "InjuryStatus" NOT NULL DEFAULT 'active',
    "recoveryTargetDate" DATE,
    "affectedPlanId" TEXT,
    "crossTrainingSuggested" JSONB,
    "goalAtRisk" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "injury_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "challenges" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "challengeType" "ChallengeType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "targetMetric" "ChallengeTargetMetric",
    "targetValue" DECIMAL(65,30),
    "linkedRouteId" TEXT,
    "status" "ChallengeStatus" NOT NULL DEFAULT 'offered',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "challenges_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "credentials_userId_kind_provider_key" ON "credentials"("userId", "kind", "provider");

-- CreateIndex
CREATE INDEX "sessions_planId_idx" ON "sessions"("planId");

-- CreateIndex
CREATE INDEX "sessions_scheduledDate_idx" ON "sessions"("scheduledDate");

-- CreateIndex
CREATE INDEX "sessions_userId_scheduledDate_idx" ON "sessions"("userId", "scheduledDate");

-- CreateIndex
CREATE UNIQUE INDEX "calendar_events_sessionId_key" ON "calendar_events"("sessionId");

-- AddForeignKey
ALTER TABLE "credentials" ADD CONSTRAINT "credentials_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_plans" ADD CONSTRAINT "training_plans_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_planId_fkey" FOREIGN KEY ("planId") REFERENCES "training_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "routes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "routes" ADD CONSTRAINT "routes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "milestones" ADD CONSTRAINT "milestones_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "milestones" ADD CONSTRAINT "milestones_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "challenges"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "injury_reports" ADD CONSTRAINT "injury_reports_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "injury_reports" ADD CONSTRAINT "injury_reports_affectedPlanId_fkey" FOREIGN KEY ("affectedPlanId") REFERENCES "training_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "challenges" ADD CONSTRAINT "challenges_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "challenges" ADD CONSTRAINT "challenges_linkedRouteId_fkey" FOREIGN KEY ("linkedRouteId") REFERENCES "routes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
