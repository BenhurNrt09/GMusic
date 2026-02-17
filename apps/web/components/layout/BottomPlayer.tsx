'use client';

import React, { useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import {
    IoPlaySharp,
    IoPauseSharp,
    IoPlaySkipBack,
    IoPlaySkipForward,
    IoShuffle,
    IoRepeat,
    IoVolumeHigh,
    IoVolumeMute,
    IoVolumeMedium,
    IoList,
    IoMusicalNote,
    IoHeart,
    IoHeartOutline,
} from 'react-icons/io5';
import Link from 'next/link';
import { usePlayerStore } from '@/store/playerStore';
import { supabase } from '@gmusic/database';

// ============================================================
// BottomPlayer — Full music player bar (Spotify-style)
// ============================================================

export default function BottomPlayer() {
    const audioRef = useRef<HTMLAudioElement>(null);
    const isInitialPositionSet = useRef(false);

    const {
        currentSong,
        isPlaying,
        progress,
        duration,
        volume,
        isMuted,
        shuffle,
        repeat,
        togglePlay,
        setProgress,
        setDuration,
        setVolume,
        toggleMute,
        toggleShuffle,
        toggleRepeat,
        nextSong,
        prevSong,
        toggleRightPanel,
        restoreFromStorage,
    } = usePlayerStore();

    const [isLiked, setIsLiked] = React.useState(false);

    // Hardcoded user ID for the main user (Gülçin Engin)
    const USER_ID = '00000000-0000-4000-a000-000000000001';

    // Restore saved state on mount
    useEffect(() => {
        restoreFromStorage();
    }, []);

    // Fetch initial liked state
    useEffect(() => {
        async function checkLiked() {
            if (!currentSong) return;
            const { data } = await supabase.from('likes').select('id').eq('song_id', currentSong.id).eq('user_id', USER_ID).single();
            setIsLiked(!!data);
        }
        checkLiked();
    }, [currentSong?.id, USER_ID]);

    const handleLikeToggle = async (e: React.MouseEvent) => {
        e.stopPropagation();
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

    // Sync audio element with store - handle play/pause
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        if (isPlaying) {
            audio.play().catch(() => { });
        } else {
            audio.pause();
        }
    }, [isPlaying]);

    // Volume sync
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;
        audio.volume = isMuted ? 0 : volume;
    }, [volume, isMuted]);

    // Audio source change and progress restoration
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio || !currentSong) return;

        // Save current isPlaying state to resume if it was already playing
        const wasPlaying = isPlaying;

        audio.src = currentSong.audio_url;
        audio.load();

        if (isInitialPositionSet.current) {
            // If this is NOT the initial load (e.g. user changed song), just play
            if (wasPlaying) audio.play().catch(() => { });
        } else {
            // First ever load - attempt restoration
            const savedProgress = progress;
            if (savedProgress > 0) {
                const onReady = () => {
                    audio.currentTime = savedProgress;
                    isInitialPositionSet.current = true;
                    if (wasPlaying) audio.play().catch(() => { });
                    audio.removeEventListener('loadedmetadata', onReady);
                };
                audio.addEventListener('loadedmetadata', onReady);
            } else {
                isInitialPositionSet.current = true;
                if (wasPlaying) audio.play().catch(() => { });
            }
        }
    }, [currentSong?.id]);

    const handleTimeUpdate = useCallback(() => {
        const audio = audioRef.current;
        if (audio && isInitialPositionSet.current) {
            // Only update store progress if we are NOT in the middle of initial restoration
            // and avoid updating if audio just started (to prevent 0 values during metadata load)
            if (audio.currentTime > 0 || isPlaying) {
                setProgress(audio.currentTime);
            }
        }
    }, [setProgress, isPlaying]);

    const handleLoadedMetadata = useCallback(() => {
        const audio = audioRef.current;
        if (audio) {
            setDuration(audio.duration);
            // Apply volume here too to be safe
            audio.volume = isMuted ? 0 : volume;
        }
    }, [setDuration, volume, isMuted]);

    const handleEnded = useCallback(() => {
        if (repeat === 'one') {
            const audio = audioRef.current;
            if (audio) {
                audio.currentTime = 0;
                audio.play().catch(() => { });
            }
        } else {
            nextSong();
        }
    }, [repeat, nextSong]);

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const time = Number(e.target.value);
        if (audioRef.current) {
            audioRef.current.currentTime = time;
        }
        setProgress(time);
    };

    const formatTime = (s: number) => {
        const mins = Math.floor(s / 60);
        const secs = Math.floor(s % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const progressPercent = duration > 0 ? (progress / duration) * 100 : 0;

    const VolumeIcon = isMuted || volume === 0
        ? IoVolumeMute
        : volume < 0.5
            ? IoVolumeMedium
            : IoVolumeHigh;

    return (
        <div className="h-[90px] bg-[#181818] border-t border-white/5 flex items-center px-4 gap-4">
            {/* Hidden audio element */}
            <audio
                ref={audioRef}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onEnded={handleEnded}
            />

            {/* LEFT — Song info */}
            <div className="flex items-center gap-3 w-[30%] min-w-[180px]">
                {currentSong ? (
                    <>
                        <button
                            onClick={toggleRightPanel}
                            className="relative w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 group cursor-pointer"
                        >
                            {currentSong.cover_url ? (
                                <Image
                                    src={currentSong.cover_url}
                                    alt={currentSong.title}
                                    fill
                                    className="object-cover group-hover:brightness-75 transition-all"
                                />
                            ) : currentSong.album?.cover_url ? (
                                <Image
                                    src={currentSong.album.cover_url}
                                    alt={currentSong.album.title}
                                    fill
                                    className="object-cover group-hover:brightness-75 transition-all"
                                />
                            ) : currentSong.artist?.image_url ? (
                                <Image
                                    src={currentSong.artist.image_url}
                                    alt={currentSong.artist.name}
                                    fill
                                    className="object-cover group-hover:brightness-75 transition-all"
                                />
                            ) : (
                                <div className="w-full h-full bg-white/10 flex items-center justify-center">
                                    <IoMusicalNote className="text-white/50" />
                                </div>
                            )}
                        </button>
                        <div className="min-w-0">
                            <p className="text-sm font-medium text-white line-clamp-1 hover:underline cursor-pointer">
                                {currentSong.title}
                            </p>
                            <Link
                                href={`/artist/${currentSong.artist_id}`}
                                className="text-xs text-gray-400 line-clamp-1 hover:underline hover:text-white cursor-pointer"
                            >
                                {currentSong.artist?.name || 'Bilinmeyen Sanatçı'}
                            </Link>
                        </div>
                        <button
                            onClick={handleLikeToggle}
                            className={`ml-2 p-2 -m-2 transition-colors duration-200 ${isLiked ? 'text-[#c68cfa]' : 'text-gray-400 hover:text-white'} relative z-10`}
                            title={isLiked ? "Beğenmekten Vazgeç" : "Beğen"}
                        >
                            {isLiked ? <IoHeart className="text-lg" /> : <IoHeartOutline className="text-lg" />}
                        </button>
                    </>
                ) : (
                    <div className="flex items-center gap-3">
                        <div className="w-14 h-14 rounded-lg bg-white/5" />
                        <div>
                            <p className="text-sm text-gray-500">Şarkı çalmıyor</p>
                        </div>
                    </div>
                )}
            </div>

            {/* CENTER — Controls + Progress */}
            <div className="flex-1 flex flex-col items-center gap-1 max-w-[722px]">
                {/* Control buttons */}
                <div className="flex items-center gap-5">
                    <button
                        onClick={toggleShuffle}
                        className={`transition-colors ${shuffle ? 'text-[#c68cfa]' : 'text-gray-400 hover:text-white'
                            }`}
                    >
                        <IoShuffle className="text-lg" />
                    </button>
                    <button onClick={prevSong} className="text-gray-400 hover:text-white transition-colors">
                        <IoPlaySkipBack className="text-xl" />
                    </button>
                    <button
                        onClick={togglePlay}
                        className="w-9 h-9 bg-white rounded-full flex items-center justify-center hover:scale-105 transition-transform"
                    >
                        {isPlaying ? (
                            <IoPauseSharp className="text-black text-lg" />
                        ) : (
                            <IoPlaySharp className="text-black text-lg ml-0.5" />
                        )}
                    </button>
                    <button onClick={nextSong} className="text-gray-400 hover:text-white transition-colors">
                        <IoPlaySkipForward className="text-xl" />
                    </button>
                    <button
                        onClick={toggleRepeat}
                        className={`transition-colors relative ${repeat !== 'off' ? 'text-[#c68cfa]' : 'text-gray-400 hover:text-white'
                            }`}
                    >
                        <IoRepeat className="text-lg" />
                        {repeat === 'one' && (
                            <span className="absolute -top-1 -right-1 text-[8px] font-bold bg-[#c68cfa] text-white w-3 h-3 rounded-full flex items-center justify-center">
                                1
                            </span>
                        )}
                    </button>
                </div>

                {/* Progress bar */}
                <div className="flex items-center gap-2 w-full">
                    <span className="text-[11px] text-gray-400 w-10 text-right tabular-nums">
                        {formatTime(progress)}
                    </span>
                    <div className="flex-1 group relative h-4 flex items-center">
                        <input
                            type="range"
                            min={0}
                            max={duration || 0}
                            value={progress}
                            onChange={handleSeek}
                            className="absolute w-full h-1 appearance-none bg-transparent cursor-pointer z-10
                [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3
                [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:opacity-0
                [&::-webkit-slider-thumb]:group-hover:opacity-100 [&::-webkit-slider-thumb]:transition-opacity"
                        />
                        <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-white group-hover:bg-[#c68cfa] rounded-full transition-colors"
                                style={{ width: `${progressPercent}%` }}
                            />
                        </div>
                    </div>
                    <span className="text-[11px] text-gray-400 w-10 tabular-nums">
                        {formatTime(duration)}
                    </span>
                </div>
            </div>

            {/* RIGHT — Volume + Queue */}
            <div className="flex items-center gap-3 w-[30%] min-w-[180px] justify-end">
                <button
                    onClick={toggleRightPanel}
                    className="text-gray-400 hover:text-white transition-colors"
                >
                    <IoList className="text-lg" />
                </button>
                <button onClick={toggleMute} className="text-gray-400 hover:text-white transition-colors">
                    <VolumeIcon className="text-lg" />
                </button>
                <div className="w-24 group relative h-4 flex items-center">
                    <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.01}
                        value={isMuted ? 0 : volume}
                        onChange={(e) => setVolume(Number(e.target.value))}
                        className="absolute w-full h-1 appearance-none bg-transparent cursor-pointer z-10
              [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3
              [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:opacity-0
              [&::-webkit-slider-thumb]:group-hover:opacity-100 [&::-webkit-slider-thumb]:transition-opacity"
                    />
                    <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-white group-hover:bg-[#c68cfa] rounded-full transition-colors"
                            style={{ width: `${(isMuted ? 0 : volume) * 100}%` }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
