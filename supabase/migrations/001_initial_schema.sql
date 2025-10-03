-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create payment_items table
CREATE TABLE payment_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,
  due_date TIMESTAMPTZ NOT NULL,
  category TEXT NOT NULL,
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create financials table
CREATE TABLE user_financials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  available_funds NUMERIC(10, 2) DEFAULT 0 NOT NULL,
  savings_reserve NUMERIC(10, 2) DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes for better query performance
CREATE INDEX idx_payment_items_user_id ON payment_items(user_id);
CREATE INDEX idx_payment_items_due_date ON payment_items(due_date);
CREATE INDEX idx_payment_items_category ON payment_items(category);
CREATE INDEX idx_user_financials_user_id ON user_financials(user_id);

-- Enable Row Level Security
ALTER TABLE payment_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_financials ENABLE ROW LEVEL SECURITY;

-- RLS Policies for payment_items
CREATE POLICY "Users can view their own payment items"
  ON payment_items FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own payment items"
  ON payment_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own payment items"
  ON payment_items FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own payment items"
  ON payment_items FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for user_financials
CREATE POLICY "Users can view their own financials"
  ON user_financials FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own financials"
  ON user_financials FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own financials"
  ON user_financials FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to auto-update updated_at
CREATE TRIGGER update_payment_items_updated_at
  BEFORE UPDATE ON payment_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_financials_updated_at
  BEFORE UPDATE ON user_financials
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to initialize user financials on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_financials (user_id, available_funds, savings_reserve)
  VALUES (NEW.id, 10000, 500);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create financials for new users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();


