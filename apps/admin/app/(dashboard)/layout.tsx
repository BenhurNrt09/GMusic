'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import {
    IoMusicalNotes,
    IoGrid,
    IoPeople,
    IoDisc,
    IoMusicalNote,
    IoList,
    IoCloudUpload,
    IoLogOut,
} from 'react-icons/io5';
import { ToastProvider } from '@/components/Toast';

// ============================================================
// Admin Dashboard Layout — Sidebar + Content (with auth guard)
// ============================================================

const AUTH_KEY = 'gmusic_admin_auth';

const navItems = [
    { href: '/', icon: IoGrid, label: 'Gösterge Paneli' },
    { href: '/artists', icon: IoPeople, label: 'Sanatçılar' },
    { href: '/albums', icon: IoDisc, label: 'Albümler' },
    { href: '/songs', icon: IoMusicalNote, label: 'Şarkılar' },
    { href: '/playlists', icon: IoList, label: 'Çalma Listeleri' },
    { href: '/uploads', icon: IoCloudUpload, label: 'Yüklemeler' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const [authChecked, setAuthChecked] = useState(false);

    useEffect(() => {
        const auth = localStorage.getItem(AUTH_KEY);
        if (auth !== 'true') {
            router.replace('/login');
        } else {
            setAuthChecked(true);
        }
    }, [router]);

    const handleLogout = () => {
        localStorage.removeItem(AUTH_KEY);
        router.replace('/login');
    };

    if (!authChecked) {
        return (
            <div className="flex items-center justify-center h-screen bg-dark">
                <div className="w-8 h-8 border-3 border-[#c68cfa]/30 border-t-[#c68cfa] rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <ToastProvider>
            <div className="flex h-screen overflow-hidden bg-dark">
                {/* Admin sidebar */}
                <aside className="w-[240px] bg-black flex flex-col flex-shrink-0">
                    {/* Logo */}
                    <div className="px-5 pt-6 pb-6">
                        <Link href="/" className="flex items-center">
                            <Image src="/logo.png" alt="GMusic Logo" width={140} height={40} className="h-10 w-auto" />
                        </Link>
                        <span className="text-[10px] text-gray-400 block mt-1 px-1">Yönetim Paneli</span>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 px-3 space-y-1">
                        {navItems.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${isActive
                                        ? 'bg-[#c68cfa]/10 text-[#c68cfa]'
                                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                                        }`}
                                >
                                    <item.icon className="text-lg flex-shrink-0" />
                                    <span className="text-sm font-medium">{item.label}</span>
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Logout */}
                    <div className="px-3 pb-4">
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/5 transition-all duration-200 w-full"
                        >
                            <IoLogOut className="text-lg" />
                            <span className="text-sm font-medium">Çıkış Yap</span>
                        </button>
                    </div>
                </aside>

                {/* Main content */}
                <main className="flex-1 overflow-y-auto scrollbar-thin bg-[#0f0f0f] p-8">
                    {children}
                </main>
            </div>
        </ToastProvider>
    );
}

