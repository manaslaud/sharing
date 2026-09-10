-- Completed reminders stay hidden by treating them as deleted.
UPDATE "Reminder"
SET "deletedAt" = COALESCE("deletedAt", "completedAt", CURRENT_TIMESTAMP)
WHERE "completedAt" IS NOT NULL
  AND "deletedAt" IS NULL;

DROP INDEX IF EXISTS "Reminder_dueAt_completedAt_deletedAt_idx";

ALTER TABLE "Reminder" DROP COLUMN "completedAt";

CREATE INDEX "Reminder_dueAt_deletedAt_idx" ON "Reminder"("dueAt", "deletedAt");
