// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function () {

    // Cache DOM elements
    const actionBtn = document.getElementById('actionBtn');
    const resetBtn = document.getElementById('resetBtn');
    const output = document.getElementById('output');
    let clickCount = 0;

    // Event listeners (separated from HTML)
    actionBtn.addEventListener('click', handleAction);
    resetBtn.addEventListener('click', handleReset);

    // Handler functions
    function handleAction() {
        clickCount++;
        updateOutput(`Button clicked <strong>${clickCount}</strong> time(s)!`);

        // Dynamic styling via JS
        output.style.borderLeft = '4px solid #007bff';
        output.style.transition = 'all 0.3s ease';
    }

    function handleReset() {
        clickCount = 0;
        updateOutput('Counter reset. Ready to start again.');
        output.style.borderLeft = '4px solid #28a745';
    }

    function updateOutput(message) {
        output.innerHTML = message;
    }

    // Initialization
    updateOutput('Waiting for interaction...');
});

const products = [
    {
        id: 1,
        title: "Premium Tissue Linen Sarees with heavy blouse - Peach",
        price: 3550,
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
        id: 2,
        title: "Premium Tissue Linen Sarees with heavy blouse - Pink",
        price: 3550,
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
        id: 3,
        title: "Pure Kanjeevaram Silk Saree - Temple Border",
        price: 12500,
        originalPrice: 15000,
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
        id: 4,
        title: "Soft Silk Saree with Zari Border - Royal Blue",
        price: 4800,
        collection: "Soft Silk",
        image: "https://rudhvivastraa.vercel.app/traditional.jpg",
        images: ["https://rudhvivastraa.vercel.app/traditional.jpg", "https://rudhvivastraa.vercel.app/pic3.webp"],
        description: "Elegant soft silk saree in rich royal blue with contrasting zari border. Lightweight and comfortable for all-day wear.",
        bullets: [
            "Lightweight soft silk fabric",
            "Contrast zari border work",
            "Easy to drape and maintain"
        ]
    }
];

let cart = [];
let currentProduct = null;
let detailQuantity = 1;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    renderProducts(products);
});

function renderProducts(list) {
    const grid = document.getElementById('productsGrid');
    grid.innerHTML = list.map(p => `
                <div class="product-card" onclick="showProductDetail(${p.id})">
                    <div class="product-image-wrapper">
                        <img src="${p.image}" class="product-img product-img-main">
                        <img src="${p.images[1] || p.image}" class="product-img product-img-hover">
                    </div>
                    <div class="product-info">
                        <h3 class="product-title">${p.title}</h3>
                        <div class="product-price">
                            ${p.originalPrice ? `<span class="price-original">Rs. ${p.originalPrice.toLocaleString()}.00</span>` : ''}
                            <span class="price-current">Rs. ${p.price.toLocaleString()}.00</span>
                        </div>
                    </div>
                </div>
            `).join('');
}

function showProductDetail(id) {
    currentProduct = products.find(p => p.id === id);
    if (!currentProduct) return;

    // Populate detail view
    document.getElementById('mainImage').src = currentProduct.image;
    document.getElementById('detailTitle').textContent = currentProduct.title;
    document.getElementById('detailPrice').textContent = `Rs. ${currentProduct.price.toLocaleString()}.00`;
    document.getElementById('breadcrumbProduct').textContent = currentProduct.title;
    document.getElementById('breadcrumbCollection').textContent = currentProduct.collection;
    document.getElementById('detailDescription').innerHTML = currentProduct.description;

    // Bullets
    document.getElementById('detailBullets').innerHTML = currentProduct.bullets.map(b => `<li>${b}</li>`).join('');

    // Thumbnails
    const thumbs = document.getElementById('thumbnailList');
    thumbs.innerHTML = currentProduct.images.map((img, i) => `
                <img src="${img}" class="thumbnail ${i === 0 ? 'active' : ''}" onclick="changeMainImage('${img}', this)">
            `).join('');

    // Reset quantity
    detailQuantity = 1;
    document.getElementById('detailQty').textContent = detailQuantity;

    // Switch views
    document.getElementById('homeView').classList.remove('active');
    document.getElementById('productView').classList.add('active');
    window.scrollTo(0, 0);
}

function showHome() {
    document.getElementById('productView').classList.remove('active');
    document.getElementById('homeView').classList.add('active');
    window.scrollTo(0, 0);
}

function changeMainImage(src, thumb) {
    document.getElementById('mainImage').src = src;
    document.querySelectorAll('.thumbnail').forEach(t => t.classList.remove('active'));
    thumb.classList.add('active');
}

