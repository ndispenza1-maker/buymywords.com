-- Track whether store owners have built their storefront
ALTER TABLE users ADD COLUMN IF NOT EXISTS store_built BOOLEAN DEFAULT false;
