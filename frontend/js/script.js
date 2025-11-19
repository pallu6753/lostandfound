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
    browseFoundBtn: document.getElementById('browseFoundBtn'),
    backendStatus: document.getElementById('backendStatus')
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
    console.log('🚀 Initializing Lost & Found Portal...');
    
    // Check backend connection first
    await checkBackendConnection();
    
    setupEventListeners();
    setupReportFormTabs();
    setupReportModal(); // Add this line
    await loadItems();
    checkAuthStatus();
}

// Check if backend is running
async function checkBackendConnection() {
    try {
        const response = await fetch(`${API_BASE}/health`);
        const data = await response.json();
        
        if (data.status === 'OK') {
            elements.backendStatus.textContent = 'Connected ✅';
            elements.backendStatus.style.color = '#2ecc71';
        } else {
            elements.backendStatus.textContent = 'Error ❌';
            elements.backendStatus.style.color = '#e74c3c';
        }
    } catch (error) {
        console.error('Backend connection failed:', error);
        elements.backendStatus.textContent = 'Not Connected ❌';
        elements.backendStatus.style.color = '#e74c3c';
        showNotification('Backend server is not running. Please start the backend server.', 'error');
    }
}

function setupEventListeners() {
    console.log('Setting up event listeners...');
    
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
            showNotification('Please login to report items', 'info');
            showModal('loginModal');
            return;
        }
        showModal('reportModal');
    });
    
    // Browse found items
    elements.browseFoundBtn.addEventListener('click', () => {
        elements.typeFilter.value = 'found';
        loadItems();
        showNotification('Showing found items', 'info');
    });
    
    // Auth modal switches
    document.getElementById('showRegister').addEventListener('click', (e) => {
        e.preventDefault();
        showModal('registerModal');
        document.getElementById('loginModal').classList.add('hidden');
    });
    
    document.getElementById('showLogin').addEventListener('click', (e) => {
        e.preventDefault();
        showModal('loginModal');
        document.getElementById('registerModal').classList.add('hidden');
    });
    
    console.log('Event listeners setup complete');
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
        elements.itemsGrid.innerHTML = '<div class="loading">Loading items...</div>';
        
        const params = new URLSearchParams();
        
        if (elements.searchInput.value) params.append('search', elements.searchInput.value);
        if (elements.categoryFilter.value) params.append('category', elements.categoryFilter.value);
        if (elements.typeFilter.value) params.append('type', elements.typeFilter.value);
        
        const result = await apiCall(`/items?${params}`);
        
        if (result.success) {
            displayItems(result.data);
            showNotification(`Loaded ${result.data.length} items`, 'success');
        } else {
            showNotification('Error loading items: ' + result.message, 'error');
            displaySampleItems(); // Fallback to sample data
        }
    } catch (error) {
        console.error('Error loading items:', error);
        showNotification('Failed to load items from server', 'error');
        displaySampleItems(); // Fallback to sample data
    }
}

function displayItems(items) {
    elements.itemsGrid.innerHTML = '';
    
    if (items.length === 0) {
        elements.itemsGrid.innerHTML = `
            <div class="text-center" style="grid-column: 1 / -1; padding: 3rem;">
                <i class="fas fa-inbox" style="font-size: 3rem; color: #ccc; margin-bottom: 1rem;"></i>
                <h3>No items found</h3>
                <p>Try adjusting your search criteria or report a new item</p>
                <button class="btn btn-primary" onclick="showModal('reportModal')" style="margin-top: 1rem;">
                    <i class="fas fa-plus"></i> Report New Item
                </button>
            </div>
        `;
        return;
    }
    
    items.forEach(item => {
        const itemCard = createItemCard(item);
        elements.itemsGrid.appendChild(itemCard);
    });
}

function displaySampleItems() {
    const sampleItems = [
        {
            _id: '1',
            title: "Black iPhone 13",
            description: "Black iPhone 13 with blue silicone case. Lost near library entrance.",
            category: "electronics",
            type: "lost",
            location: "Main Library",
            contactEmail: "john@campus.edu",
            color: "Black",
            brand: "Apple",
            createdAt: new Date()
        },
        {
            _id: '2',
            title: "Student ID Card - Sarah Johnson",
            description: "Student ID card found in cafeteria. Name: Sarah Johnson.",
            category: "documents",
            type: "found", 
            location: "Student Cafeteria",
            contactEmail: "security@campus.edu",
            color: "White",
            brand: "University",
            createdAt: new Date()
        }
    ];
    
    displayItems(sampleItems);
    showNotification('Using sample data - backend might be unavailable', 'warning');
}

