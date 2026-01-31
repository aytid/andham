// ==========================================
// ANDHAM - LUXURY SAREE E-COMMERCE
// Complete JavaScript Functionality
// ==========================================

// ==========================================
// PRODUCT DATA - 12 Premium Sarees
// Replace image URLs with your actual product images
// ==========================================
const products = [
    {
        id: 1,
        title: "Kanjivaram Pure Silk - Temple Border Red",
        category: "Silk Heritage",
        price: 8999,
        originalPrice: 12000,
        image: "https://images.unsplash.com/photo-1598965402089-274fde9da94d?w=600&auto=format&fit=crop&q=80",
        description: "Authentic Kanjivaram silk with intricate gold zari temple border. Pure mulberry silk, handwoven in Kanchipuram."
    },
    {
        id: 2,
        title: "Banarasi Brocade - Royal Blue",
        category: "Silk Heritage",
        price: 7599,
        originalPrice: 9999,
        image: "https://images.unsplash.com/photo-1583391733955-5522949ca5f6?w=600&auto=format&fit=crop&q=80",
        description: "Pure Banarasi silk brocade with silver and gold zari work. Traditional mughal motifs, perfect for weddings."
    },
    {
        id: 3,
        title: "Handloom Cotton - Indigo Dabu Print",
        category: "Cotton Classics",
        price: 1899,
        originalPrice: 2499,
        image: "https://images.unsplash.com/photo-1606293926075-69a00febf580?w=600&auto=format&fit=crop&q=80",
        description: "Natural indigo dyed handloom cotton with traditional Dabu block prints from Rajasthan."
    },
    {
        id: 4,
        title: "Linen Jamdani - Olive Green",
        category: "Contemporary",
        price: 3299,
        originalPrice: 4299,
        image: "https://images.unsplash.com/photo-1610030249022-5f4f636b5769?w=600&auto=format&fit=crop&q=80",
        description: "Premium European linen with handwoven Jamdani motifs. Contemporary design for the modern professional."
    },
    {
        id: 5,
        title: "Chanderi Silk-Cotton - Peach Blossom",
        category: "Cotton Classics",
        price: 2499,
        originalPrice: 3199,
        image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600&auto=format&fit=crop&q=80",
        description: "Sheer Chanderi weave with delicate floral motifs and zari border. Perfect for festive occasions."
    },
    {
        id: 6,
        title: "Georgette Embroidered - Blush Pink",
        category: "Contemporary",
        price: 2899,
        originalPrice: 3599,
        image: "https://images.unsplash.com/photo-1610189012906-4f786e255e5b?w=600&auto=format&fit=crop&q=80",
        description: "Lightweight georgette with intricate pearl and sequin hand embroidery. Ideal for evening parties."
    },
    {
        id: 7,
        title: "Tussar Silk - Tribal Art Brown",
        category: "Silk Heritage",
        price: 4599,
        originalPrice: 5999,
        image: "https://images.unsplash.com/photo-1606293926075-69a00febf580?w=600&auto=format&fit=crop&q=80",
        description: "Natural Tussar silk with hand-painted tribal art from Odisha. Each piece is unique."
    },
    {
        id: 8,
        title: "Mysore Silk - Traditional Purple",
        category: "Silk Heritage",
        price: 5299,
        originalPrice: 6999,
        image: "https://images.unsplash.com/photo-1598965402089-274fde9da94d?w=600&auto=format&fit=crop&q=80",
        description: "Pure Mysore silk with 100% gold zari border. Lightweight yet rich, certified by Silk Board of India."
    },
    {
        id: 9,
        title: "Khadi Cotton - Natural Beige",
        category: "Cotton Classics",
        price: 1499,
        originalPrice: 1999,
        image: "https://images.unsplash.com/photo-1610030249022-5f4f636b5769?w=600&auto=format&fit=crop&q=80",
        description: "Handspun Khadi cotton with natural dyes. Eco-friendly and breathable, perfect for summer."
    },
    {
        id: 10,
        title: "Organza Floral - Mint Green",
        category: "Contemporary",
        price: 3199,
        originalPrice: 3999,
        image: "https://images.unsplash.com/photo-1610189012906-4f786e255e5b?w=600&auto=format&fit=crop&q=80",
        description: "Sheer organza with digital floral print and hand-embroidered border. Contemporary elegance."
    },
    {
        id: 11,
        title: "Paithani Silk - Peacock Motif Green",
        category: "Bridal Trousseau",
        price: 15999,
        originalPrice: 21000,
        image: "https://images.unsplash.com/photo-1583391733955-5522949ca5f6?w=600&auto=format&fit=crop&q=80",
        description: "Maharashtra's heritage Paithani with peacock motifs and kaleidoscopic border. Pure silk with real zari."
    },
    {
        id: 12,
        title: "Linen Saree - Terracotta Red",
        category: "Contemporary",
        price: 2799,
        originalPrice: 3499,
        image: "https://images.unsplash.com/photo-1610030249022-5f4f636b5769?w=600&auto=format&fit=crop&q=80",
        description: "Belgian linen with tassel details and block prints. Artisanal craft meets contemporary design."
    }
];

