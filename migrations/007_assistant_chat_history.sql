-- Persist assistant chat history so it survives page reloads, pop-outs, and reopens
ALTER TABLE stores ADD COLUMN IF NOT EXISTS assistant_chat_history JSONB DEFAULT '[]';
