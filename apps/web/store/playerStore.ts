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
    repeat: 'off' | 'all' | 'one';

    // Right panel
    isRightPanelOpen: boolean;

    // Actions
    playSong: (song: Song, queue?: Song[]) => void;
    togglePlay: () => void;
    setProgress: (progress: number) => void;
    setDuration: (duration: number) => void;
    setVolume: (volume: number) => void;
    toggleMute: () => void;
    toggleShuffle: () => void;
    toggleRepeat: () => void;
    nextSong: () => void;
    prevSong: () => void;
    toggleRightPanel: () => void;
    setRightPanelOpen: (open: boolean) => void;
    addToQueue: (song: Song) => void;
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
    repeat: 'off',
    isRightPanelOpen: false,

    playSong: (song, queue) => {
        const newQueue = queue || [song];
        const index = newQueue.findIndex((s) => s.id === song.id);
        set({
            currentSong: song,
            queue: newQueue,
            queueIndex: index >= 0 ? index : 0,
            isPlaying: true,
            progress: 0,
        });
        saveToStorage({ currentSong: song, queue: newQueue, queueIndex: index >= 0 ? index : 0, progress: 0, volume: get().volume });
        trackRecentlyPlayed(song);
    },

    togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),

    setProgress: (progress) => {
        set({ progress });
        const { currentSong, queue, queueIndex, volume } = get();
        saveToStorage({ currentSong, queue, queueIndex, progress, volume });
    },

    setDuration: (duration) => set({ duration }),

    setVolume: (volume) => {
        set({ volume, isMuted: volume === 0 });
        const { currentSong, queue, queueIndex, progress } = get();
        saveToStorage({ currentSong, queue, queueIndex, progress, volume });
    },

    toggleMute: () =>
        set((state) => ({
            isMuted: !state.isMuted,
            volume: !state.isMuted ? 0 : state.volume || 0.7,
        })),

    toggleShuffle: () => set((state) => ({ shuffle: !state.shuffle })),

    toggleRepeat: () =>
        set((state) => ({
            repeat: state.repeat === 'off' ? 'all' : state.repeat === 'all' ? 'one' : 'off',
        })),

    nextSong: () => {
        const { queue, queueIndex, shuffle, repeat } = get();
        if (queue.length === 0) return;

        let nextIndex: number;
        if (shuffle && queue.length > 1) {
            // Pick a random index that is NOT the current one
            let newIndex = queueIndex;
            while (newIndex === queueIndex) {
                newIndex = Math.floor(Math.random() * queue.length);
            }
            nextIndex = newIndex;
        } else if (queueIndex < queue.length - 1) {
            nextIndex = queueIndex + 1;
        } else if (repeat === 'all') {
            nextIndex = 0;
        } else {
            // End of queue and no repeat
            set({ isPlaying: false, progress: 0 });
            return;
        }

        const nextSong = queue[nextIndex];
        set({
            currentSong: nextSong,
            queueIndex: nextIndex,
            isPlaying: true,
            progress: 0,
        });
        saveToStorage({ currentSong: nextSong, queue, queueIndex: nextIndex, progress: 0, volume: get().volume });
    },

    prevSong: () => {
        const { queue, queueIndex, progress } = get();
        if (queue.length === 0) return;

        // If past 3 seconds, restart current song
        if (progress > 3) {
            set({ progress: 0 });
            return;
        }

        const prevIndex = queueIndex > 0 ? queueIndex - 1 : queue.length - 1;
        set({
            currentSong: queue[prevIndex],
            queueIndex: prevIndex,
            isPlaying: true,
            progress: 0,
        });
        saveToStorage({ currentSong: queue[prevIndex], queue, queueIndex: prevIndex, progress: 0, volume: get().volume });
    },

    toggleRightPanel: () =>
        set((state) => ({ isRightPanelOpen: !state.isRightPanelOpen })),

    setRightPanelOpen: (open) => set({ isRightPanelOpen: open }),

    addToQueue: (song) =>
        set((state) => ({ queue: [...state.queue, song] })),

    restoreFromStorage: () => {
        const saved = loadFromStorage();
        if (!saved || !saved.currentSong) return;
        set({
            currentSong: saved.currentSong,
            queue: saved.queue || [saved.currentSong],
            queueIndex: saved.queueIndex ?? 0,
            progress: saved.progress ?? 0,
            volume: saved.volume ?? 0.7,
            isPlaying: false, // don't auto-play, user presses play
        });
    },
}));
