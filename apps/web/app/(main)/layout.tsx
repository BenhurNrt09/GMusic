'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import BottomPlayer from '@/components/layout/BottomPlayer';
import RightPanel from '@/components/layout/RightPanel';
import TopBar from '@/components/layout/TopBar';
import MobileBottomNav from '@/components/layout/MobileBottomNav';
import MiniPlayer from '@/components/layout/MiniPlayer';
import SupabaseHeartbeat from '@/components/utils/SupabaseHeartbeat';

// ============================================================
// MainLayout — Responsive shell with auth guard:
//   Desktop: Sidebar + Content + RightPanel + BottomPlayer
//   Mobile:  Content + MiniPlayer + BottomNav
// ============================================================

const AUTH_KEY = 'gmusic_web_auth';

export default function MainLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [authChecked, setAuthChecked] = useState(false);

    useEffect(() => {
        const auth = localStorage.getItem(AUTH_KEY) || sessionStorage.getItem(AUTH_KEY);
        if (auth !== 'true') {
            router.replace('/login');
        } else {
            setAuthChecked(true);
        }
    }, [router]);

    if (!authChecked) {
        return (
            <div className="flex items-center justify-center h-screen bg-dark">
                <div className="w-8 h-8 border-3 border-[#c68cfa]/30 border-t-[#c68cfa] rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen overflow-hidden bg-dark">
            <SupabaseHeartbeat />
            {/* Main content area */}
            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar — hidden on mobile */}
                <div className="hidden md:flex">
                    <Sidebar
                        collapsed={sidebarCollapsed}
                        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
                    />
                </div>

                {/* Center content */}
                <main className="flex-1 overflow-y-auto scrollbar-thin bg-gradient-to-b from-[#1a1a1a] to-[#0f0f0f] md:rounded-tl-xl md:rounded-bl-xl">
                    {/* TopBar — hidden on mobile */}
                    <div className="hidden md:block">
                        <TopBar />
                    </div>
                    <div className="px-4 md:px-6 pb-8 pt-4 md:pt-0">{children}</div>
                </main>

                {/* Right panel (conditional) — desktop only */}
                <div className="hidden lg:flex">
                    <RightPanel />
                </div>
            </div>

            {/* Desktop: full bottom player */}
            <div className="hidden md:block">
                <BottomPlayer />
            </div>

            {/* Mobile: mini player + bottom nav */}
            <div className="md:hidden">
                <MiniPlayer />
                <MobileBottomNav />
            </div>
        </div>
    );
}
