// ===== SUPABASE CLIENT =====
// Initialize Supabase client for database operations

// IMPORTANT: Replace these with your Supabase project credentials
// Get them from: https://app.supabase.com → Settings → API
const SUPABASE_URL = 'YOUR_SUPABASE_URL'; // e.g., https://xxxx.supabase.co
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';

// Initialize Supabase client (loaded from CDN)
let supabase = null;

function initSupabase() {
    if (typeof window !== 'undefined' && window.supabase) {
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('✅ Supabase client initialized');
        return true;
    }
    console.warn('⚠️ Supabase library not loaded, using localStorage fallback');
    return false;
}

// Check if Supabase is configured
function isSupabaseConfigured() {
    return SUPABASE_URL !== 'YOUR_SUPABASE_URL' &&
        SUPABASE_ANON_KEY !== 'YOUR_SUPABASE_ANON_KEY' &&
        supabase !== null;
}

// ===== FOOD API =====
const FoodAPI = {
    async getAll() {
        if (!isSupabaseConfigured()) return null;
        const { data, error } = await supabase
            .from('foods')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data;
    },

    async getById(id) {
        if (!isSupabaseConfigured()) return null;
        const { data, error } = await supabase
            .from('foods')
            .select('*')
            .eq('id', id)
            .single();
        if (error) throw error;
        return data;
    },

    async create(food) {
        if (!isSupabaseConfigured()) return null;
        const { data, error } = await supabase
            .from('foods')
            .insert([food])
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async update(id, updates) {
        if (!isSupabaseConfigured()) return null;
        const { data, error } = await supabase
            .from('foods')
            .update(updates)
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async delete(id) {
        if (!isSupabaseConfigured()) return null;
        const { error } = await supabase
            .from('foods')
            .delete()
            .eq('id', id);
        if (error) throw error;
        return true;
    },

    async updateStock(id, quantity) {
        if (!isSupabaseConfigured()) return null;
        const food = await this.getById(id);
        if (!food) return null;
        return this.update(id, { stock: Math.max(0, food.stock - quantity) });
    }
};

// ===== ORDER API =====
const OrderAPI = {
    async getAll() {
        if (!isSupabaseConfigured()) return null;
        const { data, error } = await supabase
            .from('orders')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data;
    },

    async getByUser(username) {
        if (!isSupabaseConfigured()) return null;
        const { data, error } = await supabase
            .from('orders')
            .select('*')
            .eq('customer_username', username)
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data;
    },

    async create(order) {
        if (!isSupabaseConfigured()) return null;
        const { data, error } = await supabase
            .from('orders')
            .insert([{
                customer_name: order.customer.name,
                customer_phone: order.customer.phone,
                customer_address: order.customer.address,
                customer_username: order.customer.username,
                items: order.items,
                total: order.total,
                status: 'pending'
            }])
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async updateStatus(id, status) {
        if (!isSupabaseConfigured()) return null;
        const { data, error } = await supabase
            .from('orders')
            .update({ status })
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return data;
    }
};

// ===== USER API =====
const UserAPI = {
    async login(username, password, role) {
        if (!isSupabaseConfigured()) return null;

        // Admin login check
        if (role === 'admin') {
            if (username === 'midhun' && password === '1234') {
                return { success: true, user: { username, role: 'admin' } };
            }
            return null;
        }

        // Customer login
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('username', username)
            .eq('password', password)
            .single();

        if (error || !data) return null;
        return { success: true, user: { username: data.username, role: 'customer' } };
    },

    async register(username, password) {
        if (!isSupabaseConfigured()) return null;

        // Check if user exists
        const { data: existing } = await supabase
            .from('users')
            .select('username')
            .ilike('username', username)
            .single();

        if (existing) return null;

        // Create user
        const { data, error } = await supabase
            .from('users')
            .insert([{ username, password, role: 'customer' }])
            .select()
            .single();

        if (error) return null;
        return { success: true, user: { username: data.username, role: 'customer' } };
    }
};

// ===== REVIEW API =====
const ReviewAPI = {
    async getAll() {
        if (!isSupabaseConfigured()) return null;
        const { data, error } = await supabase
            .from('reviews')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data;
    },

    async getByFood(foodId) {
        if (!isSupabaseConfigured()) return null;
        const { data, error } = await supabase
            .from('reviews')
            .select('*')
            .eq('food_id', foodId)
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data;
    },

    async create(review) {
        if (!isSupabaseConfigured()) return null;
        const { data, error } = await supabase
            .from('reviews')
            .insert([{
                food_id: review.foodId,
                customer_name: review.customerName,
                rating: review.rating,
                comment: review.comment
            }])
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async delete(id) {
        if (!isSupabaseConfigured()) return null;
        const { error } = await supabase
            .from('reviews')
            .delete()
            .eq('id', id);
        if (error) throw error;
        return true;
    }
};

// ===== HEALTH CHECK =====
async function checkAPIHealth() {
    if (!isSupabaseConfigured()) return false;
    try {
        const { error } = await supabase.from('foods').select('id').limit(1);
        return !error;
    } catch {
        return false;
    }
}

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    initSupabase();
});
