-- Migration 009: Kill the API Key
-- Mall Assistant becomes the store builder. No more user-provided LLM keys.
-- The Mall provides the AI brain via its own Claude API key on the backend.

-- Enable assistant for ALL fresh stores (it's now the default builder)
UPDATE stores SET assistant_enabled = true WHERE store_type = 'fresh';

-- Drop the user-facing LLM columns — Mall provides the brain now
ALTER TABLE stores DROP COLUMN IF EXISTS llm_provider;
ALTER TABLE stores DROP COLUMN IF EXISTS llm_api_key;

-- Unify chat history: migrate old chat_history (from StoreBuilder) into assistant_chat_history
-- Only for stores that have StoreBuilder history but no assistant history yet
UPDATE stores
  SET assistant_chat_history = chat_history
  WHERE chat_history IS NOT NULL
    AND chat_history != '[]'::jsonb
    AND (assistant_chat_history IS NULL OR assistant_chat_history = '[]'::jsonb);

-- Drop the old StoreBuilder chat_history column
ALTER TABLE stores DROP COLUMN IF EXISTS chat_history;
