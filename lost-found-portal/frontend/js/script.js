// API Configuration
const API_BASE = 'http://localhost:5000/api';

// Global State
let currentUser = null;
let currentToken = null;

// DOM Elements
const elements = {
    itemsGrid: document.getElementById('itemsGrid'),
    loginBtn: document.getElementById('loginBtn'),
    registerBtn: document.getElementById('registerBtn'),
    userProfile: document.getElementById('userProfile'),
    userName: document.getElementById('userName'),
    userAvatar: document.getElementById('userAvatar'),
    loginModal: document.getElementById('loginModal'),
    registerModal: document.getElementById('registerModal'),
    reportModal: document.getElementById('reportModal'),
    searchInput: document.getElementById('searchInput'),
    searchBtn: document.getElementById('searchBtn'),
    categoryFilter: document.getElementById('categoryFilter'),
    typeFilter: document.getElementById('typeFilter'),
    clearFilters: document.getElementById('clearFilters'),
    reportLostBtn: document.getElementById('reportLostBtn'),
    browseFoundBtn: document.getElementById('browseFoundBtn')
};

// Emoji mapping for categories
const categoryEmojis = {
    electronics: '📱',
    documents: '📄',
    keys: '🔑',
    wallets: '👛',
    bags: '🎒',
    clothing: '👕',
    books: '📚',
    other: '📦'
};

// Initialize Application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

async function initializeApp() {
    setupEventListeners();
    await loadItems();
    checkAuthStatus();
}

function setupEventListeners() {
    // Auth buttons
    elements.loginBtn.addEventListener('click', () => showModal('loginModal'));
    elements.registerBtn.addEventListener('click', () => showModal('registerModal'));
    
    // Close modals
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.target.closest('.modal-overlay').classList.add('hidden');
        });
    });
    
    // Modal background close
    document.querySelectorAll('.modal-overlay').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.add('hidden');
            }
        });
    });
    
    // Auth form submissions
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('registerForm').addEventListener('submit', handleRegister);
    document.getElementById('reportForm').addEventListener('submit', handleReportItem);
    
    // Search and filters
    elements.searchBtn.addEventListener('click', loadItems);
    elements.searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') loadItems();
    });
    
    elements.categoryFilter.addEventListener('change', loadItems);
    elements.typeFilter.addEventListener('change', loadItems);
    elements.clearFilters.addEventListener('click', clearFilters);
    
    // Report item
    elements.reportLostBtn.addEventListener('click', () => {
        if (!currentUser) {
            showModal('loginModal');
            return;
        }
        showModal('reportModal');
    });
    
    // Browse found items
    elements.browseFoundBtn.addEventListener('click', () => {
        elements.typeFilter.value = 'found';
        loadItems();
    });
    
    // Auth modal switches
    document.getElementById('showRegister').addEventListener('click', (e) => {
        e.preventDefault();
        showModal('registerModal');
    });
    
    document.getElementById('showLogin').addEventListener('click', (e) => {
        e.preventDefault();
        showModal('loginModal');
    });
}

// API Functions
async function apiCall(endpoint, options = {}) {
    try {
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };
        
        if (currentToken) {
            config.headers.Authorization = `Bearer ${currentToken}`;
        }
        
        const response = await fetch(`${API_BASE}${endpoint}`, config);
        const data = await response.json();
        
        return data;
    } catch (error) {
        console.error('API call failed:', error);
        return { success: false, message: 'Network error occurred' };
    }
}

// Item Management
async function loadItems() {
    try {
        const params = new URLSearchParams();
        
        if (elements.searchInput.value) params.append('search', elements.searchInput.value);
        if (elements.categoryFilter.value) params.append('category', elements.categoryFilter.value);
        if (elements.typeFilter.value) params.append('type', elements.typeFilter.value);
        
        const result = await apiCall(`/items?${params}`);
        
        if (result.success) {
            displayItems(result.data);
        } else {
            showNotification('Error loading items: ' + result.message, 'error');
        }
    } catch (error) {
        console.error('Error loading items:', error);
        showNotification('Failed to load items', 'error');
    }
}

function displayItems(items) {
    elements.itemsGrid.innerHTML = '';
    
    if (items.length === 0) {
        elements.itemsGrid.innerHTML = `
            <div class="text-center" style="grid-column: 1 / -1; padding: 3rem;">
                <i class="fas fa-inbox" style="font-size: 3rem; color: #ccc; margin-bottom: 1rem;"></i>
                <h3>No items found</h3>
                <p>Try adjusting your search criteria</p>
            </div>
        `;
        return;
    }
    
    items.forEach(item => {
        const itemCard = createItemCard(item);
        elements.itemsGrid.appendChild(itemCard);
    });
}

