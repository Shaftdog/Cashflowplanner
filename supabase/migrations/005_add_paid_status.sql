-- Add payment status tracking columns to payment_items table
ALTER TABLE payment_items 
ADD COLUMN is_paid BOOLEAN DEFAULT FALSE NOT NULL,
ADD COLUMN paid_date TIMESTAMPTZ,
ADD COLUMN recurring_expense_id UUID REFERENCES recurring_expenses(id) ON DELETE SET NULL;

-- Create index for better query performance when filtering paid/unpaid items
CREATE INDEX idx_payment_items_is_paid ON payment_items(is_paid);
CREATE INDEX idx_payment_items_recurring_expense_id ON payment_items(recurring_expense_id);

-- Add comment explaining the columns
COMMENT ON COLUMN payment_items.is_paid IS 'Indicates whether the payment item has been marked as paid';
COMMENT ON COLUMN payment_items.paid_date IS 'Timestamp when the item was marked as paid';
COMMENT ON COLUMN payment_items.recurring_expense_id IS 'Links to the recurring expense template if this item was auto-generated';