function createItemCard(item) {
    const card = document.createElement('div');
    card.className = 'item-card';
    
    const emoji = categoryEmojis[item.category] || '📦';
    const statusClass = item.type === 'lost' ? 'status-lost' : 'status-found';
    const statusText = item.type === 'lost' ? 'LOST' : 'FOUND';
    
    // Add timestamp for new items
    const isNew = Date.now() - new Date(item.createdAt).getTime() < 60000; // Less than 1 minute old
    
    card.innerHTML = `
        <div class="item-image">
            <span>${emoji}</span>
            <div class="item-status ${statusClass}">${statusText}</div>
            ${isNew ? '<div class="new-badge">NEW</div>' : ''}
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
            ${item.brand ? `<div class="item-meta"><span><i class="fas fa-tag"></i> ${item.brand}</span></div>` : ''}
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
        email: formData.get('email') || 'test@campus.edu',
        password: formData.get('password') || 'password'
    };

    // Show loading state
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';
    submitBtn.disabled = true;

    showNotification('Logging in...', 'info');
    
    try {
        const result = await apiCall('/auth/login', {
            method: 'POST',
            body: JSON.stringify(credentials)
        });
        
        if (result.success) {
            currentToken = result.data.token;
            currentUser = result.data.user;
            updateUIForUser();
            showModal('loginModal', false);
            showNotification('🎉 Login successful! Welcome back, ' + currentUser.name, 'success');
            await loadItems();
            
            // Save to localStorage
            localStorage.setItem('token', currentToken);
            localStorage.setItem('user', JSON.stringify(currentUser));
        } else {
            // If login fails, use demo user
            console.log('Login failed, using demo user...');
            currentUser = {
                id: 'demo_user_123',
                name: 'Demo User',
                email: credentials.email,
                studentId: '20240001'
            };
            currentToken = 'demo_token_' + Date.now();
            updateUIForUser();
            showModal('loginModal', false);
            showNotification('🎉 Demo login successful! Welcome, ' + currentUser.name, 'success');
            await loadItems();
        }
    } catch (error) {
        console.error('Login error:', error);
        // Fallback to demo user
        currentUser = {
            id: 'demo_user_123',
            name: 'Demo User',
            email: credentials.email,
            studentId: '20240001'
        };
        currentToken = 'demo_token_' + Date.now();
        updateUIForUser();
        showModal('loginModal', false);
        showNotification('🎉 Demo login successful! Welcome, ' + currentUser.name, 'success');
        await loadItems();
    } finally {
        // Reset button state
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
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
    
    showNotification('Creating account...', 'info');
    
    const result = await apiCall('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData)
    });
    
    if (result.success) {
        showModal('registerModal', false);
        showNotification('Registration successful! Please login with your new account.', 'success');
        showModal('loginModal');
    } else {
        showNotification('Registration failed: ' + result.message, 'error');
    }
}

async function handleReportItem(e) {
    e.preventDefault();
    
    if (!currentUser) {
        showNotification('Please login to report items', 'error');
        showModal('loginModal');
        return;
    }

    // Show loading state
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
    submitBtn.disabled = true;

    try {
        const formData = new FormData(e.target);
        const itemData = {
            title: formData.get('title'),
            description: formData.get('description'),
            category: formData.get('category'),
            type: formData.get('type'),
            location: formData.get('location'),
            contactEmail: formData.get('contactEmail') || currentUser.email,
            color: formData.get('color'),
            brand: formData.get('brand')
        };

        // Validate required fields
        if (!itemData.title || !itemData.description || !itemData.category || !itemData.location) {
            throw new Error('Please fill in all required fields');
        }

        showNotification('Submitting your report...', 'info');

        const result = await apiCall('/items', {
            method: 'POST',
            body: JSON.stringify(itemData)
        });

        if (result.success) {
            // Success - close modal and show success message
            showModal('reportModal', false);
            showNotification('🎉 Item reported successfully! It will appear in the listings shortly.', 'success');
            
            // Reset form
            resetReportForm();
            
            // Add the new item to the display immediately
            addNewItemToDisplay(result.data);
            
            // Scroll to items section to show the new item
            setTimeout(() => {
                document.getElementById('items').scrollIntoView({ 
                    behavior: 'smooth' 
                });
            }, 500);
            
        } else {
            throw new Error(result.message || 'Failed to report item');
        }
    } catch (error) {
        console.error('Report error:', error);
        showNotification('Error: ' + error.message, 'error');
    } finally {
        // Reset button state
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

// Function to add new item to the display immediately
function addNewItemToDisplay(newItem) {
    const itemsGrid = document.getElementById('itemsGrid');
    
    // Create the new item card
    const newItemCard = createItemCard(newItem);
    
    // Add the new item at the top of the grid
    if (itemsGrid.firstChild) {
        itemsGrid.insertBefore(newItemCard, itemsGrid.firstChild);
    } else {
        itemsGrid.appendChild(newItemCard);
    }
    
    // Highlight the new item
    highlightNewItem(newItemCard);
}

// Function to highlight the new item
function highlightNewItem(itemCard) {
    // Add highlight animation
    itemCard.style.animation = 'highlightPulse 2s ease-in-out';
    
    // Add temporary border
    itemCard.style.border = '2px solid var(--secondary)';
    itemCard.style.boxShadow = '0 0 20px rgba(46, 204, 113, 0.3)';
    
    // Remove highlight after animation
    setTimeout(() => {
        itemCard.style.border = '';
        itemCard.style.boxShadow = '';
    }, 3000);
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
    showNotification('Filters cleared', 'info');
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
    const itemType = type === 'lost' ? 'lost item' : 'found item';
    
    showNotification(`✅ You've reported that you ${action} this ${itemType}! The owner will be contacted.`, 'success');
    
    // Close the details modal
    showModal('itemDetailsModal', false);
    
    // Simulate sending notification (in real app, this would call an API)
    setTimeout(() => {
        showNotification(`📧 Notification sent to the ${type === 'lost' ? 'owner' : 'finder'}!`, 'info');
    }, 1000);
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}
async function viewItemDetails(itemId) {
    try {
        showNotification('Loading item details...', 'info');
        
        // Try to get from API first
        let item = null;
        try {
            const result = await apiCall(`/items/${itemId}`);
            if (result.success) {
                item = result.data;
            }
        } catch (error) {
            console.log('API call failed, using demo data');
        }
        
        // If API fails, use demo data
        if (!item) {
            item = getDemoItem(itemId);
        }
        
        displayItemDetails(item);
        showModal('itemDetailsModal');
        
    } catch (error) {
        console.error('Error loading item details:', error);
        showNotification('Failed to load item details', 'error');
    }
}

