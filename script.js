
const savedProducts = localStorage.getItem('andham_products_data');


const products = savedProducts ? JSON.parse(savedProducts) : [
    {
        id: "ADM00001",
        title: "Premium Tissue Linen Sarees with heavy blouse - Peach",
        price: 3550,
        category: "Plains",
        collection: "Tissue Linen",
        image: "https://rudhvivastraa.vercel.app/pic1.jpg",
        images: ["https://rudhvivastraa.vercel.app/pic1.jpg", "https://rudhvivastraa.vercel.app/pic3.webp"],
        description: "<em>A timeless blend of elegance and ease</em> — these Soft Tissue Linen Sarees are minimal, refined, and perfect for effortless summer dressing.",
        bullets: [
            "Crafted from premium soft tissue linen — feather-light, breathable, and luxe to the touch",
            "Paired with a running blouse that features a fully embroidered pattern, adding a grand and luxurious finish",
            "Features a statement pallu, hand-embroidered with intricate French knots for a touch of artistry",
            "The body is tastefully scattered with delicate French knot motifs, adding quiet sophistication",
            "The last slide of the images showcases the blouse design for your reference"
        ]
    },
    {
        id: "ADM00002",
        title: "Premium Tissue Linen Sarees with heavy blouse - Pink",
        price: 3550,
        category: "Plains",
        collection: "Tissue Linen",
        image: "https://rudhvivastraa.vercel.app/casual.jpg",
        images: ["https://rudhvivastraa.vercel.app/casual.jpg", "https://rudhvivastraa.vercel.app/traditional.jpg"],
        description: "Handcrafted with precision, this elegant pink tissue linen saree features intricate embroidery and a luxurious blouse piece.",
        bullets: [
            "Premium tissue linen fabric with natural sheen",
            "Heavy embroidered blouse piece included",
            "Perfect for festive occasions and formal gatherings"
        ]
    },
    {
        id: "ADM00003",
        title: "Pure Kanjeevaram Silk Saree - Temple Border",
        price: 12500,
        originalPrice: 15000,
        category: "Pure Kanchipattu",
        collection: "Kanjeevaram",
        image: "https://rudhvivastraa.vercel.app/designer.jpg",
        images: ["https://rudhvivastraa.vercel.app/designer.jpg", "https://rudhvivastraa.vercel.app/pic3.webp"],
        description: "Authentic Kanjeevaram silk with traditional temple border design. A timeless piece for your special occasions.",
        bullets: [
            "Pure mulberry silk with zari work",
            "Traditional temple border design",
            "Comes with matching blouse piece"
        ]
    },
    {
        id: "ADM00004",
        title: "Semi Kanjeevaram Silk Saree - Floral Design",
        price: 6800,
        category: "Semi Kanchipattu",
        collection: "Kanjeevaram",
        image: "https://rudhvivastraa.vercel.app/traditional.jpg",
        images: ["https://rudhvivastraa.vercel.app/traditional.jpg", "https://rudhvivastraa.vercel.app/pic3.webp"],
        description: "Beautiful semi-Kanjeevaram silk saree with intricate floral designs. Perfect blend of tradition and affordability.",
        bullets: [
            "Semi-silk blend with rich texture",
            "Intricate floral zari work",
            "Lightweight and easy to drape"
        ]
    },
    {
        id: "ADM00005",
        title: "Pure Gadwal Silk Saree - Temple Border",
        price: 9800,
        originalPrice: 12000,
        category: "Pure Gadwal",
        collection: "Gadwal",
        image: "https://images.unsplash.com/photo-1610030469983-98e360a7e6e8?w=800",
        images: ["https://images.unsplash.com/photo-1610030469983-98e360a7e6e8?w=800", "https://rudhvivastraa.vercel.app/pic3.webp"],
        description: "Authentic Pure Gadwal silk saree with signature temple border and rich pallu. A masterpiece of Telugu weaving tradition.",
        bullets: [
            "Pure silk body with contrasting border",
            "Signature Gadwal temple border design",
            "Rich zari work on pallu",
            "Lightweight kuttu weaving technique"
        ]
    },
    {
        id: "ADM00006",
        title: "Semi Gadwal Cotton Silk Saree - Checks Pattern",
        price: 4200,
        category: "Semi Gadwal",
        collection: "Gadwal",
        image: "https://images.unsplash.com/photo-1606103920295-9a091573f160?w=800",
        images: ["https://images.unsplash.com/photo-1606103920295-9a091573f160?w=800", "https://rudhvivastraa.vercel.app/casual.jpg"],
        description: "Elegant Semi Gadwal saree combining cotton comfort with silk-like sheen. Features classic checks pattern.",
        bullets: [
            "Cotton-silk blend for comfort",
            "Classic checks pattern with zari border",
            "Affordable luxury for daily wear",
            "Easy maintenance fabric"
        ]
    },
    {
        id: "ADM00007",
        title: "Pure Kanchipattu Bridal Saree - Heavy Zari",
        price: 18500,
        originalPrice: 22000,
        category: "Pure Kanchipattu",
        collection: "Kanjeevaram",
        image: "https://images.unsplash.com/photo-1583391733952-9350aacc9efe?w=800",
        images: ["https://images.unsplash.com/photo-1583391733952-9350aacc9efe?w=800", "https://rudhvivastraa.vercel.app/designer.jpg"],
        description: "Magnificent bridal pure Kanchipattu saree with heavy gold zari work. Perfect for weddings and grand celebrations.",
        bullets: [
            "Pure mulberry silk with heavy gold zari",
            "Traditional peacock and floral motifs",
            "Rich contrast pallu with intricate designs",
            "Bridal collection masterpiece"
        ]
    },
    {
        id: "ADM00008",
        title: "Semi Kanchipattu Saree - Modern Design",
        price: 5500,
        category: "Semi Kanchipattu",
        collection: "Kanjeevaram",
        image: "https://images.unsplash.com/photo-1596816692476-40d6a437b612?w=800",
        images: ["https://images.unsplash.com/photo-1596816692476-40d6a437b612?w=800", "https://rudhvivastraa.vercel.app/traditional.jpg"],
        description: "Contemporary semi-Kanchipattu saree with modern designs. Perfect for office wear and casual occasions.",
        bullets: [
            "Art silk blend with contemporary designs",
            "Lightweight and comfortable",
            "Modern color combinations",
            "Value for money choice"
        ]
    },
    {
        id: "ADM00009",
        title: "Plain Cotton Saree - Daily Wear",
        price: 1200,
        category: "Plains",
        collection: "Cotton",
        image: "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=800",
        images: ["https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=800", "https://rudhvivastraa.vercel.app/pic1.jpg"],
        description: "Simple and elegant plain cotton saree for everyday comfort. Breathable fabric perfect for summer.",
        bullets: [
            "100% pure cotton fabric",
            "Soft and breathable material",
            "Easy to wash and maintain",
            "Perfect for daily wear"
        ]
    },
    {
        id: "ADM00010",
        title: "Plain Linen Saree - Office Wear",
        price: 2800,
        category: "Plains",
        collection: "Linen",
        image: "https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?w=800",
        images: ["https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?w=800", "https://rudhvivastraa.vercel.app/casual.jpg"],
        description: "Sophisticated plain linen saree with subtle texture. Ideal for professional and formal settings.",
        bullets: [
            "Premium linen fabric with natural texture",
            "Wrinkle-resistant finish",
            "Elegant drape for office wear",
            "Minimalist sophisticated look"
        ]
    },
    {
        id: "ADM00011",
        title: "Pure Gadwal Silk - Peacock Border",
        price: 11500,
        category: "Pure Gadwal",
        collection: "Gadwal",
        image: "https://images.unsplash.com/photo-1618941716939-553df3c6c278?w=800",
        images: ["https://images.unsplash.com/photo-1618941716939-553df3c6c278?w=800", "https://rudhvivastraa.vercel.app/designer.jpg"],
        description: "Exquisite Pure Gadwal saree featuring signature peacock border motif. A treasure for your wardrobe.",
        bullets: [
            "Authentic Gadwal weaving technique",
            "Peacock motif border in rich zari",
            "Pure silk with cotton border",
            "GI certified product"
        ]
    },
    {
        id: "ADM00012",
        title: "Semi Gadwal Saree - Striped Pattern",
        price: 3600,
        category: "Semi Gadwal",
        collection: "Gadwal",
        image: "https://images.unsplash.com/photo-1594633313593-bab3825d0caf?w=800",
        images: ["https://images.unsplash.com/photo-1594633313593-bab3825d0caf?w=800", "https://rudhvivastraa.vercel.app/traditional.jpg"],
        description: "Stylish semi-Gadwal saree with contemporary striped pattern. Perfect blend of tradition and trend.",
        bullets: [
            "Art silk with cotton blend",
            "Modern striped pattern",
            "Lightweight and easy to carry",
            "Versatile for multiple occasions"
        ]
    }
];
console.log('Products loaded:', products);
// Make products available globally
window.products = products;

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
function findProductById(id) {
    return products.find(p => p.id === id || p.id === String(id));
}

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
    
    renderProducts(filteredProducts);
}

