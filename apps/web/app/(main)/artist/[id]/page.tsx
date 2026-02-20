'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { supabase } from '@gmusic/database';
import type { Artist, Song, Album } from '@gmusic/database';
import SongRow from '@/components/ui/SongRow';
import SongCard from '@/components/cards/SongCard';
import AlbumCard from '@/components/cards/AlbumCard';
import { IoPlaySharp, IoShuffle, IoPersonSharp, IoHeart, IoTimeOutline } from 'react-icons/io5';
import { usePlayerStore } from '@/store/playerStore';

// ============================================================
// Artist Page — Hero header, popular songs, albums, about
// ============================================================

const USER_ID = '00000000-0000-4000-a000-000000000001';

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
        async function fetchData() {
            setLoading(true);
            try {
                const [artistRes, songsRes, albumsRes, followRes] = await Promise.all([
                    supabase.from('artists').select('*').eq('id', id).single(),
                    supabase.from('songs').select('*, artist:artists(*), album:albums(*)').eq('artist_id', id).order('plays', { ascending: false }),
                    supabase.from('albums').select('*').eq('artist_id', id).order('release_date', { ascending: false }),
                    (supabase.from('follows') as any).select('id').eq('user_id', USER_ID).eq('artist_id', id).maybeSingle(),
                ]);

                if ((artistRes as any).data) setArtist((artistRes as any).data as any);
                if ((songsRes as any).data) setSongs((songsRes as any).data as any);
                if ((albumsRes as any).data) setAlbums((albumsRes as any).data as any);
                setIsFollowing(!!(followRes.data as any));
            } catch (error) {
                console.error('Error fetching artist:', error);
            } finally {
                setLoading(false);
            }
        }

        fetchData();

        // Real-time listener for play count updates
        const channel = supabase
            .channel(`artist_songs_updates_${id}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'songs',
                    filter: `artist_id=eq.${id}`
                },
                (payload: any) => {
                    setSongs((currentSongs) => {
                        const updatedSongs = currentSongs.map((s) =>
                            s.id === payload.new.id ? { ...s, plays: payload.new.plays } : s
                        );
                        return [...updatedSongs].sort((a, b) => (b.plays || 0) - (a.plays || 0));
                    });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [id]);

    const handleFollow = async () => {
        if (isFollowing) {
            setIsFollowing(false);
            const { error } = await supabase.from('follows').delete().eq('user_id', USER_ID).eq('artist_id', id);
            if (error) { console.error('Unfollow error:', error); setIsFollowing(true); }
        } else {
            setIsFollowing(true);
            const { error } = await (supabase.from('follows') as any).insert({ user_id: USER_ID, artist_id: id });
            if (error) { console.error('Follow error:', error); setIsFollowing(false); }
        }
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
            <div className="relative h-[400px] w-[calc(100%+2rem)] md:w-[calc(100%+3rem)] overflow-hidden -mx-4 md:-mx-6 rounded-t-[40px] shadow-2xl bg-[#181818]">
                {/* Background image */}
                <div className="absolute inset-0">
                    {artist.image_url ? (
                        <Image
                            src={artist.image_url}
                            alt={artist.name}
                            fill
                            className="object-cover object-center"
                            sizes="100vw"
                            quality={100}
                            priority
                        />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-[#c68cfa]/40 to-[#0f0f0f]" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f0f] via-[#0f0f0f]/30 to-transparent" />
                </div>

                {/* Artist info */}
                <div className="absolute bottom-0 left-0 right-0 px-8 pb-10 flex flex-col items-start justify-center text-left gap-1">
                    <p className="text-[9px] md:text-xs font-black text-white uppercase tracking-[3px] flex items-center gap-2 drop-shadow-md opacity-90">
                        <span className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center shadow-lg">
                            <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                            </svg>
                        </span>
                        Doğrulanmış Sanatçı
                    </p>
                    <h1 className="text-5xl md:text-8xl font-black text-white drop-shadow-2xl tracking-tighter italic leading-none">{artist.name}</h1>
                    <p className="text-xs md:text-sm font-bold text-white/80 drop-shadow-md flex items-center gap-2 mt-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#c68cfa] shadow-[0_0_10px_rgba(198,140,250,0.5)]" />
                        {(artist.monthly_listeners || 0).toLocaleString()} aylık dinleyici
                    </p>
                </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-6 px-8">
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

            <div className="px-8 space-y-8">
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

                {/* Singles */}
                {songs.filter(s => !s.album_id).length > 0 && (
                    <section>
                        <h2 className="text-xl font-bold text-white mb-4">Singlelar</h2>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
                            {songs.filter(s => !s.album_id).map((song) => (
                                <SongCard
                                    key={song.id}
                                    song={song}
                                    songs={songs.filter(s => !s.album_id)}
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
        </div>
    );
}

