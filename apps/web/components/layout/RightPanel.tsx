'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { IoClose, IoPersonSharp, IoHeart, IoHeartOutline, IoDisc, IoMusicalNote, IoList, IoCloudUpload, IoLogOut, IoLink, IoLogoYoutube, IoExpand, IoHeadset, IoVideocam } from 'react-icons/io5';
import { usePlayerStore } from '@/store/playerStore';
import { supabase } from '@gmusic/database';
import QueueList from '../ui/QueueList';
// Use dynamic import but ensure it's client-only and ref-safe
// We'll use a local state to hold the ReactPlayer component to avoid hydration issues
import type ReactPlayerType from 'react-player';

// ============================================================
// RightPanel — Song/Artist details drawer
// ============================================================

export default function RightPanel() {
    const {
        currentSong,
        isRightPanelOpen,
        setRightPanelOpen,
        isPlaying,
        progress,
        setProgress,
        isVideoMode,
        setVideoMode,
        repeat,
        nextSong
    } = usePlayerStore();
    const videoRef = React.useRef<any>(null);
    const [isLiked, setIsLiked] = React.useState(false);
    const [activeTab, setActiveTab] = React.useState<'info' | 'queue'>('info');
    const [hasMounted, setHasMounted] = React.useState(false);

    const [PlayerComponent, setPlayerComponent] = React.useState<any>(null);

    useEffect(() => {
        setHasMounted(true);
        // Load ReactPlayer only on client
        import('react-player').then((mod) => {
            setPlayerComponent(() => mod.default);
        });
    }, []);

    // Hardcoded user ID for the main user (Gülçin Engin)
    const USER_ID = '00000000-0000-4000-a000-000000000001';

    useEffect(() => {
        if (isVideoMode && videoRef.current && typeof videoRef.current.getInternalPlayer === 'function') {
            // Only sync if they are drift apart by more than 1s to avoid stuttering on minor network delays
            const player = videoRef.current.getInternalPlayer();
            if (player) {
                const currentTime = videoRef.current.getCurrentTime();
                if (Math.abs(currentTime - progress) > 1.5) {
                    videoRef.current.seekTo(progress, 'seconds');
                }
            }
        }
    }, [progress, isVideoMode]);

    useEffect(() => {
        // When song changes or video mode toggles, make sure we are at the right spot
        if (isVideoMode && videoRef.current && typeof videoRef.current.seekTo === 'function') {
            videoRef.current.seekTo(progress, 'seconds');
        }
    }, [currentSong?.id, isVideoMode]);

    useEffect(() => {
        async function checkLiked() {
            if (!currentSong) return;
            const { data } = await supabase.from('likes').select('id').eq('song_id', currentSong.id).eq('user_id', USER_ID).maybeSingle();
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
                <div className="flex flex-col p-5 sticky top-0 bg-[#121212]/90 backdrop-blur-lg z-10 border-b border-white/5">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-sm font-bold text-white">
                            {activeTab === 'info' ? (currentSong.artist?.name || 'Şimdi Çalıyor') : 'Sıradakiler'}
                        </h2>
                        <button
                            onClick={() => setRightPanelOpen(false)}
                            className="text-gray-400 hover:text-white transition-colors"
                        >
                            <IoClose className="text-xl" />
                        </button>
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={() => setActiveTab('info')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'info' ? 'bg-[#c68cfa] text-black' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
                        >
                            <IoMusicalNote /> Bilgi
                        </button>
                        <button
                            onClick={() => setActiveTab('queue')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'queue' ? 'bg-[#c68cfa] text-black' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
                        >
                            <IoList /> Kuyruk
                        </button>
                    </div>
                </div>

                <div className="flex-1">
                    {activeTab === 'info' ? (
                        <div className="py-5">
                            {/* Cover image */}
                            <div className="px-5 mb-4">
                                <div className="relative w-full aspect-square rounded-xl overflow-hidden shadow-2xl bg-black">
                                    {hasMounted && isVideoMode && currentSong.video_url && PlayerComponent ? (
                                        <div className="relative w-full h-full group/video">
                                            <PlayerComponent
                                                key={currentSong.video_url}
                                                ref={videoRef}
                                                url={currentSong.video_url || ''}
                                                width="100%"
                                                height="100%"
                                                playing={isPlaying && isVideoMode}
                                                muted={!isVideoMode}
                                                loop={repeat === 'one'}
                                                onEnded={nextSong}
                                                onProgress={(state: any) => {
                                                    if (isVideoMode && isPlaying) {
                                                        setProgress(state.playedSeconds);
                                                    }
                                                }}
                                                onError={(e: any) => console.error('ReactPlayer Error:', e)}
                                                playsinline
                                                config={{
                                                    youtube: {
                                                        playerVars: {
                                                            controls: 0,
                                                            modestbranding: 1,
                                                            rel: 0,
                                                            disablekb: 1,
                                                        }
                                                    },
                                                    file: {
                                                        forceVideo: true,
                                                        attributes: {
                                                            style: { width: '100%', height: '100%', objectFit: 'cover' }
                                                        }
                                                    }
                                                } as any}
                                                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                                            />
                                            {/* Fullscreen button overlay */}
                                            <button
                                                onClick={() => {
                                                    const player = videoRef.current?.getInternalPlayer();
                                                    const wrapper = player?.wrapper || videoRef.current?.wrapper;
                                                    if (wrapper?.requestFullscreen) {
                                                        wrapper.requestFullscreen();
                                                    } else if (wrapper?.webkitRequestFullscreen) {
                                                        wrapper.webkitRequestFullscreen();
                                                    } else if (currentSong.video_url?.includes('youtube')) {
                                                        const id = currentSong.video_url.match(/(?:v=|\/be\/|embed\/)([^&?/]+)/)?.[1];
                                                        window.open(`https://www.youtube.com/watch?v=${id}&t=${Math.floor(progress)}s`, '_blank');
                                                    }
                                                }}
                                                className="absolute bottom-3 right-3 z-10 p-2 bg-black/50 backdrop-blur-md rounded-lg text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                {currentSong.video_url?.includes('youtube') ? <IoLogoYoutube /> : <IoExpand />}
                                            </button>
                                        </div>
                                    ) : (
                                        <>
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
                                            ) : (
                                                <div className="w-full h-full bg-gradient-to-br from-[#c68cfa]/30 to-[#9d50bb]/10 flex items-center justify-center">
                                                    <IoPersonSharp className="text-6xl text-white/20" />
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Mode Switch Button */}
                            {currentSong.video_url && (
                                <div className="px-5 mb-4 text-center">
                                    <button
                                        onClick={() => {
                                            const newMode = !isVideoMode;
                                            setVideoMode(newMode);
                                            // Optional: ensure audio follows if needed
                                        }}
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full text-xs font-bold text-white hover:bg-white/10 transition-all"
                                    >
                                        {isVideoMode ? (
                                            <>
                                                <IoHeadset className="text-[#c68cfa]" />
                                                Sese geç
                                            </>
                                        ) : (
                                            <>
                                                <IoVideocam className="text-[#c68cfa]" />
                                                Videoya geç
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}

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
                        </div>
                    ) : (
                        <div className="p-5">
                            <QueueList />
                        </div>
                    )}
                </div>
            </aside>
        </>
    );
}

// Removing duplicate old code at the end
