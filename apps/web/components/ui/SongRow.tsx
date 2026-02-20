'use client';

import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '@gmusic/database';
import type { Song } from '@gmusic/database';
import { IoPlaySharp, IoHeart, IoEllipsisHorizontal, IoAdd, IoMusicalNoteSharp, IoTimeOutline, IoShareSocial } from 'react-icons/io5';
import { usePlayerStore } from '@/store/playerStore';
import { motion, useMotionValue, useTransform, AnimatePresence, useAnimation } from 'framer-motion';
import PlaylistModal from './PlaylistModal';

import PlayingAnimation from './PlayingAnimation';

interface SongRowProps {
    song: Song;
    index: number;
    songs: Song[];
    showCover?: boolean;
    showAlbum?: boolean;
}

export default function SongRow({ song, index, songs, showCover, showAlbum }: SongRowProps) {
    const { playSong, currentSong, isPlaying, addToQueue } = usePlayerStore();
    const [isLiked, setIsLiked] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const [showPlaylistModal, setShowPlaylistModal] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const isActive = currentSong?.id === song.id;
    const controls = useAnimation();
    const isDraggingRef = useRef(false);

    // Swipe state
    const x = useMotionValue(0);
    const background = useTransform(x, [0, 100], ['transparent', '#c68cfa']);
    const iconScale = useTransform(x, [0, 80], [0, 1.2]);
    const iconOpacity = useTransform(x, [0, 60], [0, 1]);

    const USER_ID = '00000000-0000-4000-a000-000000000001';

    useEffect(() => {
        async function checkLikeStatus() {
            const { data } = await supabase
                .from('likes')
                .select('*')
                .eq('user_id', USER_ID)
                .eq('song_id', song.id)
                .maybeSingle();
            setIsLiked(!!data);
        }
        checkLikeStatus();
    }, [song.id, USER_ID]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setShowMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLikeToggle = async (e: React.MouseEvent) => {
        e.stopPropagation();
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

    const handleDragStart = () => {
        isDraggingRef.current = true;
    };

    const handleDragEnd = async (_: any, info: any) => {
        if (info.offset.x > 80) {
            addToQueue(song);
        }
        await controls.start({ x: 0 });
        // Small delay to prevent accidental click after drag
        setTimeout(() => {
            isDraggingRef.current = false;
        }, 50);
    };

    const handleRowClick = () => {
        if (!isDraggingRef.current) {
            // Pass the full songs array to initialize the queue correctly
            playSong(song, songs);
        }
    };

    const formatDuration = (s: number) => {
        const mins = Math.floor(s / 60);
        const secs = s % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <>
            <div className="relative group">
                {/* Swipe Background - only visible when dragging */}
                <motion.div
                    style={{ background }}
                    className="absolute inset-0 z-0 flex items-center pl-8 rounded-lg overflow-hidden"
                >
                    <motion.div style={{ scale: iconScale, opacity: iconOpacity }}>
                        <IoMusicalNoteSharp className="text-white text-2xl" />
                    </motion.div>
                </motion.div>

                <motion.div
                    drag="x"
                    dragConstraints={{ left: 0, right: 150 }}
                    dragElastic={0.1}
                    dragTransition={{ bounceStiffness: 600, bounceDamping: 20 }}
                    style={{ x }}
                    animate={controls}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    onClick={handleRowClick}
                    className={`relative z-10 grid grid-cols-[32px_1fr_48px_48px] md:grid-cols-[32px_1fr_200px_48px_48px_60px] items-center gap-4 px-4 py-2 rounded-lg cursor-pointer transition-colors select-none ${isActive ? 'bg-white/10' : 'bg-black hover:bg-white/5'
                        }`}
                >
                    <div className="flex items-center justify-center">
                        {isActive && isPlaying ? (
                            <PlayingAnimation />
                        ) : (
                            <span className={`text-sm ${isActive ? 'text-[#c68cfa]' : 'text-gray-500'}`}>{index + 1}</span>
                        )}
                    </div>

                    <div className="flex items-center gap-3 overflow-hidden">
                        {showCover && (
                            <div className="w-10 h-10 rounded overflow-hidden flex-shrink-0 bg-white/10">
                                {song.cover_url && <img src={song.cover_url} alt="" className="w-full h-full object-cover" />}
                            </div>
                        )}
                        <div className="flex flex-col min-w-0">
                            <span className={`text-sm font-bold truncate ${isActive ? 'text-[#c68cfa]' : 'text-white'}`}>{song.title}</span>
                            <span className="text-xs text-gray-400 truncate font-semibold">{song.artist?.name || 'Bilinmiyor'}</span>
                        </div>
                    </div>

                    <div className="flex justify-center" onClick={(e) => { e.stopPropagation(); handleLikeToggle(e); }}>
                        <IoHeart className={`text-xl transition-colors ${isLiked ? 'text-[#c68cfa]' : 'text-gray-700 hover:text-white'}`} />
                    </div>

                    {showAlbum && (
                        <div className="hidden md:block text-sm text-gray-500 font-medium truncate">
                            {song.album?.title || '-'}
                        </div>
                    )}

                    <div className="hidden sm:block text-sm text-gray-500 font-medium text-right tabular-nums">
                        {song.plays?.toLocaleString() || 0}
                    </div>

                    <div className="flex items-center justify-end gap-2 relative" ref={menuRef}>
                        <button
                            onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
                            className="p-1.5 text-gray-500 hover:text-white transition-colors rounded-full hover:bg-white/10"
                        >
                            <IoEllipsisHorizontal className="text-xl" />
                        </button>

                        <AnimatePresence>
                            {showMenu && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                    className="absolute right-0 bottom-full mb-2 w-52 bg-[#1e1e1e] border border-white/10 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] z-[60] overflow-hidden"
                                >
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleLikeToggle(e); setShowMenu(false); }}
                                        className="w-full flex items-center gap-3 px-4 py-3.5 text-sm font-bold text-gray-300 hover:bg-white/10 hover:text-white transition-colors border-b border-white/5"
                                    >
                                        <IoHeart className={`text-lg ${isLiked ? 'text-[#c68cfa]' : 'text-[#c68cfa]/50'}`} />
                                        <span>{isLiked ? 'Beğeniden Kaldır' : 'Beğen'}</span>
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); addToQueue(song); setShowMenu(false); }}
                                        className="w-full flex items-center gap-3 px-4 py-3.5 text-sm font-bold text-gray-300 hover:bg-white/10 hover:text-white transition-colors border-b border-white/5"
                                    >
                                        <IoMusicalNoteSharp className="text-lg text-[#c68cfa]" />
                                        <span>Sıraya Ekle</span>
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setShowPlaylistModal(true); setShowMenu(false); }}
                                        className="w-full flex items-center gap-3 px-4 py-3.5 text-sm font-bold text-gray-300 hover:bg-white/10 hover:text-white transition-colors border-b border-white/5"
                                    >
                                        <IoAdd className="text-lg text-[#c68cfa]" />
                                        <span>Listeye Ekle</span>
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (navigator.share) {
                                                navigator.share({ title: song.title, text: `${song.title} - ${song.artist?.name}`, url: window.location.href });
                                            } else {
                                                navigator.clipboard.writeText(window.location.href);
                                            }
                                            setShowMenu(false);
                                        }}
                                        className="w-full flex items-center gap-3 px-4 py-3.5 text-sm font-bold text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
                                    >
                                        <IoShareSocial className="text-lg text-[#c68cfa]" />
                                        <span>Paylaş</span>
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="text-xs text-gray-500 font-bold tabular-nums w-12 text-right">
                            {formatDuration(song.duration || 0)}
                        </div>
                    </div>
                </motion.div>
            </div>

            {showPlaylistModal && (
                <PlaylistModal
                    songId={song.id}
                    onClose={() => setShowPlaylistModal(false)}
                />
            )}
        </>
    );
}
