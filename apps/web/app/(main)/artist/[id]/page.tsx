'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { supabase } from '@gmusic/database';
import type { Artist, Song, Album } from '@gmusic/database';
import SongRow from '@/components/ui/SongRow';
import AlbumCard from '@/components/cards/AlbumCard';
import { IoPlaySharp, IoShuffle, IoPersonSharp, IoHeart, IoTimeOutline } from 'react-icons/io5';
import { usePlayerStore } from '@/store/playerStore';

// ============================================================
// Artist Page — Hero header, popular songs, albums, about
// ============================================================

const FOLLOWED_KEY = 'gmusic_followed_artists';

function getFollowedArtists(): string[] {
    try {
        return JSON.parse(localStorage.getItem(FOLLOWED_KEY) || '[]');
    } catch { return []; }
}

function toggleFollowArtist(id: string): boolean {
    const followed = getFollowedArtists();
    const index = followed.indexOf(id);
    if (index >= 0) {
        followed.splice(index, 1);
        localStorage.setItem(FOLLOWED_KEY, JSON.stringify(followed));
        return false;
    } else {
        followed.push(id);
        localStorage.setItem(FOLLOWED_KEY, JSON.stringify(followed));
        return true;
    }
}

export default function ArtistPage() {
    const params = useParams();
    const id = params.id as string;

    const [artist, setArtist] = useState<Artist | null>(null);
    const [songs, setSongs] = useState<Song[]>([]);
    const [albums, setAlbums] = useState<Album[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAllSongs, setShowAllSongs] = useState(false);
    const [isFollowing, setIsFollowing] = useState(false);
    const { playSong, toggleShuffle, shuffle } = usePlayerStore();

    useEffect(() => {
        setIsFollowing(getFollowedArtists().includes(id));

        async function fetchArtist() {
            setLoading(true);
            try {
                const [artistRes, songsRes, albumsRes] = await Promise.all([
                    supabase.from('artists').select('*').eq('id', id).single(),
                    supabase.from('songs').select('*, artist:artists(*), album:albums(*)').eq('artist_id', id).order('plays', { ascending: false }),
                    supabase.from('albums').select('*').eq('artist_id', id).order('release_date', { ascending: false }),
                ]);

                if (artistRes.data) setArtist(artistRes.data as any);
                if (songsRes.data) setSongs(songsRes.data as any);
                if (albumsRes.data) setAlbums(albumsRes.data as any);
            } catch (error) {
                console.error('Error fetching artist:', error);
            } finally {
                setLoading(false);
            }
        }

        fetchArtist();
    }, [id]);

    const handleFollow = () => {
        const nowFollowing = toggleFollowArtist(id);
        setIsFollowing(nowFollowing);
    };

    const handleShuffle = () => {
        if (songs.length === 0) return;
        // Enable shuffle if not already on
        if (!shuffle) toggleShuffle();
        // Pick a random song to start
        const randomIndex = Math.floor(Math.random() * songs.length);
        playSong(songs[randomIndex], songs);
    };

    if (loading) {
        return (
            <div className="animate-pulse space-y-6">
                <div className="h-80 bg-white/5 rounded-xl" />
                <div className="h-8 bg-white/10 rounded w-48" />
                <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="h-12 bg-white/5 rounded-lg" />
                    ))}
                </div>
            </div>
        );
    }

    if (!artist) {
        return (
            <div className="text-center py-20">
                <h2 className="text-xl font-bold text-white">Sanatçı bulunamadı</h2>
            </div>
        );
    }

    const displayedSongs = showAllSongs ? songs : songs.slice(0, 5);

    return (
        <div className="space-y-8 animate-fade-in -mt-[72px]">
            {/* Hero header */}
            <div className="relative h-[400px] w-full overflow-hidden">
                {/* Background image */}
                <div className="absolute inset-0">
                    {artist.image_url ? (
                        <Image
                            src={artist.image_url}
                            alt={artist.name}
                            fill
                            className="object-cover object-top"
                            sizes="100vw"
                            quality={90}
                            priority
                        />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-[#c68cfa]/40 to-[#0f0f0f]" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f0f] via-[#0f0f0f]/40 to-transparent" />
                </div>

                {/* Artist info */}
                <div className="absolute bottom-0 left-0 right-0 px-6 pb-6">
                    <p className="text-xs font-medium text-white/80 mb-2 flex items-center gap-1">
                        <span className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                            </svg>
                        </span>
                        Doğrulanmış Sanatçı
                    </p>
                    <h1 className="text-5xl sm:text-7xl font-black text-white mb-3">{artist.name}</h1>
                    <p className="text-sm text-gray-300">
                        {(artist.monthly_listeners || 0).toLocaleString()} aylık dinleyici
                    </p>
                </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-6">
                <button
                    onClick={() => songs.length > 0 && playSong(songs[0], songs)}
                    className="w-14 h-14 bg-[#c68cfa] rounded-full flex items-center justify-center hover:bg-[#d4a5fb] hover:scale-105 transition-all shadow-xl shadow-purple-500/30"
                >
                    <IoPlaySharp className="text-white text-2xl ml-1" />
                </button>
                <button
                    onClick={handleFollow}
                    className={`px-6 py-2 border rounded-full text-sm font-semibold transition-all ${isFollowing
                        ? 'border-[#c68cfa] text-[#c68cfa] bg-[#c68cfa]/10 hover:bg-[#c68cfa]/20'
                        : 'border-white/30 text-white hover:border-white'
                        }`}
                >
                    {isFollowing ? 'Takip Ediliyor' : 'Takip Et'}
                </button>
                <button
                    onClick={handleShuffle}
                    className={`transition-colors ${shuffle ? 'text-[#c68cfa]' : 'text-gray-400 hover:text-[#c68cfa]'
                        }`}
                    title="Karışık Çal"
                >
                    <IoShuffle className="text-2xl" />
                </button>
            </div>

            {/* Popular songs */}
            <section>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-white">Popüler</h2>
                </div>

                {/* Song list header */}
                <div className="flex items-center gap-4 px-4 py-2 border-b border-white/10 text-xs text-gray-400 font-medium uppercase tracking-wider mb-2">
                    <span className="w-8 text-center">#</span>
                    <span className="flex-1">Başlık</span>
                    <span className="w-12"></span>
                    <span className="hidden md:block w-[200px]">Albüm</span>
                    <span className="hidden sm:block w-[80px] text-right">Dinlenme</span>
                    <div className="w-[60px] flex justify-end">
                        <IoTimeOutline className="text-base" />
                    </div>
                </div>

                <div className="space-y-1">
                    {displayedSongs.map((song, i) => (
                        <SongRow key={song.id} song={song} index={i} songs={songs} showCover showAlbum />
                    ))}
                </div>
                {songs.length > 5 && (
                    <button
                        onClick={() => setShowAllSongs(!showAllSongs)}
                        className="mt-3 text-sm font-semibold text-gray-400 hover:text-white transition-colors"
                    >
                        {showAllSongs ? 'Daha az göster' : 'Daha fazla göster'}
                    </button>
                )}
            </section>

            {/* Albums */}
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
                                artist_name={artist.name}
                            />
                        ))}
                    </div>
                </section>
            )}

            {/* About */}
            {artist.bio && (
                <section>
                    <h2 className="text-xl font-bold text-white mb-4">Hakkında</h2>
                    <div className="relative max-w-2xl bg-white/5 rounded-2xl p-6 overflow-hidden">
                        {artist.image_url && (
                            <div className="absolute inset-0 opacity-10">
                                <Image src={artist.image_url} alt="" fill className="object-cover blur-3xl" />
                            </div>
                        )}
                        <div className="relative">
                            <p className="text-sm text-gray-300 leading-relaxed">{artist.bio}</p>
                            <p className="text-sm text-white font-medium mt-4">
                                {(artist.monthly_listeners || 0).toLocaleString()} aylık dinleyici
                            </p>
                        </div>
                    </div>
                </section>
            )}
        </div>
    );
}

