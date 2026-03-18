CREATE TABLE IF NOT EXISTS "notification_preferences" (
  "id" serial PRIMARY KEY NOT NULL,
  "customer_id" integer NOT NULL UNIQUE,
  "restock_email" boolean DEFAULT true NOT NULL,
  "restock_sms" boolean DEFAULT false NOT NULL,
  "order_email" boolean DEFAULT true NOT NULL,
  "order_sms" boolean DEFAULT false NOT NULL,
  "promo_email" boolean DEFAULT true NOT NULL,
  "promo_sms" boolean DEFAULT false NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "notification_preferences_customer_id_fk" FOREIGN KEY ("customer_id") REFERENCES "delivery_customers"("id") ON DELETE CASCADE
);
