'use client';

import React from 'react';

// ============================================================
// Button — Reusable button with variants
// ============================================================
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    isLoading?: boolean;
}

export function Button({
    children,
    variant = 'primary',
    size = 'md',
    isLoading,
    className = '',
    disabled,
    ...props
}: ButtonProps) {
    const base = 'inline-flex items-center justify-center font-medium rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-orange-500/50 disabled:opacity-50 disabled:cursor-not-allowed';

    const variants = {
        primary: 'bg-[#c68cfa] hover:bg-[#d4a5fb] shadow-lg shadow-purple-500/20',
        secondary: 'bg-white/10 hover:bg-white/20 text-white',
        ghost: 'hover:bg-white/10 text-gray-300 hover:text-white',
        danger: 'bg-red-600 hover:bg-red-700 text-white',
    };

    const sizes = {
        sm: 'px-3 py-1.5 text-xs',
        md: 'px-5 py-2.5 text-sm',
        lg: 'px-8 py-3 text-base',
    };

    return (
        <button
            className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading && (
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
            )}
            {children}
        </button>
    );
}

// ============================================================
// Skeleton — Loading placeholder
// ============================================================
interface SkeletonProps {
    className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
    return (
        <div className={`animate-pulse bg-white/10 rounded-xl ${className}`} />
    );
}

// ============================================================
// Card — Wrapper component with dark card style
// ============================================================
interface CardProps {
    children: React.ReactNode;
    className?: string;
    hover?: boolean;
    onClick?: () => void;
}

export function Card({ children, className = '', hover = true, onClick }: CardProps) {
    return (
        <div
            onClick={onClick}
            className={`bg-[#181818] rounded-2xl p-4 transition-all duration-300 ${hover ? 'hover:bg-[#282828] cursor-pointer group' : ''
                } ${onClick ? 'cursor-pointer' : ''} ${className}`}
        >
            {children}
        </div>
    );
}

// ============================================================
// Input — Styled form input
// ============================================================
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
}

export function Input({ label, error, className = '', ...props }: InputProps) {
    return (
        <div className="space-y-1.5">
            {label && (
                <label className="block text-sm font-medium text-gray-300">{label}</label>
            )}
            <input
                className={`w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#c68cfa] focus:ring-1 focus:ring-[#c68cfa] transition-colors ${className}`}
                {...props}
            />
            {error && <p className="text-red-400 text-xs">{error}</p>}
        </div>
    );
}

// ============================================================
// Slider — Range slider for volume/progress
// ============================================================
interface SliderProps {
    value: number;
    max: number;
    onChange: (value: number) => void;
    className?: string;
}

export function Slider({ value, max, onChange, className = '' }: SliderProps) {
    const percentage = max > 0 ? (value / max) * 100 : 0;

    return (
        <div className={`group relative flex items-center w-full h-5 ${className}`}>
            <input
                type="range"
                min={0}
                max={max}
                value={value}
                onChange={(e) => onChange(Number(e.target.value))}
                className="absolute w-full h-1 appearance-none bg-transparent cursor-pointer z-10 
          [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 
          [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:opacity-0 
          [&::-webkit-slider-thumb]:group-hover:opacity-100 [&::-webkit-slider-thumb]:transition-opacity
          [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:rounded-full 
          [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-0"
            />
            <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden">
                <div
                    className="h-full bg-white group-hover:bg-[#c68cfa] rounded-full transition-colors"
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
}

// ============================================================
// Modal — Dialog overlay
// ============================================================
interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-[#282828] rounded-2xl p-6 max-w-lg w-full mx-4 shadow-2xl max-h-[85vh] overflow-y-auto">
                {title && (
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-white">{title}</h2>
                        <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                )}
                {children}
            </div>
        </div>
    );
}

// ============================================================
// Toast — Notification component
// ============================================================
interface ToastProps {
    message: string;
    type?: 'success' | 'error' | 'info';
    onClose: () => void;
}

export function Toast({ message, type = 'info', onClose }: ToastProps) {
    const colors = {
        success: 'bg-green-600',
        error: 'bg-red-600',
        info: 'bg-[#c68cfa]',
    };

    React.useEffect(() => {
        const timer = setTimeout(onClose, 3000);
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className={`fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] ${colors[type]} text-white px-6 py-3 rounded-full shadow-lg animate-slide-up flex items-center gap-2`}>
            <span className="text-sm font-medium">{message}</span>
            <button onClick={onClose} className="ml-2 hover:opacity-80">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
    );
}