function updateDetailQty(change) {
    detailQuantity += change;
    if (detailQuantity < 1) detailQuantity = 1;
    document.getElementById('detailQty').textContent = detailQuantity;
}

function addToCartFromDetail() {
    if (!currentProduct) return;

    const existing = cart.find(item => item.id === currentProduct.id);
    if (existing) {
        existing.quantity += detailQuantity;
    } else {
        cart.push({ ...currentProduct, quantity: detailQuantity });
    }

    updateCartUI();
    showToast('Added to cart');
    toggleCart();
}

// Cart Functions
function toggleCart() {
    const drawer = document.getElementById('cartDrawer');
    const overlay = document.getElementById('cartOverlay');
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

function updateCartItemQty(id, change) {
    const item = cart.find(i => i.id === id);
    if (item) {
        item.quantity += change;
        if (item.quantity <= 0) {
            cart = cart.filter(i => i.id !== id);
        }
        updateCartUI();
    }
}

function removeFromCart(id) {
    cart = cart.filter(i => i.id !== id);
    updateCartUI();
}

function updateCartUI() {
    const badge = document.getElementById('cartBadge');
    const itemsContainer = document.getElementById('cartItems');
    const totalEl = document.getElementById('cartTotal');

    const totalQty = cart.reduce((sum, item) => sum + item.quantity, 0);
    badge.textContent = totalQty;
    badge.style.display = totalQty > 0 ? 'flex' : 'none';

    if (cart.length === 0) {
        itemsContainer.innerHTML = `
                    <div class="cart-empty">
                        <div style="font-size: 48px; margin-bottom: 20px;">🛍️</div>
                        <div style="font-family: var(--font-serif); font-style: italic;">Your cart is empty</div>
                    </div>
                `;
    } else {
        itemsContainer.innerHTML = cart.map(item => `
                    <div class="cart-item">
                        <img src="${item.image}" class="cart-item-image">
                        <div class="cart-item-details">
                            <div class="cart-item-title">${item.title}</div>
                            <div class="cart-item-price">Rs. ${item.price.toLocaleString()}</div>
                            <div style="display: flex; align-items: center; margin-top: 10px;">
                                <div class="qty-selector">
                                    <button class="qty-btn" onclick="updateCartItemQty(${item.id}, -1)">−</button>
                                    <span class="qty-value">${item.quantity}</span>
                                    <button class="qty-btn" onclick="updateCartItemQty(${item.id}, 1)">+</button>
                                </div>
                                <button class="remove-btn" onclick="removeFromCart(${item.id})">Remove</button>
                            </div>
                        </div>
                    </div>
                `).join('');
    }

    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    totalEl.textContent = `Rs. ${total.toLocaleString()}.00`;
}

// Navigation and Search
function toggleNav() {
    const drawer = document.getElementById('navDrawer');
    const overlay = document.getElementById('navOverlay');

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
    if (modal.classList.contains('active')) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    } else {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        document.getElementById('searchInput').focus();
    }
}

function filterCollection(type) {
    toggleNav();
    if (type === 'all') {
        renderProducts(products);
    } else {
        const filtered = products.filter(p => p.collection.toLowerCase().includes(type));
        renderProducts(filtered);
    }
    showHome();
    showToast(`Showing ${type === 'all' ? 'all' : type} collection`);
}

function handleSearch(e) {
    if (e.key === 'Enter') {
        const query = e.target.value.toLowerCase();
        const filtered = products.filter(p => p.title.toLowerCase().includes(query));
        renderProducts(filtered);
        toggleSearch();
        showHome();
        document.getElementById('featured').scrollIntoView({ behavior: 'smooth' });
    }
}

function quickSearch(term) {
    document.getElementById('searchInput').value = term;
    handleSearch({ key: 'Enter', target: { value: term } });
}

function toggleAccordion(btn) {
    const item = btn.parentElement;
    item.classList.toggle('active');
}

function shareProduct() {
    if (navigator.share) {
        navigator.share({
            title: currentProduct?.title || 'Kannamma Designs',
            text: 'Check out this beautiful saree!',
            url: window.location.href
        });
    } else {
        showToast('Link copied to clipboard');
    }
}

function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}

// Close on escape
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        document.getElementById('searchModal').classList.remove('active');
        document.getElementById('navDrawer').classList.remove('active');
        document.getElementById('navOverlay').classList.remove('active');
        document.getElementById('cartDrawer').classList.remove('active');
        document.getElementById('cartOverlay').classList.remove('active');
        document.body.style.overflow = '';
    }
});