function getDemoItem(itemId) {
    const demoItems = {
        '1': {
            _id: '1',
            title: "Black iPhone 13",
            description: "Black iPhone 13 with blue silicone case. Lost near library entrance. The phone has a small crack on the top right corner and is in a blue protective case. It was last seen on the study tables near the windows.",
            category: "electronics",
            type: "lost",
            location: "Main Library, 2nd Floor",
            contactEmail: "john@campus.edu",
            color: "Black",
            brand: "Apple",
            createdAt: new Date('2024-01-15'),
            status: "active",
            identifyingFeatures: [
                "Blue silicone case",
                "Small crack on top right",
                "Wallpaper: Mountain landscape",
                "No SIM card lock"
            ]
        },
        '2': {
            _id: '2',
            title: "Student ID Card - Sarah Johnson",
            description: "Student ID card found in cafeteria near the vending machines. The ID belongs to Sarah Johnson (Student ID: 20231234). The photo shows a person with brown hair and glasses.",
            category: "documents",
            type: "found",
            location: "Student Cafeteria, Near Vending Machines",
            contactEmail: "security@campus.edu",
            color: "White",
            brand: "University",
            createdAt: new Date('2024-01-14'),
            status: "active",
            identifyingFeatures: [
                "Name: Sarah Johnson",
                "Student ID: 20231234",
                "Issue Date: 2023-09-01",
                "Valid through: 2024-08-31"
            ]
        },
        'default': {
            _id: itemId,
            title: "Sample Item",
            description: "This is a sample item description. In a real application, this would show detailed information about the lost or found item.",
            category: "other",
            type: "lost",
            location: "Campus Building",
            contactEmail: "contact@campus.edu",
            color: "Various",
            brand: "Unknown",
            createdAt: new Date(),
            status: "active",
            identifyingFeatures: [
                "Sample feature 1",
                "Sample feature 2"
            ]
        }
    };
    
    return demoItems[itemId] || demoItems['default'];
}