// ==========================================
// STATE MANAGEMENT
// ==========================================
let cart = JSON.parse(localStorage.getItem('andham_cart')) || [];
let wishlist = JSON.parse(localStorage.getItem('andham_wishlist')) || [];
let currentPaymentMethod = 'cod';
let cursorX = 0, cursorY = 0;
let currentX = 0, currentY = 0;

// ==========================================
// INITIALIZATION
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    // Hide loader after 2 seconds
    setTimeout(() => {
        document.getElementById('loader').classList.add('hidden');
        initAnimations();
    }, 2000);
    
    // Initialize all components
    initCursor();
    renderProducts();
    updateCartUI();
    updateWishlistUI();
    setupEventListeners();
});

// ==========================================
// CUSTOM CURSOR - Smooth Following
// ==========================================
function initCursor() {
    const cursor = document.getElementById('cursor');
    if (!cursor) return;
    
    // Update target position on mouse move
    document.addEventListener('mousemove', (e) => {
        cursorX = e.clientX;
        cursorY = e.clientY;
    });
    
    // Smooth animation loop
    function animateCursor() {
        currentX += (cursorX - currentX) * 0.1;
        currentY += (cursorY - currentY) * 0.1;
        
        cursor.style.left = currentX + 'px';
        cursor.style.top = currentY + 'px';
        
        requestAnimationFrame(animateCursor);
    }
    animateCursor();
    
    // Hover effects
    setupCursorHoverEffects();
}

function setupCursorHoverEffects() {
    const interactiveElements = document.querySelectorAll(
        'a, button, .product-card, .category-card, .action-btn, .add-to-cart-btn, input, textarea'
    );
    
    interactiveElements.forEach(el => {
        el.addEventListener('mouseenter', () => {
            document.getElementById('cursor').classList.add('hover');
        });
        el.addEventListener('mouseleave', () => {
            document.getElementById('cursor').classList.remove('hover');
        });
    });
}

// ==========================================
// GSAP ANIMATIONS
// ==========================================
function initAnimations() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
        console.warn('GSAP not loaded');
        return;
    }
    
    gsap.registerPlugin(ScrollTrigger);
    
    // Header scroll effect
    ScrollTrigger.create({
        start: 'top -100',
        end: 99999,
        toggleClass: { className: 'scrolled', targets: '#header' }
    });
    
    // Hero text animations
    gsap.to('.reveal-text', {
        y: 0,
        opacity: 1,
        duration: 1,
        stagger: 0.2,
        ease: 'power3.out'
    });
    
    // Hero image animation
    gsap.to('.hero-image', {
        x: 0,
        opacity: 1,
        duration: 1.2,
        delay: 0.5,
        ease: 'power3.out'
    });
    
    // Section headers on scroll
    gsap.utils.toArray('.section-header').forEach(header => {
        gsap.from(header, {
            scrollTrigger: {
                trigger: header,
                start: 'top 80%',
                toggleActions: 'play none none reverse'
            },
            y: 50,
            opacity: 0,
            duration: 1,
            ease: 'power3.out'
        });
    });
    
    // Product cards stagger animation
    gsap.from('.product-card', {
        scrollTrigger: {
            trigger: '#productsGrid',
            start: 'top 85%'
        },
        y: 60,
        opacity: 0,
        duration: 0.8,
        stagger: 0.1,
        ease: 'power3.out'
    });
    
    // Category cards
    gsap.from('.category-card', {
        scrollTrigger: {
            trigger: '.category-grid',
            start: 'top 85%'
        },
        y: 40,
        opacity: 0,
        duration: 0.6,
        stagger: 0.15,
        ease: 'power3.out'
    });
}