function createItemCard(item) {
    const card = document.createElement('div');
    card.className = 'item-card';
    
    const emoji = categoryEmojis[item.category] || '📦';
    const statusClass = item.type === 'lost' ? 'status-lost' : 'status-found';
    const statusText = item.type === 'lost' ? 'LOST' : 'FOUND';
    
    card.innerHTML = `
        <div class="item-image">
            <span>${emoji}</span>
            <div class="item-status ${statusClass}">${statusText}</div>
        </div>
        <div class="item-details">
            <h3 class="item-title">${item.title}</h3>
            <div class="item-meta">
                <span><i class="fas fa-tag"></i> ${item.category}</span>
                <span><i class="fas fa-calendar"></i> ${formatDate(item.createdAt)}</span>
            </div>
            <p class="item-description">${item.description}</p>
            <div class="item-meta">
                <span><i class="fas fa-map-marker-alt"></i> ${item.location}</span>
            </div>
            ${item.color ? `<div class="item-meta"><span><i class="fas fa-palette"></i> ${item.color}</span></div>` : ''}
            <div class="item-actions">
                <button class="btn btn-outline" onclick="viewItemDetails('${item._id}')">
                    <i class="fas fa-info-circle"></i> Details
                </button>
                <button class="btn ${item.type === 'lost' ? 'btn-secondary' : 'btn-primary'}" 
                        onclick="contactAboutItem('${item._id}', '${item.type}')">
                    ${item.type === 'lost' ? 'I Found This' : 'This Is Mine'}
                </button>
            </div>
        </div>
    `;
    
    return card;
}

// Auth Functions
async function handleLogin(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const credentials = {
        email: formData.get('email'),
        password: formData.get('password')
    };
    
    const result = await apiCall('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials)
    });
    
    if (result.success) {
        currentToken = result.data.token;
        currentUser = result.data.user;
        updateUIForUser();
        showModal('loginModal', false);
        showNotification('Login successful!', 'success');
        await loadItems();
    } else {
        showNotification('Login failed: ' + result.message, 'error');
    }
}

async function handleRegister(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const userData = {
        name: formData.get('name'),
        email: formData.get('email'),
        password: formData.get('password'),
        studentId: formData.get('studentId')
    };
    
    const result = await apiCall('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData)
    });
    
    if (result.success) {
        showModal('registerModal', false);
        showNotification('Registration successful! Please login.', 'success');
        showModal('loginModal');
    } else {
        showNotification('Registration failed: ' + result.message, 'error');
    }
}

async function handleReportItem(e) {
    e.preventDefault();
    
    if (!currentUser) {
        showNotification('Please login to report items', 'error');
        return;
    }
    
    const formData = new FormData(e.target);
    const itemData = {
        title: formData.get('title'),
        description: formData.get('description'),
        category: formData.get('category'),
        type: formData.get('type'),
        location: formData.get('location'),
        contactEmail: formData.get('contactEmail'),
        color: formData.get('color'),
        brand: formData.get('brand')
    };
    
    const result = await apiCall('/items', {
        method: 'POST',
        body: JSON.stringify(itemData)
    });
    
    if (result.success) {
        showModal('reportModal', false);
        showNotification('Item reported successfully!', 'success');
        e.target.reset();
        await loadItems();
    } else {
        showNotification('Failed to report item: ' + result.message, 'error');
    }
}

// UI Functions
function updateUIForUser() {
    elements.loginBtn.classList.add('hidden');
    elements.registerBtn.classList.add('hidden');
    elements.userProfile.classList.remove('hidden');
    elements.userName.textContent = currentUser.name;
    elements.userAvatar.textContent = currentUser.name.charAt(0).toUpperCase();
}

function checkAuthStatus() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (token && user) {
        currentToken = token;
        currentUser = JSON.parse(user);
        updateUIForUser();
    }
}

function showModal(modalId, show = true) {
    const modal = document.getElementById(modalId);
    if (show) {
        modal.classList.remove('hidden');
    } else {
        modal.classList.add('hidden');
    }
}

function clearFilters() {
    elements.searchInput.value = '';
    elements.categoryFilter.value = '';
    elements.typeFilter.value = '';
    loadItems();
}

function viewItemDetails(itemId) {
    showNotification('Item details feature coming soon!', 'info');
}

function contactAboutItem(itemId, type) {
    if (!currentUser) {
        showNotification('Please login to contact about items', 'error');
        showModal('loginModal');
        return;
    }
    
    const action = type === 'lost' ? 'found' : 'claimed';
    showNotification(`You've ${action} this item! The owner will be notified.`, 'success');
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <span>${message}</span>
        <button onclick="this.parentElement.remove()">&times;</button>
    `;
    
    // Add styles if not already added
    if (!document.querySelector('#notification-styles')) {
        const styles = document.createElement('style');
        styles.id = 'notification-styles';
        styles.textContent = `
            .notification {
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 1rem 1.5rem;
                border-radius: var(--radius);
                color: white;
                z-index: 1001;
                display: flex;
                align-items: center;
                gap: 1rem;
                box-shadow: var(--shadow);
                animation: slideIn 0.3s ease;
            }
            .notification-success { background: var(--secondary); }
            .notification-error { background: var(--danger); }
            .notification-info { background: var(--primary); }
            .notification-warning { background: var(--warning); }
            .notification button {
                background: none;
                border: none;
                color: white;
                cursor: pointer;
                font-size: 1.2rem;
            }
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(styles);
    }
    
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

// Save auth state (optional enhancement)
function saveAuthState() {
    if (currentToken && currentUser) {
        localStorage.setItem('token', currentToken);
        localStorage.setItem('user', JSON.stringify(currentUser));
    }
}

function clearAuthState() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    currentToken = null;
    currentUser = null;
}