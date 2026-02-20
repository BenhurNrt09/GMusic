'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@gmusic/database';
import type { Playlist } from '@gmusic/database';
import { IoClose, IoAdd, IoLibrary } from 'react-icons/io5';

interface PlaylistModalProps {
    songId: string;
    onClose: () => void;
    onSuccess?: () => void;
}

export default function PlaylistModal({ songId, onClose, onSuccess }: PlaylistModalProps) {
    const [playlists, setPlaylists] = useState<Playlist[]>([]);
    const [loading, setLoading] = useState(true);
    const [addingTo, setAddingTo] = useState<string | null>(null);

    // Hardcoded user ID
    const USER_ID = '00000000-0000-4000-a000-000000000001';

    useEffect(() => {
        async function fetchPlaylists() {
            const { data } = await supabase
                .from('playlists')
                .select('*')
                .eq('user_id', USER_ID)
                .order('created_at', { ascending: false });
            if (data) setPlaylists(data as Playlist[]);
            setLoading(false);
        }
        fetchPlaylists();
    }, []);

    const addToPlaylist = async (playlistId: string) => {
        setAddingTo(playlistId);
        try {
            const { error } = await (supabase
                .from('playlist_songs') as any)
                .insert({
                    playlist_id: playlistId,
                    song_id: songId,
                    position: 0
                });

            if (error) {
                console.error('Error adding to playlist:', error);
                alert('Çalma listesine eklenirken bir hata oluştu.');
            } else {
                if (onSuccess) onSuccess();
                onClose();
            }
        } catch (err) {
            console.error('Unexpected error:', err);
        } finally {
            setAddingTo(null);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[100] animate-fade-in p-4">
            <div className="bg-[#181818] border border-white/10 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/10">
                    <h2 className="text-xl font-bold text-white uppercase tracking-tighter">Çalma Listesine Ekle</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <IoClose className="text-2xl" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-4 max-h-[60vh] overflow-y-auto scrollbar-thin">
                    {loading ? (
                        <div className="space-y-2 py-4">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-14 bg-white/5 animate-pulse rounded-xl" />
                            ))}
                        </div>
                    ) : playlists.length === 0 ? (
                        <div className="text-center py-12 px-6">
                            <p className="text-gray-400 mb-6 font-medium">Henüz bir çalma listeniz yok.</p>
                        </div>
                    ) : (
                        <div className="grid gap-2">
                            {playlists.map((playlist) => (
                                <button
                                    key={playlist.id}
                                    onClick={() => addToPlaylist(playlist.id)}
                                    disabled={addingTo === playlist.id}
                                    className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition-all group text-left disabled:opacity-50"
                                >
                                    <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0 group-hover:scale-105 transition-transform">
                                        {playlist.cover_url ? (
                                            <img src={playlist.cover_url} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <IoLibrary className="text-gray-500 text-xl" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-white font-bold truncate group-hover:text-[#c68cfa] transition-colors">
                                            {playlist.title}
                                        </h3>
                                        <p className="text-xs text-gray-500 font-medium">
                                            {playlist.is_public ? 'Genel' : 'Özel'}
                                        </p>
                                    </div>
                                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-[#c68cfa] transition-colors">
                                        <IoAdd className="text-white text-lg" />
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
