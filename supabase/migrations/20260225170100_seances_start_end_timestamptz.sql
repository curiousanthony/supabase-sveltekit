-- Replace seances date + start_time + end_time (timezone-ambiguous) with start_at/end_at (timestamptz).
-- Legacy rows: date+time are interpreted as UTC when backfilling.
--> statement-breakpoint
ALTER TABLE "seances" DROP CONSTRAINT IF EXISTS "seances_end_after_start_chk";
--> statement-breakpoint
ALTER TABLE "seances" ADD COLUMN "start_at" timestamp with time zone;
ALTER TABLE "seances" ADD COLUMN "end_at" timestamp with time zone;
--> statement-breakpoint
UPDATE "seances" SET
  "start_at" = ("date" + "start_time")::timestamp AT TIME ZONE 'UTC',
  "end_at" = ("date" + "end_time")::timestamp AT TIME ZONE 'UTC'
WHERE "start_at" IS NULL OR "end_at" IS NULL;
--> statement-breakpoint
ALTER TABLE "seances" ALTER COLUMN "start_at" SET NOT NULL;
ALTER TABLE "seances" ALTER COLUMN "end_at" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "seances" DROP COLUMN "date";
ALTER TABLE "seances" DROP COLUMN "start_time";
ALTER TABLE "seances" DROP COLUMN "end_time";
--> statement-breakpoint
ALTER TABLE "seances" ADD CONSTRAINT "seances_end_after_start_chk" CHECK ("end_at" > "start_at");
