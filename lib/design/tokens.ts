// ===== COLOR PALETTE =====
export const colors = {
    // Primary - Orange
    primary: {
        50: '#fff7ed',
        100: '#ffedd5',
        200: '#fed7aa',
        300: '#fdba74',
        400: '#fb923c',
        500: '#f97316',
        600: '#ea580c',
        700: '#c2410c',
        800: '#9a3412',
        900: '#7c2d12',
    },
    // Accent - Cyan
    accent: {
        50: '#ecfeff',
        100: '#cffafe',
        200: '#a5f3fc',
        300: '#67e8f9',
        400: '#22d3ee',
        500: '#06b6d4',
        600: '#0891b2',
        700: '#0e7490',
        800: '#155e75',
        900: '#164e63',
    },
    // Neutral - Dark
    dark: {
        50: '#f9fafb',
        100: '#f3f4f6',
        200: '#e5e7eb',
        300: '#d1d5db',
        400: '#9ca3af',
        500: '#6b7280',
        600: '#4b5563',
        700: '#374151',
        800: '#1f2937',
        900: '#111827',
        950: '#0a0a0f',
    },
}

// ===== GRADIENTS =====
export const gradients = {
    primary: 'bg-gradient-to-r from-orange-500 to-amber-500',
    accent: 'bg-gradient-to-r from-cyan-400 to-blue-500',
    hero: 'bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900',
    glass: 'bg-white/10 backdrop-blur-xl',
    card: 'bg-gradient-to-br from-white/10 to-white/5',
}

// ===== ANIMATIONS =====
export const animations = {
    fadeIn: 'animate-in fade-in duration-500',
    slideUp: 'animate-in slide-in-from-bottom duration-500',
    slideIn: 'animate-in slide-in-from-right duration-300',
    pulse: 'animate-pulse',
    bounce: 'animate-bounce',
}