// Product Page Initialization
function initProductPage() {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');
    
    if (!productId) {
        window.location.href = 'collection.html';
        return;
    }
    
    currentProduct = findProductById(productId);
    if (!currentProduct) {
        window.location.href = 'collection.html';
        return;
    }
    
    // Check if out of stock
    const isOutOfStock = currentProduct.stock === 'out';
    
    // Update page content
    document.title = `${currentProduct.title} - Andham`;
    
    // Show out of stock badge
    const stockBadge = document.getElementById('stockBadge');
    if (stockBadge) {
        stockBadge.style.display = isOutOfStock ? 'inline-block' : 'none';
    }
    
    // Rest of initialization...
    
    // Disable buttons if out of stock
    const addToCartBtn = document.querySelector('.btn-primary');
    const buyNowBtn = document.querySelector('.btn-secondary');
    
    if (isOutOfStock) {
        if (addToCartBtn) {
            addToCartBtn.disabled = true;
            addToCartBtn.textContent = 'Out of Stock';
            addToCartBtn.style.opacity = '0.5';
            addToCartBtn.style.cursor = 'not-allowed';
            addToCartBtn.onclick = null; // Remove click handler
        }
        if (buyNowBtn) {
            buyNowBtn.disabled = true;
            buyNowBtn.style.opacity = '0.5';
            buyNowBtn.style.cursor = 'not-allowed';
        }
    }
    
    // Continue with rest of init...
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
    detailQuantity += change;
    if (detailQuantity < 1) detailQuantity = 1;
    const detailQty = document.getElementById('detailQty');
    if (detailQty) {
        detailQty.textContent = detailQuantity;
    }
}

