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
    const [durationMin, setDurationMin] = useState('');
    const [durationSec, setDurationSec] = useState('');
    const [audioFile, setAudioFile] = useState<File | null>(null);
    const [coverFile, setCoverFile] = useState<File | null>(null);
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [lyrics, setLyrics] = useState('');
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
        setTitle(''); setArtistId(''); setAlbumId(''); setDurationMin(''); setDurationSec('');
        setAudioFile(null); setCoverFile(null); setVideoFile(null); setLyrics(''); setEditingSong(null); setShowForm(false);
    };

    const openEdit = (song: Song) => {
        setEditingSong(song);
        setTitle(song.title);
        setArtistId(song.artist_id);
        setAlbumId(song.album_id || '');

        const totalSec = song.duration || 0;
        setDurationMin(Math.floor(totalSec / 60).toString());
        setDurationSec((totalSec % 60).toString());
        setLyrics(song.lyrics || '');

        setShowForm(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            let audio_url = editingSong?.audio_url || '';
            let cover_url = editingSong?.cover_url || null;
            let video_url = editingSong?.video_url || null;

            // Upload audio file
            if (audioFile) {
                const ext = audioFile.name.split('.').pop();
                const path = `songs/${Date.now()}.${ext}`;
                const { error: uploadError } = await supabase.storage.from('music').upload(path, audioFile);
                if (uploadError) {
                    showToast(`Ses yükleme hatası: ${uploadError.message}`, 'error');
                    setSaving(false);
                    return;
                }
                const { data: urlData } = supabase.storage.from('music').getPublicUrl(path);
                audio_url = urlData.publicUrl;
            }

            // Upload cover image
            if (coverFile) {
                const ext = coverFile.name.split('.').pop();
                const path = `songs/${Date.now()}_cover.${ext}`;
                const { error: uploadError } = await supabase.storage.from('covers').upload(path, coverFile);
                if (uploadError) {
                    showToast(`Kapak yükleme hatası: ${uploadError.message}`, 'error');
                } else {
                    const { data: urlData } = supabase.storage.from('covers').getPublicUrl(path);
                    cover_url = urlData.publicUrl;
                }
            }

            // Upload video file
            if (videoFile) {
                const ext = videoFile.name.split('.').pop();
                const path = `songs/${Date.now()}_video.${ext}`;
                const { error: uploadError } = await supabase.storage.from('videos').upload(path, videoFile, {
                    contentType: videoFile.type || 'video/mp4'
                });
                if (uploadError) {
                    showToast(`Video yükleme hatası: ${uploadError.message}. 'videos' adında bir bucket olduğundan emin olun.`, 'error');
                    setSaving(false);
                    return;
                }
                const { data: urlData } = supabase.storage.from('videos').getPublicUrl(path);
                video_url = urlData.publicUrl;
            }

            if (!audio_url) {
                showToast('Ses dosyası zorunludur!', 'error');
                setSaving(false);
                return;
            }

            const finalDuration = (parseInt(durationMin) || 0) * 60 + (parseInt(durationSec) || 0);

            const payload: any = {
                title,
                artist_id: artistId,
                album_id: albumId || null,
                audio_url,
                cover_url,
                video_url,
                duration: finalDuration,
                lyrics: lyrics || null,
            };

            if (editingSong) {
                const { error } = await (supabase.from('songs') as any).update(payload).eq('id', editingSong.id);
                if (error) { showToast(`Güncelleme hatası: ${error.message}`, 'error'); return; }
                showToast(`"${title}" başarıyla güncellendi!`, 'success');
            } else {
                const { error } = await (supabase.from('songs') as any).insert(payload);
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

    const filteredAlbums = React.useMemo(() => {
        return artistId
            ? albums.filter(a => String(a.artist_id) === String(artistId))
            : [];
    }, [artistId, albums]);

    // Reset album selection when artist changes
    useEffect(() => {
        setAlbumId('');
    }, [artistId]);

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
                                    <option value="" className="bg-[#1e1e1e]">Sanatçı seçin...</option>
                                    {artists.map(a => <option key={a.id} value={a.id} className="bg-[#1e1e1e]">{a.name}</option>)}
                                </select>
                            </div>
                            {artistId && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">Albüm (isteğe bağlı)</label>
                                    <select value={albumId} onChange={(e) => setAlbumId(e.target.value)}
                                        className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#c68cfa]">
                                        <option value="" className="bg-[#1e1e1e]">Albüm yok</option>
                                        {filteredAlbums.map(a => <option key={a.id} value={a.id} className="bg-[#1e1e1e]">{a.title}</option>)}
                                    </select>
                                </div>
                            )}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">Dakika</label>
                                    <input type="number" placeholder="0" value={durationMin} onChange={(e) => setDurationMin(e.target.value)}
                                        className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#c68cfa]" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">Saniye</label>
                                    <input type="number" placeholder="0" value={durationSec} onChange={(e) => setDurationSec(e.target.value)}
                                        className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#c68cfa]" />
                                </div>
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
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Video Dosyası (İsteğe bağlı - Sadece MP4)</label>
                                <label className="flex items-center gap-2 px-4 py-3 bg-white/5 border border-dashed border-white/20 rounded-xl cursor-pointer hover:border-[#c68cfa] transition-colors mb-2">
                                    <IoCloudUpload className="text-gray-400" />
                                    <span className="text-sm text-gray-400">{videoFile ? videoFile.name : 'Video (.mp4) dosyası seçin...'}</span>
                                    <input type="file" accept="video/mp4" onChange={(e) => setVideoFile(e.target.files?.[0] || null)} className="hidden" />
                                </label>
                                {editingSong?.video_url && !videoFile && (
                                    <div className="flex items-center justify-between px-3 py-2 bg-white/5 rounded-lg mb-2">
                                        <span className="text-[10px] text-gray-400 truncate max-w-[200px] italic">Mevcut video yüklü</span>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (confirm('Mevcut videoyu silmek istediğinize emin misiniz?')) {
                                                    // Immediately set video_url to null for submission
                                                    setEditingSong(prev => prev ? { ...prev, video_url: null } : null);
                                                    showToast('Video silindi, kaydetmeyi unutmayın.', 'success');
                                                }
                                            }}
                                            className="text-[10px] text-red-400 hover:underline"
                                        >
                                            Videoyu Kaldır
                                        </button>
                                    </div>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Şarkı Sözleri (İsteğe Bağlı - LRC formatı önerilir)</label>
                                <textarea
                                    value={lyrics}
                                    onChange={(e) => setLyrics(e.target.value)}
                                    placeholder="[00:12.34] Şarkı sözü satırı..."
                                    rows={6}
                                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#c68cfa] font-mono"
                                />
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
