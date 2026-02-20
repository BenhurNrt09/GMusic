'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@gmusic/database';
import type { Song, Artist, Album, Playlist } from '@gmusic/database';
import SongCard from '@/components/cards/SongCard';
import ArtistCard from '@/components/cards/ArtistCard';
import AlbumCard from '@/components/cards/AlbumCard';
import PlaylistCard from '@/components/cards/PlaylistCard';
import { IoPlaySharp, IoPersonCircle } from 'react-icons/io5';
import { usePlayerStore } from '@/store/playerStore';

// ============================================================
// Home Page — Spotify-style with mobile-first design
// ============================================================

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
    return (
        <div className="mb-4">
            <h2 className="text-xl md:text-2xl font-bold text-white">{title}</h2>
            {subtitle && <p className="text-sm text-gray-400 mt-1">{subtitle}</p>}
        </div>
    );
}

function QuickPlayCard({ title, image, gradient, onClick }: {
    title: string;
    image?: string | null;
    gradient: string;
    onClick?: () => void;
}) {
    return (
        <button
            onClick={onClick}
            className="flex items-center bg-white/5 hover:bg-white/10 rounded-md overflow-hidden group transition-all duration-300 text-left h-[56px]"
        >
            <div className={`w-14 h-14 flex-shrink-0 ${gradient} flex items-center justify-center`}>
                {image ? (
                    <img src={image} alt={title} className="w-full h-full object-cover" />
                ) : (
                    <IoPlaySharp className="text-white text-xl" />
                )}
            </div>
            <span className="px-3 text-xs sm:text-sm font-semibold text-white flex-1 line-clamp-2">{title}</span>
            <div className="hidden md:flex w-10 h-10 bg-[#c68cfa] rounded-full items-center justify-center mr-3 opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all duration-300 shadow-lg">
                <IoPlaySharp className="text-white ml-0.5" />
            </div>
        </button>
    );
}

function CardSkeleton() {
    return (
        <div className="animate-pulse min-w-[150px]">
            <div className="w-full aspect-square bg-white/10 rounded-xl mb-3" />
            <div className="h-4 bg-white/10 rounded w-3/4 mb-2" />
            <div className="h-3 bg-white/10 rounded w-1/2" />
        </div>
    );
}

// Filter chips for mobile
const filterTabs = ['Tümü', 'Müzik', 'Podcast\'ler'];

import { useRouter } from 'next/navigation';

