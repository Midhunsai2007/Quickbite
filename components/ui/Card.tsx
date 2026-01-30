'use client'

import { cn } from '@/lib/utils/helpers'

interface CardProps {
    children: React.ReactNode
    className?: string
    hover?: boolean
    glow?: boolean
}

export default function Card({ children, className, hover = false, glow = false }: CardProps) {
    return (
        <div
            className={cn(
                'relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl',
                'border border-white/10 rounded-2xl overflow-hidden',
                hover && 'hover:border-white/20 hover:shadow-xl hover:shadow-black/20 transition-all duration-300 hover:-translate-y-1',
                glow && 'before:absolute before:inset-0 before:bg-gradient-to-r before:from-orange-500/20 before:to-cyan-500/20 before:opacity-0 hover:before:opacity-100 before:transition-opacity',
                className
            )}
        >
            {children}
        </div>
    )
}

// Card Header
export function CardHeader({ children, className }: { children: React.ReactNode; className?: string }) {
    return (
        <div className={cn('p-6 border-b border-white/10', className)}>
            {children}
        </div>
    )
}

// Card Content
export function CardContent({ children, className }: { children: React.ReactNode; className?: string }) {
    return (
        <div className={cn('p-6', className)}>
            {children}
        </div>
    )
}
