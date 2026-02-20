'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@gmusic/database';
import type { Album, Artist } from '@gmusic/database';
import { IoAdd, IoTrash, IoPencil, IoSearch, IoClose, IoCloudUpload } from 'react-icons/io5';
import { useToast } from '@/components/Toast';

// ============================================================
// Albums CRUD Page
// ============================================================

export default function AlbumsPage() {
    const [albums, setAlbums] = useState<Album[]>([]);
    const [artists, setArtists] = useState<Artist[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingAlbum, setEditingAlbum] = useState<Album | null>(null);
    const [search, setSearch] = useState('');
    const { showToast } = useToast();

    const [title, setTitle] = useState('');
    const [artistId, setArtistId] = useState('');
    const [releaseDate, setReleaseDate] = useState('');
    const [coverFile, setCoverFile] = useState<File | null>(null);
    const [saving, setSaving] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        const [albumsRes, artistsRes] = await Promise.all([
            supabase.from('albums').select('*, artist:artists(*)').order('created_at', { ascending: false }),
            supabase.from('artists').select('*').order('name'),
        ]);
        if (albumsRes.data) setAlbums(albumsRes.data as unknown as Album[]);
        if (artistsRes.data) setArtists(artistsRes.data as Artist[]);
        setLoading(false);
    };

    useEffect(() => { fetchData(); }, []);

    const resetForm = () => {
        setTitle(''); setArtistId(''); setReleaseDate(''); setCoverFile(null);
        setEditingAlbum(null); setShowForm(false);
    };

    const openEdit = (album: Album) => {
        setEditingAlbum(album);
        setTitle(album.title);
        setArtistId(album.artist_id);
        setReleaseDate(album.release_date || '');
        setShowForm(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            let cover_url = editingAlbum?.cover_url || null;
            if (coverFile) {
                const ext = coverFile.name.split('.').pop();
                const path = `albums/${Date.now()}.${ext}`;
                const { error: uploadError } = await supabase.storage.from('covers').upload(path, coverFile);
                if (!uploadError) {
                    const { data: urlData } = supabase.storage.from('covers').getPublicUrl(path);
                    cover_url = urlData.publicUrl;
                }
            }

            const payload = { title, artist_id: artistId, release_date: releaseDate || null, cover_url };
            if (editingAlbum) {
                const { error } = await (supabase.from('albums') as any).update(payload).eq('id', editingAlbum.id);
                if (error) { showToast(`Güncelleme hatası: ${error.message}`, 'error'); return; }
                showToast(`"${title}" başarıyla güncellendi!`, 'success');
            } else {
                const { error } = await (supabase.from('albums') as any).insert(payload);
                if (error) { showToast(`Ekleme hatası: ${error.message}`, 'error'); return; }
                showToast(`"${title}" başarıyla eklendi!`, 'success');
            }
            resetForm();
            fetchData();
        } catch (err) {
            console.error('Error saving album:', err);
            showToast('Beklenmeyen bir hata oluştu!', 'error');
        } finally {
            setSaving(false);
        }
    };

    const deleteAlbum = async (id: string) => {
        if (!confirm('Bu albümü silmek istediğinize emin misiniz?')) return;
        const { error } = await supabase.from('albums').delete().eq('id', id);
        if (error) { showToast(`Silme hatası: ${error.message}`, 'error'); return; }
        showToast('Albüm başarıyla silindi!', 'success');
        fetchData();
    };

    const filtered = albums.filter(a => a.title.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-white">Albümler</h1>
                <button onClick={() => { resetForm(); setShowForm(true); }}
                    className="flex items-center gap-2 px-4 py-2.5 bg-[#c68cfa] hover:bg-[#d4a5fb] text-white rounded-xl text-sm font-medium transition-colors">
                    <IoAdd className="text-lg" /> Albüm Ekle
                </button>
            </div>

            <div className="relative max-w-sm">
                <IoSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="text" placeholder="Albüm ara..." value={search} onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:border-[#c68cfa]" />
            </div>

            {showForm && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-[#1e1e1e] rounded-2xl p-6 w-full max-w-lg mx-4 shadow-2xl">
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-lg font-bold text-white">{editingAlbum ? 'Albümü Düzenle' : 'Albüm Ekle'}</h2>
                            <button onClick={resetForm} className="text-gray-400 hover:text-white"><IoClose className="text-xl" /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Başlık *</label>
                                <input value={title} onChange={(e) => setTitle(e.target.value)} required
                                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#c68cfa]" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Sanatçı *</label>
                                <select value={artistId} onChange={(e) => setArtistId(e.target.value)} required
                                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#c68cfa]">
                                    <option value="">Sanatçı seçin...</option>
                                    {artists.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Çıkış Tarihi</label>
                                <input type="date" value={releaseDate} onChange={(e) => setReleaseDate(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#c68cfa]" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Kapak Görseli</label>
                                <label className="flex items-center gap-2 px-4 py-3 bg-white/5 border border-dashed border-white/20 rounded-xl cursor-pointer hover:border-[#c68cfa] transition-colors">
                                    <IoCloudUpload className="text-gray-400" />
                                    <span className="text-sm text-gray-400">{coverFile ? coverFile.name : 'Görsel seçin...'}</span>
                                    <input type="file" accept="image/*" onChange={(e) => setCoverFile(e.target.files?.[0] || null)} className="hidden" />
                                </label>
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <button type="button" onClick={resetForm} className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-medium transition-colors">İptal</button>
                                <button type="submit" disabled={saving} className="px-5 py-2.5 bg-[#c68cfa] hover:bg-[#d4a5fb] text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50">
                                    {saving ? 'Kaydediliyor...' : editingAlbum ? 'Güncelle' : 'Oluştur'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {loading ? (
                <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-16 bg-[#181818] animate-pulse rounded-xl" />)}</div>
            ) : (
                <div className="bg-[#181818] rounded-2xl overflow-hidden">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-white/10">
                                <th className="text-left text-xs font-medium text-gray-400 uppercase px-5 py-3">Albüm</th>
                                <th className="text-left text-xs font-medium text-gray-400 uppercase px-5 py-3 hidden md:table-cell">Sanatçı</th>
                                <th className="text-left text-xs font-medium text-gray-400 uppercase px-5 py-3 hidden md:table-cell">Çıkış Tarihi</th>
                                <th className="text-right text-xs font-medium text-gray-400 uppercase px-5 py-3">İşlemler</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((album) => (
                                <tr key={album.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                    <td className="px-5 py-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg overflow-hidden bg-white/10 flex-shrink-0">
                                                {album.cover_url && <img src={album.cover_url} alt="" className="w-full h-full object-cover" />}
                                            </div>
                                            <span className="text-sm font-medium text-white">{album.title}</span>
                                        </div>
                                    </td>
                                    <td className="px-5 py-3 hidden md:table-cell text-sm text-gray-300">{album.artist?.name || '-'}</td>
                                    <td className="px-5 py-3 hidden md:table-cell text-sm text-gray-400">{album.release_date || '-'}</td>
                                    <td className="px-5 py-3 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button onClick={() => openEdit(album)} className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"><IoPencil className="text-sm" /></button>
                                            <button onClick={() => deleteAlbum(album.id)} className="p-2 hover:bg-red-500/10 rounded-lg text-gray-400 hover:text-red-400 transition-colors"><IoTrash className="text-sm" /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filtered.length === 0 && <tr><td colSpan={4} className="px-5 py-10 text-center text-gray-400 text-sm">Albüm bulunamadı</td></tr>}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
