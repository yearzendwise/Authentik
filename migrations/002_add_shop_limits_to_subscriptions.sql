-- Add max_shops column to subscription_plans table
ALTER TABLE subscription_plans 
ADD COLUMN max_shops INTEGER;

-- Update existing subscription plans with shop limits
UPDATE subscription_plans 
SET max_shops = CASE 
    WHEN name = 'basic' THEN 10
    WHEN name = 'pro' THEN 25
    WHEN name = 'enterprise' THEN NULL -- NULL means unlimited
    ELSE NULL -- NULL means unlimited
END;