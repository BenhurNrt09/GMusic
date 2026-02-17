'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { IoChevronBack, IoChevronForward, IoPersonCircle } from 'react-icons/io5';
import { useRouter } from 'next/navigation';

// ============================================================
// TopBar — Navigation arrows + User menu (links to profile)
// ============================================================

import { supabase } from '@gmusic/database';

const AVATAR_KEY = 'gmusic_avatar';
const USER_EMAIL = 'gulcin@gmusic.com';

export default function TopBar() {
    const router = useRouter();
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
                const { data, error } = await supabase
                    .from('users')
                    .select('avatar_url')
                    .eq('email', USER_EMAIL)
                    .single();

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
        <div className="flex items-center justify-between px-6 py-4 sticky top-0 z-20 bg-gradient-to-b from-[#0f0f0f] to-transparent">
            {/* Navigation arrows */}
            <div className="flex items-center gap-2">
                <button
                    onClick={() => router.back()}
                    className="w-8 h-8 rounded-full bg-black/60 flex items-center justify-center hover:bg-black/80 transition-colors"
                >
                    <IoChevronBack className="text-white text-sm" />
                </button>
                <button
                    onClick={() => router.forward()}
                    className="w-8 h-8 rounded-full bg-black/60 flex items-center justify-center hover:bg-black/80 transition-colors"
                >
                    <IoChevronForward className="text-white text-sm" />
                </button>
            </div>

            {/* User menu — links to profile */}
            <Link
                href="/profile"
                className="w-9 h-9 rounded-full bg-black/60 hover:bg-black/80 transition-colors flex items-center justify-center overflow-hidden"
            >
                {avatar ? (
                    <div className="w-full h-full relative">
                        <Image src={avatar} alt="Profil" fill className="object-cover" />
                    </div>
                ) : (
                    <IoPersonCircle className="text-3xl text-gray-300" />
                )}
            </Link>
        </div>
    );
}

