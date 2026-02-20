// ============================================================
// GMusic — Database Types
// All Supabase table types defined here for shared usage
// ============================================================

export interface User {
    id: string;
    email: string;
    username: string | null;
    avatar_url: string | null;
    role: 'user' | 'admin';
    created_at: string;
}

export interface Artist {
    id: string;
    name: string;
    image_url: string | null;
    bio: string | null;
    monthly_listeners: number;
    created_at: string;
}

export interface Album {
    id: string;
    title: string;
    artist_id: string;
    cover_url: string | null;
    release_date: string | null;
    created_at: string;
    // Joined fields
    artist?: Artist;
}

export interface Song {
    id: string;
    title: string;
    artist_id: string;
    album_id: string | null;
    audio_url: string;
    cover_url: string | null;
    duration: number; // seconds
    plays: number;
    lyrics?: string | null;
    video_url?: string | null;
    created_at: string;
    // Joined fields
    artist?: Artist;
    album?: Album;
}

export interface Playlist {
    id: string;
    title: string;
    description: string | null;
    cover_url: string | null;
    user_id: string;
    is_public: boolean;
    created_at: string;
    // Joined
    songs?: Song[];
    song_count?: number;
}

export interface PlaylistSong {
    id: string;
    playlist_id: string;
    song_id: string;
    position: number;
    added_at: string;
    // Joined
    song?: Song;
}

export interface Like {
    id: string;
    user_id: string;
    song_id: string;
    created_at: string;
    // Joined
    song?: Song;
}

export interface RecentlyPlayed {
    id: string;
    user_id: string;
    song_id: string;
    played_at: string;
    // Joined
    song?: Song;
}

// Database schema type for Supabase client
export interface Database {
    public: {
        Tables: {
            users: { Row: User; Insert: Omit<User, 'id' | 'created_at'>; Update: Partial<Omit<User, 'id'>>; Relationships: [] };
            artists: { Row: Artist; Insert: Omit<Artist, 'id' | 'created_at'>; Update: Partial<Omit<Artist, 'id'>>; Relationships: [] };
            albums: { Row: Omit<Album, 'artist'>; Insert: Omit<Album, 'id' | 'created_at' | 'artist'>; Update: Partial<Omit<Album, 'id' | 'artist'>>; Relationships: [] };
            songs: { Row: Omit<Song, 'artist' | 'album'>; Insert: Omit<Song, 'id' | 'created_at' | 'artist' | 'album'>; Update: Partial<Omit<Song, 'id' | 'artist' | 'album'>>; Relationships: [] };
            playlists: { Row: Omit<Playlist, 'songs' | 'song_count'>; Insert: Omit<Playlist, 'id' | 'created_at' | 'songs' | 'song_count'>; Update: Partial<Omit<Playlist, 'id' | 'songs' | 'song_count'>>; Relationships: [] };
            playlist_songs: { Row: Omit<PlaylistSong, 'song'>; Insert: Omit<PlaylistSong, 'id' | 'added_at' | 'song'>; Update: Partial<Omit<PlaylistSong, 'id' | 'song'>>; Relationships: [] };
            likes: { Row: Omit<Like, 'song'>; Insert: Omit<Like, 'id' | 'created_at' | 'song'>; Update: Partial<Omit<Like, 'id' | 'song'>>; Relationships: [] };
            recently_played: { Row: Omit<RecentlyPlayed, 'song'>; Insert: Omit<RecentlyPlayed, 'id' | 'played_at' | 'song'>; Update: Partial<Omit<RecentlyPlayed, 'id' | 'song'>>; Relationships: [] };
        };
        Views: Record<string, never>;
        Functions: Record<string, never>;
        Enums: Record<string, never>;
    };
}

