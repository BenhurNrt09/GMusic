'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@gmusic/database';
import type { Song, Artist, Album } from '@gmusic/database';
import { IoSearch, IoClose } from 'react-icons/io5';
import SongCard from '@/components/cards/SongCard';
import ArtistCard from '@/components/cards/ArtistCard';
import AlbumCard from '@/components/cards/AlbumCard';
import SongRow from '@/components/ui/SongRow';

// ============================================================
// Search Page — Real-time search with results grid
// ============================================================

// Genre/category cards for browse section
const browseCategories = [
    { title: 'Pop', gradient: 'from-pink-500 to-rose-600' },
    { title: 'Hip-Hop', gradient: 'from-orange-500 to-red-600' },
    { title: 'Rock', gradient: 'from-red-600 to-red-900' },
    { title: 'Elektronik', gradient: 'from-cyan-500 to-blue-600' },
    { title: 'Caz', gradient: 'from-amber-600 to-yellow-800' },
    { title: 'Klasik', gradient: 'from-violet-500 to-purple-800' },
    { title: 'R&B', gradient: 'from-emerald-500 to-green-800' },
    { title: 'Indie', gradient: 'from-teal-500 to-cyan-800' },
    { title: 'Türkçe', gradient: 'from-yellow-500 to-amber-700' },
    { title: 'Metal', gradient: 'from-gray-600 to-gray-900' },
    { title: 'Lo-Fi', gradient: 'from-indigo-400 to-purple-600' },
    { title: 'Spor', gradient: 'from-[#c68cfa] to-purple-700' },
];

export default function SearchPage() {
    const [query, setQuery] = useState('');
    const [songs, setSongs] = useState<Song[]>([]);
    const [artists, setArtists] = useState<Artist[]>([]);
    const [albums, setAlbums] = useState<Album[]>([]);
    const [loading, setLoading] = useState(false);

    // Debounced search
    const search = useCallback(async (q: string) => {
        if (!q.trim()) {
            setSongs([]);
            setArtists([]);
            setAlbums([]);
            return;
        }

        setLoading(true);
        try {
            const [songsRes, artistsRes, albumsRes] = await Promise.all([
                supabase
                    .from('songs')
                    .select('*, artist:artists(*)')
                    .ilike('title', `%${q}%`)
                    .limit(12),
                supabase
                    .from('artists')
                    .select('*')
                    .ilike('name', `%${q}%`)
                    .limit(6),
                supabase
                    .from('albums')
                    .select('*, artist:artists(*)')
                    .ilike('title', `%${q}%`)
                    .limit(6),
            ]);

            if (songsRes.data) setSongs(songsRes.data as unknown as Song[]);
            if (artistsRes.data) setArtists(artistsRes.data as Artist[]);
            if (albumsRes.data) setAlbums(albumsRes.data as unknown as Album[]);
        } catch (error) {
            console.error('Search error:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const timeout = setTimeout(() => search(query), 300);
        return () => clearTimeout(timeout);
    }, [query, search]);

    const hasResults = songs.length > 0 || artists.length > 0 || albums.length > 0;

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Search input */}
            <div className="relative max-w-xl">
                <IoSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl" />
                <input
                    type="text"
                    placeholder="Ne dinlemek istiyorsun?"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="w-full pl-12 pr-12 py-3.5 bg-white/10 border border-white/5 rounded-full text-white placeholder-gray-500 focus:outline-none focus:border-[#c68cfa] focus:bg-white/15 transition-all text-sm"
                />
                {query && (
                    <button
                        onClick={() => setQuery('')}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                    >
                        <IoClose className="text-xl" />
                    </button>
                )}
            </div>

            {/* Results or Browse */}
            {query.trim() ? (
                <>
                    {loading && (
                        <div className="flex items-center gap-3 text-gray-400">
                            <div className="w-5 h-5 border-2 border-[#c68cfa] border-t-transparent rounded-full animate-spin" />
                            <span className="text-sm">Aranıyor...</span>
                        </div>
                    )}

                    {!loading && !hasResults && (
                        <div className="text-center py-20">
                            <h3 className="text-xl font-bold text-white mb-2">Sonuç bulunamadı</h3>
                            <p className="text-gray-400 text-sm">Farklı anahtar kelimeler deneyin veya aşağıdaki kategorilere göz atın</p>
                        </div>
                    )}

                    {/* Artists results */}
                    {artists.length > 0 && (
                        <section>
                            <h2 className="text-xl font-bold text-white mb-4">Sanatçılar</h2>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
                                {artists.map((artist) => (
                                    <ArtistCard
                                        key={artist.id}
                                        id={artist.id}
                                        name={artist.name}
                                        image_url={artist.image_url}
                                    />
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Songs results */}
                    {songs.length > 0 && (
                        <section>
                            <h2 className="text-xl font-bold text-white mb-4">Şarkılar</h2>
                            <div className="space-y-1">
                                {songs.map((song, i) => (
                                    <SongRow key={song.id} song={song} index={i} songs={songs} showCover showAlbum />
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Albums results */}
                    {albums.length > 0 && (
                        <section>
                            <h2 className="text-xl font-bold text-white mb-4">Albümler</h2>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
                                {albums.map((album) => (
                                    <AlbumCard
                                        key={album.id}
                                        id={album.id}
                                        title={album.title}
                                        cover_url={album.cover_url}
                                        artist_name={album.artist?.name}
                                    />
                                ))}
                            </div>
                        </section>
                    )}
                </>
            ) : (
                /* Browse categories */
                <section>
                    <h2 className="text-xl font-bold text-white mb-4">Tümüne Göz At</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {browseCategories.map((cat) => (
                            <button
                                key={cat.title}
                                onClick={() => setQuery(cat.title)}
                                className={`relative h-32 rounded-xl overflow-hidden bg-gradient-to-br ${cat.gradient} p-4 text-left hover:scale-[1.02] transition-transform duration-200`}
                            >
                                <span className="text-lg font-bold text-white">{cat.title}</span>
                            </button>
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
}
