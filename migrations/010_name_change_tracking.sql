-- Track display name changes: one free change, then 6-month cooldown
ALTER TABLE users ADD COLUMN IF NOT EXISTS name_changed_at TIMESTAMP DEFAULT NULL;