// ==========================================
// PRODUCT RENDERING
// ==========================================
function renderProducts() {
    const grid = document.getElementById('productsGrid');
    if (!grid) return;
    
    grid.innerHTML = products.map((product, index) => {
        const isWishlisted = wishlist.includes(product.id);
        const isBestseller = index < 3; // First 3 are bestsellers
        
        return `
            <article class="product-card" data-id="${product.id}">
                <div class="product-image-wrapper">
                    ${isBestseller ? `<span class="product-badge">Bestseller</span>` : ''}
                    
                    <img 
                        src="${product.image}" 
                        alt="${product.title}" 
                        class="product-image"
                        loading="lazy"
                        onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
                    >
                    <div class="product-image-fallback" style="display: none;">
                        <i class="fas fa-image"></i>
                    </div>
                    
                    <div class="product-actions">
                        <button 
                            class="action-btn ${isWishlisted ? 'active' : ''}" 
                            onclick="toggleWishlistItem(${product.id}, event)"
                            aria-label="${isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}"
                        >
                            <i class="${isWishlisted ? 'fas' : 'far'} fa-heart"></i>
                        </button>
                    </div>
                    
                    <button 
                        class="add-to-cart-btn" 
                        onclick="addToCart(${product.id})"
                    >
                        Add to Cart
                    </button>
                </div>
                
                <div class="product-info">
                    <div class="product-category">${product.category}</div>
                    <h3 class="product-title">${product.title}</h3>
                    <div class="product-price">
                        <span class="current-price">₹${formatPrice(product.price)}</span>
                        <span class="original-price">₹${formatPrice(product.originalPrice)}</span>
                    </div>
                </div>
            </article>
        `;
    }).join('');
    
    // Add click to card for quick view (optional)
    document.querySelectorAll('.product-card').forEach(card => {
        card.addEventListener('click', (e) => {
            // Don't trigger if clicking buttons
            if (e.target.closest('button')) return;
            
            const productId = parseInt(card.dataset.id);
            showProductQuickView(productId);
        });
    });
}

// ==========================================
// CART FUNCTIONALITY
// ==========================================
function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    const existingItem = cart.find(item => item.id === productId);
    
    if (existingItem) {
        existingItem.quantity += 1;
        showToast(`Added another ${product.title} to cart`);
    } else {
        cart.push({ ...product, quantity: 1 });
        showToast(`${product.title} added to cart`);
    }
    
    saveCart();
    updateCartUI();
    
    // Animate badge
    animateBadge('cartBadge');
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    saveCart();
    updateCartUI();
    showToast('Item removed from cart');
}

function updateQuantity(productId, change) {
    const item = cart.find(item => item.id === productId);
    if (!item) return;
    
    item.quantity += change;
    
    if (item.quantity <= 0) {
        removeFromCart(productId);
    } else {
        saveCart();
        updateCartUI();
    }
}

function saveCart() {
    localStorage.setItem('andham_cart', JSON.stringify(cart));
}

function updateCartUI() {
    const container = document.getElementById('cartItems');
    const footer = document.getElementById('cartFooter');
    const badge = document.getElementById('cartBadge');
    const totalEl = document.getElementById('cartTotal');
    
    if (!container || !footer || !badge || !totalEl) return;
    
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // Update badge
    badge.textContent = totalItems;
    badge.classList.toggle('show', totalItems > 0);
    
    // Render items or empty state
    if (cart.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-shopping-bag"></i>
                <p>Your cart is empty</p>
                <button class="btn btn-primary" style="margin-top: 1.5rem;" onclick="toggleCart()">
                    Continue Shopping
                </button>
            </div>
        `;
        footer.style.display = 'none';
    } else {
        container.innerHTML = cart.map(item => `
            <div class="cart-item">
                <img 
                    src="${item.image}" 
                    alt="${item.title}" 
                    class="cart-item-image"
                    onerror="this.style.background='#f0f0f0'"
                >
                <div class="cart-item-details">
                    <div>
                        <div class="cart-item-title">${item.title}</div>
                        <div class="cart-item-price">₹${formatPrice(item.price)}</div>
                    </div>
                    <div>
                        <div class="quantity-control">
                            <button class="qty-btn" onclick="updateQuantity(${item.id}, -1)">−</button>
                            <span>${item.quantity}</span>
                            <button class="qty-btn" onclick="updateQuantity(${item.id}, 1)">+</button>
                        </div>
                        <div class="remove-item" onclick="removeFromCart(${item.id})">
                            <i class="fas fa-trash"></i> Remove
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
        
        footer.style.display = 'block';
        totalEl.textContent = '₹' + formatPrice(totalAmount);
    }
}

