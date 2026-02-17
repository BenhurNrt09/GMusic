'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { IoPlaySharp, IoMusicalNotes } from 'react-icons/io5';

// ============================================================
// PlaylistCard — Playlist card with cover mosaic/image
// ============================================================

interface PlaylistCardProps {
    id: string;
    title: string;
    cover_url: string | null;
    description?: string | null;
}

export default function PlaylistCard({ id, title, cover_url, description }: PlaylistCardProps) {
    return (
        <Link href={`/playlist/${id}`}>
            <div className="bg-[#181818] rounded-2xl p-4 hover:bg-[#282828] transition-all duration-300 cursor-pointer group">
                <div className="relative w-full aspect-square rounded-xl overflow-hidden mb-3 shadow-lg shadow-black/40">
                    {cover_url ? (
                        <Image src={cover_url} alt={title} fill className="object-cover" />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-[#c68cfa]/20 to-purple-900/20 flex items-center justify-center">
                            <IoMusicalNotes className="text-4xl text-white/30" />
                        </div>
                    )}
                    <button className="absolute bottom-2 right-2 w-12 h-12 bg-[#c68cfa] rounded-full flex items-center justify-center shadow-xl shadow-black/40 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 hover:bg-[#d4a5fb] hover:scale-105">
                        <IoPlaySharp className="text-white text-xl ml-0.5" />
                    </button>
                </div>
                <h3 className="text-sm font-semibold text-white line-clamp-1 mb-1">{title}</h3>
                <p className="text-xs text-gray-400 line-clamp-2">{description || 'Çalma Listesi'}</p>
            </div>
        </Link>
    );
}
