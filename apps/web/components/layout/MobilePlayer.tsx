'use client';

import React from 'react';
import Image from 'next/image';
import {
    IoChevronDown,
    IoPlaySharp,
    IoPauseSharp,
    IoPlaySkipBackSharp,
    IoPlaySkipForwardSharp,
    IoShuffle,
    IoRepeat,
    IoEllipsisHorizontal,
    IoList,
    IoMusicalNote,
    IoVideocam,
    IoHeadset,
    IoExpand,
    IoHeart,
    IoHeartOutline,
    IoLogoYoutube,
} from 'react-icons/io5';
import { usePlayerStore } from '@/store/playerStore';
import { motion, AnimatePresence } from 'framer-motion';
// Use client-side only dynamic import for ref support
import type ReactPlayerType from 'react-player';
import QueueList from '../ui/QueueList';

// ============================================================
// MobilePlayer — Full-screen playback overlay for small screens
// ============================================================

export default function MobilePlayer() {
    const {
        currentSong,
        isPlaying,
        togglePlay,
        progress,
        duration,
        setProgress,
        nextSong,
        prevSong,
        shuffle,
        toggleShuffle,
        repeat,
        toggleRepeat,
        isMobilePlayerOpen,
        setMobilePlayerOpen,
        isVideoMode,
        setVideoMode
    } = usePlayerStore();

    const videoRef = React.useRef<any>(null);
    const [viewMode, setViewMode] = React.useState<'player' | 'queue' | 'lyrics'>('player');
    const lyricsContainerRef = React.useRef<HTMLDivElement>(null);
    const [hasMounted, setHasMounted] = React.useState(false);

    const [PlayerComponent, setPlayerComponent] = React.useState<any>(null);

    React.useEffect(() => {
        setHasMounted(true);
        import('react-player').then((mod) => {
            setPlayerComponent(() => mod.default);
        });
    }, []);

    // LRC Parser
    const parsedLyrics = React.useMemo(() => {
        if (!currentSong?.lyrics) return [];

        const lines = currentSong.lyrics.split('\n');
        const lyricsArray: { time: number; text: string }[] = [];

        const timeRegex = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/;

        lines.forEach(line => {
            const match = line.match(timeRegex);
            if (match) {
                const minutes = parseInt(match[1]);
                const seconds = parseInt(match[2]);
                const milliseconds = parseInt(match[3]);
                const time = minutes * 60 + seconds + (milliseconds / (match[3].length === 3 ? 1000 : 100));
                const text = line.replace(timeRegex, '').trim();
                if (text) {
                    lyricsArray.push({ time, text });
                }
            } else if (line.trim()) {
                // Support plain text as well (static)
                lyricsArray.push({ time: -1, text: line.trim() });
            }
        });

        return lyricsArray.sort((a, b) => a.time - b.time);
    }, [currentSong?.lyrics]);

    // Finding active lyric index
    const activeLyricIndex = React.useMemo(() => {
        if (parsedLyrics.length === 0 || parsedLyrics[0].time === -1) return -1;

        let index = -1;
        for (let i = 0; i < parsedLyrics.length; i++) {
            if (progress >= parsedLyrics[i].time) {
                index = i;
            } else {
                break;
            }
        }
        return index;
    }, [parsedLyrics, progress]);

    // Video Sync
    React.useEffect(() => {
        if (isMobilePlayerOpen && isVideoMode && videoRef.current && typeof videoRef.current.getCurrentTime === 'function') {
            const currentTime = videoRef.current.getCurrentTime();
            if (Math.abs(currentTime - progress) > 1.5) {
                videoRef.current.seekTo(progress, 'seconds');
            }
        }
    }, [progress, isVideoMode, isMobilePlayerOpen]);

    React.useEffect(() => {
        if (isVideoMode && videoRef.current && typeof videoRef.current.seekTo === 'function') {
            videoRef.current.seekTo(progress, 'seconds');
        }
    }, [currentSong?.id, isVideoMode]);

    // Scroll to active lyric
    React.useEffect(() => {
        if (viewMode === 'lyrics' && activeLyricIndex !== -1 && lyricsContainerRef.current) {
            const activeElement = lyricsContainerRef.current.children[activeLyricIndex] as HTMLElement;
            if (activeElement) {
                activeElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center'
                });
            }
        }
    }, [activeLyricIndex, viewMode]);

    if (!currentSong) return null;

    const formatTime = (time: number) => {
        const mins = Math.floor(time / 60);
        const secs = Math.floor(time % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const progressPercent = duration > 0 ? (progress / duration) * 100 : 0;

    return (
        <AnimatePresence>
            {isMobilePlayerOpen && (
                <motion.div
                    initial={{ y: '100%' }}
                    animate={{ y: 0 }}
                    exit={{ y: '100%' }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    className="fixed inset-0 z-[250] bg-gradient-to-b from-[#1e1e1e] to-[#0f0f0f] flex flex-col p-8"
                >
                    {/* Invisible/Subtle Header */}
                    <div className="flex items-center justify-between mb-8 opacity-40 hover:opacity-100 transition-opacity">
                        <button
                            onClick={() => setMobilePlayerOpen(false)}
                            className="p-2 -ml-2 text-white hover:bg-white/10 rounded-full"
                        >
                            <IoChevronDown className="text-3xl" />
                        </button>
                        <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto" />
                        <button className="p-2 -mr-2 text-white hover:bg-white/10 rounded-full">
                            <IoEllipsisHorizontal className="text-2xl" />
                        </button>
                    </div>

                    {/* Main Content (Art, Queue, or Lyrics) */}
                    <div className="flex-1 flex flex-col mt-4">
                        <AnimatePresence mode="wait">
                            {viewMode === 'player' ? (
                                <motion.div
                                    key="art"
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className="flex-1 flex flex-col"
                                >
                                    {/* Album Art / Video */}
                                    <div className="flex-1 flex flex-col items-center justify-center py-4">
                                        <div className="relative aspect-square w-full max-w-[320px] rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] bg-black">
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
                                                        className="absolute bottom-3 right-3 z-10 p-2 bg-black/50 backdrop-blur-md rounded-lg text-white"
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
                                                            sizes="90vw"
                                                            priority
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full bg-white/5 flex items-center justify-center">
                                                            <IoMusicalNote className="text-6xl text-white/20" />
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </div>

                                        {/* Mobile Mode Switch */}
                                        {currentSong.video_url && (
                                            <div className="mt-6">
                                                <button
                                                    onClick={() => setVideoMode(!isVideoMode)}
                                                    className="flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 rounded-full text-sm font-bold text-white active:scale-95 transition-all"
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
                                    </div>

                                    {/* Song Info */}
                                    <div className="mt-8 mb-6 text-left">
                                        <h2 className="text-2xl font-black text-white italic tracking-tighter mb-1 truncate">{currentSong.title}</h2>
                                        <p className="text-lg font-medium text-gray-400 truncate">{currentSong.artist?.name || 'Bilinmiyor'}</p>
                                    </div>
                                </motion.div>
                            ) : viewMode === 'queue' ? (
                                <motion.div
                                    key="queue"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    className="flex-1 overflow-y-auto scrollbar-none pt-4"
                                >
                                    <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                        <IoList className="text-[#c68cfa]" />
                                        Sıradakiler
                                    </h2>
                                    <QueueList />
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="lyrics"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 20 }}
                                    className="flex-1 overflow-y-auto scrollbar-none py-8 space-y-8"
                                    ref={lyricsContainerRef}
                                >
                                    {parsedLyrics.length > 0 ? (
                                        parsedLyrics.map((line, i) => (
                                            <motion.p
                                                key={i}
                                                className={`text-2xl font-black tracking-tight leading-tight transition-all duration-300 ${i === activeLyricIndex ? 'text-white scale-105 opacity-100' : 'text-white/30 opacity-40'}`}
                                            >
                                                {line.text}
                                            </motion.p>
                                        ))
                                    ) : (
                                        <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                                            <IoMusicalNote className="text-6xl text-white/10" />
                                            <p className="text-gray-500 font-bold">Şarkı sözü bulunamadı</p>
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-4">
                        <div className="relative h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <motion.div
                                className="absolute left-0 top-0 bottom-0 bg-white"
                                style={{ width: `${progressPercent}%` }}
                                layoutId="mobile-progress"
                            />
                            <input
                                type="range"
                                min={0}
                                max={duration || 0}
                                value={progress}
                                onChange={(e) => setProgress(parseFloat(e.target.value))}
                                className="absolute inset-0 w-full opacity-0 cursor-pointer"
                            />
                        </div>
                        <div className="flex justify-between text-xs font-bold text-gray-500 tabular-nums">
                            <span>{formatTime(progress)}</span>
                            <span>{formatTime(duration)}</span>
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="mt-8 mb-12 flex items-center justify-between">
                        <button
                            onClick={toggleShuffle}
                            className={`p-2 transition-colors ${shuffle ? 'text-[#c68cfa]' : 'text-gray-400 hover:text-white'}`}
                        >
                            <IoShuffle className="text-2xl" />
                        </button>

                        <div className="flex items-center gap-8">
                            <button onClick={prevSong} className="p-2 text-white active:scale-95 transition-transform">
                                <IoPlaySkipBackSharp className="text-3xl" />
                            </button>
                            <button
                                onClick={togglePlay}
                                className="w-16 h-16 bg-white rounded-full flex items-center justify-center active:scale-90 transition-transform shadow-xl"
                            >
                                {isPlaying ? (
                                    <IoPauseSharp className="text-black text-3xl" />
                                ) : (
                                    <IoPlaySharp className="text-black text-3xl ml-1" />
                                )}
                            </button>
                            <button onClick={nextSong} className="p-2 text-white active:scale-95 transition-transform">
                                <IoPlaySkipForwardSharp className="text-3xl" />
                            </button>
                        </div>

                        <button
                            onClick={toggleRepeat}
                            className={`p-2 transition-colors ${repeat !== 'off' ? 'text-[#c68cfa]' : 'text-gray-400 hover:text-white'}`}
                        >
                            <IoRepeat className={`text-2xl ${repeat === 'one' ? 'relative' : ''}`} />
                            {repeat === 'one' && <span className="absolute top-1 right-1 text-[8px] font-black">1</span>}
                        </button>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex items-center justify-between px-2">
                        <button
                            onClick={() => setViewMode(viewMode === 'lyrics' ? 'player' : 'lyrics')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${viewMode === 'lyrics' ? 'bg-white text-black' : 'text-white/60'}`}
                        >
                            <span className="text-xs font-black uppercase tracking-widest">LYRICS</span>
                        </button>

                        <button
                            onClick={() => setViewMode(viewMode === 'queue' ? 'player' : 'queue')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${viewMode === 'queue' ? 'bg-[#c68cfa] text-black' : 'text-white/60'}`}
                        >
                            <IoList />
                            <span className="text-xs font-bold">{viewMode === 'queue' ? 'Gizle' : 'Kuyruk'}</span>
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
