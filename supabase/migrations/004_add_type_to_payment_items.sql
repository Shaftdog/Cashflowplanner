-- Add type column to payment_items table
ALTER TABLE payment_items 
ADD COLUMN type TEXT;

-- Migrate existing data: negative amounts become revenue, positive/zero become expenses
UPDATE payment_items
SET type = CASE
  WHEN amount < 0 THEN 'revenue'
  ELSE 'expense'
END;

-- Convert all amounts to absolute values
UPDATE payment_items
SET amount = ABS(amount);

-- Add constraint and set as NOT NULL with default
ALTER TABLE payment_items
ALTER COLUMN type SET NOT NULL,
ALTER COLUMN type SET DEFAULT 'expense',
ADD CONSTRAINT payment_items_type_check CHECK (type IN ('expense', 'revenue'));

-- Add the same to recurring_expenses table
ALTER TABLE recurring_expenses
ADD COLUMN type TEXT;

-- Set default type for recurring expenses
UPDATE recurring_expenses
SET type = 'expense';

-- Add constraint and set as NOT NULL with default for recurring_expenses
ALTER TABLE recurring_expenses
ALTER COLUMN type SET NOT NULL,
ALTER COLUMN type SET DEFAULT 'expense',
ADD CONSTRAINT recurring_expenses_type_check CHECK (type IN ('expense', 'revenue'));

