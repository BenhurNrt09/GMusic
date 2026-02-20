'use client';

import React, { useState, useEffect, useRef } from 'react';
import { IoClose } from 'react-icons/io5';

interface CreatePlaylistModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreate: (title: string) => void;
    initialTitle?: string;
    loading?: boolean;
}

export default function CreatePlaylistModal({
    isOpen,
    onClose,
    onCreate,
    initialTitle = '',
    loading = false
}: CreatePlaylistModalProps) {
    const [title, setTitle] = useState(initialTitle);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            setTitle(initialTitle);
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen, initialTitle]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (title.trim()) {
            onCreate(title.trim());
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[200] animate-fade-in p-4">
            <div className="bg-[#181818] border border-white/10 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl">
                <div className="flex items-center justify-between p-6 border-b border-white/10">
                    <h2 className="text-xl font-black text-white uppercase tracking-tighter italic">Yeni Çalma Listesi</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <IoClose className="text-2xl" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="space-y-2">
                        <label htmlFor="playlist-title" className="text-sm font-bold text-gray-400 uppercase tracking-widest pl-1">
                            Başlık
                        </label>
                        <input
                            id="playlist-title"
                            ref={inputRef}
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Çalma listenize bir isim verin"
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#c68cfa] transition-colors font-medium"
                            autoComplete="off"
                        />
                    </div>

                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-6 py-3 rounded-xl text-sm font-bold text-white bg-white/5 hover:bg-white/10 transition-colors"
                        >
                            İptal
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !title.trim()}
                            className="flex-1 px-6 py-3 rounded-xl text-sm font-bold text-white bg-[#c68cfa] hover:bg-[#d4a5fb] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-purple-500/20"
                        >
                            {loading ? 'Oluşturuluyor...' : 'Oluştur'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
