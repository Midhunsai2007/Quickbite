// ===== CUSTOMER MODULE =====

document.addEventListener('DOMContentLoaded', function () {
    // Check authentication
    if (!requireAuth('customer')) return;

    // Initialize UI
    initializeCustomerUI();
    renderFoodItems();
    renderCustomerReviews();
    updateCartUI();
    setupEventListeners();
});

function initializeCustomerUI() {
    const session = getSession();
    const usernameEl = document.getElementById('username-display');
    if (usernameEl && session) {
        usernameEl.textContent = session.username;
    }
}

function renderFoodItems(items = null) {
    const foodGrid = document.getElementById('food-grid');
    if (!foodGrid) return;

    const foods = items || getFoodItems();

    if (foods.length === 0) {
        foodGrid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--gray-400);">
        <i class="fas fa-search" style="font-size: 3rem; margin-bottom: 1rem; display: block;"></i>
        <p>No food items found matching your search.</p>
      </div>
    `;
        return;
    }

    foodGrid.innerHTML = foods.map(food => {
        const stockClass = food.stock <= 0 ? 'out-of-stock' : (food.stock <= 5 ? 'low-stock' : '');
        const stockText = food.stock <= 0 ? 'Out of Stock' : `${food.stock} available`;
        const btnDisabled = food.stock <= 0 ? 'disabled' : '';
        const maxQty = Math.min(food.stock, 10);

        // Get food rating
        const avgRating = getFoodAverageRating(food.id);
        const ratingStars = generateStarRating(avgRating);

        return `
      <div class="food-card glass-card" data-id="${food.id}">
        <div class="food-image-wrapper">
          <img src="${food.image}" alt="${food.name}" class="food-image" onerror="this.src='https://via.placeholder.com/400x300?text=No+Image'">
          <span class="food-weight-badge">${food.quantity}</span>
        </div>
        <div class="food-content">
          <h3 class="food-name">${food.name}</h3>
          <div class="food-rating">${ratingStars}</div>
          <p class="food-ingredients"><i class="fas fa-leaf"></i> ${food.ingredients}</p>
          
          <div class="food-price-row">
            <span class="food-price">${formatPrice(food.price)}</span>
            <span class="food-stock ${stockClass}"><i class="fas fa-cube"></i> ${stockText}</span>
          </div>
          
          <!-- Quantity Selector -->
          <div class="food-qty-selector">
            <label>Quantity:</label>
            <div class="qty-controls">
              <button type="button" class="qty-btn food-qty-decrease" data-id="${food.id}" ${btnDisabled}>−</button>
              <span class="qty-display" id="qty-${food.id}" data-value="1" data-max="${maxQty}">1</span>
              <button type="button" class="qty-btn food-qty-increase" data-id="${food.id}" ${btnDisabled}>+</button>
            </div>
          </div>
          
          <div class="food-actions">
            <button class="btn btn-cart add-to-cart-btn" data-id="${food.id}" ${btnDisabled}>
              <i class="fas fa-cart-plus"></i> Add to Cart
            </button>
            <button class="btn btn-order order-now-btn" data-id="${food.id}" ${btnDisabled}>
              <i class="fas fa-bolt"></i> Order Now
            </button>
          </div>
        </div>
      </div>
    `;
    }).join('');
}

// Generate star rating HTML
function generateStarRating(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating - fullStars >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    let html = '';
    for (let i = 0; i < fullStars; i++) {
        html += '<i class="fas fa-star"></i>';
    }
    if (hasHalfStar) {
        html += '<i class="fas fa-star-half-alt"></i>';
    }
    for (let i = 0; i < emptyStars; i++) {
        html += '<i class="far fa-star"></i>';
    }

    if (rating > 0) {
        html += `<span class="rating-value">${rating.toFixed(1)}</span>`;
    } else {
        html += '<span class="rating-value">No ratings</span>';
    }

    return html;
}

// Get average rating for a food
function getFoodAverageRating(foodId) {
    const reviews = getReviews().filter(r => r.foodId === parseInt(foodId));
    if (reviews.length === 0) return 0;
    const total = reviews.reduce((sum, r) => sum + r.rating, 0);
    return total / reviews.length;
}

// Render customer reviews section
function renderCustomerReviews() {
    const container = document.getElementById('customer-reviews');
    if (!container) return;

    const reviews = getReviews().slice(0, 6); // Show latest 6 reviews

    if (reviews.length === 0) {
        container.innerHTML = `
      <div class="no-reviews">
        <i class="fas fa-comment-alt"></i>
        <p>No reviews yet</p>
        <small>Be the first to share your experience!</small>
      </div>
    `;
        return;
    }

    container.innerHTML = reviews.map(review => {
        const food = getFoodById(review.foodId);
        const stars = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);
        const reviewDate = new Date(review.time);

        return `
      <div class="review-card glass-card">
        <div class="review-header">
          <div class="reviewer-avatar">
            <i class="fas fa-user"></i>
          </div>
          <div class="reviewer-info">
            <div class="reviewer-name">${review.customerName}</div>
            <div class="reviewer-date">${reviewDate.toLocaleDateString('en-IN')}</div>
          </div>
        </div>
        <div class="review-rating">${stars}</div>
        <div class="review-food"><i class="fas fa-utensils"></i> ${food ? food.name : 'Unknown item'}</div>
        <p class="review-comment">${review.comment}</p>
      </div>
    `;
    }).join('');
}

function setupEventListeners() {
    // Search
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');

    if (searchInput) {
        searchInput.addEventListener('input', debounce(() => {
            const query = searchInput.value.trim();
            const results = searchFoodByIngredient(query);
            renderFoodItems(results);
        }, 300));
    }

    if (searchBtn) {
        searchBtn.addEventListener('click', () => {
            const query = searchInput?.value.trim() || '';
            const results = searchFoodByIngredient(query);
            renderFoodItems(results);
        });
    }

    // Food grid actions (delegated)
    const foodGrid = document.getElementById('food-grid');
    if (foodGrid) {
        foodGrid.addEventListener('click', (e) => {
            const btn = e.target.closest('button');
            if (!btn || btn.disabled) return;

            const foodId = btn.dataset.id;
            const qtyDisplay = document.getElementById(`qty-${foodId}`);
            const currentQty = qtyDisplay ? parseInt(qtyDisplay.dataset.value) || 1 : 1;
            const maxQty = qtyDisplay ? parseInt(qtyDisplay.dataset.max) || 10 : 10;

            if (btn.classList.contains('add-to-cart-btn')) {
                const result = addToCart(foodId, currentQty);
                if (result) {
                    showToast(`Added ${currentQty} item(s) to cart!`);
                    updateCartUI();
                    // Reset quantity display
                    if (qtyDisplay) {
                        qtyDisplay.dataset.value = '1';
                        qtyDisplay.textContent = '1';
                    }
                    renderFoodItems();
                } else {
                    showToast('Cannot add more items (stock limit)', 'error');
                }
            } else if (btn.classList.contains('order-now-btn')) {
                const result = addToCart(foodId, currentQty);
                if (result) {
                    updateCartUI();
                    openCheckoutModal();
                } else {
                    showToast('Cannot order (stock limit)', 'error');
                }
            } else if (btn.classList.contains('food-qty-decrease')) {
                if (qtyDisplay && currentQty > 1) {
                    const newQty = currentQty - 1;
                    qtyDisplay.dataset.value = newQty.toString();
                    qtyDisplay.textContent = newQty.toString();
                }
            } else if (btn.classList.contains('food-qty-increase')) {
                if (qtyDisplay && currentQty < maxQty) {
                    const newQty = currentQty + 1;
                    qtyDisplay.dataset.value = newQty.toString();
                    qtyDisplay.textContent = newQty.toString();
                }
            }
        });
    }

    // Cart toggle
    const cartBtn = document.getElementById('cart-btn');
    const cartOverlay = document.getElementById('cart-overlay');
    const cartSidebar = document.getElementById('cart-sidebar');
    const cartClose = document.getElementById('cart-close');

    if (cartBtn) {
        cartBtn.addEventListener('click', () => {
            cartOverlay?.classList.add('active');
            cartSidebar?.classList.add('active');
        });
    }

    if (cartOverlay) {
        cartOverlay.addEventListener('click', closeCart);
    }

    if (cartClose) {
        cartClose.addEventListener('click', closeCart);
    }

    // Cart item controls (delegated)
    const cartItems = document.getElementById('cart-items');
    if (cartItems) {
        cartItems.addEventListener('click', (e) => {
            const btn = e.target.closest('button');
            if (!btn) return;

            const foodId = btn.dataset.id;

            if (btn.classList.contains('qty-increase')) {
                const cart = getCart();
                const item = cart.find(i => i.foodId === parseInt(foodId));
                if (item) {
                    updateCartQuantity(foodId, item.quantity + 1);
                    updateCartUI();
                }
            } else if (btn.classList.contains('qty-decrease')) {
                const cart = getCart();
                const item = cart.find(i => i.foodId === parseInt(foodId));
                if (item) {
                    updateCartQuantity(foodId, item.quantity - 1);
                    updateCartUI();
                }
            } else if (btn.classList.contains('cart-item-remove')) {
                removeFromCart(foodId);
                updateCartUI();
                showToast('Item removed from cart');
            }
        });
    }

    // Checkout
    const checkoutBtn = document.getElementById('checkout-btn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', openCheckoutModal);
    }

    // Checkout modal
    const checkoutModal = document.getElementById('checkout-modal');
    const modalClose = document.getElementById('modal-close');
    const checkoutForm = document.getElementById('checkout-form');

    if (modalClose) {
        modalClose.addEventListener('click', closeCheckoutModal);
    }

    if (checkoutModal) {
        checkoutModal.addEventListener('click', (e) => {
            if (e.target === checkoutModal) closeCheckoutModal();
        });
    }

    if (checkoutForm) {
        checkoutForm.addEventListener('submit', handleCheckout);
    }

    // History modal
    const historyBtn = document.getElementById('history-btn');
    const historyModal = document.getElementById('history-modal');
    const historyClose = document.getElementById('history-close');

    if (historyBtn) {
        historyBtn.addEventListener('click', () => {
            renderOrderHistory();
            historyModal?.classList.add('active');
        });
    }

    if (historyClose) {
        historyClose.addEventListener('click', () => {
            historyModal?.classList.remove('active');
        });
    }

    if (historyModal) {
        historyModal.addEventListener('click', (e) => {
            if (e.target === historyModal) historyModal.classList.remove('active');
        });
    }

    // Reviews modal
    const reviewsBtn = document.getElementById('reviews-btn');
    const reviewModal = document.getElementById('review-modal');
    const reviewClose = document.getElementById('review-close');
    const reviewForm = document.getElementById('review-form');
    const starRating = document.getElementById('star-rating');

    if (reviewsBtn) {
        reviewsBtn.addEventListener('click', () => {
            populateFoodSelect();
            resetStarRating();
            reviewModal?.classList.add('active');
        });
    }

    if (reviewClose) {
        reviewClose.addEventListener('click', () => {
            reviewModal?.classList.remove('active');
        });
    }

    if (reviewModal) {
        reviewModal.addEventListener('click', (e) => {
            if (e.target === reviewModal) reviewModal.classList.remove('active');
        });
    }

    // Star rating interaction
    if (starRating) {
        starRating.addEventListener('click', (e) => {
            const star = e.target.closest('.star');
            if (star) {
                const rating = parseInt(star.dataset.rating);
                setStarRating(rating);
            }
        });

        starRating.addEventListener('mouseover', (e) => {
            const star = e.target.closest('.star');
            if (star) {
                const rating = parseInt(star.dataset.rating);
                highlightStars(rating);
            }
        });

        starRating.addEventListener('mouseleave', () => {
            const currentRating = parseInt(document.getElementById('review-rating').value) || 0;
            highlightStars(currentRating);
        });
    }

    if (reviewForm) {
        reviewForm.addEventListener('submit', handleReviewSubmit);
    }

    // Logout
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            clearSession();
            window.location.href = 'index.html';
        });
    }
}

// Populate food select dropdown
function populateFoodSelect() {
    const select = document.getElementById('review-food');
    if (!select) return;

    const foods = getFoodItems();
    select.innerHTML = '<option value="">-- Choose a dish --</option>' +
        foods.map(food => `<option value="${food.id}">${food.name}</option>`).join('');
}

// Reset star rating
function resetStarRating() {
    document.getElementById('review-rating').value = '0';
    highlightStars(0);
    document.getElementById('review-form')?.reset();
}

// Set star rating
function setStarRating(rating) {
    document.getElementById('review-rating').value = rating.toString();
    highlightStars(rating);
}

// Highlight stars up to given rating
function highlightStars(rating) {
    const stars = document.querySelectorAll('#star-rating .star');
    stars.forEach(star => {
        const starRating = parseInt(star.dataset.rating);
        if (starRating <= rating) {
            star.classList.add('active');
        } else {
            star.classList.remove('active');
        }
    });
}

// Handle review submission
function handleReviewSubmit(e) {
    e.preventDefault();

    const session = getSession();
    const foodId = document.getElementById('review-food').value;
    const rating = parseInt(document.getElementById('review-rating').value);
    const comment = document.getElementById('review-comment').value.trim();

    if (!foodId) {
        showToast('Please select a food item', 'error');
        return;
    }

    if (rating === 0) {
        showToast('Please select a rating', 'error');
        return;
    }

    if (!comment) {
        showToast('Please write your feedback', 'error');
        return;
    }

    const review = addReview({
        foodId: parseInt(foodId),
        customerName: session?.username || 'Anonymous',
        rating: rating,
        comment: comment
    });

    if (review) {
        document.getElementById('review-modal')?.classList.remove('active');
        showToast('🎉 Thank you for your review!');
        renderCustomerReviews();
        renderFoodItems(); // Update food ratings
        resetStarRating();
    } else {
        showToast('Failed to submit review', 'error');
    }
}

function closeCart() {
    document.getElementById('cart-overlay')?.classList.remove('active');
    document.getElementById('cart-sidebar')?.classList.remove('active');
}

function updateCartUI() {
    const cart = getCart();
    const cartCount = document.getElementById('cart-count');
    const cartItemsEl = document.getElementById('cart-items');
    const cartTotalEl = document.getElementById('cart-total');
    const checkoutBtn = document.getElementById('checkout-btn');

    // Update count badge
    if (cartCount) {
        const count = getCartItemCount();
        cartCount.textContent = count;
        cartCount.style.display = count > 0 ? 'flex' : 'none';
    }

    // Render cart items
    if (cartItemsEl) {
        if (cart.length === 0) {
            cartItemsEl.innerHTML = `
        <div class="cart-empty">
          <i class="fas fa-shopping-cart"></i>
          <p>Your cart is empty</p>
          <small>Add some delicious items!</small>
        </div>
      `;
        } else {
            cartItemsEl.innerHTML = cart.map(item => {
                const food = getFoodById(item.foodId);
                if (!food) return '';
                return `
          <div class="cart-item">
            <img src="${food.image}" alt="${food.name}" class="cart-item-image" onerror="this.src='https://via.placeholder.com/60x60?text=No+Image'">
            <div class="cart-item-info">
              <div class="cart-item-name">${food.name}</div>
              <div class="cart-item-weight">${food.quantity}</div>
              <div class="cart-item-price">${formatPrice(food.price * item.quantity)}</div>
              <div class="cart-item-controls">
                <button class="qty-btn qty-decrease" data-id="${food.id}">−</button>
                <span class="cart-item-qty">${item.quantity}</span>
                <button class="qty-btn qty-increase" data-id="${food.id}">+</button>
                <button class="cart-item-remove" data-id="${food.id}">
                  <i class="fas fa-trash"></i>
                </button>
              </div>
            </div>
          </div>
        `;
            }).join('');
        }
    }

    // Update total
    if (cartTotalEl) {
        cartTotalEl.textContent = formatPrice(getCartTotal());
    }

    // Enable/disable checkout
    if (checkoutBtn) {
        checkoutBtn.disabled = cart.length === 0;
    }
}

function openCheckoutModal() {
    const modal = document.getElementById('checkout-modal');
    const orderSummary = document.getElementById('order-summary');
    const cart = getCart();

    if (orderSummary) {
        orderSummary.innerHTML = cart.map(item => {
            const food = getFoodById(item.foodId);
            return `<div class="order-item">
        <span>${food.name} × ${item.quantity}</span>
        <span>${formatPrice(food.price * item.quantity)}</span>
      </div>`;
        }).join('') + `
      <div class="order-total">
        <span>Total Amount</span>
        <span>${formatPrice(getCartTotal())}</span>
      </div>
    `;
    }

    modal?.classList.add('active');
}

function closeCheckoutModal() {
    document.getElementById('checkout-modal')?.classList.remove('active');
}

function handleCheckout(e) {
    e.preventDefault();

    const session = getSession();
    const name = document.getElementById('customer-name').value.trim();
    const phone = document.getElementById('customer-phone').value.trim();
    const address = document.getElementById('customer-address').value.trim();

    if (!name || !phone || !address) {
        showToast('Please fill in all fields', 'error');
        return;
    }

    const order = placeOrder({
        name,
        phone,
        address,
        username: session?.username || 'guest'
    });

    if (order) {
        closeCheckoutModal();
        closeCart();
        showToast(`🎉 Order #${order.id} placed successfully!`);
        updateCartUI();
        renderFoodItems();

        // Reset form
        document.getElementById('checkout-form').reset();
    } else {
        showToast('Failed to place order', 'error');
    }
}

function renderOrderHistory() {
    const historyList = document.getElementById('history-list');
    const session = getSession();

    if (!historyList || !session) return;

    const orders = getOrdersByUser(session.username);

    if (orders.length === 0) {
        historyList.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-receipt"></i>
        <p>No orders yet</p>
        <small>Your order history will appear here</small>
      </div>
    `;
        return;
    }

    historyList.innerHTML = orders.map(order => {
        const orderTime = new Date(order.time);
        const itemsList = order.items.map(i => `${i.name} × ${i.quantity}`).join(', ');
        const statusLabel = getStatusLabel(order.status);

        return `
      <div class="history-item">
        <div class="history-header">
          <span class="order-id">Order #${order.id}</span>
          <span class="status-badge status-${order.status}">${statusLabel}</span>
        </div>
        <div class="history-time">
          <i class="fas fa-clock"></i> ${orderTime.toLocaleDateString('en-IN')} at ${orderTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
        </div>
        <div class="history-items">${itemsList}</div>
        <div class="history-total">Total: ${formatPrice(order.total)}</div>
      </div>
    `;
    }).join('');
}

// Utility: Debounce
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Toast
function showToast(message, type = 'success') {
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i> ${message}`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}
