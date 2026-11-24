-- Letty's Challenge at The Mall
-- Every attempt is one row. Counters read from here.

CREATE TABLE IF NOT EXISTS letty_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identity_key TEXT NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  visitor_id TEXT,
  ip_hash TEXT,
  idea TEXT NOT NULL,
  response TEXT,
  result TEXT NOT NULL DEFAULT 'pending', -- pending | held | conceded | error
  model TEXT,
  input_tokens INTEGER NOT NULL DEFAULT 0,
  output_tokens INTEGER NOT NULL DEFAULT 0,
  posted_post_id UUID REFERENCES posts(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_letty_challenges_created ON letty_challenges (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_letty_challenges_identity ON letty_challenges (identity_key, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_letty_challenges_result ON letty_challenges (result);
CREATE INDEX IF NOT EXISTS idx_letty_challenges_ip ON letty_challenges (ip_hash, created_at DESC);

-- One row per device / account. Free window + paid credits live here.
CREATE TABLE IF NOT EXISTS letty_credits (
  identity_key TEXT PRIMARY KEY,
  free_used_at TIMESTAMPTZ,
  next_free_at TIMESTAMPTZ,
  paid_credits INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Idempotent record of $1.99 purchases (one credit per checkout session).
CREATE TABLE IF NOT EXISTS letty_purchases (
  stripe_session_id TEXT PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  amount_cents INTEGER NOT NULL DEFAULT 199,
  credits INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Monthly token budget guard (she goes off the clock when this is spent).
CREATE TABLE IF NOT EXISTS letty_usage (
  month TEXT PRIMARY KEY,
  tokens_used BIGINT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
