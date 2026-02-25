-- Add check constraint: rating in [0, 5] on formateurs
ALTER TABLE "formateurs" ADD CONSTRAINT "rating_range_check" CHECK ("rating" >= 0 AND "rating" <= 5);
