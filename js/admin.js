// ===== ADMIN MODULE =====

document.addEventListener('DOMContentLoaded', function () {
  // Check authentication
  if (!requireAuth('admin')) return;

  // Initialize UI
  initializeAdminUI();
  setupAdminEventListeners();
  showPanel('foods');
});

function initializeAdminUI() {
  const session = getSession();
  const usernameEl = document.getElementById('admin-username');
  if (usernameEl && session) {
    usernameEl.textContent = session.username;
  }
}

function setupAdminEventListeners() {
  // Tab switching
  const tabs = document.querySelectorAll('.admin-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const panel = tab.dataset.panel;
      showPanel(panel);
    });
  });

  // Food form
  const foodForm = document.getElementById('food-form');
  if (foodForm) {
    foodForm.addEventListener('submit', handleFoodSubmit);
  }

  // Cancel edit
  const cancelBtn = document.getElementById('cancel-edit');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', resetFoodForm);
  }

  // Food list actions (delegated)
  const foodList = document.getElementById('food-list');
  if (foodList) {
    foodList.addEventListener('click', (e) => {
      const btn = e.target.closest('button');
      if (!btn) return;

      const foodId = btn.dataset.id;

      if (btn.classList.contains('edit-btn')) {
        editFood(foodId);
      } else if (btn.classList.contains('delete-btn')) {
        if (confirm('Are you sure you want to delete this item?')) {
          deleteFoodItem(foodId);
          renderFoodList();
          showToast('Food item deleted');
        }
      }
    });
  }

  // Order status changes (delegated)
  const orderList = document.getElementById('order-list');
  if (orderList) {
    orderList.addEventListener('change', (e) => {
      if (e.target.classList.contains('status-select')) {
        const orderId = e.target.dataset.id;
        const newStatus = e.target.value;
        updateOrderStatus(orderId, newStatus);
        showToast('Order status updated');
      }
    });
  }

  // Review deletion (delegated)
  const reviewList = document.getElementById('review-list');
  if (reviewList) {
    reviewList.addEventListener('click', (e) => {
      const btn = e.target.closest('.delete-review-btn');
      if (btn) {
        const reviewId = btn.dataset.id;
        if (confirm('Delete this review?')) {
          deleteReview(reviewId);
          renderReviewList();
          showToast('Review deleted');
        }
      }
    });
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

function showPanel(panelName) {
  // Update tabs
  document.querySelectorAll('.admin-tab').forEach(tab => {
    tab.classList.toggle('active', tab.dataset.panel === panelName);
  });

  // Update panels
  document.querySelectorAll('.admin-panel').forEach(panel => {
    panel.classList.toggle('active', panel.id === `${panelName}-panel`);
  });

  // Render content
  if (panelName === 'foods') {
    renderFoodList();
  } else if (panelName === 'orders') {
    renderOrderList();
  } else if (panelName === 'reviews') {
    renderReviewList();
  }
}

// ===== FOOD MANAGEMENT =====

function renderFoodList() {
  const tbody = document.getElementById('food-list');
  if (!tbody) return;

  const foods = getFoodItems();

  if (foods.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; padding: 2rem; color: var(--gray-400);">
          No food items yet. Add one using the form above.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = foods.map(food => `
    <tr>
      <td>
        <img src="${food.image}" alt="${food.name}" onerror="this.src='https://via.placeholder.com/50x50?text=No+Image'">
      </td>
      <td>${food.name}</td>
      <td>${formatPrice(food.price)}</td>
      <td>${food.quantity}</td>
      <td>${food.stock}</td>
      <td style="max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
        ${food.ingredients}
      </td>
      <td>
        <div class="table-actions">
          <button class="btn btn-secondary btn-sm edit-btn" data-id="${food.id}">
            <i class="fas fa-edit"></i>
          </button>
          <button class="btn btn-danger btn-sm delete-btn" data-id="${food.id}">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

function handleFoodSubmit(e) {
  e.preventDefault();

  const idField = document.getElementById('food-id');
  const nameField = document.getElementById('food-name');
  const imageField = document.getElementById('food-image');
  const priceField = document.getElementById('food-price');
  const quantityField = document.getElementById('food-quantity');
  const stockField = document.getElementById('food-stock');
  const ingredientsField = document.getElementById('food-ingredients');

  const foodData = {
    name: nameField.value.trim(),
    image: imageField.value.trim() || 'https://via.placeholder.com/400x300?text=Food+Image',
    price: parseFloat(priceField.value),
    quantity: quantityField.value.trim() || '100g',
    stock: parseInt(stockField.value),
    ingredients: ingredientsField.value.trim()
  };

  if (!foodData.name || isNaN(foodData.price) || isNaN(foodData.stock)) {
    showToast('Please fill in all required fields', 'error');
    return;
  }

  const editId = idField.value;

  if (editId) {
    // Update existing
    updateFoodItem(editId, foodData);
    showToast('Food item updated successfully');
  } else {
    // Add new
    addFoodItem(foodData);
    showToast('Food item added successfully');
  }

  resetFoodForm();
  renderFoodList();
}

function editFood(id) {
  const food = getFoodById(id);
  if (!food) return;

  document.getElementById('food-id').value = food.id;
  document.getElementById('food-name').value = food.name;
  document.getElementById('food-image').value = food.image;
  document.getElementById('food-price').value = food.price;
  document.getElementById('food-quantity').value = food.quantity;
  document.getElementById('food-stock').value = food.stock;
  document.getElementById('food-ingredients').value = food.ingredients;

  document.getElementById('form-title').textContent = 'Edit Food Item';
  document.getElementById('submit-btn').innerHTML = '<i class="fas fa-save"></i> Update Item';
  document.getElementById('cancel-edit').style.display = 'inline-flex';

  // Scroll to form
  document.querySelector('.admin-form-card').scrollIntoView({ behavior: 'smooth' });
}

function resetFoodForm() {
  document.getElementById('food-form').reset();
  document.getElementById('food-id').value = '';
  document.getElementById('form-title').textContent = 'Add New Food Item';
  document.getElementById('submit-btn').innerHTML = '<i class="fas fa-plus"></i> Add Item';
  document.getElementById('cancel-edit').style.display = 'none';
}

// ===== ORDER MANAGEMENT =====

function renderOrderList() {
  const tbody = document.getElementById('order-list');
  if (!tbody) return;

  const orders = getOrders().sort((a, b) => b.id - a.id); // Newest first

  if (orders.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; padding: 2rem; color: var(--gray-400);">
          No orders yet. Orders will appear here when customers place them.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = orders.map(order => {
    const orderTime = new Date(order.time);
    const formattedTime = orderTime.toLocaleString('en-IN');
    const itemsList = order.items.map(i => `${i.name} x${i.quantity}`).join(', ');

    // Build status options
    const statusOptions = ORDER_STATUSES.map(s =>
      `<option value="${s.value}" ${order.status === s.value ? 'selected' : ''}>${s.label}</option>`
    ).join('');

    return `
      <tr>
        <td><strong>#${order.id}</strong></td>
        <td>
          <div><strong>${order.customer.name}</strong></div>
          <div style="font-size: 0.8rem; color: var(--gray-400);">${order.customer.phone}</div>
          <div style="font-size: 0.8rem; color: var(--gray-400);">${order.customer.address}</div>
        </td>
        <td style="max-width: 200px;">
          ${itemsList}
        </td>
        <td><strong style="color: var(--primary);">${formatPrice(order.total)}</strong></td>
        <td style="font-size: 0.85rem;">${formattedTime}</td>
        <td>
          <select class="form-input status-select" data-id="${order.id}" style="padding: 0.25rem 0.5rem; min-width: 150px;">
            ${statusOptions}
          </select>
        </td>
      </tr>
    `;
  }).join('');
}

// ===== REVIEW MANAGEMENT =====

function renderReviewList() {
  const container = document.getElementById('review-list');
  if (!container) return;

  const reviews = getReviews().sort((a, b) => b.id - a.id);

  if (reviews.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 2rem; color: var(--gray-400);">
        <i class="fas fa-star" style="font-size: 2.5rem; margin-bottom: 1rem; display: block;"></i>
        <p>No reviews yet. Reviews will appear here when customers submit them.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = reviews.map(review => {
    const reviewTime = new Date(review.time);
    const stars = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);
    const food = getFoodById(review.foodId);

    return `
      <div class="review-item" style="background: var(--glass-bg); border-radius: 0.5rem; padding: 1rem; margin-bottom: 0.75rem; border: 1px solid var(--glass-border);">
        <div style="display: flex; justify-content: space-between; align-items: start;">
          <div>
            <div style="font-weight: 600;">${review.customerName}</div>
            <div style="color: var(--warning); font-size: 1.1rem;">${stars}</div>
            <div style="font-size: 0.8rem; color: var(--gray-400);">${food ? food.name : 'Unknown item'} • ${reviewTime.toLocaleDateString('en-IN')}</div>
          </div>
          <button class="btn btn-danger btn-sm delete-review-btn" data-id="${review.id}">
            <i class="fas fa-trash"></i>
          </button>
        </div>
        <p style="margin-top: 0.75rem; color: var(--gray-200);">${review.comment}</p>
      </div>
    `;
  }).join('');
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
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 3000);
}
