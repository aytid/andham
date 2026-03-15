let cart = JSON.parse(localStorage.getItem('andham_cart')) || [];
let currentProduct = null;
let detailQuantity = 1;

// Available filters
const availableFilters = ["Plains", "Semi Kanchipattu", "Pure Kanchipattu", "Semi Gadwal", "Pure Gadwal"];

// Filter descriptions
const filterDescriptions = {
    "Plains": "Elegant plain sarees perfect for daily wear and minimalist styling. Crafted with precision for the modern woman.",
    "Semi Kanchipattu": "Beautiful semi-silk Kanchipattu sarees offering traditional elegance at accessible prices.",
    "Pure Kanchipattu": "Authentic pure silk Kanchipattu sarees with intricate zari work, perfect for weddings and special occasions.",
    "Semi Gadwal": "Stylish semi-silk Gadwal sarees combining comfort with traditional craftsmanship.",
    "Pure Gadwal": "Exquisite pure silk Gadwal sarees featuring the signature kuttu weaving technique and rich borders."
};

// Helper function to find product by ID
// function findProductById(id) {
//     return products.find(p => p.id === id || p.id === String(id));
// }

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    const path = window.location.pathname;

    // Check which page we're on
    if (path.includes('index.html') || path === '/' || path === '') {
        initHomePage();
    } else if (path.includes('collection.html')) {
        initCollectionPage();
    } else if (path.includes('product.html')) {
        initProductPage();
    }

    // Update cart UI on all pages
    updateCartUI();
});

// Home Page Initialization
function initHomePage() {
    console.log('Home page loaded');
}

// Collection Page Initialization
function initCollectionPage() {
    const urlParams = new URLSearchParams(window.location.search);
    const filter = urlParams.get('filter');
    const search = urlParams.get('search');
    const id = urlParams.get('id');

    let filteredProducts = products;
    let title = "All Products";
    let description = "Explore our exquisite collection of traditional handwoven sarees.";

    // Handle ID search (redirects to product page if exact match found)
    if (id) {
        const product = findProductById(id);
        if (product) {
            window.location.href = `product.html?id=${encodeURIComponent(id)}`;
            return;
        } else {
            title = "Product Not Found";
            description = `No product found with ID: ${id}`;
            filteredProducts = [];
            updateBreadcrumb(null, `ID: ${id}`);
        }
    }
    // Handle category filter
    else if (filter && availableFilters.includes(filter)) {
        filteredProducts = products.filter(p => p.category === filter);
        title = filter;
        description = filterDescriptions[filter] || description;
        updateBreadcrumb(filter);
        renderActiveFilter(filter);
    }
    // Handle search (title, category, or ID partial match)
    else if (search) {
        const searchLower = search.toLowerCase();

        // Check if search is exact ID match first
        const exactIdMatch = findProductById(search.toUpperCase());
        if (exactIdMatch) {
            window.location.href = `product.html?id=${encodeURIComponent(exactIdMatch.id)}`;
            return;
        }

        // Otherwise search in title, category, or partial ID
        filteredProducts = products.filter(p =>
            p.title.toLowerCase().includes(searchLower) ||
            p.category.toLowerCase().includes(searchLower) ||
            p.id.toLowerCase().includes(searchLower) ||
            p.collection.toLowerCase().includes(searchLower)
        );

        title = filteredProducts.length > 0 ? `Search: "${search}"` : "No Results Found";
        description = filteredProducts.length > 0
            ? `Found ${filteredProducts.length} product(s) matching your search.`
            : `No products found for "${search}". Try searching by ID (e.g., ADM00001), category, or title.`;
        updateBreadcrumb(null, search);
    } else {
        updateBreadcrumb();
    }

    document.getElementById('collectionTitle').textContent = title;
    document.getElementById('collectionDescription').textContent = description;
    document.title = `${title} - Andham`;

    filteredProducts.sort((a, b) => b.id.localeCompare(a.id));
    renderProducts(filteredProducts);
}

// Product Page Initialization
async function initProductPage() {

    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get("id");

    if (!productId) {
        window.location.href = "collection.html";
        return;
    }

    // Fetch product from Supabase
    const { data, error } = await supabaseClient
        .from("products")
        .select("*")
        .eq("product_id", productId)
        .order('created_at', { ascending: false })
        .single();

    if (error || !data) {
        console.error(error);
        window.location.href = "collection.html";
        return;
    }

    // Convert DB record → frontend object
    window.currentProduct = {
        id: data.product_id,
        title: data.title,
        price: data.price,
        originalPrice: data.original_price,
        category: data.category,
        image: data.image,
        images: data.images ? data.images.split(",").map(i => i.trim()) : [],
        description: data.description,
        bullets: data.bullets ? data.bullets.split(",").map(b => b.trim()) : [],
        stock: data.stock
    };

    const product = window.currentProduct;

    // Update page title
    document.title = `${product.title} - Andham`;

    // Check stock
    const isOutOfStock = !product.stock;

    const stockBadge = document.getElementById("stockBadge");
    if (stockBadge) {
        stockBadge.style.display = isOutOfStock ? "inline-block" : "none";
    }

    // Disable buttons if out of stock
    const addToCartBtn = document.querySelector(".btn-primary");
    const buyNowBtn = document.querySelector(".btn-secondary");

    if (isOutOfStock) {
        if (addToCartBtn) {
            addToCartBtn.disabled = true;
            addToCartBtn.textContent = "Out of Stock";
            addToCartBtn.style.opacity = "0.5";
            addToCartBtn.style.cursor = "not-allowed";
            addToCartBtn.onclick = null;
        }

        if (buyNowBtn) {
            buyNowBtn.disabled = true;
            buyNowBtn.style.opacity = "0.5";
            buyNowBtn.style.cursor = "not-allowed";
        }
    }

    // Render product UI
    renderProductDetail();
    setupGallery();
}

