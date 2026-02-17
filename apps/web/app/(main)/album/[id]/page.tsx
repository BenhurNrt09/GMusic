'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { supabase } from '@gmusic/database';
import type { Album, Song } from '@gmusic/database';
import SongRow from '@/components/ui/SongRow';
import { IoPlaySharp, IoTimeOutline, IoMusicalNotes, IoShuffle } from 'react-icons/io5';
import { usePlayerStore } from '@/store/playerStore';

// ============================================================
// Album Page — Cover, song list, play controls
// ============================================================

export default function AlbumPage() {
    const params = useParams();
    const id = params.id as string;

    const [album, setAlbum] = useState<Album | null>(null);
    const [songs, setSongs] = useState<Song[]>([]);
    const [loading, setLoading] = useState(true);
    const { playSong, shuffle, toggleShuffle } = usePlayerStore();

    useEffect(() => {
        async function fetchAlbum() {
            setLoading(true);
            try {
                const [albumRes, songsRes] = await Promise.all([
                    supabase.from('albums').select('*, artist:artists(*)').eq('id', id).single(),
                    supabase.from('songs').select('*, artist:artists(*), album:albums(*)').eq('album_id', id).order('created_at'),
                ]);

                if (albumRes.data) setAlbum(albumRes.data as any);
                if (songsRes.data) setSongs(songsRes.data as any);
            } catch (error) {
                console.error('Error fetching album:', error);
            } finally {
                setLoading(false);
            }
        }

        fetchAlbum();
    }, [id]);

    if (loading) {
        return (
            <div className="animate-pulse space-y-6">
                <div className="flex gap-6">
                    <div className="w-60 h-60 bg-white/10 rounded-xl" />
                    <div className="space-y-3 flex-1">
                        <div className="h-4 bg-white/10 rounded w-20" />
                        <div className="h-10 bg-white/10 rounded w-64" />
                        <div className="h-4 bg-white/10 rounded w-48" />
                    </div>
                </div>
            </div>
        );
    }

    if (!album) {
        return (
            <div className="text-center py-20">
                <h2 className="text-xl font-bold text-white">Albüm bulunamadı</h2>
            </div>
        );
    }

    const totalDuration = songs.reduce((acc, s) => acc + (s.duration || 0), 0);
    const formatTotalDuration = (seconds: number) => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        return hrs > 0 ? `${hrs} sa ${mins} dk` : `${mins} dk`;
    };

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-6">
                <div className="relative w-48 h-48 sm:w-60 sm:h-60 rounded-xl overflow-hidden shadow-2xl shadow-black/60 flex-shrink-0">
                    {album.cover_url ? (
                        <Image src={album.cover_url} alt={album.title} fill className="object-cover" priority />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-purple-600/30 to-blue-600/20 flex items-center justify-center">
                            <IoMusicalNotes className="text-6xl text-white/20" />
                        </div>
                    )}
                </div>

                <div>
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Albüm</p>
                    <h1 className="text-4xl sm:text-5xl font-black text-white mb-4">{album.title}</h1>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                        {album.artist && (
                            <Link href={`/artist/${album.artist_id}`} className="text-white font-semibold hover:underline">
                                {album.artist.name}
                            </Link>
                        )}
                        <span>•</span>
                        <span>{album.release_date ? new Date(album.release_date).getFullYear() : ''}</span>
                        <span>•</span>
                        <span>{songs.length} şarkı, {formatTotalDuration(totalDuration)}</span>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-6">
                <button
                    onClick={() => songs.length > 0 && playSong(songs[0], songs)}
                    className="w-14 h-14 bg-[#c68cfa] rounded-full flex items-center justify-center hover:bg-[#d4a5fb] hover:scale-105 transition-all shadow-xl shadow-purple-500/30"
                >
                    <IoPlaySharp className="text-white text-2xl ml-1" />
                </button>
                <button
                    onClick={() => {
                        if (songs.length === 0) return;
                        if (!shuffle) toggleShuffle();
                        const randomIndex = Math.floor(Math.random() * songs.length);
                        playSong(songs[randomIndex], songs);
                    }}
                    className={`transition-colors ${shuffle ? 'text-[#c68cfa]' : 'text-gray-400 hover:text-[#c68cfa]'}`}
                    title="Karışık Çal"
                >
                    <IoShuffle className="text-2xl" />
                </button>
            </div>

            {/* Song list header */}
            <div className="flex items-center gap-4 px-4 py-2 border-b border-white/10 text-xs text-gray-400 font-medium uppercase tracking-wider">
                <span className="w-8 text-center">#</span>
                <span className="flex-1">Başlık</span>
                <span className="w-12"></span>
                <span className="hidden sm:block w-[80px] text-right">Dinlenme</span>
                <div className="w-[60px] flex justify-end">
                    <IoTimeOutline className="text-base" />
                </div>
            </div>

            {/* Songs */}
            <div className="space-y-1">
                {songs.map((song, i) => (
                    <SongRow key={song.id} song={song} index={i} songs={songs} showCover />
                ))}
            </div>
        </div>
    );
}
