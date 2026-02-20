'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@gmusic/database';
import type { Song } from '@gmusic/database';
import SongRow from '@/components/ui/SongRow';
import { IoMusicalNotes, IoPlaySharp, IoTimeOutline, IoShuffle } from 'react-icons/io5';
import { usePlayerStore } from '@/store/playerStore';

// ============================================================
// Dynamic Mix Page — Generated random playlists
// ============================================================

export default function MixPage() {
    const params = useParams();
    const slug = params.slug as string;
    const [songs, setSongs] = useState<Song[]>([]);
    const [loading, setLoading] = useState(true);
    const { playSong } = usePlayerStore();

    // Mapping slugs to human readable titles and discovery styles
    const mixInfo: Record<string, { title: string, gradient: string, icon: React.ElementType }> = {
        'daily-mix-1': {
            title: 'Daily Mix 1',
            gradient: 'from-[#c68cfa] to-purple-800',
            icon: IoMusicalNotes
        },
        'discover-weekly': {
            title: 'Discover Weekly',
            gradient: 'from-emerald-500 to-teal-700',
            icon: IoShuffle
        }
    };

    const currentMix = mixInfo[slug] || {
        title: slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
        gradient: 'from-gray-700 to-gray-900',
        icon: IoMusicalNotes
    };

    useEffect(() => {
        async function fetchRandomSongs() {
            setLoading(true);
            try {
                // Fetch random songs using a technique that works without custom RPC first
                // If it becomes a performance issue, we can add a postgres function
                const { data, error } = await supabase
                    .from('songs')
                    .select('*, artist:artists(*), album:albums(*)')
                    .limit(50); // Get more than needed to shuffle

                if (error) throw error;

                if (data) {
                    // Shuffle in JavaScript for randomness
                    const shuffled = [...data].sort(() => 0.5 - Math.random());
                    setSongs(shuffled.slice(0, 20));
                }
            } catch (error) {
                console.error('Error fetching mix songs:', error);
            } finally {
                setLoading(false);
            }
        }

        fetchRandomSongs();
    }, [slug]);

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Gradient header */}
            <div className={`bg-gradient-to-b ${currentMix.gradient.replace('from-', 'from-').replace('to-', 'to-')}/50 to-transparent -mx-6 -mt-[72px] px-6 pt-24 pb-8`}>
                <div className="flex items-end gap-6 text-white">
                    <div className={`w-48 h-48 sm:w-60 sm:h-60 rounded-xl bg-gradient-to-br ${currentMix.gradient} flex items-center justify-center shadow-2xl flex-shrink-0 animate-scale-in`}>
                        <currentMix.icon className="text-white text-7xl" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-gray-300 uppercase tracking-widest mb-2">Senin İçin Hazırlandı</p>
                        <h1 className="text-4xl sm:text-6xl font-black mb-4 tracking-tighter">{currentMix.title}</h1>
                        <p className="text-sm text-gray-300 font-medium">GMusic tarafından hazırlanan özel seçki • {songs.length} şarkı</p>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-6">
                <button
                    onClick={() => songs.length > 0 && playSong(songs[0], songs)}
                    className="w-14 h-14 bg-[#c68cfa] rounded-full flex items-center justify-center hover:bg-[#d4a5fb] hover:scale-105 transition-all shadow-xl shadow-purple-500/30 group"
                >
                    <IoPlaySharp className="text-white text-2xl ml-1 group-active:scale-90" />
                </button>
            </div>

            {/* Song list header */}
            <div className="flex items-center gap-4 px-4 py-2 border-b border-white/10 text-[11px] text-gray-400 font-bold uppercase tracking-widest">
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
                <div className="space-y-3 px-2">
                    {Array.from({ length: 10 }).map((_, i) => (
                        <div key={i} className="h-14 bg-white/5 animate-pulse rounded-lg" />
                    ))}
                </div>
            ) : (
                <div className="space-y-1">
                    {songs.map((song, i) => (
                        <SongRow key={song.id} song={song} index={i} songs={songs} showCover showAlbum />
                    ))}
                </div>
            )}

            {songs.length === 0 && !loading && (
                <div className="text-center py-20 bg-white/5 rounded-2xl border border-white/5 mx-4">
                    <IoMusicalNotes className="text-5xl text-gray-600 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">Seçki oluşturulamadı</h3>
                    <p className="text-gray-400">Daha fazla şarkı eklendiğinde burada görünecektir.</p>
                </div>
            )}
        </div>
    );
}
