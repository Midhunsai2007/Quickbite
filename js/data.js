// ===== DATA MODULE (MongoDB Version) =====
// This version uses API calls to MongoDB backend instead of localStorage

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

// Check if API is available
let useAPI = false;
checkAPIHealth().then(available => {
  useAPI = available;
  console.log(available ? '✅ Connected to MongoDB API' : '⚠️ Using localStorage fallback');
});

// ===== SESSION MANAGEMENT (localStorage only) =====
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
  if (useAPI) {
    try {
      cachedFoods = await FoodAPI.getAll();
      return cachedFoods;
    } catch (error) {
      console.error('API Error, falling back to localStorage:', error);
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
  const food = foods.find(f => f.id == id || f._id == id);
  return food || null;
}

async function addFoodItem(food) {
  if (useAPI) {
    try {
      const newFood = await FoodAPI.create(food);
      cachedFoods = await FoodAPI.getAll();
      return newFood;
    } catch (error) {
      console.error('API Error:', error);
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
  if (useAPI) {
    try {
      const updated = await FoodAPI.update(id, updates);
      cachedFoods = await FoodAPI.getAll();
      return updated;
    } catch (error) {
      console.error('API Error:', error);
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
  if (useAPI) {
    try {
      await FoodAPI.delete(id);
      cachedFoods = await FoodAPI.getAll();
      return true;
    } catch (error) {
      console.error('API Error:', error);
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

// ===== CART (localStorage only - per session) =====
function getCart() {
  const cart = localStorage.getItem('quickbite_cart');
  return cart ? JSON.parse(cart) : [];
}

function addToCart(foodId, qty = 1) {
  const cart = getCart();
  const food = getFoodById(foodId);
  const id = food._id || food.id;

  if (!food || food.stock <= 0) return null;

  const existing = cart.find(item => item.foodId == id);
  if (existing) {
    const newQty = existing.quantity + qty;
    if (newQty <= food.stock) {
      existing.quantity = newQty;
    } else {
      return null;
    }
  } else {
    if (qty <= food.stock) {
      cart.push({ foodId: id, quantity: qty });
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
  if (useAPI) {
    try {
      cachedOrders = await OrderAPI.getAll();
      return cachedOrders;
    } catch (error) {
      console.error('API Error:', error);
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
  if (useAPI) {
    try {
      return await OrderAPI.getByUser(username);
    } catch (error) {
      console.error('API Error:', error);
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

  if (useAPI) {
    try {
      const orderData = {
        customer: customerInfo,
        items: cart.map(item => ({
          foodId: item.foodId,
          quantity: item.quantity
        }))
      };
      const order = await OrderAPI.create(orderData);
      clearCart();
      cachedFoods = await FoodAPI.getAll();
      return order;
    } catch (error) {
      console.error('API Error:', error);
      return null;
    }
  }

  // Fallback to localStorage
  const foods = getLocalFoodItems();
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

  // Update stock locally
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
  if (useAPI) {
    try {
      const updated = await OrderAPI.updateStatus(orderId, status);
      cachedOrders = await OrderAPI.getAll();
      return updated;
    } catch (error) {
      console.error('API Error:', error);
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
  if (useAPI) {
    try {
      const result = await UserAPI.login(username, password, 'admin');
      return result.success;
    } catch (error) {
      return false;
    }
  }
  return username === 'midhun' && password === '1234';
}

async function validateUser(username, password) {
  if (useAPI) {
    try {
      const result = await UserAPI.login(username, password, 'customer');
      return result.success ? { username } : null;
    } catch (error) {
      return null;
    }
  }
  // Fallback to localStorage
  const users = JSON.parse(localStorage.getItem('quickbite_users') || '[]');
  return users.find(u => u.username === username && u.password === password);
}

async function registerUser(username, password) {
  if (useAPI) {
    try {
      const result = await UserAPI.register(username, password);
      return result.success ? { username } : null;
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
  if (useAPI) {
    try {
      cachedReviews = await ReviewAPI.getAll();
      return cachedReviews;
    } catch (error) {
      console.error('API Error:', error);
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
  if (useAPI) {
    try {
      const newReview = await ReviewAPI.create(review);
      cachedReviews = await ReviewAPI.getAll();
      return newReview;
    } catch (error) {
      console.error('API Error:', error);
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
  if (useAPI) {
    try {
      await ReviewAPI.delete(id);
      cachedReviews = await ReviewAPI.getAll();
      return true;
    } catch (error) {
      console.error('API Error:', error);
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

// Initialize data on load (for localStorage fallback)
(function initializeData() {
  if (!localStorage.getItem('quickbite_foods')) {
    localStorage.setItem('quickbite_foods', JSON.stringify(DEFAULT_FOOD_ITEMS));
  }
})();
