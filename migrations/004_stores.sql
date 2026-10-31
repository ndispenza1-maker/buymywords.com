-- Stores table for store owner storefronts
CREATE TABLE IF NOT EXISTS stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  store_name TEXT NOT NULL,
  store_description TEXT,
  store_type TEXT NOT NULL CHECK (store_type IN ('existing', 'llm')),
  external_url TEXT,
  llm_provider TEXT,
  llm_api_key TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id)
);