// Update breadcrumb on collection page
function updateBreadcrumb(filter = null, search = null) {
    const breadcrumbFilter = document.getElementById('breadcrumbFilter');
    const breadcrumbCurrent = document.getElementById('breadcrumbCurrent');

    if (!breadcrumbFilter || !breadcrumbCurrent) return;

    if (filter) {
        breadcrumbFilter.style.display = 'inline';
        breadcrumbCurrent.textContent = filter;
    } else if (search) {
        breadcrumbFilter.style.display = 'inline';
        breadcrumbCurrent.textContent = search;
    } else {
        breadcrumbFilter.style.display = 'none';
        breadcrumbCurrent.textContent = '';
    }
}

// Render active filter buttons
function renderActiveFilter(currentFilter) {
    const container = document.getElementById('activeFilters');
    if (!container) return;

    container.innerHTML = availableFilters.map(filter => `
        <a href="collection.html?filter=${encodeURIComponent(filter)}" 
           class="filter-tag ${filter === currentFilter ? 'active' : ''}"
           style="padding: 8px 16px; border: 1px solid ${filter === currentFilter ? '#8b0000' : '#ddd'}; 
                  background: ${filter === currentFilter ? '#8b0000' : '#fff'}; 
                  color: ${filter === currentFilter ? '#fff' : '#333'}; 
                  text-decoration: none; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;
                  transition: all 0.3s ease;">
            ${filter}
        </a>
    `).join('');
}

// Render products grid
function renderProducts(list) {
    const grid = document.getElementById('productsGrid');
    if (!grid) return;

    if (list.length === 0) {
        grid.innerHTML = `<div class="no-products">...</div>`;
        return;
    }

    grid.innerHTML = list.map(p => {
        const isOutOfStock = p.stock === 'out';
        const opacity = isOutOfStock ? 'opacity: 0.6; pointer-events: none;' : '';
        const badge = isOutOfStock ? '<span class="out-of-stock-badge">Out of Stock</span>' : '';

        return `
        <div class="product-card" style="${opacity}">
            ${isOutOfStock ? badge : `<a href="product.html?id=${encodeURIComponent(p.id)}" class="product-link">`}
                <div class="product-image-wrapper">

                    ${isOutOfStock ? '<div style="position: absolute; inset: 0; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 10;"><span style="color: white; font-size: 14px; text-transform: uppercase; letter-spacing: 2px; font-weight: 600;">Out of Stock</span></div>' : ''}
                    <img src="${p.image}" class="product-img" alt="${p.title}">
                </div>
                <div class="product-info">
                    <div style="font-size: 11px; color: #999; font-family: monospace;">${p.id}</div>
                    <h3 class="product-title">${p.title}</h3>
                    <div class="product-price">
                        ${p.originalPrice ? `<span class="price-original">Rs. ${p.originalPrice.toLocaleString()}.00</span>` : ''}
                        <span class="price-current" style="color: ${isOutOfStock ? '#999' : '#8b0000'};">Rs. ${p.price.toLocaleString()}.00</span>
                    </div>
                </div>
            ${isOutOfStock ? '' : '</a>'}
        </div>
    `}).join('');
}
// Product detail functions
function changeMainImage(src, thumb) {
    const mainImage = document.getElementById('mainImage');
    if (mainImage) {
        mainImage.src = src;
    }
    document.querySelectorAll('.thumbnail').forEach(t => t.classList.remove('active'));
    if (thumb) {
        thumb.classList.add('active');
    }
}

function updateDetailQty(change) {
    const qtyEl = document.getElementById('detailQty');
    let newQty = parseInt(qtyEl.textContent) + change;
    if (newQty < 1) newQty = 1;
    if (newQty > 10) newQty = 10;

    qtyEl.textContent = newQty;
    detailQuantity = newQty;
}

