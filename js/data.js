// ===== DATA MODULE (Supabase Version) =====
// Uses Supabase for persistent storage with localStorage fallback

const CURRENCY = '₹';

const ORDER_STATUSES = [
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Order Confirmed' },
  { value: 'preparing', label: 'Preparing' },
  { value: 'delivery_15', label: 'Delivery in 15 mins' },
  { value: 'delivery_30', label: 'Delivery in 30 mins' },
  { value: 'delivery_45', label: 'Delivery in 45 mins' },
  { value: 'out_for_delivery', label: 'Out for Delivery' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' }
];

// Check if Supabase is available
let useSupabase = false;

async function initDatabase() {
  if (typeof checkAPIHealth === 'function') {
    useSupabase = await checkAPIHealth();
    console.log(useSupabase ? '✅ Connected to Supabase' : '⚠️ Using localStorage fallback');
  }
}

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(initDatabase, 100);
});

// ===== SESSION MANAGEMENT =====
function getSession() {
  const session = localStorage.getItem('quickbite_session');
  return session ? JSON.parse(session) : null;
}

function setSession(username, role) {
  localStorage.setItem('quickbite_session', JSON.stringify({ username, role }));
}

function clearSession() {
  localStorage.removeItem('quickbite_session');
  localStorage.removeItem('quickbite_cart');
}

function requireAuth(requiredRole) {
  const session = getSession();
  if (!session) {
    window.location.href = 'index.html';
    return false;
  }
  if (requiredRole && session.role !== requiredRole) {
    window.location.href = session.role === 'admin' ? 'admin.html' : 'customer.html';
    return false;
  }
  return true;
}

// ===== FOOD ITEMS =====
let cachedFoods = [];

async function getFoodItemsAsync() {
  if (useSupabase && typeof FoodAPI !== 'undefined') {
    try {
      const foods = await FoodAPI.getAll();
      if (foods) {
        cachedFoods = foods.map(f => ({
          id: f.id,
          name: f.name,
          image: f.image,
          price: f.price,
          quantity: f.quantity,
          stock: f.stock,
          ingredients: f.ingredients
        }));
        return cachedFoods;
      }
    } catch (error) {
      console.error('Supabase Error:', error);
    }
  }
  return getLocalFoodItems();
}

function getFoodItems() {
  if (cachedFoods.length > 0) return cachedFoods;
  return getLocalFoodItems();
}

function getLocalFoodItems() {
  let foods = localStorage.getItem('quickbite_foods');
  if (!foods) {
    localStorage.setItem('quickbite_foods', JSON.stringify(DEFAULT_FOOD_ITEMS));
    return DEFAULT_FOOD_ITEMS;
  }
  return JSON.parse(foods);
}

function getFoodById(id) {
  const foods = getFoodItems();
  return foods.find(f => f.id == id) || null;
}

async function addFoodItem(food) {
  if (useSupabase && typeof FoodAPI !== 'undefined') {
    try {
      const result = await FoodAPI.create(food);
      if (result) {
        cachedFoods = await FoodAPI.getAll() || [];
        return result;
      }
    } catch (error) {
      console.error('Supabase Error:', error);
    }
  }
  // Fallback to localStorage
  const foods = getLocalFoodItems();
  food.id = foods.length > 0 ? Math.max(...foods.map(f => f.id || 0)) + 1 : 1;
  foods.push(food);
  localStorage.setItem('quickbite_foods', JSON.stringify(foods));
  return food;
}

async function updateFoodItem(id, updates) {
  if (useSupabase && typeof FoodAPI !== 'undefined') {
    try {
      const result = await FoodAPI.update(id, updates);
      if (result) {
        cachedFoods = await FoodAPI.getAll() || [];
        return result;
      }
    } catch (error) {
      console.error('Supabase Error:', error);
    }
  }
  // Fallback to localStorage
  const foods = getLocalFoodItems();
  const index = foods.findIndex(f => f.id == id);
  if (index !== -1) {
    foods[index] = { ...foods[index], ...updates };
    localStorage.setItem('quickbite_foods', JSON.stringify(foods));
    return foods[index];
  }
  return null;
}

