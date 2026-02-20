'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@gmusic/database';
import type { Artist } from '@gmusic/database';
import { IoAdd, IoTrash, IoPencil, IoSearch, IoClose, IoCloudUpload } from 'react-icons/io5';
import { useToast } from '@/components/Toast';

// ============================================================
// Artists CRUD Page
// ============================================================

export default function ArtistsPage() {
    const [artists, setArtists] = useState<Artist[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingArtist, setEditingArtist] = useState<Artist | null>(null);
    const [search, setSearch] = useState('');
    const { showToast } = useToast();

    // Form state
    const [name, setName] = useState('');
    const [bio, setBio] = useState('');
    const [monthlyListeners, setMonthlyListeners] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [saving, setSaving] = useState(false);

    const fetchArtists = async () => {
        setLoading(true);
        const { data } = await supabase.from('artists').select('*').order('name');
        if (data) setArtists(data as Artist[]);
        setLoading(false);
    };

    useEffect(() => { fetchArtists(); }, []);

    const resetForm = () => {
        setName(''); setBio(''); setMonthlyListeners(''); setImageFile(null);
        setEditingArtist(null); setShowForm(false);
    };

    const openEdit = (artist: Artist) => {
        setEditingArtist(artist);
        setName(artist.name);
        setBio(artist.bio || '');
        setMonthlyListeners(String(artist.monthly_listeners || ''));
        setShowForm(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            let image_url = editingArtist?.image_url || null;

            // Upload image if provided
            if (imageFile) {
                const ext = imageFile.name.split('.').pop();
                const path = `artists/${Date.now()}.${ext}`;
                const { error: uploadError } = await supabase.storage.from('artists').upload(path, imageFile);
                if (uploadError) {
                    showToast(`Görsel yüklenemedi: ${uploadError.message}`, 'error');
                } else {
                    const { data: urlData } = supabase.storage.from('artists').getPublicUrl(path);
                    image_url = urlData.publicUrl;
                }
            }

            const payload = { name, bio, monthly_listeners: parseInt(monthlyListeners) || 0, image_url };

            if (editingArtist) {
                const { error } = await (supabase.from('artists') as any).update(payload).eq('id', editingArtist.id);
                if (error) { showToast(`Güncelleme hatası: ${error.message}`, 'error'); return; }
                showToast(`"${name}" başarıyla güncellendi!`, 'success');
            } else {
                const { error } = await (supabase.from('artists') as any).insert(payload);
                if (error) { showToast(`Ekleme hatası: ${error.message}`, 'error'); return; }
                showToast(`"${name}" başarıyla eklendi!`, 'success');
            }

            resetForm();
            fetchArtists();
        } catch (err) {
            console.error('Error saving artist:', err);
            showToast('Beklenmeyen bir hata oluştu!', 'error');
        } finally {
            setSaving(false);
        }
    };

    const deleteArtist = async (id: string) => {
        if (!confirm('Bu sanatçıyı silmek istediğinize emin misiniz?')) return;
        const { error } = await supabase.from('artists').delete().eq('id', id);
        if (error) { showToast(`Silme hatası: ${error.message}`, 'error'); return; }
        showToast('Sanatçı başarıyla silindi!', 'success');
        fetchArtists();
    };

    const filtered = artists.filter(a => a.name.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-white">Sanatçılar</h1>
                <button
                    onClick={() => { resetForm(); setShowForm(true); }}
                    className="flex items-center gap-2 px-4 py-2.5 bg-[#c68cfa] hover:bg-[#d4a5fb] text-white rounded-xl text-sm font-medium transition-colors"
                >
                    <IoAdd className="text-lg" /> Sanatçı Ekle
                </button>
            </div>

            {/* Search */}
            <div className="relative max-w-sm">
                <IoSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                    type="text"
                    placeholder="Sanatçı ara..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:border-[#c68cfa]"
                />
            </div>

            {/* Modal/Form */}
            {showForm && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-[#1e1e1e] rounded-2xl p-6 w-full max-w-lg mx-4 shadow-2xl">
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-lg font-bold text-white">{editingArtist ? 'Sanatçıyı Düzenle' : 'Sanatçı Ekle'}</h2>
                            <button onClick={resetForm} className="text-gray-400 hover:text-white"><IoClose className="text-xl" /></button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Ad *</label>
                                <input value={name} onChange={(e) => setName(e.target.value)} required
                                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#c68cfa]" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Biyografi</label>
                                <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3}
                                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#c68cfa] resize-none" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Aylık Dinleyici</label>
                                <input type="number" placeholder="0" value={monthlyListeners} onChange={(e) => setMonthlyListeners(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#c68cfa]" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Sanatçı Görseli</label>
                                <label className="flex items-center gap-2 px-4 py-3 bg-white/5 border border-dashed border-white/20 rounded-xl cursor-pointer hover:border-[#c68cfa] transition-colors">
                                    <IoCloudUpload className="text-gray-400" />
                                    <span className="text-sm text-gray-400">{imageFile ? imageFile.name : 'Görsel seçin...'}</span>
                                    <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} className="hidden" />
                                </label>
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <button type="button" onClick={resetForm} className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-medium transition-colors">İptal</button>
                                <button type="submit" disabled={saving} className="px-5 py-2.5 bg-[#c68cfa] hover:bg-[#d4a5fb] text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50">
                                    {saving ? 'Kaydediliyor...' : editingArtist ? 'Güncelle' : 'Oluştur'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Table */}
            {loading ? (
                <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="h-16 bg-[#181818] animate-pulse rounded-xl" />
                    ))}
                </div>
            ) : (
                <div className="bg-[#181818] rounded-2xl overflow-hidden">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-white/10">
                                <th className="text-left text-xs font-medium text-gray-400 uppercase px-5 py-3">Sanatçı</th>
                                <th className="text-left text-xs font-medium text-gray-400 uppercase px-5 py-3 hidden md:table-cell">Aylık Dinleyici</th>
                                <th className="text-right text-xs font-medium text-gray-400 uppercase px-5 py-3">İşlemler</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((artist) => (
                                <tr key={artist.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                    <td className="px-5 py-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full overflow-hidden bg-white/10 flex-shrink-0">
                                                {artist.image_url && <img src={artist.image_url} alt="" className="w-full h-full object-cover" />}
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-white">{artist.name}</p>
                                                <p className="text-xs text-gray-400 line-clamp-1">{artist.bio || 'Biyografi yok'}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-5 py-3 hidden md:table-cell">
                                        <span className="text-sm text-gray-300">{(artist.monthly_listeners || 0).toLocaleString()}</span>
                                    </td>
                                    <td className="px-5 py-3 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button onClick={() => openEdit(artist)} className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors">
                                                <IoPencil className="text-sm" />
                                            </button>
                                            <button onClick={() => deleteArtist(artist.id)} className="p-2 hover:bg-red-500/10 rounded-lg text-gray-400 hover:text-red-400 transition-colors">
                                                <IoTrash className="text-sm" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filtered.length === 0 && (
                                <tr>
                                    <td colSpan={3} className="px-5 py-10 text-center text-gray-400 text-sm">Sanatçı bulunamadı</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
