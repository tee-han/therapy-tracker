-- Run this in the Supabase SQL Editor to set up the table

-- 1. Create the table
CREATE TABLE tracker_data (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable Row Level Security
ALTER TABLE tracker_data ENABLE ROW LEVEL SECURITY;

-- 3. Allow anon read/write (secured by hashed passphrase as row key)
CREATE POLICY "Allow anon select" ON tracker_data
  FOR SELECT USING (true);

CREATE POLICY "Allow anon insert" ON tracker_data
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow anon update" ON tracker_data
  FOR UPDATE USING (true);

CREATE POLICY "Allow anon delete" ON tracker_data
  FOR DELETE USING (true);
