-- Migration: Make location fields optional in shops table
-- This migration removes the NOT NULL constraint from address and city fields

-- Alter the shops table to make address and city optional
ALTER TABLE "shops" ALTER COLUMN "address" DROP NOT NULL;
ALTER TABLE "shops" ALTER COLUMN "city" DROP NOT NULL; 