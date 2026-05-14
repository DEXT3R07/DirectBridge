
// --- State Management ---
const DB = {
    get: (key, fallback) => {
        try {
            const data = localStorage.getItem('db_' + key);
            return data ? JSON.parse(data) : fallback;
        } catch { return fallback; }
    },
    set: (key, value) => localStorage.setItem('db_' + key, JSON.stringify(value)),
    remove: (key) => localStorage.removeItem('db_' + key)
};

const generateId = () => Math.random().toString(36).substr(2, 9).toUpperCase();

// Initial Data
const initialProducts = [
    { id: '1', name: 'Minimalist Analog Watch', price: 15000, category: 'Accessories', stock: 10, image: 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&w=600&q=80', description: 'A sleek, monochrome watch designed for the modern minimalist. Features a genuine leather strap and precise quartz movement.' },
    { id: '2', name: 'Wireless Noise-Cancelling Headphones', price: 45000, category: 'Electronics', stock: 5, image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80', description: 'Immersive sound quality with premium ash-finish earcups. 30-hour battery life and active noise cancellation.' },
    { id: '3', name: 'Ergonomic Office Chair', price: 85000, category: 'Home', stock: 3, image: 'https://images.unsplash.com/photo-1505843490538-5133c6c7d0e1?auto=format&fit=crop&w=600&q=80', description: 'Work in comfort with this breathable mesh back chair. Adjustable lumbar support and 360-degree swivel.' },
    { id: '4', name: 'Cotton Crew Neck Tee', price: 8000, category: 'Fashion', stock: 20, image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=600&q=80', description: '100% organic cotton, perfect fit, stone grey color. Pre-shrunk and sustainably sourced.' },
    { id: '5', name: 'Mechanical Keyboard', price: 32000, category: 'Electronics', stock: 8, image: 'https://images.unsplash.com/photo-1587829741301-dc798b91add1?auto=format&fit=crop&w=600&q=80', description: 'Tactile switches with a matte black finish. RGB backlighting and hot-swappable keys.' },
    { id: '6', name: 'Ceramic Coffee Set', price: 18000, category: 'Home', stock: 12, image: 'https://images.unsplash.com/photo-1572119865084-43c285814d63?auto=format&fit=crop&w=600&q=80', description: 'Handcrafted ceramic set for your morning brew. Includes 4 cups and a serving pot.' },
    { id: '7', name: 'Leather Weekend Bag', price: 55000, category: 'Fashion', stock: 4, image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=600&q=80', description: 'Genuine leather duffel bag, spacious and durable. Perfect for short trips.' },
    { id: '8', name: 'Smart Home Speaker', price: 28000, category: 'Electronics', stock: 15, image: 'https://images.unsplash.com/photo-1589492477829-5e65395b66cc?auto=format&fit=crop&w=600&q=80', description: 'Voice controlled assistant with rich bass. Compatible with all major smart home platforms.' }
];

// Global State
let state = {
    products: [],
    cart: [],
    user: null,
    orders: [],
    currentCategory: 'All',
    searchQuery: ''
};

function initState() {
    state.products = DB.get('products', initialProducts);
    state.cart = DB.get('cart', []);
    state.user = DB.get('user', null);
    state.orders = DB.get('orders', []);
}

function saveState() {
    DB.set('products', state.products);
    DB.set('cart', state.cart);
    DB.set('orders', state.orders);
    if (state.user) DB.set('user', state.user);
    else DB.remove('user');
}

// --- UI Helpers ---
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const msgEl = document.getElementById('toast-message');
    const icon = toast.querySelector('i');
    
    msgEl.textContent = message;
    toast.className = 'toast show ' + type;
    
    if (type === 'error') {
        icon.className = 'fas fa-exclamation-circle';
    } else {
        icon.className = 'fas fa-check-circle';
    }
    
    setTimeout(() => toast.classList.remove('show'), 3000);
}

function updateCartCount() {
    const count = state.cart.reduce((sum, item) => sum + item.qty, 0);
    const badge = document.getElementById('cart-count');
    badge.textContent = count;
    badge.classList.toggle('visible', count > 0);
}

function updateAuthUI() {
    const authBtns = document.getElementById('auth-buttons');
    const userMenu = document.getElementById('user-menu');
    
    if (state.user) {
        authBtns.classList.add('hidden');
        userMenu.classList.remove('hidden');
        document.getElementById('user-name-display').textContent = state.user.name;
        document.getElementById('user-email-display').textContent = state.user.email;
    } else {
        authBtns.classList.remove('hidden');
        userMenu.classList.add('hidden');
    }
}

function toggleUserMenu() {
    document.getElementById('user-dropdown').classList.toggle('show');
}

function getStatusColor(status) {
    const map = {
        'Pending': 'status-pending',
        'Processing': 'status-processing',
        'Shipped': 'status-shipped',
        'Completed': 'status-completed',
        'Cancelled': 'status-cancelled'
    };
    return map[status] || 'status-pending';
}

function formatPrice(price) {
    return '₦' + price.toLocaleString('en-NG');
}

// --- Cart Operations ---
function addToCart(id, qty = 1) {
    const product = state.products.find(p => p.id === id);
    if (!product) return;
    
    const existing = state.cart.find(item => item.id === id);
    if (existing) {
        existing.qty += qty;
    } else {
        state.cart.push({ ...product, qty: qty });
    }
    
    saveState();
    updateCartCount();
    showToast('Added to cart');
}

function updateCartQty(id, change) {
    const item = state.cart.find(i => i.id === id);
    if (!item) return;
    
    item.qty += change;
    if (item.qty <= 0) {
        removeFromCart(id);
    } else {
        saveState();
        renderCart();
        updateCartCount();
    }
}

function removeFromCart(id) {
    state.cart = state.cart.filter(item => item.id !== id);
    saveState();
    renderCart();
    updateCartCount();
}

// --- Auth Operations ---
function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    if (password.length < 4) {
        showToast('Invalid credentials', 'error');
        return;
    }
    
    // Check if admin
    const isAdmin = email === 'admin@directbridge.com';
    
    state.user = { 
        id: generateId(), 
        email: email, 
        name: email.split('@')[0],
        isAdmin: isAdmin
    };
    saveState();
    updateAuthUI();
    showToast('Welcome back!');
    
    if (isAdmin) {
        window.location.href = 'admin/dashboard.html';
    } else {
        window.location.href = 'index.html';
    }
}

function handleSignup(e) {
    e.preventDefault();
    const name = document.getElementById('signup-name').value;
    const email = document.getElementById('signup-email').value;
    const phone = document.getElementById('signup-phone').value;
    
    state.user = { id: generateId(), name, email, phone, isAdmin: false };
    saveState();
    updateAuthUI();
    showToast('Account created!');
    window.location.href = 'index.html';
}

function handleLogout() {
    state.user = null;
    state.cart = [];
    saveState();
    updateAuthUI();
    updateCartCount();
    window.location.href = 'index.html';
}

// --- Order Operations ---
function handleCheckout(e) {
    e.preventDefault();
    if (!state.user) {
        showToast('Please login to checkout', 'error');
        window.location.href = 'pages/login.html';
        return;
    }
    
    const total = state.cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    
    const newOrder = {
        id: generateId(),
        userId: state.user.id,
        userEmail: state.user.email,
        userName: state.user.name,
        items: [...state.cart],
        total: total,
        status: 'Pending',
        date: Date.now(),
        shipping: {
            name: document.getElementById('ship-name').value,
            phone: document.getElementById('ship-phone').value,
            address: document.getElementById('ship-address').value,
            city: document.getElementById('ship-city').value,
            state: document.getElementById('ship-state').value,
            notes: document.getElementById('ship-notes').value
        }
    };
    
    state.orders.push(newOrder);
    state.cart = [];
    saveState();
    updateCartCount();
    
    // Redirect to payment page with order ID
    window.location.href = 'payment.html?order=' + newOrder.id;
}

function cancelOrder(id) {
    const order = state.orders.find(o => o.id === id);
    if (order && order.status === 'Pending') {
        order.status = 'Cancelled';
        saveState();
        showToast('Order cancelled');
        renderDashboard();
    }
}

// --- Paystack Payment ---
function payWithPaystack(orderId) {
    const order = state.orders.find(o => o.id === orderId);
    if (!order) return;
    
    // Use Paystack V2 Inline JS
    const popup = new PaystackPop();
    popup.newTransaction({
        key: 'pk_test_your_public_key_here', // REPLACE WITH YOUR ACTUAL PAYSTACK PUBLIC KEY
        email: order.userEmail || state.user.email,
        amount: order.total * 100, // Paystack amount is in kobo
        currency: 'NGN',
        reference: 'DB-' + order.id + '-' + Date.now(),
        metadata: {
            custom_fields: [
                { display_name: 'Order ID', variable_name: 'order_id', value: order.id },
                { display_name: 'Customer Name', variable_name: 'customer_name', value: order.shipping.name }
            ]
        },
        onSuccess: (transaction) => {
            order.status = 'Processing';
            order.paymentRef = transaction.reference;
            order.paidAt = Date.now();
            saveState();
            showToast('Payment successful!');
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1500);
        },
        onCancel: () => {
            showToast('Payment cancelled', 'error');
        },
        onError: (error) => {
            showToast('Payment error: ' + error.message, 'error');
        }
    });
}

// --- Search & Filter ---
function filterByCategory(cat) {
    state.currentCategory = cat;
    // Re-render if on home page
    if (typeof renderHome === 'function') renderHome();
}

function handleSearch(e) {
    state.searchQuery = e.target.value;
    if (typeof renderHome === 'function') renderHome();
}

// --- Admin Operations ---
function updateOrderStatus(id, status) {
    const order = state.orders.find(o => o.id === id);
    if (order) {
        order.status = status;
        saveState();
        showToast('Order #' + id + ' updated to ' + status);
    }
}

function deleteProduct(id) {
    if (confirm('Are you sure you want to delete this product?')) {
        state.products = state.products.filter(p => p.id !== id);
        saveState();
        showToast('Product deleted');
        if (typeof renderAdminProducts === 'function') renderAdminProducts();
    }
}

function handleAddProduct(e) {
    e.preventDefault();
    const newProduct = {
        id: generateId().toLowerCase(),
        name: document.getElementById('new-prod-name').value,
        price: parseInt(document.getElementById('new-prod-price').value),
        category: document.getElementById('new-prod-cat').value,
        stock: parseInt(document.getElementById('new-prod-stock').value),
        image: document.getElementById('new-prod-img').value,
        description: document.getElementById('new-prod-desc').value
    };
    state.products.push(newProduct);
    saveState();
    closeAddProductModal();
    showToast('Product added successfully');
    if (typeof renderAdminProducts === 'function') renderAdminProducts();
}

// --- Modal ---
function showAddProductModal() {
    document.getElementById('add-product-modal').classList.add('show');
}

function closeAddProductModal() {
    document.getElementById('add-product-modal').classList.remove('show');
}

// --- Initialize ---
document.addEventListener('DOMContentLoaded', () => {
    initState();
    updateAuthUI();
    updateCartCount();
    
    // Close dropdown on outside click
    document.addEventListener('click', (e) => {
        const dropdown = document.getElementById('user-dropdown');
        const avatar = document.querySelector('.user-avatar');
        if (dropdown && !dropdown.contains(e.target) && e.target !== avatar && !avatar.contains(e.target)) {
            dropdown.classList.remove('show');
        }
    });
});