export default function HomePage() {
    const router = useRouter();
    const [songs, setSongs] = useState<Song[]>([]);
    const [artists, setArtists] = useState<Artist[]>([]);
    const [albums, setAlbums] = useState<Album[]>([]);
    const [playlists, setPlaylists] = useState<Playlist[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState('Tümü');
    const { playSong } = usePlayerStore();

    useEffect(() => {
        async function fetchData() {
            try {
                const [songsRes, artistsRes, albumsRes, playlistsRes] = await Promise.all([
                    supabase.from('songs').select('*, artist:artists(*)').order('plays', { ascending: false }).limit(12),
                    supabase.from('artists').select('*').order('monthly_listeners', { ascending: false }).limit(8),
                    supabase.from('albums').select('*, artist:artists(*)').order('created_at', { ascending: false }).limit(8),
                    supabase.from('playlists').select('*').eq('is_public', true).limit(8),
                ]);
                if (songsRes.data) setSongs(songsRes.data as unknown as Song[]);
                if (artistsRes.data) setArtists(artistsRes.data as Artist[]);
                if (albumsRes.data) setAlbums(albumsRes.data as unknown as Album[]);
                if (playlistsRes.data) setPlaylists(playlistsRes.data as Playlist[]);
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        }
        fetchData();

        // Real-time listener for play count updates
        const channel = supabase
            .channel('home_songs_updates')
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'songs',
                },
                (payload: any) => {
                    setSongs((currentSongs) => {
                        const songExists = currentSongs.some(s => s.id === payload.new.id);
                        if (!songExists) return currentSongs;

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
    }, []);

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 6) return 'İyi geceler, Gülçin';
        if (hour < 12) return 'Günaydın, Gülçin';
        if (hour < 18) return 'İyi öğlenler, Gülçin';
        if (hour < 22) return 'İyi akşamlar, Gülçin';
        return 'İyi geceler, Gülçin';
    };

    return (
        <div className="space-y-6 md:space-y-10 animate-fade-in">
            {/* Mobile header with profile + filter chips */}
            <div className="md:hidden">
                <div className="flex items-center gap-2 mb-4 overflow-x-auto no-scrollbar">
                    {filterTabs.map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveFilter(tab)}
                            className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${activeFilter === tab
                                ? 'bg-white text-black'
                                : 'bg-white/10 text-white'
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            {/* Desktop greeting */}
            <h1 className="hidden md:block text-3xl font-bold text-white">{getGreeting()}</h1>

            {/* Quick-play grid — 2 cols on mobile, 3 on desktop */}
            <section>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 md:gap-3">
                    {loading ? (
                        Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="h-14 bg-white/5 animate-pulse rounded-md" />
                        ))
                    ) : (
                        <>
                            <QuickPlayCard
                                title="Beğenilen Şarkılar"
                                gradient="bg-gradient-to-br from-purple-500 to-blue-400"
                                onClick={() => router.push('/liked')}
                            />
                            <QuickPlayCard
                                title="Daily Mix 1"
                                gradient="bg-gradient-to-br from-[#c68cfa] to-purple-800"
                                onClick={() => router.push('/mix/daily-mix-1')}
                            />
                            <QuickPlayCard
                                title="Discover Weekly"
                                gradient="bg-gradient-to-br from-emerald-500 to-teal-700"
                                onClick={() => router.push('/mix/discover-weekly')}
                            />
                            {songs.slice(0, 3).map(song => (
                                <QuickPlayCard
                                    key={song.id}
                                    title={song.title}
                                    image={song.cover_url}
                                    gradient=""
                                    onClick={() => playSong(song, songs)}
                                />
                            ))}
                        </>
                    )}
                </div>
            </section>

            {/* Bugün için tavsiye — horizontal scroll on mobile, grid on desktop */}
            <section>
                <SectionHeader title="Bugün için tavsiye" />
                {/* Mobile: horizontal scroll */}
                <div className="flex md:hidden gap-4 overflow-x-auto no-scrollbar pb-2">
                    {loading
                        ? Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)
                        : songs.slice(0, 6).map((song) => (
                            <div key={song.id} className="min-w-[150px] max-w-[150px]">
                                <SongCard song={song} songs={songs} />
                            </div>
                        ))
                    }
                </div>
                {/* Desktop: grid */}
                <div className="hidden md:grid grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-5">
                    {loading
                        ? Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)
                        : songs.slice(0, 6).map((song) => (
                            <SongCard key={song.id} song={song} songs={songs} />
                        ))
                    }
                </div>
            </section>

            {/* Popular Artists */}
            <section>
                <SectionHeader title="Popüler Sanatçılar" />
                <div className="flex md:hidden gap-4 overflow-x-auto no-scrollbar pb-2">
                    {loading
                        ? Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)
                        : artists.map((artist) => (
                            <div key={artist.id} className="min-w-[130px] max-w-[130px]">
                                <ArtistCard id={artist.id} name={artist.name} image_url={artist.image_url}
                                    subtitle={`${(artist.monthly_listeners || 0).toLocaleString()} dinleyici`} />
                            </div>
                        ))
                    }
                </div>
                <div className="hidden md:grid grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-5">
                    {loading
                        ? Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)
                        : artists.map((artist) => (
                            <ArtistCard key={artist.id} id={artist.id} name={artist.name} image_url={artist.image_url}
                                subtitle={`${(artist.monthly_listeners || 0).toLocaleString()} listeners`} />
                        ))
                    }
                </div>
            </section>

            {/* Beğendiğin şarkıları içeren albümler */}
            <section>
                <SectionHeader title="Beğendiğin şarkıları içeren albümler" />
                <div className="flex md:hidden gap-4 overflow-x-auto no-scrollbar pb-2">
                    {loading
                        ? Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)
                        : albums.map((album) => (
                            <div key={album.id} className="min-w-[150px] max-w-[150px]">
                                <AlbumCard id={album.id} title={album.title} cover_url={album.cover_url} artist_name={album.artist?.name} />
                            </div>
                        ))
                    }
                </div>
                <div className="hidden md:grid grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-5">
                    {loading
                        ? Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)
                        : albums.map((album) => (
                            <AlbumCard key={album.id} id={album.id} title={album.title} cover_url={album.cover_url} artist_name={album.artist?.name} />
                        ))
                    }
                </div>
            </section>

            {/* Made for You */}
            <section>
                <SectionHeader title="Sana Özel" subtitle="Günlük mixlerin ve playlistlerin" />
                <div className="flex md:hidden gap-4 overflow-x-auto no-scrollbar pb-2">
                    {loading
                        ? Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)
                        : songs.slice(6, 12).map((song) => (
                            <div key={song.id} className="min-w-[150px] max-w-[150px]">
                                <SongCard song={song} songs={songs} />
                            </div>
                        ))
                    }
                </div>
                <div className="hidden md:grid grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-5">
                    {loading
                        ? Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)
                        : songs.slice(6, 12).map((song) => (
                            <SongCard key={song.id} song={song} songs={songs} />
                        ))
                    }
                </div>
            </section>

            {/* Playlists */}
            {playlists.length > 0 && (
                <section>
                    <SectionHeader title="Popüler Playlistler" />
                    <div className="flex md:hidden gap-4 overflow-x-auto no-scrollbar pb-2">
                        {playlists.map((playlist) => (
                            <div key={playlist.id} className="min-w-[150px] max-w-[150px]">
                                <PlaylistCard id={playlist.id} title={playlist.title} cover_url={playlist.cover_url} description={playlist.description} />
                            </div>
                        ))}
                    </div>
                    <div className="hidden md:grid grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-5">
                        {playlists.map((playlist) => (
                            <PlaylistCard key={playlist.id} id={playlist.id} title={playlist.title} cover_url={playlist.cover_url} description={playlist.description} />
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
}
