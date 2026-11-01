-- Add store_content column for published HTML and chat_history for builder conversations
ALTER TABLE stores ADD COLUMN IF NOT EXISTS store_content TEXT;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS chat_history JSONB DEFAULT '[]';
