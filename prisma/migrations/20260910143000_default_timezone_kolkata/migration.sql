-- AlterTable
ALTER TABLE "User" ALTER COLUMN "timezone" SET DEFAULT 'Asia/Kolkata';

-- Existing accounts were created with the old UTC default.
UPDATE "User" SET "timezone" = 'Asia/Kolkata' WHERE "timezone" = 'UTC';
