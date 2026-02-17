-- ============================================================
-- GMusic — Supabase Database Schema
-- Run this in Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- USERS
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  username TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ARTISTS
-- ============================================================
CREATE TABLE IF NOT EXISTS artists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  image_url TEXT,
  bio TEXT,
  monthly_listeners INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ALBUMS
-- ============================================================
CREATE TABLE IF NOT EXISTS albums (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  artist_id UUID REFERENCES artists(id) ON DELETE CASCADE,
  cover_url TEXT,
  release_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SONGS
-- ============================================================
CREATE TABLE IF NOT EXISTS songs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  artist_id UUID REFERENCES artists(id) ON DELETE CASCADE,
  album_id UUID REFERENCES albums(id) ON DELETE SET NULL,
  audio_url TEXT NOT NULL,
  cover_url TEXT,
  duration INTEGER DEFAULT 0,
  plays INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PLAYLISTS
-- ============================================================
CREATE TABLE IF NOT EXISTS playlists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  cover_url TEXT,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PLAYLIST_SONGS (junction)
-- ============================================================
CREATE TABLE IF NOT EXISTS playlist_songs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  playlist_id UUID REFERENCES playlists(id) ON DELETE CASCADE,
  song_id UUID REFERENCES songs(id) ON DELETE CASCADE,
  position INTEGER DEFAULT 0,
  added_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- LIKES
-- ============================================================
CREATE TABLE IF NOT EXISTS likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  song_id UUID REFERENCES songs(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, song_id)
);

-- ============================================================
-- RECENTLY_PLAYED
-- ============================================================
CREATE TABLE IF NOT EXISTS recently_played (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  song_id UUID REFERENCES songs(id) ON DELETE CASCADE,
  played_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PINGS (to keep Supabase active)
-- ============================================================
CREATE TABLE IF NOT EXISTS pings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pinged_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_songs_artist ON songs(artist_id);
CREATE INDEX IF NOT EXISTS idx_songs_album ON songs(album_id);
CREATE INDEX IF NOT EXISTS idx_albums_artist ON albums(artist_id);
CREATE INDEX IF NOT EXISTS idx_playlist_songs_playlist ON playlist_songs(playlist_id);
CREATE INDEX IF NOT EXISTS idx_likes_user ON likes(user_id);
CREATE INDEX IF NOT EXISTS idx_recently_played_user ON recently_played(user_id);

-- ============================================================
-- RLS POLICIES
-- ============================================================
ALTER TABLE artists ENABLE ROW LEVEL SECURITY;
ALTER TABLE albums ENABLE ROW LEVEL SECURITY;
ALTER TABLE songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlist_songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recently_played ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE pings ENABLE ROW LEVEL SECURITY;

-- Full access policies for content tables (admin panel uses anon key)
CREATE POLICY "Allow full access to artists" ON artists FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow full access to albums" ON albums FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow full access to songs" ON songs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow full access to playlists" ON playlists FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow full access to playlist_songs" ON playlist_songs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow full access to likes" ON likes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow full access to recently_played" ON recently_played FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow full access to users" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow full access to pings" ON pings FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- STORAGE BUCKETS
-- ============================================================
INSERT INTO storage.buckets (id, name, public) VALUES ('music', 'music', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('covers', 'covers', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('artists', 'artists', true) ON CONFLICT (id) DO NOTHING;

-- Storage Policies
CREATE POLICY "Allow all on music" ON storage.objects FOR ALL USING (bucket_id = 'music') WITH CHECK (bucket_id = 'music');
CREATE POLICY "Allow all on covers" ON storage.objects FOR ALL USING (bucket_id = 'covers') WITH CHECK (bucket_id = 'covers');
CREATE POLICY "Allow all on artists" ON storage.objects FOR ALL USING (bucket_id = 'artists') WITH CHECK (bucket_id = 'artists');

