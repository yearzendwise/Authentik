-- Migration: Add avatar_url column to users table
-- This migration ensures the avatar_url column exists in the users table

-- Check if the column exists, and add it if it doesn't
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'avatar_url'
    ) THEN
        ALTER TABLE "users" ADD COLUMN "avatar_url" TEXT;
    END IF;
END
$$;