// ===== API CLIENT =====
// Handles all communication with the backend

const API_BASE = 'http://localhost:5000/api';

// Generic fetch wrapper
async function apiFetch(endpoint, options = {}) {
    try {
        const response = await fetch(`${API_BASE}${endpoint}`, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'API Error');
        }

        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// ===== FOOD API =====
const FoodAPI = {
    getAll: () => apiFetch('/foods'),
    getById: (id) => apiFetch(`/foods/${id}`),
    create: (food) => apiFetch('/foods', { method: 'POST', body: JSON.stringify(food) }),
    update: (id, food) => apiFetch(`/foods/${id}`, { method: 'PUT', body: JSON.stringify(food) }),
    delete: (id) => apiFetch(`/foods/${id}`, { method: 'DELETE' }),
    updateStock: (id, quantity) => apiFetch(`/foods/${id}/stock`, { method: 'PATCH', body: JSON.stringify({ quantity }) })
};

// ===== ORDER API =====
const OrderAPI = {
    getAll: () => apiFetch('/orders'),
    getByUser: (username) => apiFetch(`/orders/user/${username}`),
    getById: (id) => apiFetch(`/orders/${id}`),
    create: (order) => apiFetch('/orders', { method: 'POST', body: JSON.stringify(order) }),
    updateStatus: (id, status) => apiFetch(`/orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
    delete: (id) => apiFetch(`/orders/${id}`, { method: 'DELETE' })
};

// ===== USER API =====
const UserAPI = {
    login: (username, password, role) => apiFetch('/users/login', {
        method: 'POST',
        body: JSON.stringify({ username, password, role })
    }),
    register: (username, password) => apiFetch('/users/register', {
        method: 'POST',
        body: JSON.stringify({ username, password })
    }),
    getAll: () => apiFetch('/users')
};

// ===== REVIEW API =====
const ReviewAPI = {
    getAll: () => apiFetch('/reviews'),
    getByFood: (foodId) => apiFetch(`/reviews/food/${foodId}`),
    getRating: (foodId) => apiFetch(`/reviews/food/${foodId}/rating`),
    create: (review) => apiFetch('/reviews', { method: 'POST', body: JSON.stringify(review) }),
    delete: (id) => apiFetch(`/reviews/${id}`, { method: 'DELETE' })
};

// ===== HEALTH CHECK =====
async function checkAPIHealth() {
    try {
        const data = await apiFetch('/health');
        return data.status === 'ok';
    } catch {
        return false;
    }
}

// Export for ES modules (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { FoodAPI, OrderAPI, UserAPI, ReviewAPI, checkAPIHealth };
}
