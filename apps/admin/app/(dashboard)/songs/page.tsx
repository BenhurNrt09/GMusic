'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@gmusic/database';
import type { Song, Artist, Album } from '@gmusic/database';
import { IoAdd, IoTrash, IoPencil, IoSearch, IoClose, IoCloudUpload } from 'react-icons/io5';
import { useToast } from '@/components/Toast';

// ============================================================
// Songs CRUD Page — with audio + cover upload
// ============================================================

export default function SongsPage() {
    const [songs, setSongs] = useState<Song[]>([]);
    const [artists, setArtists] = useState<Artist[]>([]);
    const [albums, setAlbums] = useState<Album[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingSong, setEditingSong] = useState<Song | null>(null);
    const [search, setSearch] = useState('');
    const { showToast } = useToast();

    const [title, setTitle] = useState('');
    const [artistId, setArtistId] = useState('');
    const [albumId, setAlbumId] = useState('');
    const [duration, setDuration] = useState(0);
    const [audioFile, setAudioFile] = useState<File | null>(null);
    const [coverFile, setCoverFile] = useState<File | null>(null);
    const [saving, setSaving] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        const [songsRes, artistsRes, albumsRes] = await Promise.all([
            supabase.from('songs').select('*, artist:artists(*), album:albums(*)').order('created_at', { ascending: false }),
            supabase.from('artists').select('*').order('name'),
            supabase.from('albums').select('*').order('title'),
        ]);
        if (songsRes.data) setSongs(songsRes.data as unknown as Song[]);
        if (artistsRes.data) setArtists(artistsRes.data as Artist[]);
        if (albumsRes.data) setAlbums(albumsRes.data as Album[]);
        setLoading(false);
    };

    useEffect(() => { fetchData(); }, []);

    const resetForm = () => {
        setTitle(''); setArtistId(''); setAlbumId(''); setDuration(0);
        setAudioFile(null); setCoverFile(null); setEditingSong(null); setShowForm(false);
    };

    const openEdit = (song: Song) => {
        setEditingSong(song);
        setTitle(song.title);
        setArtistId(song.artist_id);
        setAlbumId(song.album_id || '');
        setDuration(song.duration || 0);
        setShowForm(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            let audio_url = editingSong?.audio_url || '';
            let cover_url = editingSong?.cover_url || null;

            // Upload audio file
            if (audioFile) {
                const ext = audioFile.name.split('.').pop();
                const path = `songs/${Date.now()}.${ext}`;
                const { error: uploadError } = await supabase.storage.from('music').upload(path, audioFile);
                if (!uploadError) {
                    const { data: urlData } = supabase.storage.from('music').getPublicUrl(path);
                    audio_url = urlData.publicUrl;
                }
            }

            // Upload cover image
            if (coverFile) {
                const ext = coverFile.name.split('.').pop();
                const path = `songs/${Date.now()}_cover.${ext}`;
                const { error: uploadError } = await supabase.storage.from('covers').upload(path, coverFile);
                if (!uploadError) {
                    const { data: urlData } = supabase.storage.from('covers').getPublicUrl(path);
                    cover_url = urlData.publicUrl;
                }
            }

            if (!audio_url) {
                showToast('Ses dosyası zorunludur!', 'error');
                setSaving(false);
                return;
            }

            const payload = {
                title,
                artist_id: artistId,
                album_id: albumId || null,
                audio_url,
                cover_url,
                duration: Math.round(parseFloat(String(duration)) || 0),
            };

            if (editingSong) {
                const { error } = await supabase.from('songs').update(payload as any).eq('id', editingSong.id);
                if (error) { showToast(`Güncelleme hatası: ${error.message}`, 'error'); return; }
                showToast(`"${title}" başarıyla güncellendi!`, 'success');
            } else {
                const { error } = await supabase.from('songs').insert(payload as any);
                if (error) { showToast(`Ekleme hatası: ${error.message}`, 'error'); return; }
                showToast(`"${title}" başarıyla eklendi!`, 'success');
            }
            resetForm();
            fetchData();
        } catch (err) {
            console.error('Error saving song:', err);
            showToast('Beklenmeyen bir hata oluştu!', 'error');
        } finally {
            setSaving(false);
        }
    };

    const deleteSong = async (id: string) => {
        if (!confirm('Bu şarkıyı silmek istediğinize emin misiniz?')) return;
        const { error } = await supabase.from('songs').delete().eq('id', id);
        if (error) { showToast(`Silme hatası: ${error.message}`, 'error'); return; }
        showToast('Şarkı başarıyla silindi!', 'success');
        fetchData();
    };

    const formatDuration = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
    const filtered = songs.filter(s => s.title.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-white">Şarkılar</h1>
                <button onClick={() => { resetForm(); setShowForm(true); }}
                    className="flex items-center gap-2 px-4 py-2.5 bg-[#c68cfa] hover:bg-[#d4a5fb] text-white rounded-xl text-sm font-medium transition-colors">
                    <IoAdd className="text-lg" /> Şarkı Ekle
                </button>
            </div>

            <div className="relative max-w-sm">
                <IoSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="text" placeholder="Şarkı ara..." value={search} onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:border-[#c68cfa]" />
            </div>

            {showForm && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-[#1e1e1e] rounded-2xl p-6 w-full max-w-lg mx-4 shadow-2xl max-h-[85vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-lg font-bold text-white">{editingSong ? 'Şarkıyı Düzenle' : 'Şarkı Ekle'}</h2>
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
                                <label className="block text-sm font-medium text-gray-300 mb-1">Albüm (isteğe bağlı)</label>
                                <select value={albumId} onChange={(e) => setAlbumId(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#c68cfa]">
                                    <option value="">Albüm yok</option>
                                    {albums.map(a => <option key={a.id} value={a.id}>{a.title}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Süre (saniye)</label>
                                <input type="number" value={duration} onChange={(e) => setDuration(Number(e.target.value))}
                                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#c68cfa]" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Ses Dosyası {!editingSong && '*'}</label>
                                <label className="flex items-center gap-2 px-4 py-3 bg-white/5 border border-dashed border-white/20 rounded-xl cursor-pointer hover:border-[#c68cfa] transition-colors">
                                    <IoCloudUpload className="text-gray-400" />
                                    <span className="text-sm text-gray-400">{audioFile ? audioFile.name : 'Ses dosyası seçin...'}</span>
                                    <input type="file" accept="audio/*" onChange={(e) => setAudioFile(e.target.files?.[0] || null)} className="hidden" />
                                </label>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Kapak Görseli</label>
                                <label className="flex items-center gap-2 px-4 py-3 bg-white/5 border border-dashed border-white/20 rounded-xl cursor-pointer hover:border-[#c68cfa] transition-colors">
                                    <IoCloudUpload className="text-gray-400" />
                                    <span className="text-sm text-gray-400">{coverFile ? coverFile.name : 'Kapak görseli seçin...'}</span>
                                    <input type="file" accept="image/*" onChange={(e) => setCoverFile(e.target.files?.[0] || null)} className="hidden" />
                                </label>
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <button type="button" onClick={resetForm} className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-medium transition-colors">İptal</button>
                                <button type="submit" disabled={saving} className="px-5 py-2.5 bg-[#c68cfa] hover:bg-[#d4a5fb] text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50">
                                    {saving ? 'Kaydediliyor...' : editingSong ? 'Güncelle' : 'Oluştur'}
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
                                <th className="text-left text-xs font-medium text-gray-400 uppercase px-5 py-3">Şarkı</th>
                                <th className="text-left text-xs font-medium text-gray-400 uppercase px-5 py-3 hidden md:table-cell">Sanatçı</th>
                                <th className="text-left text-xs font-medium text-gray-400 uppercase px-5 py-3 hidden lg:table-cell">Albüm</th>
                                <th className="text-left text-xs font-medium text-gray-400 uppercase px-5 py-3 hidden sm:table-cell">Süre</th>
                                <th className="text-right text-xs font-medium text-gray-400 uppercase px-5 py-3">İşlemler</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((song) => (
                                <tr key={song.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                    <td className="px-5 py-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg overflow-hidden bg-white/10 flex-shrink-0">
                                                {song.cover_url && <img src={song.cover_url} alt="" className="w-full h-full object-cover" />}
                                            </div>
                                            <span className="text-sm font-medium text-white line-clamp-1">{song.title}</span>
                                        </div>
                                    </td>
                                    <td className="px-5 py-3 hidden md:table-cell text-sm text-gray-300">{song.artist?.name || '-'}</td>
                                    <td className="px-5 py-3 hidden lg:table-cell text-sm text-gray-400">{song.album?.title || '-'}</td>
                                    <td className="px-5 py-3 hidden sm:table-cell text-sm text-gray-400 tabular-nums">{formatDuration(song.duration || 0)}</td>
                                    <td className="px-5 py-3 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button onClick={() => openEdit(song)} className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"><IoPencil className="text-sm" /></button>
                                            <button onClick={() => deleteSong(song.id)} className="p-2 hover:bg-red-500/10 rounded-lg text-gray-400 hover:text-red-400 transition-colors"><IoTrash className="text-sm" /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filtered.length === 0 && <tr><td colSpan={5} className="px-5 py-10 text-center text-gray-400 text-sm">Şarkı bulunamadı</td></tr>}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
