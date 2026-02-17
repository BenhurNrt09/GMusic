'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@gmusic/database';
import type { Song, Artist, Album, Playlist } from '@gmusic/database';
import SongCard from '@/components/cards/SongCard';
import ArtistCard from '@/components/cards/ArtistCard';
import AlbumCard from '@/components/cards/AlbumCard';
import PlaylistCard from '@/components/cards/PlaylistCard';
import { IoMusicalNotes, IoDisc, IoPeople, IoList } from 'react-icons/io5';

// ============================================================
// Library Page — User saved content with tabs
// ============================================================

type Tab = 'songs' | 'artists' | 'albums' | 'playlists';

const tabs: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: 'songs', label: 'Şarkılar', icon: IoMusicalNotes },
    { key: 'artists', label: 'Sanatçılar', icon: IoPeople },
    { key: 'albums', label: 'Albümler', icon: IoDisc },
    { key: 'playlists', label: 'Çalma Listeleri', icon: IoList },
];

export default function LibraryPage() {
    const [activeTab, setActiveTab] = useState<Tab>('songs');
    const [songs, setSongs] = useState<Song[]>([]);
    const [artists, setArtists] = useState<Artist[]>([]);
    const [albums, setAlbums] = useState<Album[]>([]);
    const [playlists, setPlaylists] = useState<Playlist[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchLibrary() {
            setLoading(true);
            try {
                const [songsRes, artistsRes, albumsRes, playlistsRes] = await Promise.all([
                    supabase.from('songs').select('*, artist:artists(*)').order('created_at', { ascending: false }).limit(30),
                    supabase.from('artists').select('*').order('name').limit(30),
                    supabase.from('albums').select('*, artist:artists(*)').order('created_at', { ascending: false }).limit(30),
                    supabase.from('playlists').select('*').eq('is_public', true).limit(20),
                ]);

                if (songsRes.data) setSongs(songsRes.data as unknown as Song[]);
                if (artistsRes.data) setArtists(artistsRes.data as Artist[]);
                if (albumsRes.data) setAlbums(albumsRes.data as unknown as Album[]);
                if (playlistsRes.data) setPlaylists(playlistsRes.data as Playlist[]);
            } catch (error) {
                console.error('Library fetch error:', error);
            } finally {
                setLoading(false);
            }
        }

        fetchLibrary();
    }, []);

    return (
        <div className="space-y-6 animate-fade-in">
            <h1 className="text-3xl font-bold text-white">Kitaplığın</h1>

            {/* Tab buttons */}
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-thin pb-2">
                {tabs.map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap ${activeTab === tab.key
                            ? 'bg-[#c68cfa] text-white'
                            : 'bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white'
                            }`}
                    >
                        <tab.icon className="text-base" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content */}
            {loading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
                    {Array.from({ length: 12 }).map((_, i) => (
                        <div key={i} className="animate-pulse">
                            <div className="w-full aspect-square bg-white/10 rounded-xl mb-3" />
                            <div className="h-4 bg-white/10 rounded w-3/4 mb-2" />
                            <div className="h-3 bg-white/10 rounded w-1/2" />
                        </div>
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
                    {activeTab === 'songs' && songs.map((song) => (
                        <SongCard key={song.id} song={song} songs={songs} />
                    ))}
                    {activeTab === 'artists' && artists.map((artist) => (
                        <ArtistCard key={artist.id} id={artist.id} name={artist.name} image_url={artist.image_url} />
                    ))}
                    {activeTab === 'albums' && albums.map((album) => (
                        <AlbumCard key={album.id} id={album.id} title={album.title} cover_url={album.cover_url} artist_name={album.artist?.name} />
                    ))}
                    {activeTab === 'playlists' && playlists.map((pl) => (
                        <PlaylistCard key={pl.id} id={pl.id} title={pl.title} cover_url={pl.cover_url} description={pl.description} />
                    ))}
                </div>
            )}

            {/* Empty state */}
            {!loading && (
                (activeTab === 'songs' && songs.length === 0) ||
                (activeTab === 'artists' && artists.length === 0) ||
                (activeTab === 'albums' && albums.length === 0) ||
                (activeTab === 'playlists' && playlists.length === 0)
            ) && (
                    <div className="text-center py-20">
                        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                            <IoMusicalNotes className="text-3xl text-gray-500" />
                        </div>
                        <h3 className="text-lg font-semibold text-white mb-2">Henüz burada bir şey yok</h3>
                        <p className="text-sm text-gray-400">Keşfetmeye başla ve içerikleri kitaplığına kaydet</p>
                    </div>
                )}
        </div>
    );
}
