-- Create recurring_expenses table
CREATE TABLE recurring_expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,
  day_of_month INTEGER NOT NULL CHECK (day_of_month >= 1 AND day_of_month <= 31),
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  notes TEXT,
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes for better query performance
CREATE INDEX idx_recurring_expenses_user_id ON recurring_expenses(user_id);
CREATE INDEX idx_recurring_expenses_day_of_month ON recurring_expenses(day_of_month);

-- Enable Row Level Security
ALTER TABLE recurring_expenses ENABLE ROW LEVEL SECURITY;

-- RLS Policies for recurring_expenses
CREATE POLICY "Users can view their own recurring expenses"
  ON recurring_expenses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own recurring expenses"
  ON recurring_expenses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own recurring expenses"
  ON recurring_expenses FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own recurring expenses"
  ON recurring_expenses FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger to auto-update updated_at
CREATE TRIGGER update_recurring_expenses_updated_at
  BEFORE UPDATE ON recurring_expenses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

