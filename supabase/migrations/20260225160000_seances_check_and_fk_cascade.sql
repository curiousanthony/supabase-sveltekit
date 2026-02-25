-- Add check constraint: end_time > start_time on seances
ALTER TABLE "seances" ADD CONSTRAINT "seances_end_after_start_chk" CHECK ("end_time" > "start_time");
--> statement-breakpoint
-- Recreate module_id FK with ON DELETE CASCADE so sessions are removed when a module is deleted
ALTER TABLE "seances" DROP CONSTRAINT "seances_module_id_fkey";
--> statement-breakpoint
ALTER TABLE "seances" ADD CONSTRAINT "seances_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "modules"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
