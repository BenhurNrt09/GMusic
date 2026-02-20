'use client';

import { create } from 'zustand';
import { supabase } from '@gmusic/database';
import type { Song } from '@gmusic/database';

// ============================================================
// Player Store — Zustand state management for audio player
// ============================================================

const STORAGE_KEY = 'gmusic_player_state';

interface SavedPlayerState {
    currentSong: Song | null;
    queue: Song[];
    queueIndex: number;
    progress: number;
    volume: number;
    isVideoMode: boolean;
}

let saveTimer: ReturnType<typeof setTimeout> | null = null;

function saveToStorage(state: SavedPlayerState) {
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        } catch { /* storage full or unavailable */ }
    }, 500);
}

function loadFromStorage(): SavedPlayerState | null {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        return JSON.parse(raw) as SavedPlayerState;
    } catch {
        return null;
    }
}

const HISTORY_SONGS_KEY = 'gmusic_recent_songs';
const HISTORY_ARTISTS_KEY = 'gmusic_recent_artists';

async function trackRecentlyPlayed(song: Song) {
    try {
        // Local state for immediate UI
        const songs = JSON.parse(localStorage.getItem(HISTORY_SONGS_KEY) || '[]');
        const newRecentSong = {
            id: song.id,
            title: song.title,
            cover_url: song.cover_url,
            artist_name: song.artist?.name || 'Bilinmiyor',
            played_at: Date.now(),
        };
        const filtered = songs.filter((s: any) => s.id !== song.id);
        filtered.unshift(newRecentSong);
        localStorage.setItem(HISTORY_SONGS_KEY, JSON.stringify(filtered.slice(0, 20)));

        // Sync to Supabase if logged in
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            await (supabase.from('recently_played') as any).upsert({
                user_id: user.id,
                song_id: song.id,
                played_at: new Date().toISOString()
            }, { onConflict: 'user_id,song_id' });
        }

        // Track artists locally
        if (song.artist) {
            const artists = JSON.parse(localStorage.getItem(HISTORY_ARTISTS_KEY) || '[]');
            const newArtist = {
                id: song.artist_id || song.artist.id,
                name: song.artist.name,
                image_url: song.artist.image_url,
                played_at: Date.now(),
            };
            const filteredArtists = artists.filter((a: any) => a.id !== newArtist.id);
            filteredArtists.unshift(newArtist);
            localStorage.setItem(HISTORY_ARTISTS_KEY, JSON.stringify(filteredArtists.slice(0, 10)));
        }
    } catch { /* ignore */ }
}


async function incrementPlayCount(songId: string) {
    try {
        await (supabase.rpc as any)('increment_song_plays', { song_id: songId });
    } catch (error) {
        console.error('Error incrementing play count:', error);
    }
}

interface PlayerState {
    // Current track
    currentSong: Song | null;
    queue: Song[];
    queueIndex: number;

    // Playback state
    isPlaying: boolean;
    progress: number; // seconds
    duration: number;
    volume: number; // 0-1
    isMuted: boolean;

    // Modes
    shuffle: boolean;
    shuffledOrder: number[]; // Index array for shuffle cycle
    repeat: 'off' | 'all' | 'one';
    isVideoMode: boolean;

    // Right panel
    isRightPanelOpen: boolean;

    // Mobile full-screen player
    isMobilePlayerOpen: boolean;

    // Actions
    playSong: (song: Song, queue?: Song[]) => void;
    togglePlay: () => void;
    setProgress: (progress: number) => void;
    setDuration: (duration: number) => void;
    setVolume: (volume: number) => void;
    setVideoMode: (enabled: boolean) => void;
    toggleMute: () => void;
    toggleShuffle: () => void;
    toggleRepeat: () => void;
    nextSong: () => void;
    prevSong: () => void;
    toggleRightPanel: () => void;
    setRightPanelOpen: (open: boolean) => void;
    setMobilePlayerOpen: (open: boolean) => void;
    addToQueue: (song: Song) => void;
    removeFromQueue: (songId: string) => void;
    clearQueue: () => void;
    setQueue: (queue: Song[]) => void;
    restoreFromStorage: () => void;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
    currentSong: null,
    queue: [],
    queueIndex: -1,
    isPlaying: false,
    progress: 0,
    duration: 0,
    volume: 0.7,
    isMuted: false,
    shuffle: false,
    shuffledOrder: [],
    repeat: 'off',
    isRightPanelOpen: false,
    isVideoMode: false,
    isMobilePlayerOpen: false,

