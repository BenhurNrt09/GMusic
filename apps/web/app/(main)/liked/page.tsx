'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@gmusic/database';
import type { Song } from '@gmusic/database';
import SongRow from '@/components/ui/SongRow';
import { IoHeart, IoPlaySharp, IoTimeOutline } from 'react-icons/io5';
import { usePlayerStore } from '@/store/playerStore';

// ============================================================
// Liked Songs Page — Liked songs with gradient header
// ============================================================

export default function LikedSongsPage() {
    const [songs, setSongs] = useState<Song[]>([]);
    const [loading, setLoading] = useState(true);
    const { playSong } = usePlayerStore();

    // Hardcoded user ID for the main user (Gülçin Engin)
    const USER_ID = '00000000-0000-4000-a000-000000000001';

    useEffect(() => {
        async function fetchLikedSongs() {
            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from('likes')
                    .select('*, song:songs(*, artist:artists(*), album:albums(*))')
                    .eq('user_id', USER_ID)
                    .order('created_at', { ascending: false });

                if (error) throw error;

                if (data) {
                    const likedSongs = data.map((item: any) => item.song).filter(Boolean);
                    setSongs(likedSongs);
                }
            } catch (error) {
                console.error('Error fetching liked songs:', error);
            } finally {
                setLoading(false);
            }
        }

        fetchLikedSongs();

        // Subscribe to real-time changes
        const channel = supabase
            .channel('liked_songs_sync')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'likes',
                    filter: `user_id=eq.${USER_ID}`
                },
                (payload) => {
                    if (payload.eventType === 'INSERT') {
                        // Small delay to ensure DB records are fully committed and reachable with joins
                        setTimeout(() => fetchLikedSongs(), 500);
                    } else if (payload.eventType === 'DELETE') {
                        // For delete, we can immediately remove from state if we have the song_id
                        const deletedId = payload.old.song_id;
                        if (deletedId) {
                            setSongs(prev => prev.filter(s => s.id !== deletedId));
                        } else {
                            // Fallback to fetch if old data is missing (Replica Identity issues)
                            fetchLikedSongs();
                        }
                    } else {
                        fetchLikedSongs();
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [USER_ID]);

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Gradient header */}
            <div className="bg-gradient-to-b from-purple-800/50 to-transparent -mx-6 -mt-[72px] px-6 pt-24 pb-8">
                <div className="flex items-end gap-6">
                    <div className="w-48 h-48 sm:w-60 sm:h-60 rounded-xl bg-gradient-to-br from-purple-600 to-blue-400 flex items-center justify-center shadow-2xl flex-shrink-0">
                        <IoHeart className="text-white text-7xl" />
                    </div>
                    <div>
                        <p className="text-xs font-medium text-gray-300 uppercase tracking-wider mb-2">Çalma Listesi</p>
                        <h1 className="text-4xl sm:text-5xl font-black text-white mb-4">Beğenilen Şarkılar</h1>
                        <p className="text-sm text-gray-300">{songs.length} şarkı</p>
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

            {loading ? (
                <div className="space-y-3">
                    {Array.from({ length: 10 }).map((_, i) => (
                        <div key={i} className="h-12 bg-white/5 animate-pulse rounded-lg" />
                    ))}
                </div>
            ) : (
                <div className="space-y-1">
                    {songs.map((song, i) => (
                        <SongRow key={song.id} song={song} index={i} songs={songs} showCover showAlbum />
                    ))}
                </div>
            )}
        </div>
    );
}
