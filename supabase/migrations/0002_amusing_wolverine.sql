CREATE TYPE "public"."types_financement" AS ENUM('CPF', 'OPCO', 'Inter', 'Intra');--> statement-breakpoint
ALTER TABLE "formations" ADD COLUMN "type_financement" "types_financement";