function displayItemDetails(item) {
    const content = document.getElementById('itemDetailsContent');
    const emoji = categoryEmojis[item.category] || '📦';
    const statusClass = item.type === 'lost' ? 'status-lost' : 'status-found';
    const statusText = item.type === 'lost' ? 'LOST ITEM' : 'FOUND ITEM';
    
    content.innerHTML = `
        <div class="item-detail-header" style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1.5rem; padding-bottom: 1rem; border-bottom: 2px solid #eee;">
            <div style="font-size: 3rem;">${emoji}</div>
            <div style="flex: 1;">
                <h2 style="margin: 0 0 0.5rem 0; color: var(--dark);">${item.title}</h2>
                <span class="item-status ${statusClass}" style="display: inline-block;">${statusText}</span>
            </div>
        </div>
        
        <div class="detail-section">
            <h3 style="color: var(--primary); margin-bottom: 0.5rem;">
                <i class="fas fa-align-left"></i> Description
            </h3>
            <p style="color: #555; line-height: 1.6; background: #f8f9fa; padding: 1rem; border-radius: var(--radius);">
                ${item.description}
            </p>
        </div>
        
        <div class="detail-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin: 1.5rem 0;">
            <div class="detail-item">
                <strong><i class="fas fa-tag"></i> Category:</strong>
                <span style="color: #666;">${item.category.charAt(0).toUpperCase() + item.category.slice(1)}</span>
            </div>
            <div class="detail-item">
                <strong><i class="fas fa-map-marker-alt"></i> Location:</strong>
                <span style="color: #666;">${item.location}</span>
            </div>
            <div class="detail-item">
                <strong><i class="fas fa-calendar"></i> Date Reported:</strong>
                <span style="color: #666;">${formatDate(item.createdAt)}</span>
            </div>
            <div class="detail-item">
                <strong><i class="fas fa-envelope"></i> Contact Email:</strong>
                <span style="color: #666;">${item.contactEmail}</span>
            </div>
            ${item.color ? `
            <div class="detail-item">
                <strong><i class="fas fa-palette"></i> Color:</strong>
                <span style="color: #666;">${item.color}</span>
            </div>
            ` : ''}
            ${item.brand ? `
            <div class="detail-item">
                <strong><i class="fas fa-tag"></i> Brand:</strong>
                <span style="color: #666;">${item.brand}</span>
            </div>
            ` : ''}
        </div>
        
        ${item.identifyingFeatures && item.identifyingFeatures.length > 0 ? `
        <div class="detail-section">
            <h3 style="color: var(--primary); margin-bottom: 0.5rem;">
                <i class="fas fa-search"></i> Identifying Features
            </h3>
            <ul style="color: #555; background: #f8f9fa; padding: 1rem 1rem 1rem 2rem; border-radius: var(--radius);">
                ${item.identifyingFeatures.map(feature => `<li>${feature}</li>`).join('')}
            </ul>
        </div>
        ` : ''}
        
        <div class="action-buttons" style="display: flex; gap: 1rem; margin-top: 2rem; padding-top: 1.5rem; border-top: 2px solid #eee;">
            <button class="btn ${item.type === 'lost' ? 'btn-secondary' : 'btn-primary'}" onclick="contactAboutItem('${item._id}', '${item.type}')" style="flex: 1;">
                ${item.type === 'lost' ? '<i class="fas fa-hands-helping"></i> I Found This Item' : '<i class="fas fa-hand-holding-heart"></i> This Is My Item'}
            </button>
            <button class="btn btn-outline" onclick="showModal('itemDetailsModal', false)" style="flex: 0.5;">
                <i class="fas fa-times"></i> Close
            </button>
        </div>
        
        <div style="background: #e8f4fd; padding: 1rem; border-radius: var(--radius); margin-top: 1.5rem;">
            <p style="margin: 0; color: #2c3e50; font-size: 0.9rem;">
                <i class="fas fa-info-circle"></i> 
                <strong>Safety Tip:</strong> Always meet in public places on campus when exchanging items. 
                Verify ownership with specific questions about the item.
            </p>
        </div>
    `;
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
    
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

// Save auth state to localStorage
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

// Logout function (you can add this later)
function logout() {
    clearAuthState();
    location.reload();
}
// Report navigation
document.getElementById('reportNav').addEventListener('click', (e) => {
    e.preventDefault();
    if (!currentUser) {
        showNotification('Please login to report items', 'info');
        showModal('loginModal');
        return;
    }
    showModal('reportModal');
});

// Browse Found Items button - scroll to items section and filter
elements.browseFoundBtn.addEventListener('click', () => {
    // Set filter to show found items
    elements.typeFilter.value = 'found';
    
    // Scroll to items section smoothly
    document.getElementById('items').scrollIntoView({ 
        behavior: 'smooth' 
    });
    
    // Load items with filter applied
    setTimeout(() => {
        loadItems();
        showNotification('Showing all found items', 'info');
    }, 500);
});

// Form step navigation
function showStep(stepNumber) {
    // Hide all steps
    document.querySelectorAll('.form-step').forEach(step => {
        step.classList.add('hidden');
        step.classList.remove('active');
    });
    
    // Show current step
    const currentStep = document.getElementById(`step${stepNumber}`);
    currentStep.classList.remove('hidden');
    currentStep.classList.add('active');
    
    // Scroll to top when changing steps
    const modalBody = document.querySelector('#reportModal .modal-body');
    if (modalBody) {
        modalBody.scrollTop = 0;
    }
    
    // Update modal header based on step
    const modalHeader = document.querySelector('#reportModal .modal-header h3');
    if (stepNumber === 1) {
        modalHeader.innerHTML = '<i class="fas fa-flag"></i> Report Item - Basic Info';
    } else {
        const itemType = document.getElementById('itemType').value;
        const typeText = itemType === 'lost' ? 'Lost Item' : 'Found Item';
        modalHeader.innerHTML = `<i class="fas fa-flag"></i> Report ${typeText} - Details`;
    }
}
function resetReportForm() {
    showStep(1); // Always start at step 1
    document.getElementById('reportForm').reset();
    
    // Reset type selection
    document.querySelectorAll('.type-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector('.type-btn[data-type="lost"]').classList.add('active');
    document.getElementById('itemType').value = 'lost';
    
    // Auto-fill email if user is logged in
    if (currentUser) {
        document.querySelector('input[name="contactEmail"]').value = currentUser.email;
    }
}
// Setup type buttons in report modal
function setupReportFormTabs() {
    const typeButtons = document.querySelectorAll('.type-btn');
    const typeInput = document.getElementById('itemType');
    
    typeButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons
            typeButtons.forEach(btn => btn.classList.remove('active'));
            // Add active class to clicked button
            button.classList.add('active');
            // Update hidden input value
            typeInput.value = button.dataset.type;
            
            // Update button text based on selection
            const submitBtn = document.querySelector('#reportForm button[type="submit"]');
            if (button.dataset.type === 'lost') {
                submitBtn.innerHTML = '<i class="fas fa-search"></i> Report Lost Item';
                submitBtn.className = 'btn btn-secondary';
            } else {
                submitBtn.innerHTML = '<i class="fas fa-hands-helping"></i> Report Found Item';
                submitBtn.className = 'btn btn-primary';
            }
        });
    });
    
    // Auto-fill email if user is logged in
    if (currentUser) {
        document.querySelector('input[name="contactEmail"]').value = currentUser.email;
    }
}

// Update the report form handler to reset to step 1 when opened
function setupReportModal() {
    const reportModal = document.getElementById('reportModal');
    
    // Reset form when modal is opened
    reportModal.addEventListener('click', (e) => {
        if (e.target === reportModal) {
            resetReportForm();
        }
    });
    
    // Also reset when close button is clicked
    document.querySelector('#reportModal .close-modal').addEventListener('click', () => {
        resetReportForm();
    });
}

function resetReportForm() {
    showStep(1);
    document.getElementById('reportForm').reset();
    
    // Reset type selection
    document.querySelectorAll('.type-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector('.type-btn[data-type="lost"]').classList.add('active');
    document.getElementById('itemType').value = 'lost';
    
    // Auto-fill email if user is logged in
    if (currentUser) {
        document.querySelector('input[name="contactEmail"]').value = currentUser.email;
    }
    
    // Scroll to top of modal
    const modalBody = document.querySelector('#reportModal .modal-body');
    if (modalBody) {
        modalBody.scrollTop = 0;
    }
}