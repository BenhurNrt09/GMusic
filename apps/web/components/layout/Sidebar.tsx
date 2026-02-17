'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { supabase } from '@gmusic/database';
import type { Playlist } from '@gmusic/database';
import {
    IoHomeSharp,
    IoSearch,
    IoLibrary,
    IoHeart,
    IoMusicalNotes,
    IoChevronBack,
    IoChevronForward,
    IoAdd,
} from 'react-icons/io5';

// ============================================================
// Sidebar — Collapsible Spotify-style navigation
// ============================================================

interface SidebarProps {
    collapsed: boolean;
    onToggle: () => void;
}

const navItems = [
    { href: '/', icon: IoHomeSharp, label: 'Ana Sayfa' },
    { href: '/search', icon: IoSearch, label: 'Ara' },
    { href: '/library', icon: IoLibrary, label: 'Kitaplığın' },
];

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
    const pathname = usePathname();
    const [playlists, setPlaylists] = useState<Playlist[]>([]);

    useEffect(() => {
        async function fetchPlaylists() {
            const { data } = await supabase
                .from('playlists')
                .select('*')
                .eq('is_public', true)
                .order('created_at', { ascending: false })
                .limit(10);
            if (data) setPlaylists(data as Playlist[]);
        }
        fetchPlaylists();
    }, []);

    return (
        <aside
            className={`flex flex-col h-full bg-black transition-all duration-300 ease-in-out ${collapsed ? 'w-[72px]' : 'w-[280px]'
                }`}
        >
            {/* Logo */}
            <div className="flex items-center gap-3 px-5 pt-6 pb-4">
                <Link href="/" className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                        <Image
                            src="/logo.png"
                            alt="Logo"
                            width={collapsed ? 32 : 120}
                            height={32}
                            className={`${collapsed ? 'w-8 h-8' : 'h-8 w-auto'} object-contain`}
                        />
                    </div>
                </Link>
            </div>

            {/* Main navigation */}
            <nav className="px-3 space-y-1">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-4 px-3 py-2.5 rounded-lg transition-all duration-200 group ${isActive
                                ? 'bg-white/10 text-white'
                                : 'text-gray-400 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            <item.icon
                                className={`text-xl flex-shrink-0 ${isActive ? 'text-[#c68cfa]' : 'group-hover:text-white'
                                    }`}
                            />
                            {!collapsed && (
                                <span className="text-sm font-medium">{item.label}</span>
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* Divider */}
            <div className="mx-5 my-4 border-t border-white/10" />

            {/* Library section */}
            <div className="flex-1 overflow-y-auto scrollbar-thin px-3">
                {/* Liked Songs */}
                <Link
                    href="/liked"
                    className={`flex items-center gap-4 px-3 py-2.5 rounded-lg transition-all duration-200 group ${pathname === '/liked'
                        ? 'bg-white/10 text-white'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                        }`}
                >
                    <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-blue-400 rounded flex items-center justify-center flex-shrink-0">
                        <IoHeart className="text-white text-xs" />
                    </div>
                    {!collapsed && (
                        <span className="text-sm font-medium">Beğenilen Şarkılar</span>
                    )}
                </Link>

                {/* Playlists header */}
                {!collapsed && (
                    <div className="flex items-center justify-between px-3 mt-4 mb-2">
                        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                            Çalma Listeleri
                        </span>
                        <button className="text-gray-400 hover:text-white transition-colors">
                            <IoAdd className="text-lg" />
                        </button>
                    </div>
                )}

                {/* Real playlists from database */}
                {!collapsed && (
                    <div className="space-y-1">
                        {playlists.map((playlist) => {
                            const isActive = pathname === `/playlist/${playlist.id}`;
                            return (
                                <Link
                                    key={playlist.id}
                                    href={`/playlist/${playlist.id}`}
                                    className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-all duration-200 line-clamp-1 block ${isActive
                                        ? 'text-white bg-white/10'
                                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                                        }`}
                                >
                                    {playlist.title}
                                </Link>
                            );
                        })}
                        {playlists.length === 0 && (
                            <p className="px-3 py-2 text-xs text-gray-600">Henüz playlist yok</p>
                        )}
                    </div>
                )}
            </div>

            {/* Collapse toggle */}
            <div className="px-3 pb-4">
                <button
                    onClick={onToggle}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-all duration-200"
                >
                    {collapsed ? (
                        <IoChevronForward className="text-lg" />
                    ) : (
                        <>
                            <IoChevronBack className="text-lg" />
                            <span className="text-xs font-medium">Daralt</span>
                        </>
                    )}
                </button>
            </div>
        </aside>
    );
}