function addToCartFromDetail() {
    if (!currentProduct) return;

    const existing = cart.find(item => item.id === currentProduct.id);
    if (existing) {
        existing.quantity += detailQuantity;
    } else {
        cart.push({ ...currentProduct, quantity: detailQuantity });
    }
    
    localStorage.setItem('andham_cart', JSON.stringify(cart));
    updateCartUI();
    showToast('Added to cart');
    toggleCart();
}

// Cart Functions
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
        drawer.classList.add('active');
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

// Cart functions with string ID handling
function updateCartItemQty(id, change) {
    const item = cart.find(i => i.id === id);
    if (item) {
        item.quantity += change;
        if (item.quantity <= 0) {
            cart = cart.filter(i => i.id !== id);
        }
        localStorage.setItem('andham_cart', JSON.stringify(cart));
        updateCartUI();
    }
}

function removeFromCart(id) {
    cart = cart.filter(i => i.id !== id);
    localStorage.setItem('andham_cart', JSON.stringify(cart));
    updateCartUI();
}

function updateCartUI() {
    const badge = document.getElementById('cartBadge');
    const itemsContainer = document.getElementById('cartItems');
    const totalEl = document.getElementById('cartTotal');

    if (!badge) return;

    const totalQty = cart.reduce((sum, item) => sum + item.quantity, 0);
    badge.textContent = totalQty;
    badge.style.display = totalQty > 0 ? 'flex' : 'none';

    if (!itemsContainer) return;

    if (cart.length === 0) {
        itemsContainer.innerHTML = `
            <div class="cart-empty">
                <div style="font-size: 48px; margin-bottom: 20px;">🛍️</div>
                <div style="font-family: var(--font-serif); font-style: italic;">Your cart is empty</div>
            </div>
        `;
    } else {
        itemsContainer.innerHTML = cart.map(item => `
            <div class="cart-item" style="display: flex; gap: 15px; padding: 20px; border-bottom: 1px solid #eee;">
                <img src="${item.image}" class="cart-item-image" style="width: 80px; height: 100px; object-fit: cover;" alt="${item.title}">
                <div class="cart-item-details" style="flex: 1;">
                    <div class="cart-item-category" style="font-size: 10px; color: #8b0000; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 5px;">${item.category}</div>
                    <div class="cart-item-id" style="font-size: 10px; color: #999; font-family: monospace; margin-bottom: 3px;">${item.id}</div>
                    <div class="cart-item-title" style="font-size: 14px; margin-bottom: 5px;">${item.title}</div>
                    <div class="cart-item-price" style="color: #8b0000; font-weight: 600; margin-bottom: 10px;">Rs. ${item.price.toLocaleString()}</div>
                    <div style="display: flex; align-items: center; gap: 15px;">
                        <div class="qty-selector" style="display: flex; align-items: center; border: 1px solid #ddd;">
                            <button class="qty-btn" onclick="updateCartItemQty('${item.id}', -1)" style="width: 30px; height: 30px; border: none; background: #f5f5f5; cursor: pointer;">−</button>
                            <span class="qty-value" style="padding: 0 15px; font-size: 13px;">${item.quantity}</span>
                            <button class="qty-btn" onclick="updateCartItemQty('${item.id}', 1)" style="width: 30px; height: 30px; border: none; background: #f5f5f5; cursor: pointer;">+</button>
                        </div>
                        <button class="remove-btn" onclick="removeFromCart('${item.id}')" style="background: none; border: none; color: #999; text-decoration: underline; cursor: pointer; font-size: 12px;">Remove</button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    if (totalEl) {
        const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
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
function handleSearch(e) {
    if (e.key === 'Enter') {
        const query = e.target.value.trim();
        if (!query) return;
        
        // Check if query looks like an ID (starts with ADM or is all uppercase)
        const isIdSearch = /^ADM\d+$/i.test(query);
        
        if (isIdSearch) {
            const product = findProductById(query.toUpperCase());
            if (product) {
                window.location.href = `product.html?id=${encodeURIComponent(product.id)}`;
            } else {
                window.location.href = `collection.html?id=${encodeURIComponent(query.toUpperCase())}`;
            }
        } else {
            window.location.href = `collection.html?search=${encodeURIComponent(query)}`;
        }
    }
}

function quickSearch(term) {
    // Check if term is an ID
    const isIdSearch = /^ADM\d+$/i.test(term);
    
    if (isIdSearch) {
        const product = findProductById(term.toUpperCase());
        if (product) {
            window.location.href = `product.html?id=${encodeURIComponent(product.id)}`;
        } else {
            window.location.href = `collection.html?id=${encodeURIComponent(term.toUpperCase())}`;
        }
    } else {
        window.location.href = `collection.html?search=${encodeURIComponent(term)}`;
    }
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
    console.log('Home page loaded');
    renderHomeProducts(); // Add this line
}

function loadProductDetail() {
    const params = new URLSearchParams(window.location.search);
    const productId = params.get("id");

    if (!productId) return;

    const product = products.find(p => p.id === productId);
    if (!product) return;

    // Title
    document.getElementById("detailTitle").textContent = product.title;

    // Price
    document.getElementById("detailPrice").textContent =
        `Rs. ${product.price.toLocaleString()}.00`;

    // Original price
    const originalEl = document.getElementById("detailOriginalPrice");
    const badgeEl = document.getElementById("discountBadge");

    if (product.originalPrice) {
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

    // Image
    document.getElementById("mainImage").src = product.image;

    // Product ID
    document.getElementById("productId").textContent = product.id;
}

document.addEventListener("DOMContentLoaded", function () {
    loadProductDetail();
});