function addToCartFromDetail() {
    const qtyEl = document.getElementById('detailQty');
    const quantity = parseInt(qtyEl.textContent) || 1;
    
    const product = window.currentProduct;
    
    if (!product) {
        showToast('Error: Product not loaded');
        return;
    }

    // Use product_id consistently
    const productId = product.id || product.product_id;
    
    const existing = cart.find(item => (item.id === productId || item.product_id === productId));
    
    if (existing) {
        existing.quantity += quantity;
    } else {
        // Store complete product data for checkout
        cart.push({ 
            product_id: productId,
            id: productId, // for compatibility
            title: product.title,
            price: product.price,
            image: product.image,
            category: product.category,
            quantity: quantity 
        });
    }
    
    localStorage.setItem('andham_cart', JSON.stringify(cart));
    updateCartUI();
    showToast(`Added ${quantity} item(s) to cart`);
    toggleCart();
    
    // Save to database if logged in
    const user = getCurrentUser();
    if (user) {
        saveCartToDatabase(productId, existing ? existing.quantity : quantity);
    }
    
    // Reset quantity
    if (qtyEl) qtyEl.textContent = '1';
}

async function saveCartToDatabase(productId, quantity) {
    const user = getCurrentUser();
    if (!user) return;
    
    try {
        await supabaseClient
            .from('cart')
            .upsert({
                user_id: user.user_id,
                product_id: productId,
                quantity: quantity,
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'user_id,product_id'
            });
    } catch (err) {
        console.error('Failed to save cart:', err);
    }
}

function updateCartItemQty(id, change) {
    let cart = JSON.parse(localStorage.getItem('andham_cart') || '[]');
    const itemIndex = cart.findIndex(i => i.id === id || i.product_id === id);

    if (itemIndex >= 0) {
        cart[itemIndex].quantity += change;
        if (cart[itemIndex].quantity <= 0) {
            cart.splice(itemIndex, 1);
        }
        localStorage.setItem('andham_cart', JSON.stringify(cart));
        updateCartUI(); // Refresh UI immediately
        updateCartBadge();

        // Sync to database if logged in (async)
        const user = getCurrentUser();
        if (user && cart[itemIndex]) {
            supabaseClient
                .from('cart')
                .upsert({
                    user_id: user.user_id,
                    product_id: id,
                    quantity: cart[itemIndex].quantity,
                    updated_at: new Date().toISOString()
                }, {
                    onConflict: 'user_id,product_id'
                })
                .catch(err => console.error('Failed to sync quantity:', err));
        } else if (user && !cart[itemIndex]) {
            // Item removed, delete from database
            supabaseClient
                .from('cart')
                .delete()
                .eq('user_id', user.user_id)
                .eq('product_id', id)
                .catch(err => console.error('Failed to delete from cart:', err));
        }
    }
}

function removeFromCart(id) {
    let cart = JSON.parse(localStorage.getItem('andham_cart') || '[]');
    cart = cart.filter(i => i.id !== id && i.product_id !== id);
    localStorage.setItem('andham_cart', JSON.stringify(cart));
    updateCartUI(); // Refresh UI immediately
    updateCartBadge();

    // Remove from database if logged in (async)
    const user = getCurrentUser();
    if (user) {
        supabaseClient
            .from('cart')
            .delete()
            .eq('user_id', user.user_id)
            .eq('product_id', id)
            .catch(err => console.error('Failed to remove from database cart:', err));
    }
}

