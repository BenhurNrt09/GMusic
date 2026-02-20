'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { IoChevronBack, IoChevronForward } from 'react-icons/io5';
import { useRouter, usePathname } from 'next/navigation';

// ============================================================
// TopBar — Navigation arrows
// ============================================================

import { supabase } from '@gmusic/database';

const AVATAR_KEY = 'gmusic_avatar';
const USER_EMAIL = 'gulcin@gmusic.com';

export default function TopBar() {
    const router = useRouter();
    const pathname = usePathname();
    const isHomePage = pathname === '/';
    const [avatar, setAvatar] = useState<string | null>(null);

    useEffect(() => {
        const loadAvatar = () => {
            const saved = localStorage.getItem(AVATAR_KEY);
            if (saved) setAvatar(saved);
        };
        loadAvatar();

        // Sync from database
        const syncAvatar = async () => {
            try {
                const { data, error } = await (supabase
                    .from('users') as any)
                    .select('avatar_url')
                    .eq('email', USER_EMAIL)
                    .maybeSingle();

                if (!error && data?.avatar_url) {
                    setAvatar(data.avatar_url);
                    localStorage.setItem(AVATAR_KEY, data.avatar_url);
                }
            } catch (err) {
                console.error('TopBar avatar sync error:', err);
            }
        };
        syncAvatar();

        window.addEventListener('gmusic_avatar_updated', loadAvatar);
        return () => window.removeEventListener('gmusic_avatar_updated', loadAvatar);
    }, []);

    return (
        <div className="flex items-center justify-between px-4 md:px-6 py-4 sticky top-0 z-50 bg-gradient-to-b from-[#0f0f0f] via-[#0f0f0f]/80 to-transparent backdrop-blur-[2px]">
            {/* Mobile Back Button — Prominent on small screens, hidden on home */}
            <div className="flex items-center gap-2">
                {!isHomePage && (
                    <button
                        onClick={() => router.back()}
                        className="md:hidden w-11 h-11 rounded-full bg-black/70 backdrop-blur-xl flex items-center justify-center border border-white/20 active:scale-90 active:bg-black transition-all shadow-xl"
                    >
                        <IoChevronBack className="text-white text-2xl" />
                    </button>
                )}

                {/* Desktop Navigation arrows */}
                <div className="hidden md:flex items-center gap-2">
                    {!isHomePage && (
                        <button
                            onClick={() => router.back()}
                            className="w-8 h-8 rounded-full bg-black/60 flex items-center justify-center hover:bg-black/80 transition-colors"
                        >
                            <IoChevronBack className="text-white text-sm" />
                        </button>
                    )}
                    <button
                        onClick={() => router.forward()}
                        className="w-8 h-8 rounded-full bg-black/60 flex items-center justify-center hover:bg-black/80 transition-colors"
                    >
                        <IoChevronForward className="text-white text-sm" />
                    </button>
                </div>
            </div>

            {/* Profile Bubble */}
            <div className="flex items-center gap-3">
                <button
                    onClick={() => router.push('/profile')}
                    className="w-8 h-8 rounded-full overflow-hidden border border-white/10 hover:border-white/30 transition-colors bg-white/5 flex items-center justify-center group"
                >
                    {avatar ? (
                        <Image
                            src={avatar}
                            alt="Profile"
                            width={32}
                            height={32}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#c68cfa] to-purple-700">
                            <span className="text-white text-xs font-bold">G</span>
                        </div>
                    )}
                </button>
            </div>
        </div>
    );
}

