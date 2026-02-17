'use client';

import React, { useEffect, useState, createContext, useContext, useCallback } from 'react';
import { IoCheckmarkCircle, IoAlertCircle, IoClose } from 'react-icons/io5';

// ============================================================
// Toast Notification System
// ============================================================

interface ToastItem {
    id: number;
    message: string;
    type: 'success' | 'error';
}

interface ToastContextType {
    showToast: (message: string, type: 'success' | 'error') => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error('useToast must be used within ToastProvider');
    return ctx;
}

function ToastNotification({ item, onRemove }: { item: ToastItem; onRemove: () => void }) {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        requestAnimationFrame(() => setVisible(true));
        const timer = setTimeout(() => {
            setVisible(false);
            setTimeout(onRemove, 300);
        }, 3000);
        return () => clearTimeout(timer);
    }, [onRemove]);

    return (
        <div
            className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border transition-all duration-300 ${visible ? 'translate-x-0 opacity-100' : 'translate-x-[120%] opacity-0'
                } ${item.type === 'success'
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    : 'bg-red-500/10 border-red-500/30 text-red-400'
                }`}
        >
            {item.type === 'success' ? (
                <IoCheckmarkCircle className="text-xl flex-shrink-0" />
            ) : (
                <IoAlertCircle className="text-xl flex-shrink-0" />
            )}
            <span className="text-sm font-medium flex-1">{item.message}</span>
            <button onClick={() => { setVisible(false); setTimeout(onRemove, 300); }} className="text-white/40 hover:text-white">
                <IoClose />
            </button>
        </div>
    );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<ToastItem[]>([]);
    let counter = 0;

    const showToast = useCallback((message: string, type: 'success' | 'error') => {
        const id = Date.now() + counter++;
        setToasts((prev) => [...prev, { id, message, type }]);
    }, []);

    const removeToast = useCallback((id: number) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            {/* Toast container */}
            <div className="fixed top-4 right-4 z-[100] space-y-2 max-w-sm">
                {toasts.map((toast) => (
                    <ToastNotification key={toast.id} item={toast} onRemove={() => removeToast(toast.id)} />
                ))}
            </div>
        </ToastContext.Provider>
    );
}
