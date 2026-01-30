'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils/helpers'
import Button from './Button'

interface NavbarProps {
    username?: string
    cartCount?: number
    onCartClick?: () => void
    onLogout?: () => void
    isAdmin?: boolean
}

export default function Navbar({ username, cartCount = 0, onCartClick, onLogout, isAdmin = false }: NavbarProps) {
    const pathname = usePathname()

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-xl border-b border-white/10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2 group">
                        <span className="text-2xl group-hover:animate-bounce">⚡</span>
                        <span className="text-xl font-bold bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">
                            Quick Bite
                        </span>
                        {isAdmin && (
                            <span className="px-2 py-0.5 text-xs font-semibold bg-cyan-500/20 text-cyan-400 rounded-full">
                                Admin
                            </span>
                        )}
                    </Link>

                    {/* Right Section */}
                    <div className="flex items-center gap-4">
                        {/* Cart Button (Customer Only) */}
                        {!isAdmin && onCartClick && (
                            <button
                                onClick={onCartClick}
                                className="relative p-2 hover:bg-white/10 rounded-xl transition-colors"
                            >
                                <span className="text-xl">🛒</span>
                                {cartCount > 0 && (
                                    <span className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center text-xs font-bold bg-orange-500 text-white rounded-full animate-in zoom-in">
                                        {cartCount}
                                    </span>
                                )}
                            </button>
                        )}

                        {/* User Info */}
                        {username && (
                            <div className="flex items-center gap-3">
                                <div className="hidden sm:block">
                                    <p className="text-sm text-gray-400">Welcome,</p>
                                    <p className="text-sm font-medium text-white truncate max-w-[120px]">{username}</p>
                                </div>
                                <Button variant="ghost" size="sm" onClick={onLogout}>
                                    Logout
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    )
}
