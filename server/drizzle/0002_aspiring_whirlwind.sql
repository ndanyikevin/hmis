DO $$ BEGIN
    CREATE TYPE "public"."facility_care_type" AS ENUM('outpatient', 'inpatient', 'both');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

--> statement-breakpoint

ALTER TABLE "facility" ADD COLUMN "care_type" "facility_care_type" DEFAULT 'outpatient' NOT NULL;