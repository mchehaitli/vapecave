ALTER TABLE "delivery_customers" ADD COLUMN "email_consent" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "delivery_customers" ADD COLUMN "marketing_consent" boolean DEFAULT false NOT NULL;
