-- Subscription tracking for paywall
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT NULL; -- 'active', 'past_due', 'canceled', null
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_id TEXT DEFAULT NULL; -- Stripe subscription ID
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_price_id TEXT DEFAULT NULL; -- which price they're on
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT NULL; -- 'shopper', 'owner_basic', 'owner_assistant'
ALTER TABLE users ADD COLUMN IF NOT EXISTS messages_last_read TIMESTAMPTZ DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_users_stripe_customer ON users(stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_subscription ON users(subscription_status) WHERE subscription_status IS NOT NULL;
