-- Add customer segmentation fields to newsletters table
ALTER TABLE newsletters 
ADD COLUMN recipient_type TEXT NOT NULL DEFAULT 'all',
ADD COLUMN selected_contact_ids TEXT[],
ADD COLUMN selected_tag_ids TEXT[];

-- Update existing newsletters to have default recipient_type
UPDATE newsletters SET recipient_type = 'all' WHERE recipient_type IS NULL;