'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { IoClose, IoPersonSharp, IoHeart, IoHeartOutline } from 'react-icons/io5';
import { usePlayerStore } from '@/store/playerStore';
import { supabase } from '@gmusic/database';

// ============================================================
// RightPanel — Song/Artist details drawer
// ============================================================

export default function RightPanel() {
    const { currentSong, isRightPanelOpen, setRightPanelOpen, toggleRightPanel, isPlaying, togglePlay } = usePlayerStore();
    const [isLiked, setIsLiked] = useState(false);

    // Hardcoded user ID for the main user (Gülçin Engin)
    const USER_ID = '00000000-0000-4000-a000-000000000001';

    useEffect(() => {
        async function checkLiked() {
            if (!currentSong) return;
            const { data } = await supabase.from('likes').select('id').eq('song_id', currentSong.id).eq('user_id', USER_ID).single();
            setIsLiked(!!data);
        }
        checkLiked();
    }, [currentSong?.id, USER_ID]);

    const handleLikeToggle = async () => {
        if (!currentSong) return;

        if (isLiked) {
            setIsLiked(false);
            const { error } = await supabase.from('likes').delete().eq('user_id', USER_ID).eq('song_id', currentSong.id);
            if (error) {
                console.error('Error removing like:', error);
                setIsLiked(true);
            }
        } else {
            setIsLiked(true);
            const { error } = await (supabase.from('likes') as any).insert({ user_id: USER_ID, song_id: currentSong.id });
            if (error) {
                console.error('Error adding like:', error);
                setIsLiked(false);
            }
        }
    };

    if (!isRightPanelOpen || !currentSong) return null;

    return (
        <>
            {/* Backdrop for mobile */}
            <div
                className="fixed inset-0 bg-black/40 z-30 lg:hidden"
                onClick={() => setRightPanelOpen(false)}
            />

            {/* Panel */}
            <aside className="w-[340px] h-full bg-[#121212] border-l border-white/5 flex flex-col animate-slide-right overflow-y-auto scrollbar-thin fixed right-0 top-0 bottom-[90px] z-40 lg:relative lg:z-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-5 sticky top-0 bg-[#121212]/90 backdrop-blur-lg z-10">
                    <h2 className="text-sm font-bold text-white">
                        {currentSong.artist?.name || 'Şimdi Çalıyor'}
                    </h2>
                    <button
                        onClick={() => setRightPanelOpen(false)}
                        className="text-gray-400 hover:text-white transition-colors"
                    >
                        <IoClose className="text-xl" />
                    </button>
                </div>

                {/* Cover image */}
                <div className="px-5 mb-4">
                    <div className="relative w-full aspect-square rounded-xl overflow-hidden shadow-2xl">
                        {currentSong.cover_url ? (
                            <Image
                                src={currentSong.cover_url}
                                alt={currentSong.title}
                                fill
                                className="object-cover"
                            />
                        ) : currentSong.album?.cover_url ? (
                            <Image
                                src={currentSong.album.cover_url}
                                alt={currentSong.album.title}
                                fill
                                className="object-cover"
                            />
                        ) : currentSong.artist?.image_url ? (
                            <Image
                                src={currentSong.artist.image_url}
                                alt={currentSong.artist.name}
                                fill
                                className="object-cover"
                            />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-br from-[#c68cfa]/30 to-[#9d50bb]/10 flex items-center justify-center">
                                <IoPersonSharp className="text-6xl text-white/20" />
                            </div>
                        )}
                    </div>
                </div>

                {/* Song info */}
                <div className="px-5 mb-6 flex items-start justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-white mb-1">{currentSong.title}</h3>
                        <Link
                            href={`/artist/${currentSong.artist_id}`}
                            className="text-sm text-gray-400 hover:text-white hover:underline transition-colors"
                        >
                            {currentSong.artist?.name || 'Bilinmeyen Sanatçı'}
                        </Link>
                    </div>
                    <button
                        onClick={handleLikeToggle}
                        className={`transition-colors duration-200 mt-1 p-2 -m-2 ${isLiked ? 'text-[#c68cfa]' : 'text-gray-400 hover:text-white'} relative z-10`}
                        title={isLiked ? "Beğenmekten Vazgeç" : "Beğen"}
                    >
                        {isLiked ? <IoHeart className="text-2xl" /> : <IoHeartOutline className="text-2xl" />}
                    </button>
                </div>

                {/* Artist section */}
                {currentSong.artist && (
                    <div className="px-5 mb-6">
                        <div className="bg-white/5 rounded-2xl p-4">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="relative w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
                                    {currentSong.artist.image_url ? (
                                        <Image
                                            src={currentSong.artist.image_url}
                                            alt={currentSong.artist.name}
                                            fill
                                            className="object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-white/10 flex items-center justify-center">
                                            <IoPersonSharp className="text-white/50" />
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-white">
                                        {currentSong.artist.name}
                                    </p>
                                    <p className="text-xs text-gray-400">
                                        {(currentSong.artist.monthly_listeners || 0).toLocaleString()} aylık dinleyici
                                    </p>
                                </div>
                            </div>

                            {currentSong.artist.bio && (
                                <p className="text-xs text-gray-400 leading-relaxed line-clamp-3 mb-3">
                                    {currentSong.artist.bio}
                                </p>
                            )}

                            <Link
                                href={`/artist/${currentSong.artist_id}`}
                                className="inline-flex items-center gap-2 text-xs font-semibold text-[#c68cfa] hover:text-[#d4a5fb] transition-colors"
                            >
                                Sanatçı profiline git →
                            </Link>
                        </div>
                    </div>
                )}

                {/* Album section */}
                {currentSong.album && (
                    <div className="px-5 mb-6">
                        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                            Albümden
                        </h4>
                        <Link
                            href={`/album/${currentSong.album_id}`}
                            className="flex items-center gap-3 p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors group"
                        >
                            <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                                {currentSong.album.cover_url ? (
                                    <Image
                                        src={currentSong.album.cover_url}
                                        alt={currentSong.album.title}
                                        fill
                                        className="object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-white/10" />
                                )}
                            </div>
                            <div>
                                <p className="text-sm font-medium text-white group-hover:text-[#c68cfa] transition-colors">
                                    {currentSong.album.title}
                                </p>
                                <p className="text-xs text-gray-400">{currentSong.album.release_date}</p>
                            </div>
                        </Link>
                    </div>
                )}
            </aside>
        </>
    );
}
