-- Assistant feature: track which stores have the guided assistant enabled
-- and log token usage for billing (added to rent)
ALTER TABLE stores ADD COLUMN IF NOT EXISTS assistant_enabled BOOLEAN DEFAULT false;

-- Usage tracking table — logs every assistant API call for billing
CREATE TABLE IF NOT EXISTS assistant_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  input_tokens INTEGER NOT NULL DEFAULT 0,
  output_tokens INTEGER NOT NULL DEFAULT 0,
  model TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Index for querying usage by store and time range
CREATE INDEX IF NOT EXISTS idx_assistant_usage_store_date ON assistant_usage(store_id, created_at);
CREATE INDEX IF NOT EXISTS idx_assistant_usage_user_date ON assistant_usage(user_id, created_at);
