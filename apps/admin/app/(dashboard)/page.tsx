'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@gmusic/database';
import { IoPeople, IoDisc, IoMusicalNote, IoList, IoTrendingUp, IoEye } from 'react-icons/io5';

// ============================================================
// Admin Dashboard — Stats overview
// ============================================================

interface Stats {
    artists: number;
    albums: number;
    songs: number;
    playlists: number;
}

function StatCard({ icon: Icon, label, value, color }: {
    icon: React.ElementType;
    label: string;
    value: number;
    color: string;
}) {
    return (
        <div className="bg-[#181818] rounded-2xl p-6 hover:bg-[#1e1e1e] transition-colors">
            <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
                    <Icon className="text-2xl text-white" />
                </div>
                <IoTrendingUp className="text-green-400 text-lg" />
            </div>
            <p className="text-3xl font-bold text-white mb-1">{value.toLocaleString()}</p>
            <p className="text-sm text-gray-400">{label}</p>
        </div>
    );
}

export default function DashboardPage() {
    const [stats, setStats] = useState<Stats>({ artists: 0, albums: 0, songs: 0, playlists: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchStats() {
            try {
                const [artists, albums, songs, playlists] = await Promise.all([
                    supabase.from('artists').select('id', { count: 'exact', head: true }),
                    supabase.from('albums').select('id', { count: 'exact', head: true }),
                    supabase.from('songs').select('id', { count: 'exact', head: true }),
                    supabase.from('playlists').select('id', { count: 'exact', head: true }),
                ]);

                setStats({
                    artists: artists.count || 0,
                    albums: albums.count || 0,
                    songs: songs.count || 0,
                    playlists: playlists.count || 0,
                });
            } catch (error) {
                console.error('Error fetching stats:', error);
            } finally {
                setLoading(false);
            }
        }

        fetchStats();
    }, []);

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-white mb-2">Gösterge Paneli</h1>
                <p className="text-gray-400">Tekrar hoş geldiniz! Müzik platformunuzun genel görünümü.</p>
            </div>

            {/* Stats grid */}
            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="h-36 bg-[#181818] animate-pulse rounded-2xl" />
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    <StatCard icon={IoPeople} label="Toplam Sanatçı" value={stats.artists} color="bg-blue-600" />
                    <StatCard icon={IoDisc} label="Toplam Albüm" value={stats.albums} color="bg-purple-600" />
                    <StatCard icon={IoMusicalNote} label="Toplam Şarkı" value={stats.songs} color="bg-[#c68cfa]" />
                    <StatCard icon={IoList} label="Çalma Listeleri" value={stats.playlists} color="bg-emerald-600" />
                </div>
            )}

            {/* Quick actions */}
            <div>
                <h2 className="text-xl font-bold text-white mb-4">Hızlı İşlemler</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <a href="/artists" className="bg-[#181818] hover:bg-[#282828] rounded-2xl p-5 transition-colors group">
                        <IoPeople className="text-2xl text-[#c68cfa] mb-3" />
                        <h3 className="text-sm font-semibold text-white mb-1 group-hover:text-[#c68cfa] transition-colors">Sanatçıları Yönet</h3>
                        <p className="text-xs text-gray-400">Sanatçı ekle, düzenle veya kaldır</p>
                    </a>
                    <a href="/songs" className="bg-[#181818] hover:bg-[#282828] rounded-2xl p-5 transition-colors group">
                        <IoMusicalNote className="text-2xl text-[#c68cfa] mb-3" />
                        <h3 className="text-sm font-semibold text-white mb-1 group-hover:text-[#c68cfa] transition-colors">Şarkıları Yönet</h3>
                        <p className="text-xs text-gray-400">Müzik yükle ve düzenle</p>
                    </a>
                    <a href="/uploads" className="bg-[#181818] hover:bg-[#282828] rounded-2xl p-5 transition-colors group">
                        <IoEye className="text-2xl text-[#c68cfa] mb-3" />
                        <h3 className="text-sm font-semibold text-white mb-1 group-hover:text-[#c68cfa] transition-colors">Dosya Yükle</h3>
                        <p className="text-xs text-gray-400">Müzik ve görsel yükleyin</p>
                    </a>
                </div>
            </div>
        </div>
    );
}
