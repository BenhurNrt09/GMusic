'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { supabase } from '@gmusic/database';
import type { Playlist, Song, PlaylistSong } from '@gmusic/database';
import SongRow from '@/components/ui/SongRow';
import { IoPlaySharp, IoTimeOutline, IoMusicalNotes, IoShuffle } from 'react-icons/io5';
import { usePlayerStore } from '@/store/playerStore';

// ============================================================
// Playlist Page — Cover, song list, play controls
// ============================================================

export default function PlaylistPage() {
    const params = useParams();
    const id = params.id as string;

    const [playlist, setPlaylist] = useState<Playlist | null>(null);
    const [songs, setSongs] = useState<Song[]>([]);
    const [loading, setLoading] = useState(true);
    const { playSong, shuffle, toggleShuffle } = usePlayerStore();

    useEffect(() => {
        async function fetchPlaylist() {
            setLoading(true);
            try {
                const [playlistRes, songsRes] = await Promise.all([
                    supabase.from('playlists').select('*').eq('id', id).single(),
                    supabase
                        .from('playlist_songs')
                        .select('*, song:songs(*, artist:artists(*), album:albums(*))')
                        .eq('playlist_id', id)
                        .order('position'),
                ]);

                if (playlistRes.data) setPlaylist(playlistRes.data as any);
                if (songsRes.data) {
                    const extracted = (songsRes.data as any[]).map((ps) => ps.song).filter(Boolean);
                    setSongs(extracted as Song[]);
                }
            } catch (error) {
                console.error('Error fetching playlist:', error);
            } finally {
                setLoading(false);
            }
        }

        fetchPlaylist();
    }, [id]);

    if (loading) {
        return (
            <div className="animate-pulse space-y-6">
                <div className="flex gap-6">
                    <div className="w-60 h-60 bg-white/10 rounded-xl" />
                    <div className="space-y-3 flex-1">
                        <div className="h-4 bg-white/10 rounded w-20" />
                        <div className="h-10 bg-white/10 rounded w-64" />
                    </div>
                </div>
            </div>
        );
    }

    if (!playlist) {
        return (
            <div className="text-center py-20">
                <h2 className="text-xl font-bold text-white">Çalma listesi bulunamadı</h2>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-6">
                <div className="relative w-48 h-48 sm:w-60 sm:h-60 rounded-xl overflow-hidden shadow-2xl shadow-black/60 flex-shrink-0">
                    {playlist.cover_url ? (
                        <Image src={playlist.cover_url} alt={playlist.title} fill className="object-cover" priority />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-[#c68cfa]/30 to-purple-900/20 flex items-center justify-center">
                            <IoMusicalNotes className="text-6xl text-white/20" />
                        </div>
                    )}
                </div>

                <div>
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Çalma Listesi</p>
                    <h1 className="text-4xl sm:text-5xl font-black text-white mb-4">{playlist.title}</h1>
                    {playlist.description && (
                        <p className="text-sm text-gray-400 mb-2">{playlist.description}</p>
                    )}
                    <p className="text-sm text-gray-400">{songs.length} şarkı</p>
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
                <span className="hidden md:block w-[200px]">Albüm</span>
                <span className="hidden sm:block w-[80px] text-right">Dinlenme</span>
                <div className="w-[60px] flex justify-end">
                    <IoTimeOutline className="text-base" />
                </div>
            </div>

            {/* Songs */}
            <div className="space-y-1">
                {songs.map((song, i) => (
                    <SongRow key={song.id} song={song} index={i} songs={songs} showCover showAlbum />
                ))}
            </div>
        </div>
    );
}
