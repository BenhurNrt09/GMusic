'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { IoPlaySharp, IoPauseSharp, IoHeart, IoHeartOutline } from 'react-icons/io5';
import Link from 'next/link';
import { supabase } from '@gmusic/database';
import type { Song } from '@gmusic/database';
import { usePlayerStore } from '@/store/playerStore';

// ============================================================
// SongRow — Table row for song lists (artist page, album page)
// ============================================================

interface SongRowProps {
    song: Song;
    index: number;
    songs: Song[];
    showCover?: boolean;
    showAlbum?: boolean;
}

export default function SongRow({ song, index, songs, showCover = false, showAlbum = false }: SongRowProps) {
    const { playSong, currentSong, isPlaying, togglePlay } = usePlayerStore();
    const [isLiked, setIsLiked] = useState(false);
    const isCurrentSong = currentSong?.id === song.id;

    // Hardcoded user ID for the main user (Gülçin Engin)
    const USER_ID = '00000000-0000-4000-a000-000000000001';

    useEffect(() => {
        async function checkLikeStatus() {
            const { data } = await supabase
                .from('likes')
                .select('*')
                .eq('user_id', USER_ID)
                .eq('song_id', song.id)
                .single();
            setIsLiked(!!data);
        }
        checkLikeStatus();
    }, [song.id, USER_ID]);

    const handlePlay = () => {
        if (isCurrentSong) {
            togglePlay();
        } else {
            playSong(song, songs);
        }
    };

    const handleLike = async (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();

        if (isLiked) {
            setIsLiked(false);
            const { error } = await supabase.from('likes').delete().eq('user_id', USER_ID).eq('song_id', song.id);
            if (error) {
                console.error('Error removing like:', error);
                setIsLiked(true);
            }
        } else {
            setIsLiked(true);
            const { error } = await (supabase.from('likes') as any).insert({ user_id: USER_ID, song_id: song.id });
            if (error) {
                console.error('Error adding like:', error);
                setIsLiked(false);
            }
        }
    };

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div
            onClick={handlePlay}
            className={`group flex items-center gap-4 px-4 py-2.5 rounded-lg cursor-pointer transition-all duration-200 ${isCurrentSong ? 'bg-white/10' : 'hover:bg-white/5'
                }`}
        >
            {/* Index / Play icon */}
            <div className="w-8 flex items-center justify-center flex-shrink-0">
                <span className={`text-sm tabular-nums group-hover:hidden ${isCurrentSong ? 'text-[#c68cfa]' : 'text-gray-400'}`}>
                    {index + 1}
                </span>
                <button className="hidden group-hover:flex items-center justify-center text-white">
                    {isCurrentSong && isPlaying ? (
                        <IoPauseSharp className="text-lg" />
                    ) : (
                        <IoPlaySharp className="text-lg" />
                    )}
                </button>
            </div>

            {/* Cover (optional) */}
            {showCover && (
                <div className="relative w-10 h-10 rounded overflow-hidden flex-shrink-0">
                    {song.cover_url ? (
                        <Image src={song.cover_url} alt={song.title} fill className="object-cover" />
                    ) : song.album?.cover_url ? (
                        <Image src={song.album.cover_url} alt={song.album.title} fill className="object-cover" />
                    ) : song.artist?.image_url ? (
                        <Image src={song.artist.image_url} alt={song.artist.name} fill className="object-cover" />
                    ) : (
                        <div className="w-full h-full bg-white/10" />
                    )}
                </div>
            )}

            {/* Title + Artist */}
            <div className="flex-1 min-w-0 flex flex-col justify-center">
                <span className={`text-sm font-medium truncate ${isCurrentSong ? 'text-[#c68cfa]' : 'text-white'}`}>
                    {song.title}
                </span>
                <Link
                    href={`/artist/${song.artist_id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="text-xs text-gray-400 truncate hover:text-white hover:underline transition-colors w-fit"
                >
                    {song.artist?.name || 'Bilinmeyen Sanatçı'}
                </Link>
            </div>

            {/* Heart / Like Column */}
            <div className="flex items-center gap-2 w-12 flex-shrink-0 relative z-10" onClick={(e) => e.stopPropagation()}>
                <button
                    onClick={handleLike}
                    className={`p-2 -m-2 transition-colors duration-200 ${isLiked ? 'text-[#c68cfa]' : 'text-white/20 group-hover:text-white/60 hover:!text-white'}`}
                    title={isLiked ? "Beğenmekten Vazgeç" : "Beğen"}
                >
                    {isLiked ? <IoHeart className="text-lg" /> : <IoHeartOutline className="text-lg" />}
                </button>
            </div>

            {/* Album name */}
            {showAlbum && (
                <div className="hidden md:block w-[200px] flex-shrink-0">
                    <p className="text-sm text-gray-400 line-clamp-1">{song.album?.title || '-'}</p>
                </div>
            )}

            {/* Plays */}
            <div className="hidden sm:block w-[80px] flex-shrink-0 text-right">
                <p className="text-sm text-gray-400 tabular-nums">{(song.plays || 0).toLocaleString()}</p>
            </div>

            {/* Duration */}
            <div className="w-[60px] flex-shrink-0 text-right">
                <span className="text-sm text-gray-400 tabular-nums">{formatDuration(song.duration || 0)}</span>
            </div>
        </div>
    );
}
