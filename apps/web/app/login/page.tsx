'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { IoMusicalNotes, IoKey, IoEye, IoEyeOff, IoPerson } from 'react-icons/io5';

// ============================================================
// Web Login Page — Hardcoded credentials
// ============================================================

const VALID_USERNAME = 'GülçinEngin';
const VALID_PASSWORD = 'G_Music2026';
const AUTH_KEY = 'gmusic_web_auth';

export default function LoginPage() {
    const router = useRouter();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // If already logged in, redirect
    useEffect(() => {
        const auth = localStorage.getItem(AUTH_KEY) || sessionStorage.getItem(AUTH_KEY);
        if (auth === 'true') {
            router.replace('/');
        }
    }, [router]);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        setTimeout(() => {
            if (username === VALID_USERNAME && password === VALID_PASSWORD) {
                if (rememberMe) {
                    localStorage.setItem(AUTH_KEY, 'true');
                } else {
                    sessionStorage.setItem(AUTH_KEY, 'true');
                }
                router.replace('/');
            } else {
                setError('Kullanıcı adı veya şifre hatalı!');
            }
            setLoading(false);
        }, 600);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-dark px-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center mb-8">
                        <Image src="/logo.png" alt="GMusic Logo" width={220} height={80} className="h-20 w-auto" priority />
                    </div>
                    <p className="text-sm text-gray-400 mt-2">Müzik dünyasına hoş geldiniz</p>
                </div>

                {/* Login form */}
                <form onSubmit={handleLogin} className="bg-[#181818] rounded-2xl p-8 space-y-5 border border-white/5">
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                            <p className="text-sm text-red-400">{error}</p>
                        </div>
                    )}

                    {/* Username */}
                    <div className="space-y-1.5">
                        <label className="block text-sm font-medium text-gray-300">Kullanıcı Adı</label>
                        <div className="relative">
                            <IoPerson className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="Kullanıcı adınızı girin"
                                required
                                className="w-full pl-11 pr-12 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#c68cfa] focus:ring-1 focus:ring-[#c68cfa] transition-colors"
                            />
                        </div>
                    </div>

                    {/* Password */}
                    <div className="space-y-1.5">
                        <label className="block text-sm font-medium text-gray-300">Şifre</label>
                        <div className="relative">
                            <IoKey className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                className="w-full pl-11 pr-12 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#ff7a00] focus:ring-1 focus:ring-[#ff7a00] transition-colors"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                            >
                                {showPassword ? <IoEyeOff /> : <IoEye />}
                            </button>
                        </div>
                    </div>

                    {/* Remember me */}
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                            className="w-4 h-4 accent-[#c68cfa] rounded"
                        />
                        <span className="text-sm text-gray-400">Beni Hatırla</span>
                    </label>

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-[#c68cfa] hover:bg-[#d4a5fb] text-white font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                Giriş yapılıyor...
                            </>
                        ) : (
                            <>
                                <IoKey className="text-lg" />
                                Giriş Yap
                            </>
                        )}
                    </button>

                    {/* Credits */}
                    <p className="text-center text-xs text-gray-500 pt-2">
                        Directed by Benhur & İsa
                    </p>
                </form>
            </div>
        </div>
    );
}
