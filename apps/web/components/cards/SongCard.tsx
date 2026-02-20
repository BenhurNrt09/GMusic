'use client';

import React from 'react';
import Image from 'next/image';
import { IoPlaySharp } from 'react-icons/io5';
import type { Song } from '@gmusic/database';
import { usePlayerStore } from '@/store/playerStore';

// ============================================================
// SongCard — Card with hover play button for song grids
// ============================================================

interface SongCardProps {
    song: Song;
    songs?: Song[];
}

export default function SongCard({ song, songs }: SongCardProps) {
    const { playSong, currentSong, isPlaying, togglePlay } = usePlayerStore();

    const isCurrentSong = currentSong?.id === song.id;

    const handlePlay = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isCurrentSong) {
            togglePlay();
        } else {
            // Pass the songs array if available, otherwise just the single song
            playSong(song, songs || [song]);
        }
    };

    return (
        <div className="bg-[#181818] rounded-2xl p-4 hover:bg-[#282828] transition-all duration-300 cursor-pointer group">
            {/* Cover image */}
            <div className="relative w-full aspect-square rounded-xl overflow-hidden mb-3 shadow-lg shadow-black/40">
                {song.cover_url ? (
                    <Image
                        src={song.cover_url}
                        alt={song.title}
                        fill
                        className="object-cover"
                    />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[#c68cfa]/30 to-purple-900/20 flex items-center justify-center">
                        <IoPlaySharp className="text-4xl text-white/30" />
                    </div>
                )}

                {/* Play button overlay */}
                <button
                    onClick={handlePlay}
                    className={`absolute bottom-2 right-2 w-12 h-12 bg-[#c68cfa] rounded-full flex items-center justify-center shadow-xl shadow-black/40 transition-all duration-300
            ${isCurrentSong && isPlaying ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0'}
            hover:bg-[#d4a5fb] hover:scale-105`}
                >
                    <IoPlaySharp className="text-white text-xl ml-0.5" />
                </button>
            </div>

            {/* Info */}
            <h3 className="text-sm font-semibold text-white line-clamp-1 mb-1">{song.title}</h3>
            <p className="text-xs text-gray-400 line-clamp-2">
                {song.artist?.name || 'Bilinmeyen Sanatçı'}
            </p>
        </div>
    );
}
