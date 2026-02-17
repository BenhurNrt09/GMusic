'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { IoHomeSharp, IoSearch, IoLibrary, IoPersonCircle } from 'react-icons/io5';

// ============================================================
// MobileBottomNav — Spotify-style bottom tab bar (mobile only)
// ============================================================

const AVATAR_KEY = 'gmusic_avatar';

const tabs = [
    { href: '/', icon: IoHomeSharp, label: 'Ana sayfa' },
    { href: '/search', icon: IoSearch, label: 'Ara' },
    { href: '/library', icon: IoLibrary, label: 'Kitaplığın' },
];

export default function MobileBottomNav() {
    const pathname = usePathname();
    const [avatar, setAvatar] = useState<string | null>(null);

    useEffect(() => {
        const saved = localStorage.getItem(AVATAR_KEY);
        if (saved) setAvatar(saved);
    }, []);

    const isProfileActive = pathname === '/profile';

    return (
        <nav className="flex md:hidden items-center justify-around bg-[#121212] border-t border-white/5 px-2 py-2 safe-area-bottom">
            {tabs.map((tab) => {
                const isActive = pathname === tab.href;
                return (
                    <Link
                        key={tab.href}
                        href={tab.href}
                        className="flex flex-col items-center gap-1 px-3 py-1"
                    >
                        <tab.icon
                            className={`text-2xl transition-colors ${isActive ? 'text-white' : 'text-gray-500'}`}
                        />
                        <span
                            className={`text-[10px] font-medium transition-colors ${isActive ? 'text-white' : 'text-gray-500'}`}
                        >
                            {tab.label}
                        </span>
                    </Link>
                );
            })}

            {/* Profile tab with avatar */}
            <Link href="/profile" className="flex flex-col items-center gap-1 px-3 py-1">
                <div className={`w-6 h-6 rounded-full overflow-hidden flex items-center justify-center ${isProfileActive ? 'ring-2 ring-white' : ''}`}>
                    {avatar ? (
                        <div className="w-full h-full relative">
                            <Image src={avatar} alt="Profil" fill className="object-cover" />
                        </div>
                    ) : (
                        <IoPersonCircle className={`text-3xl transition-colors ${isProfileActive ? 'text-white' : 'text-gray-500'}`} />
                    )}
                </div>
                <span className={`text-[10px] font-medium transition-colors ${isProfileActive ? 'text-white' : 'text-gray-500'}`}>
                    Profil
                </span>
            </Link>
        </nav>
    );
}

