'use client';

import React from 'react';
import Image from 'next/image';
import { IoPlaySharp, IoPauseSharp, IoMusicalNote } from 'react-icons/io5';
import { usePlayerStore } from '@/store/playerStore';

// ============================================================
// MiniPlayer — Compact player bar above bottom nav (mobile)
// ============================================================

export default function MiniPlayer() {
    const { currentSong, isPlaying, togglePlay, progress, duration } = usePlayerStore();

    if (!currentSong) return null;

    const progressPercent = duration > 0 ? (progress / duration) * 100 : 0;

    return (
        <div className="flex md:hidden flex-col bg-[#282828] mx-2 rounded-lg overflow-hidden">
            {/* Song info + controls */}
            <div className="flex items-center gap-3 px-3 py-2">
                {/* Cover */}
                <div className="relative w-10 h-10 rounded overflow-hidden flex-shrink-0">
                    {currentSong.cover_url ? (
                        <Image
                            src={currentSong.cover_url}
                            alt={currentSong.title}
                            fill
                            className="object-cover"
                        />
                    ) : (
                        <div className="w-full h-full bg-white/10 flex items-center justify-center">
                            <IoMusicalNote className="text-white/50" />
                        </div>
                    )}
                </div>

                {/* Title + Artist */}
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white line-clamp-1">{currentSong.title}</p>
                    <p className="text-xs text-gray-400 line-clamp-1">{currentSong.artist?.name || 'Bilinmiyor'}</p>
                </div>

                {/* Play/Pause */}
                <button
                    onClick={togglePlay}
                    className="w-8 h-8 flex items-center justify-center"
                >
                    {isPlaying ? (
                        <IoPauseSharp className="text-white text-xl" />
                    ) : (
                        <IoPlaySharp className="text-white text-xl" />
                    )}
                </button>
            </div>

            {/* Progress bar */}
            <div className="h-0.5 bg-white/10">
                <div
                    className="h-full bg-white transition-all duration-200"
                    style={{ width: `${progressPercent}%` }}
                />
            </div>
        </div>
    );
}
