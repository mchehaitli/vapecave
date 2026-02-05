-- Add must_change_password column to delivery_customers table
-- This column is used to force users to change their password after a password reset

ALTER TABLE "delivery_customers" 
ADD COLUMN IF NOT EXISTS "must_change_password" boolean DEFAULT false NOT NULL;
