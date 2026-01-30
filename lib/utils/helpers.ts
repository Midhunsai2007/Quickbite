// ===== UTILITY FUNCTIONS =====

// Format price with currency
export function formatPrice(price: number): string {
    return `₹${price.toFixed(0)}`
}

// Format date
export function formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    })
}

// Truncate text
export function truncate(text: string, length: number): string {
    return text.length > length ? text.slice(0, length) + '...' : text
}

// Generate random ID
export function generateId(): string {
    return Math.random().toString(36).slice(2, 11)
}

// Classname helper (like clsx)
export function cn(...classes: (string | boolean | undefined)[]): string {
    return classes.filter(Boolean).join(' ')
}
