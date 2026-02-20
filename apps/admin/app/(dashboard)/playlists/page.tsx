'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@gmusic/database';
import type { Playlist } from '@gmusic/database';
import { IoAdd, IoTrash, IoPencil, IoSearch, IoClose, IoCloudUpload } from 'react-icons/io5';
import { useToast } from '@/components/Toast';

export default function PlaylistsPage() {
    const [playlists, setPlaylists] = useState<Playlist[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState<Playlist | null>(null);
    const [search, setSearch] = useState('');
    const { showToast } = useToast();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [isPublic, setIsPublic] = useState(true);
    const [coverFile, setCoverFile] = useState<File | null>(null);
    const [saving, setSaving] = useState(false);

    const fetch_ = async () => {
        setLoading(true);
        const { data } = await supabase.from('playlists').select('*').order('created_at', { ascending: false });
        if (data) setPlaylists(data as Playlist[]);
        setLoading(false);
    };

    useEffect(() => { fetch_(); }, []);

    const reset = () => { setTitle(''); setDescription(''); setIsPublic(true); setCoverFile(null); setEditing(null); setShowForm(false); };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); setSaving(true);
        try {
            let cover_url = editing?.cover_url || null;
            if (coverFile) {
                const path = `playlists/${Date.now()}.${coverFile.name.split('.').pop()}`;
                const { error: upErr } = await supabase.storage.from('covers').upload(path, coverFile);
                if (upErr) showToast(`Görsel yüklenemedi: ${upErr.message}`, 'error');
                else cover_url = supabase.storage.from('covers').getPublicUrl(path).data.publicUrl;
            }
            const payload = { title, description, is_public: isPublic, cover_url };
            if (editing) {
                const { error } = await (supabase.from('playlists') as any).update(payload).eq('id', editing.id);
                if (error) { showToast(`Güncelleme hatası: ${error.message}`, 'error'); return; }
                showToast(`"${title}" başarıyla güncellendi!`, 'success');
            } else {
                const { error } = await (supabase.from('playlists') as any).insert({ ...payload, user_id: '00000000-0000-0000-0000-000000000000' });
                if (error) { showToast(`Ekleme hatası: ${error.message}`, 'error'); return; }
                showToast(`"${title}" başarıyla eklendi!`, 'success');
            }
            reset(); fetch_();
        } catch (err) {
            showToast('Beklenmeyen bir hata oluştu!', 'error');
        } finally { setSaving(false); }
    };

    const del = async (id: string) => {
        if (!confirm('Silmek istediğinize emin misiniz?')) return;
        const { error } = await supabase.from('playlists').delete().eq('id', id);
        if (error) { showToast(`Silme hatası: ${error.message}`, 'error'); return; }
        showToast('Çalma listesi başarıyla silindi!', 'success');
        fetch_();
    };
    const filtered = playlists.filter(p => p.title.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-white">Çalma Listeleri</h1>
                <button onClick={() => { reset(); setShowForm(true); }} className="flex items-center gap-2 px-4 py-2.5 bg-[#c68cfa] hover:bg-[#d4a5fb] text-white rounded-xl text-sm font-medium"><IoAdd /> Çalma Listesi Ekle</button>
            </div>
            <div className="relative max-w-sm">
                <IoSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input placeholder="Ara..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#c68cfa]" />
            </div>
            {showForm && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-[#1e1e1e] rounded-2xl p-6 w-full max-w-lg mx-4">
                        <div className="flex justify-between mb-5"><h2 className="text-lg font-bold text-white">{editing ? 'Düzenle' : 'Ekle'} Çalma Listesi</h2><button onClick={reset}><IoClose className="text-xl text-gray-400" /></button></div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div><label className="block text-sm text-gray-300 mb-1">Başlık *</label><input value={title} onChange={e => setTitle(e.target.value)} required className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#c68cfa]" /></div>
                            <div><label className="block text-sm text-gray-300 mb-1">Açıklama</label><textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#c68cfa] resize-none" /></div>
                            <label className="flex items-center gap-2"><input type="checkbox" checked={isPublic} onChange={e => setIsPublic(e.target.checked)} className="accent-[#c68cfa]" /><span className="text-sm text-gray-300">Herkese Açık</span></label>
                            <div><label className="flex items-center gap-2 px-4 py-3 bg-white/5 border border-dashed border-white/20 rounded-xl cursor-pointer hover:border-[#c68cfa]"><IoCloudUpload className="text-gray-400" /><span className="text-sm text-gray-400">{coverFile?.name || 'Kapak görseli...'}</span><input type="file" accept="image/*" onChange={e => setCoverFile(e.target.files?.[0] || null)} className="hidden" /></label></div>
                            <div className="flex justify-end gap-3"><button type="button" onClick={reset} className="px-5 py-2.5 bg-white/10 text-white rounded-xl text-sm">İptal</button><button type="submit" disabled={saving} className="px-5 py-2.5 bg-[#c68cfa] text-white rounded-xl text-sm disabled:opacity-50">{saving ? 'Kaydediliyor...' : editing ? 'Güncelle' : 'Oluştur'}</button></div>
                        </form>
                    </div>
                </div>
            )}
            <div className="bg-[#181818] rounded-2xl overflow-hidden">
                <table className="w-full">
                    <thead><tr className="border-b border-white/10"><th className="text-left text-xs text-gray-400 uppercase px-5 py-3">Çalma Listesi</th><th className="text-left text-xs text-gray-400 uppercase px-5 py-3 hidden md:table-cell">Görünürlük</th><th className="text-right text-xs text-gray-400 uppercase px-5 py-3">İşlemler</th></tr></thead>
                    <tbody>
                        {filtered.map(pl => (
                            <tr key={pl.id} className="border-b border-white/5 hover:bg-white/5">
                                <td className="px-5 py-3"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-white/10 overflow-hidden">{pl.cover_url && <img src={pl.cover_url} alt="" className="w-full h-full object-cover" />}</div><div><p className="text-sm font-medium text-white">{pl.title}</p><p className="text-xs text-gray-400">{pl.description || 'Açıklama yok'}</p></div></div></td>
                                <td className="px-5 py-3 hidden md:table-cell"><span className={`text-xs px-2.5 py-1 rounded-full ${pl.is_public ? 'bg-green-500/10 text-green-400' : 'bg-gray-500/10 text-gray-400'}`}>{pl.is_public ? 'Herkese Açık' : 'Gizli'}</span></td>
                                <td className="px-5 py-3 text-right"><button onClick={() => { setEditing(pl); setTitle(pl.title); setDescription(pl.description || ''); setIsPublic(pl.is_public); setShowForm(true); }} className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white"><IoPencil /></button><button onClick={() => del(pl.id)} className="p-2 hover:bg-red-500/10 rounded-lg text-gray-400 hover:text-red-400"><IoTrash /></button></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