// ==========================================
// WISHLIST FUNCTIONALITY
// ==========================================
function toggleWishlistItem(productId, event) {
    if (event) {
        event.stopPropagation();
        event.preventDefault();
    }
    
    const index = wishlist.indexOf(productId);
    const product = products.find(p => p.id === productId);
    
    if (index > -1) {
        wishlist.splice(index, 1);
        showToast('Removed from wishlist');
    } else {
        wishlist.push(productId);
        showToast('Added to wishlist');
        animateBadge('wishlistBadge');
    }
    
    localStorage.setItem('andham_wishlist', JSON.stringify(wishlist));
    updateWishlistUI();
    renderProducts(); // Re-render to update heart icons
}

function updateWishlistUI() {
    const container = document.getElementById('wishlistItems');
    const badge = document.getElementById('wishlistBadge');
    
    if (!container || !badge) return;
    
    badge.textContent = wishlist.length;
    badge.classList.toggle('show', wishlist.length > 0);
    
    if (wishlist.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-heart"></i>
                <p>Your wishlist is empty</p>
            </div>
        `;
    } else {
        const wishlistProducts = products.filter(p => wishlist.includes(p.id));
        container.innerHTML = wishlistProducts.map(product => `
            <div class="cart-item">
                <img src="${product.image}" alt="${product.title}" class="cart-item-image">
                <div class="cart-item-details">
                    <div class="cart-item-title">${product.title}</div>
                    <div class="cart-item-price">₹${formatPrice(product.price)}</div>
                    <button 
                        class="btn btn-primary" 
                        style="padding: 0.5rem 1rem; font-size: 0.8rem; margin-top: 0.5rem;"
                        onclick="moveToCart(${product.id})"
                    >
                        Move to Cart
                    </button>
                </div>
                <button 
                    class="close-btn" 
                    style="position: static; width: 35px; height: 35px;"
                    onclick="toggleWishlistItem(${product.id})"
                >
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `).join('');
    }
}

function moveToCart(productId) {
    addToCart(productId);
    toggleWishlistItem(productId); // Remove from wishlist
}

// ==========================================
// CHECKOUT & PAYMENT
// ==========================================
function openCheckout() {
    toggleCart(); // Close cart sidebar
    
    const modal = document.getElementById('checkoutModal');
    const overlay = document.getElementById('overlay');
    const summary = document.getElementById('checkoutSummary');
    
    if (!modal || !summary) return;
    
    // Calculate totals
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shipping = subtotal > 999 ? 0 : 99;
    const total = subtotal + shipping;
    
    // Generate summary HTML
    summary.innerHTML = `
        ${cart.map(item => `
            <div class="summary-row">
                <span>${item.title} × ${item.quantity}</span>
                <span>₹${formatPrice(item.price * item.quantity)}</span>
            </div>
        `).join('')}
        <div class"summary-row">
            <span>Shipping</span>
            <span>${shipping === 0 ? 'FREE' : '₹' + shipping}</span>
        </div>
        <div class="summary-row total">
            <span>Total</span>
            <span>₹${formatPrice(total)}</span>
        </div>
    `;
    
    // Show modal
    modal.classList.add('active');
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeCheckout() {
    const modal = document.getElementById('checkoutModal');
    const overlay = document.getElementById('overlay');
    
    if (modal) modal.classList.remove('active');
    if (overlay) overlay.classList.remove('active');
    document.body.style.overflow = '';
}

function selectPayment(element, method) {
    document.querySelectorAll('.payment-option').forEach(opt => {
        opt.classList.remove('selected');
    });
    element.classList.add('selected');
    currentPaymentMethod = method;
}

function submitOrder(event) {
    event.preventDefault();
    
    const btn = document.getElementById('submitBtn');
    const form = event.target;
    
    if (!btn) return;
    
    // Loading state
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
    btn.disabled = true;
    
    // Gather data
    const formData = {
        name: form.user_name.value,
        email: form.user_email.value,
        phone: form.user_phone.value,
        address: form.user_address.value,
        payment: currentPaymentMethod,
        orderId: 'AND-' + Date.now(),
        items: cart,
        total: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    };
    
    // Simulate API call
    setTimeout(() => {
        // Success
        cart = [];
        saveCart();
        updateCartUI();
        closeCheckout();
        
        showToast('Order placed successfully! Check your email.');
        
        // Reset form
        form.reset();
        btn.innerHTML = originalText;
        btn.disabled = false;
        
        // Show confirmation
        alert(`Thank you for your order, ${formData.name}!

Order ID: ${formData.orderId}
Total: ₹${formatPrice(formData.total)}
Payment: ${currentPaymentMethod === 'cod' ? 'Cash on Delivery' : 'Online Payment'}

Confirmation sent to: ${formData.email}

We will process your order shortly.`);
        
    }, 2000);
}

// ==========================================
// UI TOGGLES
// ==========================================
function toggleCart() {
    const sidebar = document.getElementById('cartSidebar');
    const overlay = document.getElementById('overlay');
    
    if (!sidebar) return;
    
    const isActive = sidebar.classList.contains('active');
    
    if (isActive) {
        sidebar.classList.remove('active');
        if (overlay) overlay.classList.remove('active');
        document.body.style.overflow = '';
    } else {
        // Close wishlist if open
        document.getElementById('wishlistSidebar')?.classList.remove('active');
        
        sidebar.classList.add('active');
        if (overlay) overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function toggleWishlist() {
    const sidebar = document.getElementById('wishlistSidebar');
    const overlay = document.getElementById('overlay');
    
    if (!sidebar) return;
    
    const isActive = sidebar.classList.contains('active');
    
    if (isActive) {
        sidebar.classList.remove('active');
        if (overlay) overlay.classList.remove('active');
        document.body.style.overflow = '';
    } else {
        // Close cart if open
        document.getElementById('cartSidebar')?.classList.remove('active');
        
        sidebar.classList.add('active');
        if (overlay) overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeAll() {
    document.getElementById('cartSidebar')?.classList.remove('active');
    document.getElementById('wishlistSidebar')?.classList.remove('active');
    document.getElementById('checkoutModal')?.classList.remove('active');
    document.getElementById('overlay')?.classList.remove('active');
    document.getElementById('navLinks')?.classList.remove('active');
    document.body.style.overflow = '';
}

function toggleNav() {
    const navLinks = document.getElementById('navLinks');
    if (navLinks) {
        navLinks.classList.toggle('active');
    }
}

// ==========================================
// UTILITIES
// ==========================================
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const messageEl = document.getElementById('toastMessage');
    
    if (!toast || !messageEl) return;
    
    messageEl.textContent = message;
    toast.className = 'toast show ' + type;
    
    // Auto hide
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

function animateBadge(badgeId) {
    const badge = document.getElementById(badgeId);
    if (!badge) return;
    
    badge.style.transform = 'scale(1.4)';
    setTimeout(() => {
        badge.style.transform = 'scale(1)';
    }, 200);
}

function formatPrice(price) {
    return price.toLocaleString('en-IN');
}

function showProductQuickView(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    // Simple alert for now - can be expanded to modal
    showToast(`${product.title} - ₹${formatPrice(product.price)}`);
}

// ==========================================
// EVENT LISTENERS
// ==========================================
function setupEventListeners() {
    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const target = document.querySelector(targetId);
            
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
                
                // Close mobile menu if open
                document.getElementById('navLinks')?.classList.remove('active');
            }
        });
    });
    
    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeAll();
        }
    });
    
    // Header scroll effect (fallback if GSAP fails)
    window.addEventListener('scroll', () => {
        const header = document.getElementById('header');
        if (header) {
            if (window.scrollY > 100) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        }
    });
}

// ==========================================
// EMAIL INTEGRATION (Optional)
// Uncomment and configure with EmailJS
// ==========================================
/*
// Initialize EmailJS with your public key
emailjs.init("YOUR_PUBLIC_KEY");

function sendOrderEmail(orderData) {
    emailjs.send("YOUR_SERVICE_ID", "YOUR_TEMPLATE_ID", {
        to_name: orderData.name,
        to_email: orderData.email,
        order_id: orderData.orderId,
        order_details: orderData.items.map(i => `${i.title} x ${i.quantity}`).join('\n'),
        total_amount: '₹' + formatPrice(orderData.total),
        payment_method: orderData.payment
    }).then(
        function(response) {
            console.log("Email sent successfully", response);
        },
        function(error) {
            console.log("Email failed", error);
        }
    );
}
*/
