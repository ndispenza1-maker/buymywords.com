-- Anonymous likes: visitors without accounts can like posts
CREATE TABLE IF NOT EXISTS anonymous_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id TEXT NOT NULL,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(visitor_id, post_id)
);

CREATE INDEX IF NOT EXISTS idx_anonymous_likes_post ON anonymous_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_anonymous_likes_visitor ON anonymous_likes(visitor_id);
