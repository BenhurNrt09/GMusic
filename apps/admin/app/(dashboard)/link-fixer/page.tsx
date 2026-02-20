'use client';

import React, { useState } from 'react';
import { IoLink, IoCopy, IoCheckmarkCircle, IoInformationCircle } from 'react-icons/io5';

export default function LinkFixerPage() {
    const [inputUrl, setInputUrl] = useState('');
    const [resultUrl, setResultUrl] = useState('');
    const [copied, setCopied] = useState(false);

    const fixLink = () => {
        let url = inputUrl.trim();
        if (!url) return;

        // More robust Google ID extraction (matches 33-character alphanumeric string with - or _)
        const idRegex = /([a-zA-Z0-9_-]{33})/;
        const match = url.match(idRegex);

        if (match && match[1]) {
            const directUrl = `https://drive.google.com/uc?export=download&id=${match[1]}`;
            setResultUrl(directUrl);
        } else {
            // Fallback for non-standard or already correct links
            setResultUrl(url);
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(resultUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">Link Düzeltici</h1>
                <p className="text-gray-400">Google Drive video linklerini GMusic oynatıcısının anlayabileceği direkt linklere çevirin.</p>
            </div>

            <div className="grid gap-6">
                {/* Input Section */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                    <label className="block text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
                        <IoLink className="text-[#c68cfa]" />
                        Google Drive Paylaşım Linki
                    </label>
                    <div className="flex gap-3">
                        <input
                            type="text"
                            value={inputUrl}
                            onChange={(e) => setInputUrl(e.target.value)}
                            placeholder="https://drive.google.com/file/d/.../view?usp=sharing"
                            className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#c68cfa] transition-colors"
                        />
                        <button
                            onClick={fixLink}
                            className="bg-[#c68cfa] hover:bg-[#b37ae6] text-black font-bold px-6 py-3 rounded-xl transition-all active:scale-95"
                        >
                            Düzelt
                        </button>
                    </div>
                </div>

                {/* Result Section */}
                {resultUrl && (
                    <div className="bg-[#c68cfa]/10 border border-[#c68cfa]/20 rounded-2xl p-6 animate-in fade-in slide-in-from-top-2">
                        <label className="block text-sm font-medium text-[#c68cfa] mb-3">Düzeltilmiş Direkt Link</label>
                        <div className="flex gap-3">
                            <input
                                type="text"
                                readOnly
                                value={resultUrl}
                                className="flex-1 bg-black/40 border border-[#c68cfa]/30 rounded-xl px-4 py-3 text-white font-mono text-sm"
                            />
                            <button
                                onClick={handleCopy}
                                className="bg-white/10 hover:bg-white/20 text-white p-4 rounded-xl transition-all relative group"
                                title="Kopyala"
                            >
                                {copied ? <IoCheckmarkCircle className="text-green-400 text-xl" /> : <IoCopy className="text-xl" />}
                                {copied && <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-green-500 text-black text-[10px] font-bold px-2 py-1 rounded">Kopyalandı!</span>}
                            </button>
                        </div>
                        <p className="text-[11px] text-[#c68cfa]/60 mt-4 flex items-center gap-2">
                            <IoInformationCircle />
                            Bu linki Şarkı Düzenleme sayfasındaki "Veya URL" kısmına yapıştırabilirsiniz.
                        </p>
                    </div>
                )}

                {/* Guide Section */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                    <h3 className="text-white font-bold mb-4">Nasıl Yapılır?</h3>
                    <ul className="space-y-4 text-sm text-gray-400">
                        <li className="flex gap-3">
                            <span className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">1</span>
                            <span>Videonuzu Google Drive'a yükleyin.</span>
                        </li>
                        <li className="flex gap-3">
                            <span className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">2</span>
                            <span>Videonun üzerine sağ tıklayıp <b>"Paylaş"</b> &rarr; <b>"Bağlantıyı kopyala"</b> deyin.</span>
                        </li>
                        <li className="flex gap-3">
                            <span className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">3</span>
                            <span>Erişimin <b>"Bağlantıya sahip olan herkes: Görüntüleyebilir"</b> olduğundan emin olun.</span>
                        </li>
                        <li className="flex gap-3">
                            <span className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">4</span>
                            <span>Kopyaladığınız linki yukarıdaki kutuya yapıştırıp düzeltin.</span>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
