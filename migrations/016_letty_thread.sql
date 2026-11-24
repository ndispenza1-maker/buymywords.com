-- Letty's Challenge: a session is a thread, capped at three replies.
ALTER TABLE letty_challenges ADD COLUMN IF NOT EXISTS turns INTEGER NOT NULL DEFAULT 1;
ALTER TABLE letty_challenges ADD COLUMN IF NOT EXISTS thread JSONB;
