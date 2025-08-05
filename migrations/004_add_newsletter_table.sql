-- Add newsletter table for newsletter management functionality
-- This table stores newsletter data including title, subject, content, and metadata

CREATE TABLE IF NOT EXISTS "newsletters" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "title" text NOT NULL,
  "subject" text NOT NULL,
  "content" text NOT NULL,
  "status" text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sent')),
  "scheduled_at" timestamp,
  "recipient_count" integer NOT NULL DEFAULT 0,
  "open_count" integer NOT NULL DEFAULT 0,
  "click_count" integer NOT NULL DEFAULT 0,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS "newsletters_tenant_id_idx" ON "newsletters" ("tenant_id");
CREATE INDEX IF NOT EXISTS "newsletters_user_id_idx" ON "newsletters" ("user_id");
CREATE INDEX IF NOT EXISTS "newsletters_status_idx" ON "newsletters" ("status");
CREATE INDEX IF NOT EXISTS "newsletters_created_at_idx" ON "newsletters" ("created_at");

-- Add RLS (Row Level Security) policies for multi-tenant data isolation
ALTER TABLE "newsletters" ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to see only newsletters from their own tenant
CREATE POLICY "newsletters_tenant_isolation" ON "newsletters"
  FOR ALL USING ("tenant_id" = current_setting('app.current_tenant')::uuid);