function updateCartUI() {
    const badge = document.getElementById('cartBadge');
    const itemsContainer = document.getElementById('cartItems');
    const totalEl = document.getElementById('cartTotal');

    // Get cart from localStorage
    const cart = JSON.parse(localStorage.getItem('andham_cart') || '[]');

    if (!badge) return;

    // Update badge
    const totalQty = cart.reduce((sum, item) => sum + (parseInt(item.quantity) || 0), 0);
    badge.textContent = totalQty;
    badge.style.display = totalQty > 0 ? 'flex' : 'none';

    if (!itemsContainer) return;

    // Render cart items
    if (cart.length === 0) {
        itemsContainer.innerHTML = `
            <div class="cart-empty">
                <div style="font-size: 48px; margin-bottom: 20px;">🛍️</div>
                <div style="font-family: 'Playfair Display', serif; font-style: italic;">Your cart is empty</div>
            </div>
        `;
        if (totalEl) totalEl.textContent = 'Rs. 0.00';
        return;
    }

    let total = 0;

    itemsContainer.innerHTML = cart.map(item => {
        const itemTotal = (item.price || 0) * (item.quantity || 1);
        total += itemTotal;

        const itemId = item.id || item.product_id;

        return `
            <div class="cart-item" style="display: flex; gap: 15px; padding: 20px; border-bottom: 1px solid #eee;">
                <img src="${item.image || 'https://via.placeholder.com/80x100?text=No+Image'}" 
                     class="cart-item-image" 
                     style="width: 80px; height: 100px; object-fit: cover;" 
                     alt="${item.title || 'Product'}"
                     onerror="this.src='https://via.placeholder.com/80x100?text=No+Image'">
                <div class="cart-item-details" style="flex: 1;">
                    <div class="cart-item-category" style="font-size: 10px; color: #8b0000; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 5px;">${item.category || ''}</div>
                    <div class="cart-item-id" style="font-size: 10px; color: #999; font-family: monospace; margin-bottom: 3px;">${itemId}</div>
                    <div class="cart-item-title" style="font-size: 14px; margin-bottom: 5px;">${item.title || 'Unknown Product'}</div>
                    <div class="cart-item-price" style="color: #8b0000; font-weight: 600; margin-bottom: 10px;">Rs. ${(item.price || 0).toLocaleString()}</div>
                    <div style="display: flex; align-items: center; gap: 15px;">
                        <div class="qty-selector" style="display: flex; align-items: center; border: 1px solid #ddd;">
                            <button class="qty-btn" onclick="updateCartItemQty('${itemId}', -1)" style="width: 30px; height: 30px; border: none; background: #f5f5f5; cursor: pointer;">−</button>
                            <span class="qty-value" style="padding: 0 15px; font-size: 13px;">${item.quantity || 1}</span>
                            <button class="qty-btn" onclick="updateCartItemQty('${itemId}', 1)" style="width: 30px; height: 30px; border: none; background: #f5f5f5; cursor: pointer;">+</button>
                        </div>
                        <button class="remove-btn" onclick="removeFromCart('${itemId}')" style="background: none; border: none; color: #999; text-decoration: underline; cursor: pointer; font-size: 12px;">Remove</button>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    if (totalEl) {
        totalEl.textContent = `Rs. ${total.toLocaleString()}.00`;
    }
}

// Navigation and Search
function toggleNav() {
    const drawer = document.getElementById('navDrawer');
    const overlay = document.getElementById('navOverlay');
    if (!drawer || !overlay) return;

    if (drawer.classList.contains('active')) {
        drawer.classList.remove('active');
        overlay.classList.remove('active');
        document.body.style.overflow = '';
    } else {
        drawer.classList.add('active');
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function toggleSearch() {
    const modal = document.getElementById('searchModal');
    if (!modal) return;

    if (modal.classList.contains('active')) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    } else {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        const searchInput = document.getElementById('searchInput');
        if (searchInput) searchInput.focus();
    }
}

// Enhanced search handler with ID support
async function handleSearch(event) {
    const query = event.target.value.trim();

    // Don't search for empty strings
    if (query.length < 2) {
        document.getElementById('search-results-list').innerHTML = '';
        return;
    }

    // Call Supabase with an 'OR' filter to check both Title and Category
    const { data, error } = await supabaseClient
        .from('products')
        .select('*')
        .or(`title.ilike.%${query}%,category.ilike.%${query}%,product_id.ilike.%${query}%`)
        .limit(10);

    if (error) {
        console.error("Search error:", error);
        return;
    }

    displaySearchResults(data);
}

function quickSearch(term) {
    const searchInput = document.getElementById('searchInput');
    searchInput.value = term;
    // Manually trigger the search function
    handleSearch({ target: { value: term } });
}

function toggleAccordion(btn) {
    const item = btn.parentElement;
    if (item) {
        item.classList.toggle('active');
    }
}

function shareProduct() {
    if (navigator.share) {
        navigator.share({
            title: currentProduct?.title || 'Andham',
            text: 'Check out this beautiful saree!',
            url: window.location.href
        });
    } else {
        navigator.clipboard.writeText(window.location.href).then(() => {
            showToast('Link copied to clipboard');
        }).catch(() => {
            showToast('Unable to share');
        });
    }
}

function showToast(message) {
    const toast = document.getElementById('toast');
    if (!toast) return;

    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}

// Close on escape
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const searchModal = document.getElementById('searchModal');
        const navDrawer = document.getElementById('navDrawer');
        const navOverlay = document.getElementById('navOverlay');
        const cartDrawer = document.getElementById('cartDrawer');
        const cartOverlay = document.getElementById('cartOverlay');

        if (searchModal) searchModal.classList.remove('active');
        if (navDrawer) navDrawer.classList.remove('active');
        if (navOverlay) navOverlay.classList.remove('active');
        if (cartDrawer) cartDrawer.classList.remove('active');
        if (cartOverlay) cartOverlay.classList.remove('active');

        document.body.style.overflow = '';
    }
});

// For home page - render featured products
function renderHomeProducts() {
    const grid = document.getElementById('homeProductsGrid');
    if (!grid || typeof products === 'undefined') return;

    const featured = products;

    grid.innerHTML = featured.map(p => {
        const isOutOfStock = p.stock === 'out';

        if (isOutOfStock) {
            return `
            <div class="product-card" style="opacity: 0.6; background: white;">
                <div style="position: relative;">
                    <div style="position: absolute; inset: 0; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 10;">
                        <span style="color: white; font-size: 14px; text-transform: uppercase; letter-spacing: 2px;">Out of Stock</span>
                    </div>
                    <img src="${p.image}" style="width: 100%; aspect-ratio: 3/4; object-fit: cover;" alt="${p.title}">
                </div>
                <div style="padding: 20px;">
                    <div style="font-size: 11px; color: #999; font-family: monospace;">${p.id}</div>
                    <h3 style="font-family: var(--font-serif); font-size: 16px; margin: 10px 0;">${p.title}</h3>
                    <div>
                        ${p.originalPrice ? `<span style="text-decoration: line-through; color: #999; margin-right: 10px;">Rs. ${p.originalPrice.toLocaleString()}.00</span>` : ''}
                        <span style="color: #999; font-weight: 600;">Rs. ${p.price.toLocaleString()}.00</span>
                    </div>
                </div>
            </div>`;
        }

        return `
        <div class="product-card" style="background: white; transition: transform 0.3s;">
            <a href="product.html?id=${encodeURIComponent(p.id)}" style="text-decoration: none; color: inherit;">
                <div style="position: relative; overflow: hidden;">
                    <span style="position: absolute; top: 10px; left: 10px; background: #8b0000; color: #fff; padding: 4px 12px; font-size: 10px; text-transform: uppercase; z-index: 2;">${p.category}</span>
                    <img src="${p.image}" style="width: 100%; aspect-ratio: 3/4; object-fit: cover; transition: transform 0.6s;" alt="${p.title}" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
                </div>
                <div style="padding: 20px;">
                    <div style="font-size: 11px; color: #999; font-family: monospace;">${p.id}</div>
                    <h3 style="font-family: var(--font-serif); font-size: 16px; margin: 10px 0;">${p.title}</h3>
                    <div>
                        ${p.originalPrice ? `<span style="text-decoration: line-through; color: #999; margin-right: 10px;">Rs. ${p.originalPrice.toLocaleString()}.00</span>` : ''}
                        <span style="color: #8b0000; font-weight: 600;">Rs. ${p.price.toLocaleString()}.00</span>
                    </div>
                </div>
            </a>
        </div>`;
    }).join('');
}

// Call in initHomePage
function initHomePage() {
    renderHomeProducts(); // Add this line
}

function loadProductDetail() {

    const product = window.currentProduct;
    if (!product) return;

    // Title
    document.getElementById("detailTitle").textContent = product.title;

    // Price
    document.getElementById("detailPrice").textContent =
        `Rs. ${product.price.toLocaleString()}.00`;

    // Original price
    const originalEl = document.getElementById("detailOriginalPrice");
    const badgeEl = document.getElementById("discountBadge");

    if (product.originalPrice && product.originalPrice > product.price) {

        originalEl.style.display = "block";
        originalEl.textContent =
            `Rs. ${product.originalPrice.toLocaleString()}.00`;

        const discount = Math.round(
            ((product.originalPrice - product.price) / product.originalPrice) * 100
        );

        badgeEl.style.display = "inline-block";
        badgeEl.textContent = `${discount}% OFF`;

    } else {

        originalEl.style.display = "none";
        badgeEl.style.display = "none";
    }

    // Main Image
    document.getElementById("mainImage").src = product.image;

    // Product ID
    document.getElementById("productId").textContent = product.id;

    // Breadcrumb
    const breadcrumb = document.getElementById("breadcrumbProduct");
    if (breadcrumb) breadcrumb.textContent = product.title;

    // Description
    const desc = document.getElementById("detailDescription");
    if (desc) desc.innerHTML = product.description || "";

    // Bullets
    const bullets = document.getElementById("detailBullets");
    if (bullets && product.bullets) {
        bullets.innerHTML = product.bullets
            .map(b => `<li>${b}</li>`)
            .join("");
    }
}

document.addEventListener("DOMContentLoaded", function () {
    loadProductDetail();
});


// Clean all product URLs on load
function cleanProductData() {
    if (typeof products === 'undefined') return;

    products.forEach(p => {
        if (p.image) p.image = p.image.trim();
        if (p.images && Array.isArray(p.images)) {
            p.images = p.images.map(img => img ? img.trim() : '').filter(img => img);
        }
    });
}


// ============================================
// CART FUNCTIONS
// ============================================

// Get current user from storage
function getCurrentUser() {
    const user = localStorage.getItem('andham_user') || sessionStorage.getItem('andham_user');
    return user ? JSON.parse(user) : null;
}

// Add to cart (database + localStorage backup)
async function addToCart(productId, quantity = 1) {
    const user = getCurrentUser();

    // 1. Fetch product details FIRST (needed for immediate UI display)
    const { data: product, error: productError } = await supabaseClient
        .from('products')
        .select('product_id, title, price, image, category')
        .eq('product_id', productId)
        .single();

    if (productError || !product) {
        console.error('Product fetch error:', productError);
        showToast('Product not found', 'error');
        return false;
    }

    // 2. Update localStorage with complete product info
    let cart = JSON.parse(localStorage.getItem('andham_cart') || '[]');
    const existingIndex = cart.findIndex(item => item.id === productId || item.product_id === productId);

    if (existingIndex >= 0) {
        cart[existingIndex].quantity += quantity;
    } else {
        cart.push({
            id: productId,
            product_id: productId,
            title: product.title,
            price: product.price,
            image: product.image,
            category: product.category,
            quantity: quantity,
            added_at: new Date().toISOString()
        });
    }

    localStorage.setItem('andham_cart', JSON.stringify(cart));

    // 3. Update UI IMMEDIATELY (before database call)
    updateCartUI();
    updateCartBadge();

    // 4. If user logged in, save to database (async, don't wait)
    if (user) {
        try {
            await supabaseClient
                .from('cart')
                .upsert({
                    user_id: user.user_id,
                    product_id: productId,
                    quantity: cart.find(item => item.id === productId)?.quantity || quantity,
                    updated_at: new Date().toISOString()
                }, {
                    onConflict: 'user_id,product_id'
                });
        } catch (err) {
            console.error('Database save error:', err);
        }
    }

    showToast('Added to cart!', 'success');
    return true;
}
// Get cart (merge database + localStorage)
async function getCart() {
    const user = getCurrentUser();
    let cartItems = [];

    // Get from database if logged in
    if (user) {
        const { data: dbCart, error } = await supabaseClient
            .from('cart')
            .select('*')
            .eq('user_id', user.user_id);

        if (error) {
            console.error('Error fetching cart:', error);
        } else if (dbCart) {
            // Fetch product details for each item
            for (const item of dbCart) {
                const { data: product } = await supabaseClient
                    .from('products')
                    .select('product_id, title, price, image, category')
                    .eq('product_id', item.product_id)
                    .single();

                if (product) {
                    cartItems.push({
                        cart_id: item.cart_id,
                        product_id: item.product_id,
                        quantity: item.quantity,
                        product: product
                    });
                }
            }
        }
    } else {
        // Not logged in - get from localStorage
        const localCart = JSON.parse(localStorage.getItem('andham_cart') || '[]');

        for (const item of localCart) {
            const productId = item.product_id || item.id;

            const { data: product } = await supabaseClient
                .from('products')
                .select('product_id, title, price, image, category')
                .eq('product_id', productId)
                .single();

            if (product) {
                cartItems.push({
                    product_id: productId,
                    quantity: item.quantity,
                    product: product
                });
            }
        }
    }

    return cartItems;
}
// Remove from cart
async function removeFromCart(productId) {
    const user = getCurrentUser();

    // Remove from database if logged in
    if (user) {
        const { error } = await supabaseClient
            .from('cart')
            .delete()
            .eq('user_id', user.user_id)
            .eq('product_id', productId);

        if (error) {
            console.error('Error removing from cart:', error);
        }
    }

    // Always remove from localStorage
    let cart = JSON.parse(localStorage.getItem('andham_cart') || '[]');
    cart = cart.filter(item => (item.product_id !== productId && item.id !== productId));
    localStorage.setItem('andham_cart', JSON.stringify(cart));

    updateCartBadge();
    renderCartDrawer();
}

// Update quantity
async function updateCartQuantity(productId, quantity) {
    if (quantity < 1) {
        removeFromCart(productId);
        return;
    }

    const user = getCurrentUser();

    // Update localStorage
    let cart = JSON.parse(localStorage.getItem('andham_cart') || '[]');
    const item = cart.find(item => (item.product_id === productId || item.id === productId));
    if (item) {
        item.quantity = quantity;
        localStorage.setItem('andham_cart', JSON.stringify(cart));
    }

    // Update database if logged in
    if (user) {
        const { error } = await supabaseClient
            .from('cart')
            .upsert({
                user_id: user.user_id,
                product_id: productId,
                quantity: quantity,
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'user_id,product_id'
            });

        if (error) {
            console.error('Error updating cart quantity:', error);
        }
    }

    updateCartBadge();
    renderCartDrawer();
}

// Sync local cart to database on login
async function syncCartOnLogin(userId) {
    const localCart = JSON.parse(localStorage.getItem('andham_cart') || '[]');

    if (localCart.length === 0) return;

    // Merge with database cart
    for (const item of localCart) {
        await supabaseClient
            .from('cart')
            .upsert({
                user_id: userId,
                product_id: item.product_id,
                quantity: item.quantity
            }, {
                onConflict: 'user_id,product_id'
            });
    }

    // Clear local cart after sync
    localStorage.removeItem('andham_cart');
}

// Update cart badge count
function updateCartBadge() {
    const cart = JSON.parse(localStorage.getItem('andham_cart') || '[]');
    const badge = document.getElementById('cartBadge');
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

    if (badge) {
        badge.textContent = totalItems;
        badge.style.display = totalItems > 0 ? 'flex' : 'none';
    }
}

// ============================================
// ORDER FUNCTIONS
// ============================================

// Create order from cart
async function createOrder(shippingAddress, paymentMethod) {
    const user = getCurrentUser();
    const cartItems = await getCart();

    if (cartItems.length === 0) {
        showToast('Your cart is empty', 'error');
        return null;
    }

    // Calculate total
    const totalAmount = cartItems.reduce((sum, item) => {
        return sum + (item.product.price * item.quantity);
    }, 0);

    // Generate order number
    const orderNumber = `ORD-${Date.now()}`;

    // Create order
    const { data: order, error: orderError } = await supabaseClient
        .from('orders')
        .insert({
            user_id: user ? user.user_id : null,  // null for guest checkout
            order_number: orderNumber,
            total_amount: totalAmount,
            shipping_address: shippingAddress,
            payment_method: paymentMethod,
            status: 'confirmed',
            payment_status: 'paid'
        })
        .select()
        .single();

    if (orderError) {
        showToast('Failed to create order', 'error');
        return null;
    }

    // Create order items
    const orderItems = cartItems.map(item => ({
        order_id: order.order_id,
        product_id: item.product_id,
        product_name: item.product.title,
        quantity: item.quantity,
        unit_price: item.product.price,
        total_price: item.product.price * item.quantity
    }));

    const { error: itemsError } = await supabaseClient
        .from('order_items')
        .insert(orderItems);

    if (itemsError) {
        showToast('Failed to save order items', 'error');
        return null;
    }

    // Clear cart
    if (user) {
        await supabaseClient
            .from('cart')
            .delete()
            .eq('user_id', user.user_id);
    }
    localStorage.removeItem('andham_cart');
    updateCartBadge();

    showToast(`Order ${orderNumber} placed successfully!`, 'success');
    return order;
}

// Get user's orders
async function getUserOrders() {
    const user = getCurrentUser();
    if (!user) return [];

    const { data, error } = await supabaseClient
        .from('orders')
        .select(`
            *,
            order_items (*)
        `)
        .eq('user_id', user.user_id)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Failed to fetch orders:', error);
        return [];
    }

    return data;
}

// ============================================
// UI FUNCTIONS
// ============================================

// Render cart drawer
async function renderCartDrawer() {
    const cartItems = await getCart();
    const cartContainer = document.getElementById('cartItems');
    const cartTotal = document.getElementById('cartTotal');

    if (!cartContainer) return;

    if (cartItems.length === 0) {
        cartContainer.innerHTML = `
            <div class="cart-empty">
                <div style="font-size: 48px; margin-bottom: 20px;">🛍️</div>
                <div style="font-family: var(--font-serif); font-style: italic;">Your cart is empty</div>
            </div>
        `;
        if (cartTotal) cartTotal.textContent = 'Rs. 0.00';
        return;
    }

    let total = 0;

    cartContainer.innerHTML = cartItems.map(item => {
        const itemTotal = item.product.price * item.quantity;
        total += itemTotal;

        return `
            <div class="cart-item">
                <img src="${item.product.image}" class="cart-item-image" alt="${item.product.title}">
                <div class="cart-item-details">
                    <div class="cart-item-title">${item.product.title}</div>
                    <div class="cart-item-price">Rs. ${item.product.price.toLocaleString()}</div>
                    <div class="qty-selector">
                        <button class="qty-btn" onclick="updateCartQuantity('${item.product_id}', ${item.quantity - 1})">−</button>
                        <span class="qty-value">${item.quantity}</span>
                        <button class="qty-btn" onclick="updateCartQuantity('${item.product_id}', ${item.quantity + 1})">+</button>
                    </div>
                    <button class="remove-btn" onclick="removeFromCart('${item.product_id}')">Remove</button>
                </div>
            </div>
        `;
    }).join('');

    if (cartTotal) {
        cartTotal.textContent = `Rs. ${total.toLocaleString()}`;
    }
}

// Toggle cart drawer
function toggleCart() {
    const drawer = document.getElementById('cartDrawer');
    const overlay = document.getElementById('cartOverlay');
    if (!drawer || !overlay) return;

    const isActive = drawer.classList.contains('active');

    if (isActive) {
        drawer.classList.remove('active');
        overlay.classList.remove('active');
        document.body.style.overflow = '';
    } else {
        // REFRESH UI BEFORE SHOWING
        updateCartUI();
        updateCartBadge();

        drawer.classList.add('active');
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function updateHeader() {
    const user = getCurrentUser();
    const accountBtn = document.getElementById('accountBtn');
    if (accountBtn && user) {
        accountBtn.innerHTML = `
            <span style="font-size: 12px; margin-right: 5px;">${user.user_name?.split(' ')[0] || 'Account'}</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
            </svg>
        `;
    }
}

document.addEventListener('DOMContentLoaded', updateHeader);

// ============================================
// HEADER ACCOUNT BUTTON FUNCTIONS
// ============================================

function handleAccountClick() {
    const user = getCurrentUser();
    if (user) {
        window.location.href = 'account.html';
    } else {
        // Save current page for redirect after login
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        window.location.href = `login.html?redirect=${encodeURIComponent(currentPage)}`;
    }
}

function updateHeaderAccount() {
    const user = getCurrentUser();
    const accountBtn = document.getElementById('accountBtn');

    if (!accountBtn) return;

    if (user && user.user_name) {
        // User is logged in - show first initial or name
        const firstInitial = user.user_name.charAt(0).toUpperCase();
        const firstName = user.user_name.split(' ')[0];

        accountBtn.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
            </svg>
            <span class="user-initial">${firstInitial}</span>
        `;

        // Add logged-in class for desktop name display
        accountBtn.classList.add('logged-in');

        // Optional: Add tooltip with full name
        accountBtn.title = `Hello, ${user.user_name}`;

    } else {
        // Not logged in - show default icon
        accountBtn.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
            </svg>
        `;
        accountBtn.classList.remove('logged-in');
        accountBtn.title = 'Sign In';
    }
}

// Update on page load
document.addEventListener('DOMContentLoaded', async () => {
    const user = getCurrentUser();

    if (user) {
        // CRITICAL: Sync cart from database when logged in
        await syncCartFromDatabase();
    } else {
        updateCartUI();
    }

    updateHeaderAccount();
    updateCartBadge();
});

// Fetch cart from Supabase and save to localStorage
async function syncCartFromDatabase() {
    const user = getCurrentUser();
    if (!user) return;

    try {
        // Get local cart first
        let localCart = JSON.parse(localStorage.getItem('andham_cart') || '[]');

        // Fetch from database
        const { data: cartItems, error } = await supabaseClient
            .from('cart')
            .select('*')
            .eq('user_id', user.user_id);

        if (error) {
            console.error('Error fetching cart:', error);
            updateCartUI();
            return;
        }

        // Create a map of local items for quick lookup
        const localMap = new Map();
        localCart.forEach(item => {
            const id = item.product_id || item.id;
            localMap.set(id, item);
        });

        // Merge database items with local items (newer wins)
        if (cartItems && cartItems.length > 0) {
            for (const item of cartItems) {
                const localItem = localMap.get(item.product_id);
                const dbTime = new Date(item.updated_at || 0);
                const localTime = localItem ? new Date(localItem.added_at || localItem.updated_at || 0) : 0;

                // If database is newer or local doesn't have it, use database version
                if (!localItem || dbTime > localTime) {
                    const { data: product } = await supabaseClient
                        .from('products')
                        .select('product_id, title, price, image, category')
                        .eq('product_id', item.product_id)
                        .single();

                    if (product) {
                        localMap.set(item.product_id, {
                            id: item.product_id,
                            product_id: item.product_id,
                            title: product.title,
                            price: product.price,
                            image: product.image,
                            category: product.category,
                            quantity: item.quantity,
                            updated_at: item.updated_at
                        });
                    }
                }
            }
        }

        // Convert map back to array
        const mergedCart = Array.from(localMap.values());

        // Save merged cart
        localStorage.setItem('andham_cart', JSON.stringify(mergedCart));
        cart = mergedCart;

        // Sync back to database if local had newer items
        for (const item of mergedCart) {
            const dbItem = cartItems?.find(ci => ci.product_id === (item.product_id || item.id));
            const localTime = new Date(item.added_at || item.updated_at || 0);
            const dbTime = dbItem ? new Date(dbItem.updated_at || 0) : 0;

            // If local is newer, update database
            if (!dbItem || localTime > dbTime) {
                await supabaseClient
                    .from('cart')
                    .upsert({
                        user_id: user.user_id,
                        product_id: item.product_id || item.id,
                        quantity: item.quantity,
                        updated_at: new Date().toISOString()
                    }, {
                        onConflict: 'user_id,product_id'
                    });
            }
        }

        updateCartUI();
        updateCartBadge();
        console.log('Cart synced:', mergedCart);

    } catch (err) {
        console.error('Failed to sync cart:', err);
        updateCartUI();
    }
}


function displaySearchResults(products) {

    const container = document.getElementById("search-results-list");

    if (!container) return;

    if (!products || products.length === 0) {
        container.innerHTML = "<p style='padding:10px;color:#999;'>No products found</p>";
        return;
    }

    container.innerHTML = products.map(p => `
        <div onclick="window.location.href='product.html?id=${p.product_id}'"
            style="display:flex;gap:12px;padding:12px;border-bottom:1px solid #eee;cursor:pointer;align-items:center;">

            <img src="${p.image}"
                style="width:50px;height:70px;object-fit:cover;border-radius:4px;">

            <div>
                <div style="font-size:11px;color:#999;font-family:monospace;">
                    ${p.product_id}
                </div>

                <div style="font-size:14px;font-weight:500;">
                    ${p.title}
                </div>

                <div style="color:#8b0000;font-weight:600;">
                    Rs. ${p.price}
                </div>
            </div>

        </div>
    `).join("");
}