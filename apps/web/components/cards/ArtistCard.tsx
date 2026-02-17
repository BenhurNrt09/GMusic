'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { IoPersonSharp, IoPlaySharp } from 'react-icons/io5';

// ============================================================
// ArtistCard — Circular artist avatar card
// ============================================================

interface ArtistCardProps {
    id: string;
    name: string;
    image_url: string | null;
    subtitle?: string;
}

export default function ArtistCard({ id, name, image_url, subtitle }: ArtistCardProps) {
    return (
        <Link href={`/artist/${id}`}>
            <div className="bg-[#181818] rounded-2xl p-4 hover:bg-[#282828] transition-all duration-300 cursor-pointer group text-center">
                {/* Circular image */}
                <div className="relative w-full aspect-square rounded-full overflow-hidden mb-4 shadow-xl shadow-black/40 mx-auto">
                    {image_url ? (
                        <Image src={image_url} alt={name} fill className="object-cover" />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-[#c68cfa]/20 to-purple-900/10 flex items-center justify-center">
                            <IoPersonSharp className="text-5xl text-white/20" />
                        </div>
                    )}

                    {/* Hover play button */}
                    <button className="absolute bottom-2 right-2 w-12 h-12 bg-[#c68cfa] rounded-full flex items-center justify-center shadow-xl shadow-black/40 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 hover:bg-[#d4a5fb] hover:scale-105">
                        <IoPlaySharp className="text-white text-xl ml-0.5" />
                    </button>
                </div>

                <h3 className="text-sm font-semibold text-white line-clamp-1 mb-1">{name}</h3>
                <p className="text-xs text-gray-400">{subtitle || 'Sanatçı'}</p>
            </div>
        </Link>
    );
}
