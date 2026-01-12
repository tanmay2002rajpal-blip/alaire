-- User addresses table for saved shipping addresses
CREATE TABLE IF NOT EXISTS user_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  line1 TEXT NOT NULL,
  line2 TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  pincode TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for user lookups
CREATE INDEX IF NOT EXISTS idx_user_addresses_user_id ON user_addresses(user_id);

-- RLS policies
ALTER TABLE user_addresses ENABLE ROW LEVEL SECURITY;

-- Users can only see their own addresses
CREATE POLICY "Users can view own addresses" ON user_addresses
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own addresses
CREATE POLICY "Users can insert own addresses" ON user_addresses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own addresses
CREATE POLICY "Users can update own addresses" ON user_addresses
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own addresses
CREATE POLICY "Users can delete own addresses" ON user_addresses
  FOR DELETE USING (auth.uid() = user_id);
