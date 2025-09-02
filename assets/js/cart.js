// Cart functionality
let cart = [];
const deliveryFee = 20;
const API_URL = 'https://web-production-ca4ef.up.railway.app/submit_order';

document.addEventListener('DOMContentLoaded', function() {
  loadCart();
  setupFormValidation();
  if (window.updateCartCounter) updateCartCounter();
});

function loadCart() {
  try {
    cart = JSON.parse(localStorage.getItem('cart') || '[]');
    displayCart();
    updateSummary();
  } catch (error) {
    console.error('Error loading cart:', error);
    cart = [];
    displayCart();
  }
}

function displayCart() {
  const container = document.getElementById('cart-items');
  
  if (cart.length === 0) {
    container.innerHTML = `
      <div class="empty-cart">
        <h3><i class="fas fa-shopping-cart"></i> السلة فارغة</h3>
        <p>لم تقم بإضافة أي منتجات إلى السلة بعد</p>
        <a href="menu.html" class="btn">
          <i class="fas fa-utensils"></i>
          تصفح القائمة
        </a>
      </div>
    `;
    return;
  }

  let html = '';
  cart.forEach((item, index) => {
    const lineTotal = item.price * item.quantity;
    html += `
      <div class="cart-row">
        <img src="${item.image}" alt="${item.title}" class="thumb" loading="lazy" decoding="async" fetchpriority="low" onerror="this.src='./assets/images/placeholder.jpg'">
        <div class="cart-content">
          <div class="name">${item.title}</div>
          <div class="quantity-section">
            <div class="quantity-control">
              <button class="quantity-btn minus" onclick="updateCartQuantity(${index}, -1)" ${item.quantity <= 1 ? 'disabled' : ''} aria-label="تقليل الكمية">
                <i class="fas fa-minus"></i>
              </button>
              <span class="quantity-display">${item.quantity}</span>
              <button class="quantity-btn plus" onclick="updateCartQuantity(${index}, 1)" ${item.quantity >= 99 ? 'disabled' : ''} aria-label="زيادة الكمية">
                <i class="fas fa-plus"></i>
              </button>
            </div>
          </div>
          <div class="price-section">
            <div class="line-total">${lineTotal} جنيه</div>
          </div>
          <div class="remove-section">
            <button class="remove" onclick="removeFromCart(${index})" title="حذف">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
      </div>
    `;
  });
  
  container.innerHTML = html;
}

function handleQuantityInputChange(index, newValue) {
    const quantity = parseInt(newValue, 10);
    if (isNaN(quantity) || quantity < 1) {
        // If invalid, reset to the old value and exit
        displayCart(); 
        return;
    }
    
    const clampedQuantity = Math.max(1, Math.min(quantity, 99));

    if (cart[index]) {
        cart[index].quantity = clampedQuantity;
        saveCart();
        displayCart();
        updateSummary();
        if (window.updateCartCounter) updateCartCounter();
    }
}

function updateCartQuantity(index, change) {
  if (cart[index]) {
    const newQuantity = cart[index].quantity + change;
    if (newQuantity >= 1 && newQuantity <= 99) {
      cart[index].quantity = newQuantity;
      saveCart();
      displayCart();
      updateSummary();
      if (window.updateCartCounter) updateCartCounter();
    }
  }
}

function removeFromCart(index) {
  if (confirm('هل تريد حذف هذا المنتج من السلة؟')) {
    cart.splice(index, 1);
    saveCart();
    displayCart();
    updateSummary();
    if (window.updateCartCounter) updateCartCounter();
    showNotification('تم حذف المنتج من السلة', 'success');
  }
}

function saveCart() {
  localStorage.setItem('cart', JSON.stringify(cart));
}

function updateSummary() {
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const grandTotal = subtotal + (cart.length > 0 ? deliveryFee : 0);
  
  document.getElementById('subtotal').textContent = `${subtotal} جنيه`;
  document.getElementById('delivery-fee').textContent = cart.length > 0 ? `${deliveryFee} جنيه` : '0 جنيه';
  document.getElementById('grand-total').textContent = `${grandTotal} جنيه`;
  
  const submitBtn = document.getElementById('submit-order');
  if(submitBtn) {
    submitBtn.disabled = cart.length === 0;
  }
}

function setupFormValidation() {
  const requiredFields = ['customer-name', 'customer-phone', 'customer-address'];
  const submitBtn = document.getElementById('submit-order');
  
  requiredFields.forEach(fieldId => {
    const field = document.getElementById(fieldId);
    if(field) field.addEventListener('input', validateForm);
  });
  
  function validateForm() {
    const allFilled = requiredFields.every(fieldId => {
      const field = document.getElementById(fieldId);
      return field.value.trim() !== '';
    });
    
    if(submitBtn) submitBtn.disabled = !allFilled || cart.length === 0;
  }
  
  if(submitBtn) submitBtn.addEventListener('click', submitOrder);
}

async function submitOrder() {
  const submitBtn = document.getElementById('submit-order');

  const customerData = {
    name: document.getElementById('customer-name').value.trim(),
    phone: document.getElementById('customer-phone').value.trim(),
    address: document.getElementById('customer-address').value.trim(),
    notes: document.getElementById('customer-notes').value.trim()
  };
  
  if (!customerData.name || !customerData.phone || !customerData.address) {
    showNotification('يرجى ملء جميع البيانات المطلوبة', 'error');
    return;
  }
  
  if (cart.length === 0) {
    showNotification('السلة فارغة', 'error');
    return;
  }
  
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const total = subtotal + deliveryFee;

  const payload = {
    items: cart.map(i => ({ 
        id: i.id || 0, // Assuming items might not have an ID, default to 0
        name: i.title, 
        qty: i.quantity, 
        price: i.price 
    })),
    customer: customerData,
    totals: { 
        subtotal: subtotal,
        delivery: deliveryFee, 
        total: total 
    }
  };

  submitBtn.disabled = true;
  submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الإرسال...';

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || 'حدث خطأ أثناء إرسال الطلب');
    }

    showNotification('تم إرسال طلبك بنجاح! رقم الطلب: ' + result.order_id, 'success');
    cart = [];
    localStorage.removeItem('cart');
    
    // Reset form and UI
    document.getElementById('customer-name').value = '';
    document.getElementById('customer-phone').value = '';
    document.getElementById('customer-address').value = '';
    document.getElementById('customer-notes').value = '';
    
    displayCart();
    updateSummary();
    if (window.updateCartCounter) updateCartCounter();

    setTimeout(() => {
      window.location.href = 'index.html';
    }, 3000);

  } catch (error) {
    console.error('Error submitting order:', error);
    showNotification(`فشل إرسال الطلب: ${error.message}`, 'error');
    submitBtn.disabled = false;
    submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> إرسال الطلب';
  }
}

function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.innerHTML = `
    <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
    <span>${message}</span>
  `;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.classList.add('show');
  }, 100);
  
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => {
      notification.remove();
    }, 300);
  }, 4000);
}

// This function might be defined in another file, so we ensure it's available.
if (typeof window.updateCartCounter !== 'function') {
    window.updateCartCounter = function() {
        const cart = JSON.parse(localStorage.getItem('cart') || '[]');
        const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 0), 0);
        const cartLink = document.querySelector('.cart-nav-link');
        if (!cartLink) return;
        let badge = cartLink.querySelector('.cart-badge');
        if (badge) badge.remove();
        if (totalItems > 0) {
            badge = document.createElement('span');
            badge.className = 'cart-badge';
            badge.textContent = totalItems;
            cartLink.appendChild(badge);
        }
    }
}
