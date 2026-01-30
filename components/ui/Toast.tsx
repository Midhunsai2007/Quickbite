'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils/helpers'

interface ToastProps {
    message: string
    type?: 'success' | 'error' | 'info'
    duration?: number
    onClose: () => void
}

export function Toast({ message, type = 'success', duration = 3000, onClose }: ToastProps) {
    useEffect(() => {
        const timer = setTimeout(onClose, duration)
        return () => clearTimeout(timer)
    }, [duration, onClose])

    const icons = {
        success: '✓',
        error: '✕',
        info: 'ℹ',
    }

    const colors = {
        success: 'from-green-500/20 to-emerald-500/20 border-green-500/30',
        error: 'from-red-500/20 to-pink-500/20 border-red-500/30',
        info: 'from-blue-500/20 to-cyan-500/20 border-blue-500/30',
    }

    return (
        <div
            className={cn(
                'fixed bottom-6 right-6 z-50',
                'flex items-center gap-3 px-6 py-4',
                'bg-gradient-to-r backdrop-blur-xl border rounded-2xl',
                'animate-in slide-in-from-bottom-5 fade-in duration-300',
                colors[type]
            )}
        >
            <span className="text-lg">{icons[type]}</span>
            <p className="text-white font-medium">{message}</p>
            <button onClick={onClose} className="ml-2 text-gray-400 hover:text-white">
                ×
            </button>
        </div>
    )
}

// Toast container hook
export function useToast() {
    const [toasts, setToasts] = useState<{ id: string; message: string; type: 'success' | 'error' | 'info' }[]>([])

    const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
        const id = Math.random().toString(36).slice(2)
        setToasts((prev) => [...prev, { id, message, type }])
    }

    const removeToast = (id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
    }

    return { toasts, showToast, removeToast }
}
