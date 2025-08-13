-- Migration: Add isEmbeddable field to forms table
-- This allows forms to be configured for remote embedding

ALTER TABLE forms 
ADD COLUMN is_embeddable BOOLEAN DEFAULT true;

-- Update existing forms to be embeddable by default
UPDATE forms 
SET is_embeddable = true 
WHERE is_embeddable IS NULL;
