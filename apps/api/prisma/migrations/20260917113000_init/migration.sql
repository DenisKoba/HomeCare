CREATE SCHEMA IF NOT EXISTS "public";

CREATE TYPE "HouseholdRole" AS ENUM ('owner', 'member');
CREATE TYPE "RoomType" AS ENUM ('kitchen', 'bathroom', 'bedroom', 'living_room', 'hallway', 'office', 'other');
CREATE TYPE "Effort" AS ENUM ('low', 'normal', 'high');
CREATE TYPE "TaskPriority" AS ENUM ('low', 'normal', 'high');
CREATE TYPE "AssignmentMode" AS ENUM ('unassigned', 'fixed', 'rotation');
CREATE TYPE "PlanStatus" AS ENUM ('draft', 'active', 'completed', 'cancelled');
CREATE TYPE "PlanItemStatus" AS ENUM ('planned', 'completed', 'skipped', 'deferred');
CREATE TYPE "SelectionReason" AS ENUM ('overdue', 'due', 'priority', 'manual');
CREATE TYPE "DevicePlatform" AS ENUM ('ios', 'android');

CREATE TABLE "Profile" (
  "id" UUID NOT NULL,
  "displayName" VARCHAR(80),
  "avatarUrl" TEXT,
  "locale" VARCHAR(20) NOT NULL DEFAULT 'uk',
  "timezone" VARCHAR(100) NOT NULL DEFAULT 'Europe/Kyiv',
  "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Profile_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Household" (
  "id" UUID NOT NULL,
  "name" VARCHAR(80) NOT NULL,
  "timezone" VARCHAR(100) NOT NULL,
  "version" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Household_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "HouseholdMember" (
  "id" UUID NOT NULL,
  "householdId" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "role" "HouseholdRole" NOT NULL,
  "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "HouseholdMember_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "HouseholdInvitation" (
  "id" UUID NOT NULL,
  "householdId" UUID NOT NULL,
  "createdById" UUID NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "role" "HouseholdRole" NOT NULL DEFAULT 'member',
  "email" TEXT,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "acceptedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "HouseholdInvitation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Room" (
  "id" UUID NOT NULL,
  "householdId" UUID NOT NULL,
  "name" VARCHAR(80) NOT NULL,
  "type" "RoomType" NOT NULL,
  "position" INTEGER NOT NULL DEFAULT 0,
  "archived" BOOLEAN NOT NULL DEFAULT false,
  "version" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Room_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TaskTemplate" (
  "id" UUID NOT NULL,
  "slug" TEXT NOT NULL,
  "title" VARCHAR(120) NOT NULL,
  "roomType" "RoomType" NOT NULL,
  "estimatedMinutes" INTEGER NOT NULL,
  "effort" "Effort" NOT NULL,
  "priority" "TaskPriority" NOT NULL DEFAULT 'normal',
  "recurrence" JSONB NOT NULL,
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TaskTemplate_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Task" (
  "id" UUID NOT NULL,
  "roomId" UUID NOT NULL,
  "templateId" UUID,
  "title" VARCHAR(120) NOT NULL,
  "notes" TEXT,
  "estimatedMinutes" INTEGER NOT NULL,
  "effort" "Effort" NOT NULL,
  "priority" "TaskPriority" NOT NULL,
  "recurrence" JSONB NOT NULL,
  "nextDueOn" DATE,
  "lastCompletedAt" TIMESTAMP(3),
  "assignmentMode" "AssignmentMode" NOT NULL DEFAULT 'unassigned',
  "fixedAssigneeId" UUID,
  "rotationMemberIds" UUID[],
  "archived" BOOLEAN NOT NULL DEFAULT false,
  "version" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TaskCompletion" (
  "id" UUID NOT NULL,
  "taskId" UUID NOT NULL,
  "completedById" UUID NOT NULL,
  "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "actualMinutes" INTEGER,
  "note" TEXT,
  "undoneAt" TIMESTAMP(3),
  "idempotencyKey" VARCHAR(100) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TaskCompletion_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DailyPlan" (
  "id" UUID NOT NULL,
  "householdId" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "localDate" DATE NOT NULL,
  "timezone" VARCHAR(100) NOT NULL,
  "timeBudgetMinutes" INTEGER NOT NULL,
  "energyLevel" "Effort" NOT NULL,
  "status" "PlanStatus" NOT NULL DEFAULT 'active',
  "version" INTEGER NOT NULL DEFAULT 1,
  "idempotencyKey" VARCHAR(100) NOT NULL,
  "scheduledStartAt" TIMESTAMP(3),
  "scheduledEndAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "DailyPlan_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DailyPlanItem" (
  "id" UUID NOT NULL,
  "planId" UUID NOT NULL,
  "taskId" UUID NOT NULL,
  "position" INTEGER NOT NULL,
  "estimatedMinutes" INTEGER NOT NULL,
  "reason" "SelectionReason" NOT NULL,
  "status" "PlanItemStatus" NOT NULL DEFAULT 'planned',
  "scheduledStartAt" TIMESTAMP(3),
  "scheduledEndAt" TIMESTAMP(3),
  "version" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "DailyPlanItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Device" (
  "id" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "installationId" VARCHAR(120) NOT NULL,
  "platform" "DevicePlatform" NOT NULL,
  "expoPushToken" TEXT,
  "locale" VARCHAR(20) NOT NULL,
  "timezone" VARCHAR(100) NOT NULL,
  "appVersion" VARCHAR(30),
  "notificationsEnabled" BOOLEAN NOT NULL DEFAULT false,
  "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Device_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "NotificationPreference" (
  "userId" UUID NOT NULL,
  "dailyPlanEnabled" BOOLEAN NOT NULL DEFAULT true,
  "assignmentEnabled" BOOLEAN NOT NULL DEFAULT true,
  "invitationEnabled" BOOLEAN NOT NULL DEFAULT true,
  "quietHoursStart" VARCHAR(5),
  "quietHoursEnd" VARCHAR(5),
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "NotificationPreference_pkey" PRIMARY KEY ("userId")
);

CREATE INDEX "HouseholdMember_userId_idx" ON "HouseholdMember"("userId");
CREATE UNIQUE INDEX "HouseholdMember_householdId_userId_key" ON "HouseholdMember"("householdId", "userId");
CREATE UNIQUE INDEX "HouseholdInvitation_tokenHash_key" ON "HouseholdInvitation"("tokenHash");
CREATE INDEX "HouseholdInvitation_householdId_idx" ON "HouseholdInvitation"("householdId");
CREATE INDEX "Room_householdId_archived_position_idx" ON "Room"("householdId", "archived", "position");
CREATE UNIQUE INDEX "TaskTemplate_slug_key" ON "TaskTemplate"("slug");
CREATE INDEX "Task_roomId_archived_idx" ON "Task"("roomId", "archived");
CREATE INDEX "Task_nextDueOn_idx" ON "Task"("nextDueOn");
CREATE INDEX "TaskCompletion_completedById_completedAt_idx" ON "TaskCompletion"("completedById", "completedAt");
CREATE UNIQUE INDEX "TaskCompletion_taskId_idempotencyKey_key" ON "TaskCompletion"("taskId", "idempotencyKey");
CREATE INDEX "DailyPlan_householdId_localDate_idx" ON "DailyPlan"("householdId", "localDate");
CREATE UNIQUE INDEX "DailyPlan_householdId_userId_localDate_key" ON "DailyPlan"("householdId", "userId", "localDate");
CREATE UNIQUE INDEX "DailyPlan_userId_idempotencyKey_key" ON "DailyPlan"("userId", "idempotencyKey");
CREATE INDEX "DailyPlanItem_planId_position_idx" ON "DailyPlanItem"("planId", "position");
CREATE UNIQUE INDEX "DailyPlanItem_planId_taskId_key" ON "DailyPlanItem"("planId", "taskId");
CREATE UNIQUE INDEX "Device_userId_installationId_key" ON "Device"("userId", "installationId");

ALTER TABLE "HouseholdMember" ADD CONSTRAINT "HouseholdMember_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HouseholdMember" ADD CONSTRAINT "HouseholdMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HouseholdInvitation" ADD CONSTRAINT "HouseholdInvitation_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HouseholdInvitation" ADD CONSTRAINT "HouseholdInvitation_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Room" ADD CONSTRAINT "Room_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Task" ADD CONSTRAINT "Task_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Task" ADD CONSTRAINT "Task_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "TaskTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Task" ADD CONSTRAINT "Task_fixedAssigneeId_fkey" FOREIGN KEY ("fixedAssigneeId") REFERENCES "Profile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "TaskCompletion" ADD CONSTRAINT "TaskCompletion_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TaskCompletion" ADD CONSTRAINT "TaskCompletion_completedById_fkey" FOREIGN KEY ("completedById") REFERENCES "Profile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "DailyPlan" ADD CONSTRAINT "DailyPlan_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DailyPlan" ADD CONSTRAINT "DailyPlan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DailyPlanItem" ADD CONSTRAINT "DailyPlanItem_planId_fkey" FOREIGN KEY ("planId") REFERENCES "DailyPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DailyPlanItem" ADD CONSTRAINT "DailyPlanItem_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Device" ADD CONSTRAINT "Device_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "NotificationPreference" ADD CONSTRAINT "NotificationPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
