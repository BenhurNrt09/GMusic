'use client';

import React, { useState } from 'react';
import { supabase } from '@gmusic/database';
import { IoCloudUpload, IoMusicalNote, IoImage, IoCheckmarkCircle, IoAlertCircle } from 'react-icons/io5';

export default function UploadsPage() {
    const [files, setFiles] = useState<File[]>([]);
    const [bucket, setBucket] = useState<'music' | 'covers' | 'artists'>('music');
    const [uploading, setUploading] = useState(false);
    const [results, setResults] = useState<{ name: string; success: boolean; url?: string }[]>([]);

    const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) setFiles(Array.from(e.target.files));
    };

    const handleUpload = async () => {
        if (files.length === 0) return;
        setUploading(true);
        const uploadResults: typeof results = [];

        for (const file of files) {
            try {
                const path = `${Date.now()}_${file.name}`;
                const { error } = await supabase.storage.from(bucket).upload(path, file);
                if (error) throw error;
                const { data } = supabase.storage.from(bucket).getPublicUrl(path);
                uploadResults.push({ name: file.name, success: true, url: data.publicUrl });
            } catch {
                uploadResults.push({ name: file.name, success: false });
            }
        }

        setResults(uploadResults);
        setFiles([]);
        setUploading(false);
    };

    const buckets = [
        { key: 'music' as const, label: 'Müzik Dosyaları', icon: IoMusicalNote, accept: 'audio/*' },
        { key: 'covers' as const, label: 'Kapak Görselleri', icon: IoImage, accept: 'image/*' },
        { key: 'artists' as const, label: 'Sanatçı Görselleri', icon: IoImage, accept: 'image/*' },
    ];

    return (
        <div className="space-y-6 max-w-2xl">
            <h1 className="text-2xl font-bold text-white">Dosya Yükle</h1>
            <p className="text-gray-400 text-sm">Müzik dosyalarını ve görselleri Supabase Storage'a yükleyin.</p>

            {/* Bucket selector */}
            <div className="flex gap-3">
                {buckets.map(b => (
                    <button key={b.key} onClick={() => setBucket(b.key)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${bucket === b.key ? 'bg-[#c68cfa] text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}>
                        <b.icon /> {b.label}
                    </button>
                ))}
            </div>

            {/* Drop zone */}
            <label className="flex flex-col items-center gap-3 p-10 border-2 border-dashed border-white/10 rounded-2xl cursor-pointer hover:border-[#c68cfa]/50 transition-colors bg-white/[0.02]">
                <IoCloudUpload className="text-4xl text-gray-500" />
                <span className="text-sm text-gray-400">{files.length > 0 ? `${files.length} dosya seçildi` : 'Dosya seçmek için tıklayın'}</span>
                <input type="file" multiple accept={buckets.find(b => b.key === bucket)?.accept} onChange={handleFiles} className="hidden" />
            </label>

            {files.length > 0 && (
                <button onClick={handleUpload} disabled={uploading}
                    className="w-full py-3 bg-[#c68cfa] hover:bg-[#d4a5fb] text-white font-semibold rounded-xl disabled:opacity-50 flex items-center justify-center gap-2">
                    {uploading ? <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Yükleniyor...</> : `${files.length} dosya yükle`}
                </button>
            )}

            {/* Results */}
            {results.length > 0 && (
                <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-white">Yükleme Sonuçları</h3>
                    {results.map((r, i) => (
                        <div key={i} className={`flex items-center gap-3 px-4 py-3 rounded-xl ${r.success ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                            {r.success ? <IoCheckmarkCircle className="text-green-400" /> : <IoAlertCircle className="text-red-400" />}
                            <span className="text-sm text-white flex-1">{r.name}</span>
                            {r.url && <span className="text-xs text-gray-400 line-clamp-1 max-w-[200px]">{r.url}</span>}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
