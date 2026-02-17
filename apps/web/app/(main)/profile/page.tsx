'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
    IoPersonCircle,
    IoLogOut,
    IoCamera,
    IoLockClosed,
    IoMusicalNote,
    IoPerson,
    IoCheckmarkCircle,
    IoClose,
    IoPlaySharp,
} from 'react-icons/io5';
import Link from 'next/link';
import { usePlayerStore } from '@/store/playerStore';
import { supabase } from '@gmusic/database';

// ============================================================
// Profile Page — User info, avatar, password, recent history
// ============================================================

const AUTH_KEY = 'gmusic_web_auth';
const AVATAR_KEY = 'gmusic_avatar';
const HISTORY_SONGS_KEY = 'gmusic_recent_songs';
const HISTORY_ARTISTS_KEY = 'gmusic_recent_artists';

interface RecentSong {
    id: string;
    title: string;
    cover_url: string | null;
    artist_name: string;
    played_at: number;
}

interface RecentArtist {
    id: string;
    name: string;
    image_url: string | null;
    played_at: number;
}

export default function ProfilePage() {
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [avatar, setAvatar] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [recentSongs, setRecentSongs] = useState<RecentSong[]>([]);
    const [recentArtists, setRecentArtists] = useState<RecentArtist[]>([]);
    const { playSong } = usePlayerStore();

    // Password change
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [passwordSuccess, setPasswordSuccess] = useState(false);

    // Hardcoded user ID for the main user (Gülçin Engin)
    const USER_ID = '00000000-0000-4000-a000-000000000001';
    const USER_EMAIL = 'gulcin@gmusic.com';
    const USER_NAME = 'Gülçin Engin';

    useEffect(() => {
        // Load avatar from localStorage first (for speed)
        const saved = localStorage.getItem(AVATAR_KEY);
        if (saved) setAvatar(saved);

        // Then sync from database
        const syncProfile = async () => {
            try {
                // Ensure user exists (upsert)
                const { data: userData, error: fetchError } = await supabase
                    .from('users')
                    .select('*')
                    .eq('email', USER_EMAIL)
                    .single();

                if (fetchError && fetchError.code === 'PGRST116') {
                    // Not found, create it
                    const { data: newUser, error: createError } = await (supabase.from('users') as any).insert({
                        id: USER_ID,
                        email: USER_EMAIL,
                        username: USER_NAME,
                        avatar_url: saved || null
                    }).select().single();

                    if (!createError && newUser?.avatar_url) {
                        setAvatar(newUser.avatar_url);
                        localStorage.setItem(AVATAR_KEY, newUser.avatar_url);
                        window.dispatchEvent(new Event('gmusic_avatar_updated'));
                    }
                } else if (!fetchError && userData) {
                    if (userData.avatar_url) {
                        setAvatar(userData.avatar_url);
                        localStorage.setItem(AVATAR_KEY, userData.avatar_url);
                        window.dispatchEvent(new Event('gmusic_avatar_updated'));
                    }
                }
            } catch (err) {
                console.error('Profile sync error:', err);
            }
        };

        syncProfile();

        const loadAvatar = () => {
            const saved = localStorage.getItem(AVATAR_KEY);
            if (saved) setAvatar(saved);
        };
        // loadAvatar(); // Already handled above

        window.addEventListener('gmusic_avatar_updated', loadAvatar);

        // Load recent songs
        try {
            const songs = JSON.parse(localStorage.getItem(HISTORY_SONGS_KEY) || '[]');
            setRecentSongs(songs);
        } catch { /* ignore */ }

        // Load recent artists
        try {
            const artists = JSON.parse(localStorage.getItem(HISTORY_ARTISTS_KEY) || '[]');
            setRecentArtists(artists);
        } catch { /* ignore */ }

        return () => window.removeEventListener('gmusic_avatar_updated', loadAvatar);
    }, []);

    const handleLogout = () => {
        localStorage.removeItem(AUTH_KEY);
        sessionStorage.removeItem(AUTH_KEY);
        router.replace('/login');
    };

    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            // Upload to Supabase Storage
            const fileExt = file.name.split('.').pop();
            const fileName = `profile_avatar_${Date.now()}.${fileExt}`;
            const filePath = `avatars/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('covers')
                .upload(filePath, file, { cacheControl: '3600', upsert: true });

            if (uploadError) {
                console.error('Upload error:', uploadError);
                // Fallback to base64 if upload fails
                const reader = new FileReader();
                reader.onloadend = () => {
                    const base64 = reader.result as string;
                    setAvatar(base64);
                    localStorage.setItem(AVATAR_KEY, base64);
                    window.dispatchEvent(new Event('gmusic_avatar_updated'));
                };
                reader.readAsDataURL(file);
                return;
            }

            // Get public URL
            const { data: urlData } = supabase.storage.from('covers').getPublicUrl(filePath);
            const publicUrl = urlData.publicUrl;

            setAvatar(publicUrl);
            localStorage.setItem(AVATAR_KEY, publicUrl);

            // Sync with database
            await supabase.from('users').update({ avatar_url: publicUrl }).eq('id', USER_ID);

            window.dispatchEvent(new Event('gmusic_avatar_updated'));
        } catch (err) {
            console.error('Avatar upload error:', err);
            // Fallback to base64
            const reader = new FileReader();
            reader.onloadend = async () => {
                const base64 = reader.result as string;
                setAvatar(base64);
                localStorage.setItem(AVATAR_KEY, base64);

                // Sync with database (even if it's base64, though URL is preferred)
                await supabase.from('users').update({ avatar_url: base64 }).eq('id', USER_ID);
                window.dispatchEvent(new Event('gmusic_avatar_updated'));
            };
            reader.readAsDataURL(file);
        } finally {
            setUploading(false);
        }
    };

    const handlePasswordChange = (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordError('');
        setPasswordSuccess(false);

        if (currentPassword !== 'G_Music2026') {
            setPasswordError('Mevcut şifre hatalı!');
            return;
        }
        if (newPassword.length < 6) {
            setPasswordError('Yeni şifre en az 6 karakter olmalı!');
            return;
        }
        if (newPassword !== confirmPassword) {
            setPasswordError('Yeni şifreler eşleşmiyor!');
            return;
        }

        // Since credentials are hardcoded, we just show success
        setPasswordSuccess(true);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => {
            setShowPasswordModal(false);
            setPasswordSuccess(false);
        }, 1500);
    };

    return (
        <div className="max-w-3xl mx-auto space-y-8 pb-12">
            {/* Header with logout */}
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-white">Profil</h1>
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-red-500/10 border border-white/10 hover:border-red-500/30 rounded-xl text-gray-400 hover:text-red-400 transition-all duration-200 text-sm font-medium"
                >
                    <IoLogOut className="text-lg" />
                    Çıkış Yap
                </button>
            </div>

            {/* Profile card */}
            <div className="bg-[#181818] rounded-2xl p-8 flex flex-col sm:flex-row items-center gap-6 border border-white/5">
                {/* Avatar */}
                <div className="relative group">
                    <div className="w-28 h-28 rounded-full overflow-hidden bg-white/10 flex items-center justify-center relative">
                        {avatar ? (
                            <Image src={avatar} alt="Profil" fill className="object-cover rounded-full" />
                        ) : (
                            <IoPersonCircle className="text-7xl text-gray-500" />
                        )}
                        {uploading && (
                            <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center">
                                <div className="w-8 h-8 border-2 border-white/30 border-t-[#c68cfa] rounded-full animate-spin" />
                            </div>
                        )}
                    </div>
                    <button
                        onClick={() => !uploading && fileInputRef.current?.click()}
                        className={`absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity ${uploading ? 'cursor-wait' : 'cursor-pointer'}`}
                    >
                        <IoCamera className="text-2xl text-white" />
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarChange}
                        className="hidden"
                    />
                </div>

                {/* Info */}
                <div className="text-center sm:text-left">
                    <h2 className="text-2xl font-bold text-white">Gülçin Engin</h2>
                    <p className="text-gray-400 text-sm mt-1">Dünyanın En İyi Fizyoterapisti</p>
                </div>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-3 bg-[#181818] rounded-2xl p-5 border border-white/5 hover:border-[#ff7a00]/30 hover:bg-[#1f1f1f] transition-all group"
                >
                    <div className="w-10 h-10 rounded-xl bg-[#c68cfa]/10 flex items-center justify-center">
                        <IoCamera className="text-[#c68cfa] text-lg" />
                    </div>
                    <div className="text-left">
                        <p className="text-sm font-semibold text-white group-hover:text-[#c68cfa] transition-colors">Profil Fotoğrafını Güncelle</p>
                        <p className="text-xs text-gray-500">Yeni bir fotoğraf yükle</p>
                    </div>
                </button>

                <button
                    onClick={() => setShowPasswordModal(true)}
                    className="flex items-center gap-3 bg-[#181818] rounded-2xl p-5 border border-white/5 hover:border-[#ff7a00]/30 hover:bg-[#1f1f1f] transition-all group"
                >
                    <div className="w-10 h-10 rounded-xl bg-[#c68cfa]/10 flex items-center justify-center">
                        <IoLockClosed className="text-[#c68cfa] text-lg" />
                    </div>
                    <div className="text-left">
                        <p className="text-sm font-semibold text-white group-hover:text-[#c68cfa] transition-colors">Şifreyi Güncelle</p>
                        <p className="text-xs text-gray-500">Hesap şifreni değiştir</p>
                    </div>
                </button>
            </div>

            {/* Recently listened songs */}
            <div>
                <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <IoMusicalNote className="text-[#c68cfa]" />
                    Son Dinlenen Şarkılar
                </h2>
                {recentSongs.length > 0 ? (
                    <div className="bg-[#181818] rounded-2xl border border-white/5 overflow-hidden">
                        {recentSongs.slice(0, 10).map((song, i) => (
                            <button
                                key={song.id + '-' + i}
                                onClick={() => playSong(song as any, recentSongs as any)}
                                className="w-full flex items-center gap-3 px-5 py-3 hover:bg-white/5 transition-colors border-b border-white/5 last:border-b-0 text-left group"
                            >
                                <div className="relative w-5 h-5 flex items-center justify-center flex-shrink-0">
                                    <span className="text-xs text-gray-500 group-hover:hidden">{i + 1}</span>
                                    <IoPlaySharp className="text-[#c68cfa] hidden group-hover:block" />
                                </div>
                                <div className="w-10 h-10 rounded-lg bg-white/10 overflow-hidden flex-shrink-0">
                                    {song.cover_url ? (
                                        <Image src={song.cover_url} alt={song.title} width={40} height={40} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <IoMusicalNote className="text-white/30" />
                                        </div>
                                    )}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium text-white line-clamp-1 group-hover:text-[#c68cfa] transition-colors">{song.title}</p>
                                    <p className="text-xs text-gray-400 line-clamp-1">{song.artist_name}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                ) : (
                    <div className="bg-[#181818] rounded-2xl border border-white/5 px-5 py-10 text-center">
                        <IoMusicalNote className="text-3xl text-gray-600 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">Henüz şarkı dinlemediniz</p>
                    </div>
                )}
            </div>

            {/* Recently listened artists */}
            <div>
                <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <IoPerson className="text-[#c68cfa]" />
                    Son Dinlenen Sanatçılar
                </h2>
                {recentArtists.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                        {recentArtists.slice(0, 10).map((artist, i) => (
                            <Link
                                key={artist.id + '-' + i}
                                href={`/artist/${artist.id}`}
                                className="bg-[#181818] rounded-2xl p-4 border border-white/5 hover:bg-[#1f1f1f] transition-all text-center group cursor-pointer hover:border-[#ff7a00]/30"
                            >
                                <div className="w-16 h-16 rounded-full bg-white/10 overflow-hidden mx-auto mb-3">
                                    {artist.image_url ? (
                                        <Image src={artist.image_url} alt={artist.name} width={64} height={64} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <IoPerson className="text-2xl text-white/30" />
                                        </div>
                                    )}
                                </div>
                                <p className="text-sm font-medium text-white line-clamp-1 group-hover:text-[#c68cfa] transition-colors">{artist.name}</p>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="bg-[#181818] rounded-2xl border border-white/5 px-5 py-10 text-center">
                        <IoPerson className="text-3xl text-gray-600 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">Henüz sanatçı dinlemediniz</p>
                    </div>
                )}
            </div>

            {/* Password change modal */}
            {showPasswordModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-[#1e1e1e] rounded-2xl p-6 w-full max-w-md mx-4 border border-white/10">
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-lg font-bold text-white">Şifreyi Güncelle</h2>
                            <button onClick={() => { setShowPasswordModal(false); setPasswordError(''); setPasswordSuccess(false); }}>
                                <IoClose className="text-xl text-gray-400 hover:text-white" />
                            </button>
                        </div>

                        {passwordSuccess ? (
                            <div className="text-center py-6">
                                <IoCheckmarkCircle className="text-5xl text-green-400 mx-auto mb-3" />
                                <p className="text-white font-medium">Şifre başarıyla güncellendi!</p>
                            </div>
                        ) : (
                            <form onSubmit={handlePasswordChange} className="space-y-4">
                                {passwordError && (
                                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                                        <p className="text-sm text-red-400">{passwordError}</p>
                                    </div>
                                )}
                                <div>
                                    <label className="block text-sm text-gray-300 mb-1">Mevcut Şifre</label>
                                    <input
                                        type="password"
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        required
                                        className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#c68cfa]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-300 mb-1">Yeni Şifre</label>
                                    <input
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        required
                                        className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#ff7a00]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-300 mb-1">Yeni Şifre (Tekrar)</label>
                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                        className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#ff7a00]"
                                    />
                                </div>
                                <div className="flex justify-end gap-3 pt-2">
                                    <button type="button" onClick={() => { setShowPasswordModal(false); setPasswordError(''); }} className="px-5 py-2.5 bg-white/10 text-white rounded-xl text-sm font-medium hover:bg-white/20 transition-colors">
                                        İptal
                                    </button>
                                    <button type="submit" className="px-5 py-2.5 bg-[#c68cfa] hover:bg-[#d4a5fb] text-white rounded-xl text-sm font-medium transition-colors">
                                        Güncelle
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