async function deleteFoodItem(id) {
  if (useSupabase && typeof FoodAPI !== 'undefined') {
    try {
      await FoodAPI.delete(id);
      cachedFoods = await FoodAPI.getAll() || [];
      return true;
    } catch (error) {
      console.error('Supabase Error:', error);
    }
  }
  // Fallback to localStorage
  let foods = getLocalFoodItems();
  foods = foods.filter(f => f.id != id);
  localStorage.setItem('quickbite_foods', JSON.stringify(foods));
  return true;
}

function searchFoodByIngredient(query) {
  if (!query) return getFoodItems();
  const lowerQuery = query.toLowerCase();
  return getFoodItems().filter(food =>
    food.name.toLowerCase().includes(lowerQuery) ||
    food.ingredients.toLowerCase().includes(lowerQuery)
  );
}

// ===== CART (localStorage only) =====
function getCart() {
  const cart = localStorage.getItem('quickbite_cart');
  return cart ? JSON.parse(cart) : [];
}

function addToCart(foodId, qty = 1) {
  const cart = getCart();
  const food = getFoodById(foodId);
  if (!food || food.stock <= 0) return null;

  const existing = cart.find(item => item.foodId == foodId);
  if (existing) {
    const newQty = existing.quantity + qty;
    if (newQty <= food.stock) {
      existing.quantity = newQty;
    } else {
      return null;
    }
  } else {
    if (qty <= food.stock) {
      cart.push({ foodId: parseInt(foodId), quantity: qty });
    } else {
      return null;
    }
  }
  localStorage.setItem('quickbite_cart', JSON.stringify(cart));
  return cart;
}

function updateCartQuantity(foodId, quantity) {
  let cart = getCart();
  if (quantity <= 0) {
    cart = cart.filter(item => item.foodId != foodId);
  } else {
    const item = cart.find(item => item.foodId == foodId);
    if (item) {
      const food = getFoodById(foodId);
      item.quantity = Math.min(quantity, food?.stock || 10);
    }
  }
  localStorage.setItem('quickbite_cart', JSON.stringify(cart));
  return cart;
}

function removeFromCart(foodId) {
  let cart = getCart();
  cart = cart.filter(item => item.foodId != foodId);
  localStorage.setItem('quickbite_cart', JSON.stringify(cart));
  return cart;
}

function clearCart() {
  localStorage.removeItem('quickbite_cart');
  return [];
}

function getCartItemCount() {
  return getCart().reduce((sum, item) => sum + item.quantity, 0);
}

function getCartTotal() {
  return getCart().reduce((sum, item) => {
    const food = getFoodById(item.foodId);
    return sum + (food ? food.price * item.quantity : 0);
  }, 0);
}

// ===== ORDERS =====
let cachedOrders = [];

async function getOrdersAsync() {
  if (useSupabase && typeof OrderAPI !== 'undefined') {
    try {
      const orders = await OrderAPI.getAll();
      if (orders) {
        cachedOrders = orders.map(o => ({
          id: o.id,
          customer: {
            name: o.customer_name,
            phone: o.customer_phone,
            address: o.customer_address,
            username: o.customer_username
          },
          items: o.items,
          total: o.total,
          status: o.status,
          time: o.created_at
        }));
        return cachedOrders;
      }
    } catch (error) {
      console.error('Supabase Error:', error);
    }
  }
  return getLocalOrders();
}

function getOrders() {
  if (cachedOrders.length > 0) return cachedOrders;
  return getLocalOrders();
}

function getLocalOrders() {
  const orders = localStorage.getItem('quickbite_orders');
  return orders ? JSON.parse(orders) : [];
}

async function getOrdersByUserAsync(username) {
  if (useSupabase && typeof OrderAPI !== 'undefined') {
    try {
      const orders = await OrderAPI.getByUser(username);
      if (orders) {
        return orders.map(o => ({
          id: o.id,
          customer: {
            name: o.customer_name,
            phone: o.customer_phone,
            address: o.customer_address,
            username: o.customer_username
          },
          items: o.items,
          total: o.total,
          status: o.status,
          time: o.created_at
        }));
      }
    } catch (error) {
      console.error('Supabase Error:', error);
    }
  }
  return getLocalOrders().filter(o => o.customer.username === username);
}

