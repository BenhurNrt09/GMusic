-- ============================================================
-- GMusic — Real-time Play Counts Migration
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Create the increment function
CREATE OR REPLACE FUNCTION increment_song_plays(song_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE songs
  SET plays = COALESCE(plays, 0) + 1
  WHERE id = song_id;
END;
$$ LANGUAGE plpgsql;

-- 2. Add songs table to realtime publication (Skip if already added)
-- ALTER PUBLICATION supabase_realtime ADD TABLE songs;

-- 3. Add lyrics column to songs table
ALTER TABLE songs ADD COLUMN IF NOT EXISTS lyrics TEXT;

-- 4. Add video_url column to songs table
ALTER TABLE songs ADD COLUMN IF NOT EXISTS video_url TEXT;
