-- Account type: 'shopper' or 'store_owner', null until profile is built
ALTER TABLE users ADD COLUMN IF NOT EXISTS account_type TEXT DEFAULT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_complete BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_users_account_type ON users(account_type) WHERE account_type IS NOT NULL;