function getOrdersByUser(username) {
  return getOrders().filter(o => o.customer?.username === username);
}

async function placeOrder(customerInfo) {
  const cart = getCart();
  if (cart.length === 0) return null;

  const orderItems = cart.map(item => {
    const food = getFoodById(item.foodId);
    return {
      foodId: item.foodId,
      name: food.name,
      price: food.price,
      quantity: item.quantity,
      weight: food.quantity
    };
  });

  const total = cart.reduce((sum, item) => {
    const food = getFoodById(item.foodId);
    return sum + (food ? food.price * item.quantity : 0);
  }, 0);

  if (useSupabase && typeof OrderAPI !== 'undefined') {
    try {
      const order = await OrderAPI.create({
        customer: customerInfo,
        items: orderItems,
        total
      });
      if (order) {
        // Update stock
        for (const item of cart) {
          await FoodAPI.updateStock(item.foodId, item.quantity);
        }
        clearCart();
        cachedFoods = await FoodAPI.getAll() || [];
        return { id: order.id, ...order };
      }
    } catch (error) {
      console.error('Supabase Error:', error);
    }
  }

  // Fallback to localStorage
  const foods = getLocalFoodItems();
  cart.forEach(item => {
    const foodIndex = foods.findIndex(f => f.id == item.foodId);
    if (foodIndex !== -1) {
      foods[foodIndex].stock -= item.quantity;
    }
  });
  localStorage.setItem('quickbite_foods', JSON.stringify(foods));

  const order = {
    id: Date.now(),
    customer: customerInfo,
    items: orderItems,
    total,
    status: 'pending',
    time: new Date().toISOString()
  };

  const orders = getLocalOrders();
  orders.unshift(order);
  localStorage.setItem('quickbite_orders', JSON.stringify(orders));
  clearCart();
  return order;
}

async function updateOrderStatus(orderId, status) {
  if (useSupabase && typeof OrderAPI !== 'undefined') {
    try {
      const result = await OrderAPI.updateStatus(orderId, status);
      if (result) {
        cachedOrders = [];
        return result;
      }
    } catch (error) {
      console.error('Supabase Error:', error);
    }
  }
  // Fallback to localStorage
  const orders = getLocalOrders();
  const order = orders.find(o => o.id == orderId);
  if (order) {
    order.status = status;
    localStorage.setItem('quickbite_orders', JSON.stringify(orders));
    return order;
  }
  return null;
}

// ===== USERS =====
async function validateAdmin(username, password) {
  return username === 'midhun' && password === '1234';
}

async function validateUser(username, password) {
  if (useSupabase && typeof UserAPI !== 'undefined') {
    try {
      const result = await UserAPI.login(username, password, 'customer');
      return result ? { username } : null;
    } catch (error) {
      return null;
    }
  }
  // Fallback to localStorage
  const users = JSON.parse(localStorage.getItem('quickbite_users') || '[]');
  return users.find(u => u.username === username && u.password === password);
}

async function registerUser(username, password) {
  if (useSupabase && typeof UserAPI !== 'undefined') {
    try {
      const result = await UserAPI.register(username, password);
      return result ? { username } : null;
    } catch (error) {
      return null;
    }
  }
  // Fallback to localStorage
  const users = JSON.parse(localStorage.getItem('quickbite_users') || '[]');
  if (users.find(u => u.username.toLowerCase() === username.toLowerCase())) {
    return null;
  }
  const newUser = { username, password, createdAt: new Date().toISOString() };
  users.push(newUser);
  localStorage.setItem('quickbite_users', JSON.stringify(users));
  return newUser;
}

// ===== REVIEWS =====
let cachedReviews = [];

