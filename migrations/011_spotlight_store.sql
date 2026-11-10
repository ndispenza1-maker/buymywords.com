-- Spotlight Store: one featured store per month, picked by The Mall
CREATE TABLE IF NOT EXISTS spotlight_stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  month TEXT NOT NULL, -- YYYY-MM format
  note TEXT, -- optional note about why this store was picked
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(month) -- only one spotlight per month
);