    playSong: (song, queue) => {
        const { queue: currentQueue } = get();
        let newQueue = queue;
        let index = -1;

        if (!newQueue) {
            index = currentQueue.findIndex(s => s.id === song.id);
            if (index >= 0) {
                newQueue = currentQueue;
            } else {
                newQueue = [song];
                index = 0;
            }
        } else {
            index = newQueue.findIndex((s) => s.id === song.id);
        }

        const processedSong = {
            ...song,
        };

        set({
            currentSong: processedSong,
            queue: newQueue,
            queueIndex: index >= 0 ? index : 0,
            isPlaying: true,
            progress: 0,
            isVideoMode: !!processedSong.video_url // Priority to video if it exists
        });

        saveToStorage({
            currentSong: song,
            queue: newQueue,
            queueIndex: index >= 0 ? index : 0,
            progress: 0,
            volume: get().volume,
            isVideoMode: get().isVideoMode
        });

        trackRecentlyPlayed(song);
        incrementPlayCount(song.id);
    },

    togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),

    setProgress: (progress) => {
        set({ progress });
        const { currentSong, queue, queueIndex, volume, isVideoMode } = get();
        saveToStorage({ currentSong, queue, queueIndex, progress, volume, isVideoMode });
    },

    setDuration: (duration) => set({ duration }),

    setVolume: (volume) => {
        set({ volume, isMuted: volume === 0 });
        const { currentSong, queue, queueIndex, progress, isVideoMode } = get();
        saveToStorage({ currentSong, queue, queueIndex, progress, volume, isVideoMode });
    },

    setVideoMode: (enabled: boolean) => {
        set({ isVideoMode: enabled });
        const { currentSong, queue, queueIndex, progress, volume } = get();
        saveToStorage({ currentSong, queue, queueIndex, progress, volume, isVideoMode: enabled });
    },

    toggleMute: () =>
        set((state) => ({
            isMuted: !state.isMuted,
            volume: !state.isMuted ? 0 : state.volume || 0.7,
        })),

    toggleShuffle: () => {
        const { shuffle, queue, queueIndex } = get();
        const newShuffle = !shuffle;

        if (newShuffle && queue.length > 0) {
            const indices = Array.from({ length: queue.length }, (_, i) => i)
                .filter(i => i !== queueIndex);

            for (let i = indices.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [indices[i], indices[j]] = [indices[j], indices[i]];
            }

            set({ shuffle: true, shuffledOrder: [queueIndex, ...indices] });
        } else {
            set({ shuffle: false, shuffledOrder: [] });
        }
    },

    toggleRepeat: () =>
        set((state) => ({
            repeat: state.repeat === 'off' ? 'all' : state.repeat === 'all' ? 'one' : 'off',
        })),

    nextSong: () => {
        const { queue, queueIndex, shuffle, shuffledOrder, repeat, isVideoMode } = get();
        if (queue.length === 0) return;

        let nextIndex: number;
        if (shuffle && shuffledOrder.length > 0) {
            const currentOrderIdx = shuffledOrder.indexOf(queueIndex);
            if (currentOrderIdx < shuffledOrder.length - 1) {
                nextIndex = shuffledOrder[currentOrderIdx + 1];
            } else if (repeat === 'all') {
                const indices = Array.from({ length: queue.length }, (_, i) => i);
                for (let i = indices.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [indices[i], indices[j]] = [indices[j], indices[i]];
                }
                set({ shuffledOrder: indices });
                nextIndex = indices[0];
            } else {
                set({ isPlaying: false, progress: 0 });
                return;
            }
        } else if (queueIndex < queue.length - 1) {
            nextIndex = queueIndex + 1;
        } else if (repeat === 'all') {
            nextIndex = 0;
        } else {
            set({ isPlaying: false, progress: 0 });
            return;
        }

        const nextSong = queue[nextIndex];

        set({
            currentSong: nextSong,
            queueIndex: nextIndex,
            isPlaying: true,
            progress: 0,
            isVideoMode: !!nextSong.video_url // Priority to video
        });
        saveToStorage({
            currentSong: nextSong,
            queue,
            queueIndex: nextIndex,
            progress: 0,
            volume: get().volume,
            isVideoMode: !!nextSong.video_url
        });
    },

    prevSong: () => {
        const { queue, queueIndex, shuffle, shuffledOrder, progress } = get();
        if (queue.length === 0) return;

        if (progress > 3) {
            set({ progress: 0 });
            return;
        }

        let prevIndex: number;
        if (shuffle && shuffledOrder.length > 0) {
            const currentOrderIdx = shuffledOrder.indexOf(queueIndex);
            if (currentOrderIdx > 0) {
                prevIndex = shuffledOrder[currentOrderIdx - 1];
            } else {
                prevIndex = shuffledOrder[shuffledOrder.length - 1];
            }
        } else {
            prevIndex = queueIndex > 0 ? queueIndex - 1 : queue.length - 1;
        }

        const prevSong = queue[prevIndex];

        set({
            currentSong: prevSong,
            queueIndex: prevIndex,
            isPlaying: true,
            progress: 0,
            isVideoMode: !!prevSong.video_url
        });
        saveToStorage({
            currentSong: prevSong,
            queue,
            queueIndex: prevIndex,
            progress: 0,
            volume: get().volume,
            isVideoMode: !!prevSong.video_url
        });
    },

    toggleRightPanel: () =>
        set((state) => ({ isRightPanelOpen: !state.isRightPanelOpen })),

    setRightPanelOpen: (open) => set({ isRightPanelOpen: open }),

    setMobilePlayerOpen: (open) => set({ isMobilePlayerOpen: open }),

    addToQueue: (song) =>
        set((state) => ({ queue: [...state.queue, song] })),

    removeFromQueue: (songId) => {
        const { queue, queueIndex, currentSong, isVideoMode } = get();
        const indexToRemove = queue.findIndex(s => s.id === songId);
        if (indexToRemove === -1) return;

        const newQueue = queue.filter(s => s.id !== songId);
        let newIndex = queueIndex;
        let newCurrentSong = currentSong;

        if (indexToRemove === queueIndex) {
            if (newQueue.length > 0) {
                const nextIdx = indexToRemove % newQueue.length;
                newCurrentSong = newQueue[nextIdx];
                newIndex = nextIdx;
            } else {
                newCurrentSong = null;
                newIndex = -1;
            }
        } else if (indexToRemove < queueIndex) {
            newIndex = queueIndex - 1;
        }

        set({
            queue: newQueue,
            queueIndex: newIndex,
            currentSong: newCurrentSong,
            isPlaying: newQueue.length > 0 && indexToRemove === queueIndex ? get().isPlaying : get().isPlaying
        });

        saveToStorage({
            currentSong: newCurrentSong,
            queue: newQueue,
            queueIndex: newIndex,
            progress: get().progress,
            volume: get().volume,
            isVideoMode
        });
    },

    clearQueue: () => {
        const { currentSong, volume, isVideoMode } = get();
        const newQueue = currentSong ? [currentSong] : [];
        set({ queue: newQueue, queueIndex: currentSong ? 0 : -1 });

        saveToStorage({
            currentSong,
            queue: newQueue,
            queueIndex: currentSong ? 0 : -1,
            progress: get().progress,
            volume,
            isVideoMode
        });
    },

    setQueue: (queue) => set({ queue }),

    restoreFromStorage: () => {
        const saved = loadFromStorage();
        if (!saved || !saved.currentSong) return;
        set({
            currentSong: saved.currentSong,
            queue: saved.queue || [saved.currentSong],
            queueIndex: saved.queueIndex ?? 0,
            progress: saved.progress ?? 0,
            volume: saved.volume ?? 0.7,
            isVideoMode: saved.isVideoMode ?? false,
            isPlaying: false,
        });
    },
}));