async function getReviewsAsync() {
  if (useSupabase && typeof ReviewAPI !== 'undefined') {
    try {
      const reviews = await ReviewAPI.getAll();
      if (reviews) {
        cachedReviews = reviews.map(r => ({
          id: r.id,
          foodId: r.food_id,
          customerName: r.customer_name,
          rating: r.rating,
          comment: r.comment,
          time: r.created_at
        }));
        return cachedReviews;
      }
    } catch (error) {
      console.error('Supabase Error:', error);
    }
  }
  return getLocalReviews();
}

function getReviews() {
  if (cachedReviews.length > 0) return cachedReviews;
  return getLocalReviews();
}

function getLocalReviews() {
  return JSON.parse(localStorage.getItem('quickbite_reviews') || '[]');
}

async function addReview(review) {
  if (useSupabase && typeof ReviewAPI !== 'undefined') {
    try {
      const result = await ReviewAPI.create(review);
      if (result) {
        cachedReviews = [];
        await getReviewsAsync();
        return result;
      }
    } catch (error) {
      console.error('Supabase Error:', error);
    }
  }
  // Fallback to localStorage
  const reviews = getLocalReviews();
  review.id = Date.now();
  review.time = new Date().toISOString();
  reviews.unshift(review);
  localStorage.setItem('quickbite_reviews', JSON.stringify(reviews));
  return review;
}

async function deleteReview(id) {
  if (useSupabase && typeof ReviewAPI !== 'undefined') {
    try {
      await ReviewAPI.delete(id);
      cachedReviews = [];
      return true;
    } catch (error) {
      console.error('Supabase Error:', error);
    }
  }
  // Fallback to localStorage
  let reviews = getLocalReviews();
  reviews = reviews.filter(r => r.id != id);
  localStorage.setItem('quickbite_reviews', JSON.stringify(reviews));
  return true;
}

// ===== UTILITIES =====
function formatPrice(price) {
  return `${CURRENCY}${price.toFixed(0)}`;
}

function getStatusLabel(statusValue) {
  const status = ORDER_STATUSES.find(s => s.value === statusValue);
  return status ? status.label : statusValue;
}

// ===== DEFAULT DATA =====
const DEFAULT_FOOD_ITEMS = [
  {
    id: 1,
    name: "Classic Burger",
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500",
    price: 199,
    quantity: "250g",
    stock: 25,
    ingredients: "Beef patty, Lettuce, Tomato, Cheese, Pickles, Onions"
  },
  {
    id: 2,
    name: "Margherita Pizza",
    image: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=500",
    price: 299,
    quantity: "300g",
    stock: 20,
    ingredients: "Tomato sauce, Mozzarella, Fresh basil, Olive oil"
  },
  {
    id: 3,
    name: "Chicken Biryani",
    image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500",
    price: 249,
    quantity: "400g",
    stock: 30,
    ingredients: "Basmati rice, Chicken, Spices, Saffron, Fried onions"
  },
  {
    id: 4,
    name: "Caesar Salad",
    image: "https://images.unsplash.com/photo-1546793665-c74683f339c1?w=500",
    price: 149,
    quantity: "200g",
    stock: 15,
    ingredients: "Romaine lettuce, Croutons, Parmesan, Caesar dressing"
  },
  {
    id: 5,
    name: "Chocolate Brownie",
    image: "https://images.unsplash.com/photo-1564355808539-22fda35bed7e?w=500",
    price: 99,
    quantity: "100g",
    stock: 40,
    ingredients: "Dark chocolate, Butter, Sugar, Eggs, Walnuts"
  },
  {
    id: 6,
    name: "Masala Dosa",
    image: "https://images.unsplash.com/photo-1668236543090-82eb5eace0f7?w=500",
    price: 89,
    quantity: "200g",
    stock: 35,
    ingredients: "Rice batter, Potato masala, Sambar, Chutney"
  }
];

// Initialize data on load
(function initializeData() {
  if (!localStorage.getItem('quickbite_foods')) {
    localStorage.setItem('quickbite_foods', JSON.stringify(DEFAULT_FOOD_ITEMS));
  }
})();
