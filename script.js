// let cart = JSON.parse(localStorage.getItem('andham_cart')) || [];
let currentProduct = null;
let detailQuantity = 1;

// Available filters
const availableFilters = ["Kanchipattu", "Gadwal", "Banaras", "Fancy"];

// Filter descriptions
const filterDescriptions = {
    "Kanchipattu": "Beautiful Kanchipattu silk sarees known for rich zari and traditional weaving.",
    "Gadwal": "Classic Gadwal sarees famous for lightweight silk and contrasting borders.",
    "Banaras": "Elegant Banaras silk sarees with intricate zari weaving and royal patterns.",
    "Fancy": "Modern designer sarees perfect for parties and special occasions."
};

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
        filteredProducts = products.filter(p => p.category?.toLowerCase() === filter.toLowerCase());
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
        .eq("available_for_customer", true)
        .order('created_at', { ascending: false })
        .single();

    if (error || !data) {
        console.error(error);
        window.location.href = "collection.html";
        return;
    }

    // data is a single product object (from .single()) — map it to window.currentProduct
    window.currentProduct = {
        id: data.product_id,
        product_id: data.product_id,
        title: data.title,
        price: data.price,
        originalPrice: data.original_price,
        category: data.category,
        image: data.image,
        images: data.images ? data.images.split(',') : [],
        description: data.description,
        bullets: data.bullets ? data.bullets.split('|') : [],
        stock: data.stock,
        created_at: data.created_at
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
        const opacity = isOutOfStock ? 'opacity:0.6; pointer-events:none;' : '';

        return `
<div class="product-card ${isOutOfStock ? 'out' : ''}">

    <div class="product-image-wrapper">

        ${!isOutOfStock ? `
        <a href="product.html?id=${encodeURIComponent(p.id)}" class="product-link">
        ` : ''}

            <img src="${p.image}" class="product-img" alt="${p.title}">

        ${!isOutOfStock ? `</a>` : ''}

        ${isOutOfStock ? `
        <div class="stock-overlay">
            Out of Stock
        </div>
        ` : ''}

    </div>

    <div class="product-info">

        <h3 class="product-title">${p.title}</h3>

        <div class="product-price-row">

            <span class="price-current">
                Rs. ${p.price.toLocaleString()}
            </span>

            ${isOutOfStock ? '' : `
            <button class="add-cart-btn" onclick="addToCart('${p.id}')">
                +
            </button>
            `}

        </div>

    </div>

</div>
`;

    }).join('');
}
//Render New Arrivals
function renderNewArrivals() {

    const grid = document.getElementById('newArrivalsGrid');
    if (!grid || typeof products === 'undefined') return;

    const today = new Date();
    const fifteenDaysAgo = new Date();
    fifteenDaysAgo.setDate(today.getDate() - 15);

    const newProducts = products.filter(p => {
        const created = new Date(p.created_at);
        return created >= fifteenDaysAgo;
    });

    if (newProducts.length === 0) {
        grid.innerHTML = `<div style="text-align:center;color:#999;">No new arrivals</div>`;
        return;
    }

    grid.innerHTML = newProducts.map(p => {

        const isOutOfStock = p.stock === "out";
        const opacity = isOutOfStock ? 'opacity:0.6; pointer-events:none;' : '';

        return `
        <div class="product-card" style="background:white; ${opacity}">

            ${isOutOfStock ? '' : `
            <a href="product.html?id=${encodeURIComponent(p.id)}" style="text-decoration:none;color:inherit;">
            `}

                <div style="position:relative; overflow:hidden;">

                    ${isOutOfStock ? `
                    <div style="position:absolute; inset:0; background:rgba(0,0,0,0.6); display:flex; align-items:center; justify-content:center; z-index:10;">
                        <span style="color:white; font-size:14px; text-transform:uppercase; letter-spacing:2px; font-weight:600;">
                            Out of Stock
                        </span>
                    </div>
                    ` : ''}

                    <img src="${p.image}" 
                         style="width:100%; aspect-ratio:3/4; object-fit:cover;" 
                         alt="${p.title}">

                </div>

            ${isOutOfStock ? '' : `</a>`}

            <div style="padding:20px;">

                <h3 style="font-family:var(--font-serif);font-size:16px;margin:10px 0;">
                    ${p.title}
                </h3>

                <div style="display:flex; justify-content:space-between; align-items:center;">

                    <span style="color:${isOutOfStock ? '#999' : '#8b0000'};">
                        Rs. ${p.price.toLocaleString()}.00
                    </span>

                    ${isOutOfStock ? '' : `
                    <button onclick="addToCart('${p.id}')" 
                        style="width:28px;height:28px;border:1px solid #ddd;background:#fff;border-radius:50%;font-size:18px;cursor:pointer;display:flex;align-items:center;justify-content:center;">
                        +
                    </button>
                    `}

                </div>

            </div>

        </div>
        `;

    }).join('');
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

async function addToCartFromDetail() {
    
    const qtyEl = document.getElementById('detailQty');
    const requestedQty = parseInt(qtyEl?.textContent) || 1;
    const product = window.currentProduct;

    if (!product) {
        console.error("DEBUG: window.currentProduct is NULL. Rendering failed.");
        showToast("Product data not loaded", "error");
        return;
    }

    const productId = product.id || product.product_id;

    // Fetch latest stock quantity from Supabase
    const { data, error } = await supabaseClient
        .from('products')
        .select('quantity, stock')
        .eq('product_id', productId)
        .single();

    if (error || !data) {
        console.error("DEBUG: Supabase Fetch Error:", error);
        showToast("Could not verify stock", "error");
        return;
    }


    let cart = JSON.parse(localStorage.getItem('andham_cart') || '[]');
    const existing = cart.find(item => item.id === productId || item.product_id === productId);
    const inCart = existing ? existing.quantity : 0;

    // Validation Logic
    if (!data.stock || data.quantity <= 0) {
        console.warn("DEBUG: Validation Failed - Out of Stock flag or 0 qty.");
        showToast("Sorry, this item is out of stock", "warning");
        return;
    }

    if ((inCart + requestedQty) > data.quantity) {
        console.warn(`DEBUG: Validation Failed - Exceeds Stock. In Cart: ${inCart}, Requested: ${requestedQty}, Max: ${data.quantity}`);
        showToast(`Only ${data.quantity} units available. You have ${inCart} in cart.`, "warning");
        toggleCart(); // Open cart to show current quantity
        return;
    }

    // Update Local Cart
    if (existing) {
        existing.quantity += requestedQty;
    } else {
        cart.push({
            product_id: productId,
            id: productId,
            title: product.title,
            price: product.price,
            image: product.image,
            category: product.category,
            quantity: requestedQty
        });
    }

    localStorage.setItem('andham_cart', JSON.stringify(cart));
    
    updateCartUI();
    updateCartBadge();
    showToast(`Added ${requestedQty} item(s) to cart`, "success");
    
    toggleCart(); 
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

// Updated in script.js
async function updateCartItemQty(id, change) {
    let cart = JSON.parse(localStorage.getItem('andham_cart') || '[]');
    const itemIndex = cart.findIndex(i => i.id === id || i.product_id === id);

    if (itemIndex >= 0) {
        const newQty = cart[itemIndex].quantity + change;

        if (newQty <= 0) {
            removeFromCart(id);
            return;
        }

        // If increasing, check stock
        if (change > 0) {
            const { data: product } = await supabaseClient
                .from('products')
                .select('quantity')
                .eq('product_id', id)
                .single();

            if (product && newQty > product.quantity) {
                showToast(`Limit reached: Only ${product.quantity} items in stock`, 'warning');
                return;
            }
        }

        cart[itemIndex].quantity = newQty;
        localStorage.setItem('andham_cart', JSON.stringify(cart));
        updateCartUI();
        updateCartBadge();

        // Sync to database
        const user = getCurrentUser();
        if (user) {
            await saveCartToDatabase(id, newQty);
        }
    }
}
async function removeFromCart(id) {
    // 1. Update Local Storage immediately for UI responsiveness
    let cart = JSON.parse(localStorage.getItem('andham_cart') || '[]');
    // Filter out by both possible ID keys to be safe
    cart = cart.filter(i => i.id !== id && i.product_id !== id);
    localStorage.setItem('andham_cart', JSON.stringify(cart));
    
    // 2. Refresh the UI
    if (typeof updateCartUI === 'function') updateCartUI();
    if (typeof updateCartBadge === 'function') updateCartBadge();

    // 3. Sync with Supabase
    const user = getCurrentUser();
    if (user && user.user_id) {
        try {
            
            const { error, status } = await supabaseClient
                .from('cart')
                .delete()
                .eq('user_id', user.user_id)
                .eq('product_id', id);

            if (error) throw error;
        
        } catch (err) {
            console.error('Failed to remove from database cart:', err);
            // Optional: notify user that database sync failed
        }
    }
}

function updateCartUI() {
    const badge = document.getElementById('cartBadge');
    const itemsContainer = document.getElementById('cartItems');
    const totalEl = document.getElementById('cartTotal');

    // Get cart from localStorage
    const cart = JSON.parse(localStorage.getItem('andham_cart') || '[]');

    // Update badge count if element exists (don't exit early — items must still render)
    const totalQty = cart.reduce((sum, item) => sum + (parseInt(item.quantity) || 0), 0);
    if (badge) {
        badge.textContent = totalQty;
        badge.style.display = totalQty > 0 ? 'flex' : 'none';
    }

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
                <img src="${item.image || 'https://png.pngtree.com/png-vector/20190820/ourmid/pngtree-no-image-vector-illustration-isolated-png-image_1694547.jpg'}" 
                     class="cart-item-image" 
                     style="width: 80px; height: 100px; object-fit: cover;" 
                     alt="${item.title || 'Product'}"
                     onerror="this.src='https://png.pngtree.com/png-vector/20190820/ourmid/pngtree-no-image-vector-illustration-isolated-png-image_1694547.jpg'">
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
                        <span class="remove-icon" onclick="removeFromCart('${item.product_id}')" style="cursor:pointer;">
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="#ff4d4d" viewBox="0 0 24 24">
    <path d="M9 3V4H4V6H5V20C5 21.1 5.9 22 7 22H17C18.1 22 19 21.1 19 20V6H20V4H15V3H9ZM7 6H17V20H7V6ZM9 8V18H11V8H9ZM13 8V18H15V8H13Z"/>
  </svg>
</span>
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

// function quickSearch(term) {
//     const searchInput = document.getElementById('searchInput');
//     searchInput.value = term;
//     // Manually trigger the search function
//     handleSearch({ target: { value: term } });
// }
function quickSearch(term) {
    window.location.href = `collection.html?filter=${encodeURIComponent(term)}`;
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

function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    if (!toast) return;

    toast.textContent = message;
    toast.style.display = 'block'; // Ensure it's visible
    toast.className = 'toast show'; 

    // Set colors based on type
    if (type === 'warning') toast.style.backgroundColor = '#ff9800'; 
    else if (type === 'success') toast.style.backgroundColor = '#16a34a'; 
    else if (type === 'error') toast.style.backgroundColor = '#dc2626'; 
    else toast.style.backgroundColor = '#1a1a1a';

    toast.style.zIndex = "10001"; // Stay above drawers

    clearTimeout(window.toastTimeout);
    window.toastTimeout = setTimeout(() => {
        toast.classList.remove('show');
        // Wait for the CSS fade-out before hiding display
        setTimeout(() => { toast.style.display = 'none'; }, 300); 
    }, 3000);
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

        const isOutOfStock = p.stock === "out";
        const opacity = isOutOfStock ? "opacity:0.6; pointer-events:none;" : "";

        return `
        <div class="product-card" style="background:white; transition:transform 0.3s; ${opacity}">

            ${isOutOfStock ? '' : `<a href="product.html?id=${encodeURIComponent(p.id)}" style="text-decoration:none;color:inherit;">`}

            <div style="position:relative; overflow:hidden;">

                <!-- Out of Stock Overlay -->
                ${isOutOfStock ? `
                <div style="position:absolute; inset:0; background:rgba(0,0,0,0.6); display:flex; align-items:center; justify-content:center; z-index:10;">
                    <span style="color:white; font-size:14px; text-transform:uppercase; letter-spacing:2px; font-weight:600;">
                        Out of Stock
                    </span>
                </div>
                ` : ''}

                <img src="${p.image}"
                     style="width:100%; aspect-ratio:3/4; object-fit:cover; transition:transform 0.6s;"
                     alt="${p.title}"
                     onmouseover="this.style.transform='scale(1.05)'"
                     onmouseout="this.style.transform='scale(1)'">

            </div>

            ${isOutOfStock ? '' : `</a>`}

            <div style="padding:20px;">
                <h3 style="font-family:var(--font-serif); font-size:16px; margin:10px 0;">
                    ${p.title}
                </h3>

<div style="display:flex; justify-content:space-between; align-items:center;">

    <span style="color:${isOutOfStock ? '#999' : '#8b0000'};">
        Rs. ${p.price.toLocaleString()}.00
    </span>

    ${isOutOfStock ? '' : `
    <button onclick="addToCart('${p.id}')" 
        style="width:28px;height:28px;border:1px solid #ddd;background:#fff;border-radius:50%;font-size:18px;cursor:pointer;display:flex;align-items:center;justify-content:center;">
        +
    </button>
    `}

</div>

            </div>

        </div>
        `;

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
    const userStr = localStorage.getItem('andham_user') || sessionStorage.getItem('andham_user');
    if (!userStr) return null;
    
    try {
        const user = JSON.parse(userStr);
        // Ensure we return null if the object exists but has no usable ID
        if (!user.user_id && !user.id) return null; 
        return user;
    } catch (e) {
        return null;
    }
}

// Add to cart (database + localStorage backup)
async function addToCart(productId, quantity = 1) {
    const user = getCurrentUser();

    // 1. Fetch latest stock quantity directly from DB
    const { data: product, error: productError } = await supabaseClient
        .from('products')
        .select('product_id, title, price, image, category, quantity, stock')
        .eq('product_id', productId)
        .single();

    if (productError || !product) {
        showToast('Product not found', 'error');
        return false;
    }

    // 2. Check if item is out of stock
    if (!product.stock || product.quantity <= 0) {
        showToast('Sorry, this item is out of stock', 'warning');
        return false;
    }

    // 3. Check cumulative quantity (In Cart + New Request)
    let cart = JSON.parse(localStorage.getItem('andham_cart') || '[]');
    const existingIndex = cart.findIndex(item => item.id === productId || item.product_id === productId);
    const currentInCart = existingIndex >= 0 ? cart[existingIndex].quantity : 0;
    const totalRequested = currentInCart + quantity;

    if (totalRequested > product.quantity) {
        showToast(`Only ${product.quantity} units available. You already have ${currentInCart} in cart.`, 'warning');
        return false;
    }

    // 4. Update localStorage
    if (existingIndex >= 0) {
        cart[existingIndex].quantity = totalRequested;
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
    updateCartUI();
    updateCartBadge();

    // 5. Sync to Database if logged in
    if (user) {
        supabaseClient.from('cart').upsert({
            user_id: user.user_id,
            product_id: productId,
            quantity: totalRequested,
            updated_at: new Date().toISOString()
        }, { onConflict: 'user_id,product_id' }).catch(err => console.error(err));
    }

    showToast('Added to cart!', 'success');
    toggleCart();
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

// Update quantity
async function updateCartQuantity(productId, quantity) {
if (quantity < 1) {
        removeFromCart(productId);
        return;
    }

    // 1. Double check stock before updating
    const { data: product } = await supabaseClient
        .from('products')
        .select('quantity')
        .eq('product_id', productId)
        .single();

    if (product && quantity > product.quantity) {
        showToast(`Sorry, only ${product.quantity} units left in stock.`, 'warning');
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
        const product = item.product || {};
        const availableStock = product.quantity || 0; // Get available stock from DB
        const itemTotal = (product.price || 0) * item.quantity;
        total += itemTotal;

        // Validation for the "+" button
        const isAtMax = item.quantity >= availableStock;

        return `
            <div class="cart-item">
                <img src="${product.image}" class="cart-item-image" alt="${product.title}">
                <div class="cart-item-details">
                    <div class="cart-item-title">${product.title}</div>
                    <div class="cart-item-price">Rs. ${(product.price || 0).toLocaleString()}</div>
                    <div class="qty-selector">
                        <button class="qty-btn" onclick="updateCartQuantity('${item.product_id}', ${item.quantity - 1})">−</button>
                        <span class="qty-value">${item.quantity}</span>
                        <button class="qty-btn" 
                                onclick="${isAtMax ? `showToast('Only ${availableStock} units available', 'warning')` : `updateCartQuantity('${item.product_id}', ${item.quantity + 1})`}"
                                style="${isAtMax ? 'opacity: 0.5; cursor: not-allowed;' : ''}">+</button>
                    </div>
                    <span class="remove-icon" onclick="removeFromCart('${item.product_id}')" style="cursor:pointer;">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="#ff4d4d" viewBox="0 0 24 24">
                            <path d="M9 3V4H4V6H5V20C5 21.1 5.9 22 7 22H17C18.1 22 19 21.1 19 20V6H20V4H15V3H9ZM7 6H17V20H7V6ZM9 8V18H11V8H9ZM13 8V18H15V8H13Z"/>
                        </svg>
                    </span>
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

    const user = localStorage.getItem('andham_user') || sessionStorage.getItem('andham_user');

    if (user) {
        window.location.href = "account.html";
    } else {
        window.location.href = "login.html?redirect=account.html";
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

// Fetch cart from Supabase and merge with local cart (race-safe)
async function syncCartFromDatabase() {
    const user = getCurrentUser();
    if (!user) return;

    try {
        // Step 1: Fetch DB cart FIRST before reading localStorage.
        // This avoids the race where addToCart() saves to localStorage
        // DURING our awaits, and we then overwrite it with a stale snapshot.
        const { data: cartItems, error } = await supabaseClient
            .from('cart')
            .select('*')
            .eq('user_id', user.user_id);

        if (error) {
            console.error('Error fetching cart:', error);
            updateCartUI();
            updateCartBadge();
            return;
        }

        // Step 2: If DB cart is empty, nothing to merge — keep local cart as-is.
        // This is the safe path for brand-new users or cleared carts.
        if (!cartItems || cartItems.length === 0) {
            updateCartUI();
            updateCartBadge();
            return;
        }

        // Step 3: Re-read localStorage AFTER the DB await to get the freshest local state.
        const localCart = JSON.parse(localStorage.getItem('andham_cart') || '[]');
        const localMap = new Map();
        localCart.forEach(item => {
            const id = item.product_id || item.id;
            localMap.set(id, item);
        });

        // Step 4: Add DB items that are missing from local cart (never delete local items).
        for (const item of cartItems) {
            if (!localMap.has(item.product_id)) {
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

        // Step 5: Save merged cart.
        const mergedCart = Array.from(localMap.values());
        localStorage.setItem('andham_cart', JSON.stringify(mergedCart));

        updateCartUI();
        updateCartBadge();
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

                <div style="color:#8b0000;">
                    Rs. ${p.price}
                </div>
            </div>

        </div>
    `).join("");
}

async function loadSimilarProducts() {

    const product = window.currentProduct;
    if (!product) return;

    const { data, error } = await supabaseClient
        .from("products")
        .select("*")
        .eq("category", product.category)
        .neq("product_id", product.id)
        .limit(6);

    if (error) {
        console.error(error);
        return;
    }

    const grid = document.getElementById("similarProductsGrid");

    if (!data || data.length === 0) {
        grid.innerHTML = `<p style="text-align:center; color:#888;">No similar products found.</p>`;
        return;
    }

    grid.innerHTML = data.map(p => {

        const isOutOfStock = p.stock === 'out';

        return `
        <div class="product-card ${isOutOfStock ? 'out' : ''}">

            <div class="product-image-wrapper">

                ${!isOutOfStock ? `
                <a href="product.html?id=${encodeURIComponent(p.product_id)}">
                ` : ''}

                    <img src="${p.image}" class="product-img" alt="${p.title}">

                ${!isOutOfStock ? `</a>` : ''}

                ${isOutOfStock ? `
                <div class="stock-overlay">
                    Out of Stock
                </div>
                ` : ''}

            </div>

            <div class="product-info">

                <h3 class="product-title">${p.title}</h3>

                <div class="product-price-row">

                    <span class="price-current">
                        Rs. ${p.price.toLocaleString()}
                    </span>

                    ${isOutOfStock ? '' : `
                    <button class="add-cart-btn" onclick="addToCart('${p.product_id}')">
                        +
                    </button>
                    `}

                </div>

            </div>

        </div>
        `;

    }).join("");
}

function goToImage(index){

    const slider = document.getElementById('imageSlider');
    const width = slider.clientWidth;

    slider.scrollTo({
        left: width * index,
        behavior: "smooth"
    });

    document.querySelectorAll('.thumbnail-wrapper').forEach(el=>{
        el.classList.remove("active");
    });

    document.querySelectorAll('.thumbnail-wrapper')[index].classList.add("active");
}

// Add this helper to script.js to handle the return from Google
async function initGoogleSession() {
    // 1. Get the session from Supabase after the redirect back
    const { data: { session } } = await supabaseClient.auth.getSession();

    if (session && session.user) {
        // 2. Check if local storage is already set to avoid loops
        if (!localStorage.getItem('andham_user')) {
            const gUser = session.user;
            
            // 3. Try to fetch additional profile info from your custom users table
            const { data: profile } = await supabaseClient
                .from('users')
                .select('*')
                .eq('email', gUser.email)
                .maybeSingle();

            // 4. Create the standard andham_user object your code expects
            const userData = {
                user_id: profile ? profile.user_id : gUser.id,
                user_name: profile ? profile.user_name : gUser.user_metadata.full_name,
                email: gUser.email,
                phone: profile ? profile.phone : null,
                address: profile ? profile.address : null,
                city: profile ? profile.city : null,
                login_at: new Date().toISOString()
            };

            // 5. SET LOCAL STORAGE - Now your other code will work
            localStorage.setItem('andham_user', JSON.stringify(userData));

            // 6. Refresh UI
            await syncCartFromDatabase();
            updateHeaderAccount();
            showToast(`Welcome, ${userData.user_name}!`, 'success');
        }
    }
}

// Ensure this runs on every page load
document.addEventListener('DOMContentLoaded', initGoogleSession);
// Add this to script.js
async function handleGoogleRedirectSession() {
    // 1. Get the current session from Supabase
    const { data: { session }, error } = await supabaseClient.auth.getSession();

    if (session && session.user) {
        // 2. Check if we already have the local storage set to prevent redundant DB calls
        if (localStorage.getItem('andham_user')) return;

        const gUser = session.user;
        console.log("Processing Google login for:", gUser.email);

        try {
            // 3. Fetch the full profile from your 'users' table using the Google email
            const { data: profile, error: profileError } = await supabaseClient
                .from('users')
                .select('*')
                .eq('email', gUser.email)
                .maybeSingle();

            let userData;

            if (profile) {
                // 4. Set localStorage with full database details
                userData = {
                    user_id:           profile.user_id,
                    user_name:         profile.user_name,
                    email:             profile.email,
                    phone:             profile.phone,
                    address:           profile.address || null,
                    secondary_address: profile.secondary_address || null,
                    city:              profile.city || null,
                    state:             profile.state || null,
                    pincode:           profile.pincode || null,
                    country:           profile.country || 'India',
                    login_at:          new Date().toISOString()
                };
            } else {
                // Fallback if the user exists in Auth but not yet in your custom 'users' table
                userData = {
                    user_id:   gUser.id,
                    user_name: gUser.user_metadata.full_name || 'User',
                    email:     gUser.email,
                    login_at:  new Date().toISOString()
                };
            }

            // 5. SET THE STORAGE - Required for your other code to function
            localStorage.setItem('andham_user', JSON.stringify(userData));
            
            // 6. Refresh UI elements
            await syncCartFromDatabase();
            updateHeaderAccount();
            showToast(`Welcome, ${userData.user_name}!`, 'success');

        } catch (err) {
            console.error("Error syncing Google profile:", err);
        }
    }
}

// Ensure this runs when any page finishes loading
document.addEventListener('DOMContentLoaded', () => {
    handleGoogleRedirectSession();
});