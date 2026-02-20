'use client';

import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '@gmusic/database';
import type { Song } from '@gmusic/database';
import {
    IoPlay,
    IoPause,
    IoTime,
    IoSave,
    IoTrash,
    IoArrowBack,
    IoCheckmarkCircle,
    IoMusicalNote
} from 'react-icons/io5';
import { useToast } from '@/components/Toast';

export default function LyricsSyncPage() {
    const [songs, setSongs] = useState<Song[]>([]);
    const [selectedSong, setSelectedSong] = useState<Song | null>(null);
    const [loading, setLoading] = useState(true);
    const [rawLyrics, setRawLyrics] = useState('');
    const [syncedLines, setSyncedLines] = useState<{ time: number; text: string }[]>([]);
    const [currentTime, setCurrentTime] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);

    const audioRef = useRef<HTMLAudioElement | null>(null);
    const { showToast } = useToast();

    useEffect(() => {
        const fetchSongs = async () => {
            const { data } = await supabase.from('songs').select('*, artist:artists(*)').order('title');
            if (data) setSongs(data as unknown as Song[]);
            setLoading(false);
        };
        fetchSongs();
    }, []);

    const handleSongSelect = (song: Song) => {
        setSelectedSong(song);

        // Try to parse existing LRC if present
        if (song.lyrics && song.lyrics.includes('[')) {
            const lines = song.lyrics.split('\n');
            const timeRegex = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/;
            const parsed: { time: number; text: string }[] = [];
            let rawText = '';

            lines.forEach(line => {
                const match = line.match(timeRegex);
                if (match) {
                    const mins = parseInt(match[1]);
                    const secs = parseInt(match[2]);
                    const ms = parseInt(match[3]);
                    const time = mins * 60 + secs + (ms / 100);
                    const text = line.replace(timeRegex, '').trim();
                    parsed.push({ time, text });
                    rawText += text + '\n';
                } else if (line.trim()) {
                    parsed.push({ time: -1, text: line.trim() });
                    rawText += line.trim() + '\n';
                }
            });
            setSyncedLines(parsed);
            setRawLyrics(rawText.trim());
        } else {
            setRawLyrics(song.lyrics || '');
            setSyncedLines([]);
        }

        if (audioRef.current) {
            audioRef.current.src = song.audio_url;
            audioRef.current.load();
        }
    };

    const parseRawLyrics = () => {
        const lines = rawLyrics.split('\n').filter(l => l.trim() !== '');
        setSyncedLines(lines.map(text => ({ time: -1, text: text.trim() })));
    };

    const addTimestamp = () => {
        if (!audioRef.current) return;
        const time = audioRef.current.currentTime;

        const nextUnsyncedIndex = syncedLines.findIndex(l => l.time === -1);
        if (nextUnsyncedIndex !== -1) {
            const newLines = [...syncedLines];
            newLines[nextUnsyncedIndex].time = time;
            setSyncedLines(newLines);

            // Auto scroll to next line
            const nextElement = document.getElementById(`line-${nextUnsyncedIndex + 1}`);
            if (nextElement) {
                nextElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    };

    const formatTime = (time: number) => {
        const mins = Math.floor(time / 60);
        const secs = Math.floor(time % 60);
        const ms = Math.floor((time % 1) * 100);
        return `[${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}]`;
    };

    const handleSave = async () => {
        if (!selectedSong) return;

        const lrcContent = syncedLines
            .filter(l => l.time !== -1)
            .map(l => `${formatTime(l.time)} ${l.text}`)
            .join('\n');

        const { error } = await (supabase.from('songs') as any)
            .update({ lyrics: lrcContent })
            .eq('id', selectedSong.id);

        if (error) {
            showToast('Kaydetme hatası: ' + error.message, 'error');
        } else {
            showToast('Senkronize edilmiş sözler başarıyla kaydedildi!', 'success');
        }
    };

    if (loading) return <div className="p-8 text-white">Yükleniyor...</div>;

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                    <IoTime className="text-[#c68cfa]" />
                    Söz Senkronizasyonu
                </h1>
                {selectedSong && (
                    <button
                        onClick={() => setSelectedSong(null)}
                        className="text-gray-400 hover:text-white flex items-center gap-1 text-sm"
                    >
                        <IoArrowBack /> Geri Dön
                    </button>
                )}
            </div>

            {!selectedSong ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {songs.map(song => (
                        <button
                            key={song.id}
                            onClick={() => handleSongSelect(song as any)}
                            className="bg-white/5 border border-white/10 p-4 rounded-2xl hover:border-[#c68cfa]/50 transition-all text-left flex items-center gap-4 group"
                        >
                            <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center overflow-hidden">
                                {song.cover_url ? (
                                    <img src={song.cover_url} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <IoMusicalNote className="text-xl text-white/30" />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-bold text-white truncate">{song.title}</p>
                                <p className="text-xs text-gray-400 truncate">{song.artist?.name}</p>
                            </div>
                            {song.lyrics && song.lyrics.includes('[') && (
                                <IoCheckmarkCircle className="text-green-500" title="Senkronize edilmiş" />
                            )}
                        </button>
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left: Player & Raw Text */}
                    <div className="space-y-6">
                        <div className="bg-white/5 p-6 rounded-2xl border border-white/10 space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 bg-white/10 rounded-xl overflow-hidden shadow-xl">
                                    <img src={selectedSong.cover_url || ''} alt="" className="w-full h-full object-cover" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-white tracking-tight">{selectedSong.title}</h2>
                                    <p className="text-[#c68cfa] font-medium text-sm">{selectedSong.artist?.name}</p>
                                </div>
                            </div>

                            <audio
                                ref={audioRef}
                                onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
                                onPlay={() => setIsPlaying(true)}
                                onPause={() => setIsPlaying(false)}
                                className="hidden"
                            />

                            <div className="flex items-center gap-4 pt-4">
                                <button
                                    onClick={() => isPlaying ? audioRef.current?.pause() : audioRef.current?.play()}
                                    className="w-12 h-12 bg-white text-black rounded-full flex items-center justify-center hover:scale-105 transition-transform"
                                >
                                    {isPlaying ? <IoPause /> : <IoPlay className="ml-1" />}
                                </button>
                                <div className="flex-1">
                                    <input
                                        type="range"
                                        min={0}
                                        max={selectedSong.duration}
                                        value={currentTime}
                                        onChange={(e) => {
                                            if (audioRef.current) audioRef.current.currentTime = parseFloat(e.target.value);
                                        }}
                                        className="w-full accent-[#c68cfa]"
                                    />
                                    <div className="flex justify-between text-[10px] text-gray-500 font-mono mt-1">
                                        <span>{Math.floor(currentTime / 60)}:{(currentTime % 60).toFixed(0).padStart(2, '0')}</span>
                                        <span>{Math.floor(selectedSong.duration / 60)}:{(selectedSong.duration % 60).toFixed(0).padStart(2, '0')}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-300">Ham Şarkı Sözleri (Her satırı ayırın)</label>
                            <textarea
                                value={rawLyrics}
                                onChange={(e) => setRawLyrics(e.target.value)}
                                className="w-full h-80 bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-sm focus:outline-none focus:border-[#c68cfa] scrollbar-thin"
                                placeholder="Şarkı sözlerini buraya yapıştırın..."
                            />
                            <button
                                onClick={parseRawLyrics}
                                className="w-full py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-bold transition-colors"
                            >
                                Listeyi Hazırla
                            </button>
                        </div>
                    </div>

                    {/* Right: Sync Editor */}
                    <div className="flex flex-col h-[650px]">
                        <div className="flex-1 overflow-y-auto scrollbar-none space-y-2 pr-2 mb-4">
                            {syncedLines.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-gray-500 p-8 border-2 border-dashed border-white/5 rounded-3xl">
                                    <IoMusicalNote className="text-4xl mb-4 opacity-20" />
                                    <p className="text-sm font-medium italic">Önce sol taraftaki listeyi hazırlayın</p>
                                </div>
                            ) : (
                                syncedLines.map((line, idx) => {
                                    const isActive = syncedLines.findIndex(l => l.time === -1) === idx;
                                    const isDone = line.time !== -1;
                                    const isCurrent = isDone && currentTime >= line.time && (idx === syncedLines.length - 1 || currentTime < syncedLines[idx + 1].time);

                                    return (
                                        <div
                                            key={idx}
                                            id={`line-${idx}`}
                                            onClick={() => {
                                                if (!isDone) return;
                                                if (audioRef.current) audioRef.current.currentTime = line.time;
                                            }}
                                            className={`p-3 rounded-xl border transition-all cursor-pointer ${isActive ? 'bg-[#c68cfa]/20 border-[#c68cfa] ring-2 ring-[#c68cfa]/20' :
                                                isCurrent ? 'bg-white/10 border-[#c68cfa]/50 scale-[1.02]' :
                                                    isDone ? 'bg-white/5 border-white/10 opacity-60 hover:opacity-100' :
                                                        'bg-white/5 border-transparent opacity-30 shadow-inner'
                                                }`}
                                        >
                                            <div className="flex items-center justify-between gap-3">
                                                <span className={`text-xs font-mono w-20 ${isCurrent ? 'text-white font-bold' : 'text-[#c68cfa]'}`}>
                                                    {isDone ? formatTime(line.time).replace('[', '').replace(']', '') : '--:--.--'}
                                                </span>
                                                <p className={`flex-1 text-sm font-medium ${isCurrent ? 'text-[#c68cfa]' : (isDone ? 'text-white' : 'text-white/40')}`}>
                                                    {line.text}
                                                </p>
                                                {isDone && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            const n = [...syncedLines];
                                                            n[idx].time = -1;
                                                            setSyncedLines(n);
                                                        }}
                                                        className="text-gray-500 hover:text-red-400 p-1 bg-white/5 rounded-md"
                                                    >
                                                        <IoTrash size={14} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        <div className="space-y-3 p-4 bg-black rounded-3xl border border-white/5 shadow-2xl">
                            <button
                                onClick={addTimestamp}
                                disabled={syncedLines.length === 0 || !isPlaying}
                                className="w-full py-4 bg-white text-black font-black rounded-2xl hover:scale-[1.02] active:scale-95 transition-all text-lg flex items-center justify-center gap-2 disabled:opacity-20 disabled:scale-100"
                            >
                                <IoTime /> ZAMANLA (Space)
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={syncedLines.every(l => l.time === -1)}
                                className="w-full py-3 bg-[#c68cfa] hover:bg-[#d4a5fb] text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-20"
                            >
                                <IoSave /> Kaydet ve Kapat
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Keyboard listener */}
            <EventListener name="keydown" handler={(e: any) => {
                if (e.code === 'Space' && selectedSong && document.activeElement?.tagName !== 'TEXTAREA') {
                    e.preventDefault();
                    if (!isPlaying) audioRef.current?.play();
                    else addTimestamp();
                }
            }} />
        </div>
    );
}

function EventListener({ name, handler }: { name: string, handler: any }) {
    useEffect(() => {
        window.addEventListener(name, handler);
        return () => window.removeEventListener(name, handler);
    }, [name, handler]);
    return null;
}
