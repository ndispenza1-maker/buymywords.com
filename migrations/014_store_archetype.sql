-- Store archetype: which starter template the Mall Assistant builds from.
-- 'blank' = legacy stores created before this migration, assistant behaves as it did.
ALTER TABLE stores ADD COLUMN IF NOT EXISTS store_archetype TEXT NOT NULL DEFAULT 'blank';

ALTER TABLE stores DROP CONSTRAINT IF EXISTS stores_store_archetype_check;
ALTER TABLE stores ADD CONSTRAINT stores_store_archetype_check
  CHECK (store_archetype IN ('service', 'product', 'donation', 'blank'));

-- Existing fresh stores default to service (the primary blue-collar lane).
UPDATE stores SET store_archetype = 'service'
  WHERE store_type = 'fresh' AND store_archetype = 'blank';
