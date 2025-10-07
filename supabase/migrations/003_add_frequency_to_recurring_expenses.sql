-- Add frequency support to recurring_expenses table

-- Add new columns
ALTER TABLE recurring_expenses
ADD COLUMN frequency TEXT NOT NULL DEFAULT 'monthly' 
  CHECK (frequency IN ('weekly', 'biweekly', 'monthly', 'quarterly', 'annually')),
ADD COLUMN frequency_config JSONB NOT NULL DEFAULT '{}'::jsonb;

-- Migrate existing data: move day_of_month to frequency_config
UPDATE recurring_expenses
SET frequency_config = jsonb_build_object('dayOfMonth', day_of_month)
WHERE frequency_config = '{}'::jsonb;

-- Make day_of_month nullable for backward compatibility
ALTER TABLE recurring_expenses
ALTER COLUMN day_of_month DROP NOT NULL;

-- Add index for better query performance
CREATE INDEX idx_recurring_expenses_frequency ON recurring_expenses(frequency);

-- Add comment to explain the frequency_config structure
COMMENT ON COLUMN recurring_expenses.frequency_config IS 
'JSONB configuration for frequency-specific data:
- Weekly/Biweekly: {"daysOfWeek": [0,1,2,3,4,5,6]} where 0=Sunday, 6=Saturday
- Monthly: {"dayOfMonth": 15}
- Quarterly/Annually: {"dayOfMonth": 15, "month": 3} where month is 1-12';

