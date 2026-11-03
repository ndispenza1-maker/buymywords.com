-- Add Google OAuth support to users table
-- Run this migration before deploying the Google OAuth feature

-- auth_provider: 'email' (default) or 'google'
ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_provider TEXT NOT NULL DEFAULT 'email';

-- google_id: unique Google sub identifier (only set for Google-authed users)
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id TEXT UNIQUE;

-- avatar_url already exists — Google profile pic will populate it on first sign-in

-- Make password_hash nullable (Google users won't have one)
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;
