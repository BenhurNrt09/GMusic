'use client';

import React, { useEffect, useRef } from 'react';
import { IoClose, IoExpand, IoPause, IoPlay, IoLogoYoutube } from 'react-icons/io5';
import { usePlayerStore } from '@/store/playerStore';
import { motion, AnimatePresence } from 'framer-motion';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type ReactPlayerType from 'react-player';

export default function VideoMiniPlayer() {
    const {
        currentSong,
        isVideoMode,
        setVideoMode,
        repeat,
        nextSong,
        isRightPanelOpen,
        setRightPanelOpen,
        isPlaying,
        togglePlay,
        progress,
        setProgress
    } = usePlayerStore();

    const videoRef = useRef<any>(null);
    const [hasMounted, setHasMounted] = React.useState(false);

    const [PlayerComponent, setPlayerComponent] = React.useState<any>(null);

    useEffect(() => {
        setHasMounted(true);
        import('react-player').then((mod) => {
            setPlayerComponent(() => mod.default);
        });
    }, []);

    useEffect(() => {
        if (isVideoMode && !isRightPanelOpen && videoRef.current && typeof videoRef.current.getCurrentTime === 'function') {
            const currentTime = videoRef.current.getCurrentTime();
            if (Math.abs(currentTime - progress) > 1.5) {
                videoRef.current.seekTo(progress, 'seconds');
            }
        }
    }, [progress, isVideoMode, isRightPanelOpen]);

    useEffect(() => {
        if (isVideoMode && videoRef.current && typeof videoRef.current.seekTo === 'function') {
            videoRef.current.seekTo(progress, 'seconds');
        }
    }, [currentSong?.id, isVideoMode]);

    const showMiniPlayer = isVideoMode && !isRightPanelOpen && currentSong?.video_url;

    return (
        <AnimatePresence>
            {showMiniPlayer && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.8, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8, y: 20 }}
                    className="fixed bottom-24 right-6 z-50 w-72 aspect-video bg-black rounded-xl overflow-hidden shadow-2xl border border-white/10 group shadow-[#c68cfa]/20"
                >
                    {hasMounted && (
                        PlayerComponent ? (
                            <PlayerComponent
                                key={currentSong?.video_url}
                                ref={videoRef}
                                url={currentSong?.video_url || ''}
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
                        ) : (
                            <div className="w-full h-full bg-black/20 animate-pulse" />
                        )
                    )}

                    {/* Controls Overlay */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                        <div className="flex justify-end gap-1">
                            <button
                                onClick={() => setRightPanelOpen(true)}
                                className="p-1.5 bg-black/60 rounded-lg text-white hover:bg-[#c68cfa] transition-colors"
                                title="Genişlet"
                            >
                                <IoExpand size={14} />
                            </button>
                            <button
                                onClick={() => setVideoMode(false)}
                                className="p-1.5 bg-black/60 rounded-lg text-white hover:bg-red-500 transition-colors"
                                title="Kapat"
                            >
                                <IoClose size={14} />
                            </button>
                        </div>

                        <div className="flex justify-center">
                            <button
                                onClick={togglePlay}
                                className="p-3 bg-white text-black rounded-full hover:scale-110 transition-transform shadow-xl"
                            >
                                {isPlaying ? <IoPause size={20} /> : <IoPlay size={20} className="ml-0.5" />}
                            </button>
                        </div>

                        <div className="flex flex-col">
                            <p className="text-[10px] text-white font-bold truncate px-1 drop-shadow-lg">
                                {currentSong?.title}
                            </p>
                            <p className="text-[8px] text-white/70 truncate px-1 drop-shadow-lg">
                                {currentSong?.artist?.name}
                            </p>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
