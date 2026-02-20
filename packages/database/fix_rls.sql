-- ============================================================
-- GMusic — Fix RLS Policies for Admin Panel
-- Run this in Supabase SQL Editor
-- ============================================================

-- ============================================================
-- 1. DROP existing restrictive policies
-- ============================================================
DROP POLICY IF EXISTS "Public read artists" ON artists;
DROP POLICY IF EXISTS "Public read albums" ON albums;
DROP POLICY IF EXISTS "Public read songs" ON songs;
DROP POLICY IF EXISTS "Public read playlists" ON playlists;
DROP POLICY IF EXISTS "Public read playlist_songs" ON playlist_songs;
DROP POLICY IF EXISTS "Users manage own likes" ON likes;
DROP POLICY IF EXISTS "Users manage own recently_played" ON recently_played;
DROP POLICY IF EXISTS "Users manage own playlists" ON playlists;
DROP POLICY IF EXISTS "Users read own data" ON users;

-- ============================================================
-- 2. Content tables: allow full access (SELECT, INSERT, UPDATE, DELETE)
--    These are managed by the admin panel
-- ============================================================

-- ARTISTS
DROP POLICY IF EXISTS "Allow full access to artists" ON artists;
CREATE POLICY "Allow full access to artists" ON artists FOR ALL USING (true) WITH CHECK (true);

-- ALBUMS
DROP POLICY IF EXISTS "Allow full access to albums" ON albums;
CREATE POLICY "Allow full access to albums" ON albums FOR ALL USING (true) WITH CHECK (true);

-- SONGS
DROP POLICY IF EXISTS "Allow full access to songs" ON songs;
CREATE POLICY "Allow full access to songs" ON songs FOR ALL USING (true) WITH CHECK (true);

-- PLAYLISTS
DROP POLICY IF EXISTS "Allow full access to playlists" ON playlists;
CREATE POLICY "Allow full access to playlists" ON playlists FOR ALL USING (true) WITH CHECK (true);

-- PLAYLIST_SONGS
DROP POLICY IF EXISTS "Allow full access to playlist_songs" ON playlist_songs;
CREATE POLICY "Allow full access to playlist_songs" ON playlist_songs FOR ALL USING (true) WITH CHECK (true);

-- LIKES
DROP POLICY IF EXISTS "Allow full access to likes" ON likes;
CREATE POLICY "Allow full access to likes" ON likes FOR ALL USING (true) WITH CHECK (true);

-- RECENTLY_PLAYED
DROP POLICY IF EXISTS "Allow full access to recently_played" ON recently_played;
CREATE POLICY "Allow full access to recently_played" ON recently_played FOR ALL USING (true) WITH CHECK (true);

-- USERS
DROP POLICY IF EXISTS "Allow full access to users" ON users;
CREATE POLICY "Allow full access to users" ON users FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- 3. Create Storage Buckets (if not exists)
--    Run these one by one if they fail
-- ============================================================
INSERT INTO storage.buckets (id, name, public) VALUES ('music', 'music', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('covers', 'covers', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('artists', 'artists', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('videos', 'videos', true) ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 4. Storage Policies — allow uploads and reads
-- ============================================================
-- Drop existing storage policies if any
DROP POLICY IF EXISTS "Allow public read on music" ON storage.objects;
DROP POLICY IF EXISTS "Allow public upload on music" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read on covers" ON storage.objects;
DROP POLICY IF EXISTS "Allow public upload on covers" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read on artists" ON storage.objects;
DROP POLICY IF EXISTS "Allow public upload on artists" ON storage.objects;
DROP POLICY IF EXISTS "Allow all on music" ON storage.objects;
DROP POLICY IF EXISTS "Allow all on covers" ON storage.objects;
DROP POLICY IF EXISTS "Allow all on artists" ON storage.objects;

-- Music bucket
CREATE POLICY "Allow all on music" ON storage.objects FOR ALL USING (bucket_id = 'music') WITH CHECK (bucket_id = 'music');

-- Covers bucket
CREATE POLICY "Allow all on covers" ON storage.objects FOR ALL USING (bucket_id = 'covers') WITH CHECK (bucket_id = 'covers');

-- Artists bucket
CREATE POLICY "Allow all on artists" ON storage.objects FOR ALL USING (bucket_id = 'artists') WITH CHECK (bucket_id = 'artists');

-- Videos bucket
DROP POLICY IF EXISTS "Allow all on videos" ON storage.objects;
CREATE POLICY "Allow all on videos" ON storage.objects FOR ALL USING (bucket_id = 'videos') WITH CHECK (bucket_id = 'videos');
