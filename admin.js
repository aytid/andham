let products = [];
let activityLog = JSON.parse(localStorage.getItem('andham_admin_activity')) || [];
let sidebarOpen = false;

// Mobile sidebar toggle
function toggleSidebar() {
    sidebarOpen = !sidebarOpen;
    document.getElementById('sidebar').classList.toggle('open', sidebarOpen);
    document.getElementById('sidebarOverlay').classList.toggle('active', sidebarOpen);
    document.getElementById('hamburgerBtn').classList.toggle('active', sidebarOpen);
}

// Close sidebar when clicking nav item on mobile
function closeSidebarMobile() {
    if (window.innerWidth <= 768) {
        toggleSidebar();
    }
}

// Login
async function handleLogin(e) {
    e.preventDefault();

    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    const { data, error } = await supabaseClient
        .from("users")
        .select("*")
        .eq("user_name", username)
        .eq("password", password)
        .single();

    if (error || !data) {
        showToast("Invalid credentials");
        return;
    }

    localStorage.setItem("admin_user", JSON.stringify(data));

    document.getElementById("loginScreen").style.display = "none";
    document.getElementById("adminPanel").style.display = "block";

    document.getElementById("adminName").textContent = data.user_name;

    showToast("Login successful");
    await loadProductsFromSupabase();
    loadDashboard();
}

function logout() {
    localStorage.removeItem("admin_user");
    location.reload();
}

// Show section
function showSection(sectionId, e) {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.getElementById(sectionId).classList.add('active');

    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    if (e) {
        e.target.closest('.nav-item').classList.add('active');
    }
    const titles = {
        dashboard: 'Dashboard',
        products: 'All Products',
        addProduct: 'Add Product',
        inventory: 'Inventory',
        priceManager: 'Price Manager',
        analytics: 'Analytics',
        settings: 'Settings'
    };
    document.getElementById('pageTitle').textContent = titles[sectionId] || sectionId;

    // Close mobile sidebar
    closeSidebarMobile();

    // Load data
    if (sectionId === 'dashboard') loadDashboard();
    if (sectionId === 'products') renderProductsTable();
    if (sectionId === 'inventory') renderInventory();
    if (sectionId === 'priceManager') renderPriceManager();
    if (sectionId === 'analytics') loadAnalytics();
}

// Dashboard
function loadDashboard() {
    if (typeof products === 'undefined') return;

    const inStock = products.filter(p => p.quantity > 0).length;
    const outOfStock = products.filter(p => p.quantity === 0).length;
    const totalValue = products.reduce((sum, p) => sum + (p.price || 0) * (p.quantity || 0), 0);
    const availableToCustomers = products.filter(p => p.available_for_customer).length;

    document.getElementById('totalProducts').textContent = products.length;
    document.getElementById('inStock').textContent = inStock;
    document.getElementById('outOfStock').textContent = outOfStock;
    document.getElementById('totalValue').textContent = `₹${totalValue.toLocaleString()}`;
    const availableEl = document.getElementById('availableToCustomers');
    if (availableEl) availableEl.textContent = availableToCustomers;

    renderActivityLog();
}

// Render products table and cards - SHOWS ONLY AVAILABLE TO CUSTOMERS
function renderProductsTable(searchTerm = '') {
    if (typeof products === 'undefined') return;

    // Filter: only show products that are BOTH available to customers AND in stock
    let filtered = products.filter(p => p.available_for_customer && p.stock);

    if (searchTerm) {
        filtered = filtered.filter(p =>
            p.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.title.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }

    // Desktop table
    const tbody = document.getElementById('productsTable');

    if (filtered.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 40px; color: #666;">
                    ${searchTerm ? 'No matching products in stock' : 'No products in stock'}
                </td>
            </tr>
        `;
    } else {
        tbody.innerHTML = filtered.map(p => `
            <tr>
                <td><img src="${p.image}" class="product-img" onerror="this.src='https://via.placeholder.com/50'"></td>
                <td><code style="font-size: 11px;">${p.id}</code></td>
                <td>${p.title}</td>
                <td><span class="badge badge-success">${p.category}</span></td>
                <td>₹${(p.price || 0).toLocaleString()}</td>
                <td class="actions">
                    <button class="btn btn-secondary btn-small" onclick="editProduct('${p.id}')">Edit</button>
                </td>
            </tr>
        `).join('');
    }

    // Mobile cards
    const cardsContainer = document.getElementById('productsCards');
    if (filtered.length === 0) {
        cardsContainer.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #666;">
                ${searchTerm ? 'No matching products in stock' : 'No products in stock'}
            </div>
        `;
    } else {
        cardsContainer.innerHTML = filtered.map(p => `
            <div class="product-card">
                <div class="product-card-header">
                    <img src="${p.image}" alt="" onerror="this.style.display='none'">
                    <div class="product-card-info">
                        <h4>${p.title}</h4>
                        <p>ID: ${p.id}</p>
                        <p>₹${(p.price || 0).toLocaleString()}</p>
                        <span class="badge badge-success">${p.category}</span>
                    </div>
                </div>
                <div class="product-card-actions">
                    <button class="btn btn-secondary btn-small" onclick="editProduct('${p.id}')" style="flex: 1;">Edit</button>
                </div>
            </div>
        `).join('');
    }
}

function searchProducts() {
    renderProductsTable(document.getElementById('productSearch').value);
}

// Add bullet
function addBullet() {
    const container = document.getElementById('bulletInputs');
    const div = document.createElement('div');
    div.className = 'bullet-row';
    div.innerHTML = `
        <input type="text" placeholder="Feature" class="bullet-point">
        <button type="button" class="btn btn-danger btn-small" onclick="removeBullet(this)">×</button>
    `;
    container.appendChild(div);
}

function removeBullet(btn) {
    btn.closest('.bullet-row').remove();
}

function previewImage(url, containerId) {
    const container = document.getElementById(containerId);
    container.innerHTML = url ? `<img src="${url}" style="max-width: 100%; max-height: 150px; margin-top: 10px; border-radius: 4px;" onerror="this.style.display='none'">` : '';
}

function previewMultipleImages(urls, containerId) {
    const container = document.getElementById(containerId);
    const urlArray = urls.split(',').map(u => u.trim()).filter(u => u);
    container.innerHTML = urlArray.map(url =>
        `<img src="${url}" style="width: 80px; height: 80px; object-fit: cover; margin: 5px; border-radius: 4px;" onerror="this.style.display='none'">`
    ).join('');
}

async function generateProductId() {
    const { data, error } = await supabaseClient
        .from("products")
        .select("product_id")
        .order("product_id", { ascending: false })
        .limit(1);

    if (error || !data || data.length === 0) {
        return "ADM00001";
    }

    const lastId = data[0].product_id;
    const number = parseInt(lastId.replace("ADM", ""));

    return "ADM" + String(number + 1).padStart(5, "0");
}

// Save product - using URLs only, no file upload
async function saveProduct(e) {
    e.preventDefault();

    try {
        const imageInput = document.getElementById("newProductImage");
        const galleryInput = document.getElementById("newProductImages");

        const mainFile = imageInput.files[0];

        if (!mainFile) {
            showToast("Please upload a main product image!");
            return;
        }

        // Upload main image
        const mainFileName = `${Date.now()}-${mainFile.name}`;

        const { error: mainUploadError } = await supabaseClient
            .storage
            .from("product-images")
            .upload(mainFileName, mainFile);

        if (mainUploadError) throw mainUploadError;

        const { data: mainUrlData } = supabaseClient
            .storage
            .from("product-images")
            .getPublicUrl(mainFileName);

        const mainImageUrl = mainUrlData.publicUrl;

        // Upload gallery images
        let galleryUrls = [];

        if (galleryInput.files.length > 0) {
            for (const file of galleryInput.files) {
                const fileName = `${Date.now()}-${file.name}`;

                const { error } = await supabaseClient
                    .storage
                    .from("product-images")
                    .upload(fileName, file);

                if (error) {
                    console.error(error);
                    continue;
                }

                const { data } = supabaseClient
                    .storage
                    .from("product-images")
                    .getPublicUrl(fileName);

                galleryUrls.push(data.publicUrl);
            }
        }

        // Get bullet points
        const bullets = Array.from(document.querySelectorAll('.bullet-point'))
            .map(input => input.value.trim())
            .filter(val => val)
            .join('|');

        const productId = await generateProductId();

        const { error } = await supabaseClient.from("products").insert({
            product_id: productId,
            title: document.getElementById('newProductTitle').value,
            price: parseInt(document.getElementById('newProductPrice').value),
            original_price: parseInt(document.getElementById('newProductOriginalPrice').value) || null,
            image: mainImageUrl,
            images: galleryUrls.length ? galleryUrls.join(",") : null,
            category: document.getElementById('newProductCategory').value,
            collection: document.getElementById('newProductCollection').value || null,
            description: document.getElementById('newProductDescription').value || null,
            bullets: bullets || null,
            stock: true,
            available_for_customer: true,
            quantity: 1
        });

        if (error) throw error;

        showToast("Product saved successfully!");
        logActivity('Added product', productId, 'New product created');

        await loadProductsFromSupabase();

        clearForm();
        showSection('products');

    } catch (err) {
        showToast("Error: " + err.message);
        console.error(err);
    }
}

function clearForm() {
    document.getElementById('addProductForm').reset();
    document.getElementById('mainPreviewGrid').innerHTML = '';
    document.getElementById('galleryPreviewGrid').innerHTML = '';
    document.getElementById('bulletInputs').innerHTML = `
        <div class="bullet-row">
            <input type="text" placeholder="Feature 1" class="bullet-point">
            <button type="button" class="btn btn-danger btn-small" onclick="removeBullet(this)">×</button>
        </div>
    `;
}

function closeModal() {
    document.getElementById('editModal').classList.remove('active');
}
// Inventory - SHOWS ALL PRODUCTS WITH BOTH TOGGLES
function renderInventory(searchTerm = '') {
    if (typeof products === 'undefined') return;

    let filtered = products;
    if (searchTerm) {
        filtered = products.filter(p =>
            p.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.title.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }

    // Desktop table
    const tbody = document.getElementById('inventoryTable');

    if (filtered.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; padding: 40px; color: #666;">
                    No products in inventory
                </td>
            </tr>
        `;
    } else {
        tbody.innerHTML = filtered.map(p => {
            const stockStatus = p.stock && p.quantity > 0 ? 'in' : 'out';

            return `
                <tr>
                    <td><code style="font-size: 11px;">${p.id}</code></td>
                    <td>${p.title}</td>
                    <td>${p.quantity || 0}</td>
                    <td>
                        <span class="badge badge-${stockStatus === 'in' ? 'success' : 'danger'}">
                            ${stockStatus === 'in' ? 'In Stock' : 'Out of Stock'}
                        </span>
                    </td>
                    <td>
                        <div class="stock-toggle" onclick="toggleStock('${p.id}')" title="Toggle stock status">
                            <div class="toggle-switch ${p.stock ? 'active' : ''}"></div>
                            <span style="font-size: 11px; color: ${p.stock ? 'var(--success)' : 'var(--danger)'}">
                                ${p.stock ? 'Active' : 'Inactive'}
                            </span>
                        </div>
                    </td>
                    <td>
                        <div class="stock-toggle" onclick="toggleAvailable('${p.id}')" title="Toggle customer visibility">
                            <div class="toggle-switch ${p.available_for_customer ? 'active' : ''}"></div>
                            <span style="font-size: 11px; color: ${p.available_for_customer ? 'var(--success)' : 'var(--text-light)'}">
                                ${p.available_for_customer ? 'Visible' : 'Hidden'}
                            </span>
                        </div>
                    </td>
                    <td>
                        <button class="btn btn-secondary btn-small" onclick="openInventoryEdit('${p.id}')">Edit</button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    // Mobile cards
    const cardsContainer = document.getElementById('inventoryCards');
    if (filtered.length === 0) {
        cardsContainer.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #666;">
                No products in inventory
            </div>
        `;
    } else {
        cardsContainer.innerHTML = filtered.map(p => {
            const stockStatus = p.stock && p.quantity > 0 ? 'in' : 'out';

            return `
                <div class="product-card">
                    <div class="product-card-header">
                        <div class="product-card-info" style="margin-left: 0;">
                            <h4>${p.title}</h4>
                            <p>ID: ${p.id}</p>
                            <p>Qty: ${p.quantity || 0}</p>
                            <span class="badge badge-${stockStatus === 'in' ? 'success' : 'danger'}">
                                ${stockStatus === 'in' ? 'In Stock' : 'Out of Stock'}
                            </span>
                        </div>
                    </div>
                    <div class="product-card-actions">
                        <button class="btn btn-${p.stock ? 'success' : 'danger'} btn-small" onclick="toggleStock('${p.id}')" style="flex: 1;">
                            Stock: ${p.stock ? 'ON' : 'OFF'}
                        </button>
                        <button class="btn btn-${p.available_for_customer ? 'success' : 'secondary'} btn-small" onclick="toggleAvailable('${p.id}')" style="flex: 1;">
                            ${p.available_for_customer ? 'Visible' : 'Hidden'}
                        </button>
                        <button class="btn btn-secondary btn-small" onclick="openInventoryEdit('${p.id}')" style="flex: 1;">Edit</button>
                    </div>
                </div>
            `;
        }).join('');
    }
}

function searchInventory() {
    renderInventory(document.getElementById('inventorySearch').value);
}

function toggleSelectAll() {
    const checkboxes = document.querySelectorAll('.inventory-check');
    const selectAll = document.getElementById('selectAll');
    checkboxes.forEach(cb => cb.checked = selectAll.checked);
}
// Toggle stock status - updates Supabase, sets qty to 1 if turning on from 0
async function toggleStock(id) {
    const product = products.find(p => p.id === id);
    if (!product) return;

    const newStock = !product.stock;
    let updateData = { stock: newStock };

    // If turning ON and quantity is 0, set quantity to 1
    if (newStock && product.quantity === 0) {
        updateData.quantity = 1;
    }

    // Optimistic update
    product.stock = newStock;
    if (updateData.quantity) product.quantity = updateData.quantity;
    renderInventory(document.getElementById('inventorySearch').value);

    // Update in Supabase
    const { error } = await supabaseClient
        .from("products")
        .update(updateData)
        .eq("product_id", id)
        .select();

    if (error) {
        console.error(error);
        showToast("Stock update failed");
        product.stock = !newStock; // Revert
        if (updateData.quantity) product.quantity = 0; // Revert quantity too
        renderInventory();
        return;
    }

    const msg = newStock
        ? (updateData.quantity ? "Stock activated (Qty set to 1)" : "Stock activated")
        : "Stock deactivated";
    logActivity('Stock toggle', id, newStock ? 'Active' : 'Inactive');
    showToast(msg);
}
// Toggle available_for_customer
async function toggleAvailable(id) {
    const product = products.find(p => p.id === id);
    if (!product) return;

    const newAvailable = !product.available_for_customer;

    // Optimistic update
    product.available_for_customer = newAvailable;
    renderInventory(document.getElementById('inventorySearch').value);

    const { error } = await supabaseClient
        .from("products")
        .update({ available_for_customer: newAvailable })
        .eq("product_id", id)
        .select();

    if (error) {
        console.error(error);
        showToast("Availability update failed");
        product.available_for_customer = !newAvailable;
        renderInventory();
        return;
    }

    logActivity('Availability toggle', id, newAvailable ? 'Visible to customers' : 'Hidden from customers');
    showToast(newAvailable ? "Product now visible to customers" : "Product hidden from customers");
}
// Price Manager
function renderPriceManager(searchTerm = '', categoryFilter = '') {
    if (typeof products === 'undefined') return;

    let filtered = products;
    if (searchTerm) {
        filtered = filtered.filter(p =>
            p.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.title.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }
    if (categoryFilter) {
        filtered = filtered.filter(p => p.category === categoryFilter);
    }

    // Desktop table
    document.getElementById('priceTable').innerHTML = filtered.map(p => {
        const discount = p.originalPrice ? Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100) : 0;
        return `
            <tr>
                <td><code style="font-size: 11px;">${p.id}</code></td>
                <td>${p.title}</td>
                <td>₹${(p.price || 0).toLocaleString()}</td>
                <td>
                    <div class="price-editor">
                        <input type="number" id="newPrice-${p.id}" value="${p.price}" min="0">
                        <button class="btn btn-primary btn-small" onclick="updatePrice('${p.id}')">Update</button>
                    </div>
                </td>
                <td>${discount > 0 ? `<span style="color: var(--success);">${discount}% OFF</span>` : '-'}</td>
                <td>
                    <button class="btn btn-secondary btn-small" onclick="setDiscount('${p.id}')">Discount</button>
                </td>
            </tr>
        `;
    }).join('');

    // Mobile cards
    document.getElementById('priceCards').innerHTML = filtered.map(p => {
        const discount = p.originalPrice ? Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100) : 0;
        return `
            <div class="product-card">
                <div class="product-card-header">
                    <div class="product-card-info" style="margin-left: 0;">
                        <h4>${p.title}</h4>
                        <p>ID: ${p.id}</p>
                        <p>Current: ₹${(p.price || 0).toLocaleString()}</p>
                        ${discount > 0 ? `<p style="color: var(--success);">${discount}% OFF</p>` : ''}
                    </div>
                </div>
                <div class="product-card-actions">
                    <input type="number" id="mobPrice-${p.id}" value="${p.price}" style="flex: 1; padding: 8px; border: 1px solid var(--border); border-radius: 4px;">
                    <button class="btn btn-primary btn-small" onclick="updatePriceMobile('${p.id}')" style="flex: 1;">Update</button>
                </div>
            </div>
        `;
    }).join('');
}

function searchPriceProducts() {
    const term = document.getElementById('priceSearch').value;
    const category = document.getElementById('priceFilter').value;
    renderPriceManager(term, category);
}

function filterByCategory() {
    searchPriceProducts();
}

async function setDiscount(id) {
    const discount = prompt('Discount % (0 to remove)');
    if (discount === null) return;

    const product = products.find(p => p.id === id);
    if (!product) return;

    let newPrice = product.price;
    let originalPrice = product.originalPrice;

    const percent = parseInt(discount);

    if (percent > 0) {
        originalPrice = product.price;
        newPrice = Math.round(product.price * (1 - percent / 100));
    } else {
        newPrice = originalPrice || product.price;
        originalPrice = null;
    }

    const { error } = await supabaseClient
        .from("products")
        .update({
            price: newPrice,
            original_price: originalPrice
        })
        .eq("product_id", id)
        .select();

    if (error) {
        console.error(error);
        showToast("Discount update failed");
        return;
    }

    logActivity('Set discount', id, `${percent}% off`);
    await loadProductsFromSupabase();
    showToast("Discount applied");
}

async function applyBulkPricing() {
    const operation = document.getElementById('bulkOperation').value;
    const value = parseFloat(document.getElementById('bulkValue').value);
    const category = document.getElementById('bulkCategory').value;

    if (!value || value < 0) {
        showToast('Enter valid value!');
        return;
    }

    let affected = products;
    if (category !== 'all') {
        affected = products.filter(p => p.category === category);
    }

    let updateCount = 0;
    const errors = [];

    for (const p of affected) {
        let newPrice = p.price;

        if (operation === 'increase') {
            newPrice = Math.round(p.price * (1 + value / 100));
        } else if (operation === 'decrease') {
            newPrice = Math.round(p.price * (1 - value / 100));
        } else if (operation === 'fixed') {
            newPrice = value;
        }

        const { error } = await supabaseClient
            .from("products")
            .update({ price: newPrice })
            .eq("product_id", p.id)
            .select();

        if (error) {
            errors.push(`${p.id}: ${error.message}`);
        } else {
            updateCount++;
        }
    }

    if (errors.length > 0) {
        showToast(`Updated ${updateCount}, ${errors.length} failed`);
        console.error(errors);
    } else {
        showToast(`Updated ${updateCount} products!`);
    }

    logActivity('Bulk price', 'multiple', `${operation} ${value}`);
    await loadProductsFromSupabase();
}

// Analytics
function loadAnalytics() {
    if (typeof products === 'undefined') return;

    const categoryStats = {};
    products.forEach(p => {
        if (!categoryStats[p.category]) {
            categoryStats[p.category] = { count: 0, totalPrice: 0, totalQuantity: 0 };
        }
        categoryStats[p.category].count++;
        categoryStats[p.category].totalPrice += p.price || 0;
        categoryStats[p.category].totalQuantity += p.quantity || 0;
    });

    document.getElementById('analyticsTotal').textContent = products.length;

    const availableCount = products.filter(p => p.available_for_customer).length;
    document.getElementById('analyticsAvailable').textContent = availableCount;

    const avgPrice = products.length > 0 ? Math.round(products.reduce((sum, p) => sum + (p.price || 0), 0) / products.length) : 0;
    document.getElementById('avgPrice').textContent = `₹${avgPrice.toLocaleString()}`;

    const totalQuantity = products.reduce((sum, p) => sum + (p.quantity || 0), 0);
    document.getElementById('totalQuantity').textContent = totalQuantity;

    const topCat = Object.entries(categoryStats).sort((a, b) => b[1].count - a[1].count)[0];
    document.getElementById('topCategory').textContent = topCat ? topCat[0] : '-';

    document.getElementById('categoryStats').innerHTML = Object.entries(categoryStats).map(([cat, stats]) => `
        <tr>
            <td>${cat}</td>
            <td>${stats.count}</td>
            <td>₹${Math.round(stats.totalPrice / stats.count).toLocaleString()}</td>
            <td>${stats.totalQuantity}</td>
        </tr>
    `).join('');

    const ranges = {
        'Under ₹2k': products.filter(p => (p.price || 0) < 2000).length,
        '₹2k-5k': products.filter(p => (p.price || 0) >= 2000 && (p.price || 0) < 5000).length,
        '₹5k-10k': products.filter(p => (p.price || 0) >= 5000 && (p.price || 0) < 10000).length,
        '₹10k-15k': products.filter(p => (p.price || 0) >= 10000 && (p.price || 0) < 15000).length,
        'Over ₹15k': products.filter(p => (p.price || 0) >= 15000).length
    };

    document.getElementById('priceDistribution').innerHTML = Object.entries(ranges).map(([range, count]) => `
        <tr>
            <td>${range}</td>
            <td>${count}</td>
            <td>${products.length > 0 ? Math.round((count / products.length) * 100) : 0}%</td>
        </tr>
    `).join('');
}

// Settings
function saveSettings() {
    const settings = {
        storeName: document.getElementById('storeName').value,
        email: document.getElementById('storeEmail').value,
        currency: document.getElementById('currencySymbol').value,
        taxRate: parseFloat(document.getElementById('taxRate').value) || 0
    };
    localStorage.setItem('andham_admin_settings', JSON.stringify(settings));
    showToast('Settings saved!');
}

function exportProducts() {
    if (typeof products === 'undefined') return;
    const dataStr = JSON.stringify(products, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `products_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    showToast('Exported!');
}

async function importProducts() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const imported = JSON.parse(event.target.result);
                if (!confirm(`Import ${imported.length} products? This will add them to the database.`)) return;

                let successCount = 0;
                const errors = [];

                for (const p of imported) {
                    const { error } = await supabaseClient.from("products").insert({
                        product_id: p.id || generateProductId(),
                        title: p.title,
                        price: p.price || 0,
                        original_price: p.originalPrice || null,
                        category: p.category || 'Plains',
                        collection: p.collection || null,
                        image: p.image || '',
                        images: p.images ? p.images.join(',') : null,
                        description: p.description || null,
                        bullets: p.bullets ? p.bullets.join('|') : null,
                        stock: p.stock === 'in' || p.stock === true,
                        available_for_customer: p.available_for_customer !== undefined ? p.available_for_customer : true,
                        quantity: p.quantity || 1
                    });

                    if (error) {
                        errors.push(`${p.id || p.title}: ${error.message}`);
                    } else {
                        successCount++;
                    }
                }

                if (errors.length > 0) {
                    showToast(`Imported ${successCount}, ${errors.length} failed`);
                    console.error(errors);
                } else {
                    showToast(`Imported ${successCount} products!`);
                }

                await loadProductsFromSupabase();
            } catch (err) {
                showToast('Invalid file!');
                console.error(err);
            }
        };
        reader.readAsText(file);
    };
    input.click();
}

function logActivity(action, productId, details) {
    activityLog.unshift({
        time: new Date().toLocaleString(),
        action,
        productId,
        details
    });
    if (activityLog.length > 50) activityLog.pop();
    localStorage.setItem('andham_admin_activity', JSON.stringify(activityLog));
}

function renderActivityLog() {
    const tbody = document.getElementById('activityLog');
    if (activityLog.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 30px;">No recent activity</td></tr>';
        return;
    }
    tbody.innerHTML = activityLog.slice(0, 10).map(log => `
        <tr>
            <td style="font-size: 11px;">${log.time}</td>
            <td>${log.action}</td>
            <td><code style="font-size: 10px;">${log.productId}</code></td>
            <td style="font-size: 11px;">${log.details}</td>
        </tr>
    `).join('');
}

function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2500);
}

// Close modal on outside click
document.addEventListener("DOMContentLoaded", () => {
    const editModal = document.getElementById('editModal');
    if (editModal) {
        editModal.addEventListener('click', (e) => {
            if (e.target === editModal) closeModal();
        });
    }
});

// Handle window resize
window.addEventListener('resize', () => {
    if (window.innerWidth > 768 && sidebarOpen) {
        toggleSidebar();
    }
});

async function loadProductsFromSupabase() {
        const { data, error } = await supabaseClient
            .from("products")
            .select("*")
            .order("created_at", { ascending: false });

        if (error) {
            showToast("Failed to load products: " + error.message);
            return;
        }

        if (!data || data.length === 0) {
            products = [];
        } else {
            products = data.map(p => {
                const quantity = p.quantity || 0;
                // If quantity is 0, force stock to false
                // Otherwise use the stored stock value (default true)
                const stock = quantity === 0 ? false : (p.stock !== false);

                return {
                    id: p.product_id,
                    title: p.title,
                    price: p.price,
                    originalPrice: p.original_price,
                    category: p.category,
                    collection: p.collection,
                    image: p.image,
                    images: p.images ? p.images.split(",") : [],
                    description: p.description,
                    bullets: p.bullets ? p.bullets.split("|") : [],
                    stock: stock,
                    available_for_customer: p.available_for_customer !== false,
                    quantity: quantity
                };
            });
        }

        renderProductsTable();
        renderInventory();
        loadDashboard();
}
async function updatePrice(id) {
    const input = document.getElementById(`newPrice-${id}`);
    if (!input) {
        console.error("Price input not found:", id);
        return;
    }

    const newPrice = parseInt(input.value);
    if (isNaN(newPrice) || newPrice < 0) {
        showToast("Invalid price");
        return;
    }

    const { error } = await supabaseClient
        .from("products")
        .update({ price: newPrice })
        .eq("product_id", id)
        .select();

    if (error) {
        console.error(error);
        showToast("Failed to update");
        return;
    }

    logActivity('Price update', id, `₹${newPrice}`);
    await loadProductsFromSupabase();
    showToast("Price updated!");
}

async function updatePriceMobile(id) {
    const newPrice = document.getElementById(`mobPrice-${id}`).value;
    if (!newPrice || isNaN(newPrice) || newPrice < 0) {
        showToast("Invalid price");
        return;
    }

    const { error } = await supabaseClient
        .from("products")
        .update({ price: parseInt(newPrice) })
        .eq("product_id", id)
        .select();

    if (error) {
        console.error(error);
        showToast("Price update failed");
        return;
    }

    logActivity('Price update', id, `₹${newPrice}`);
    await loadProductsFromSupabase();
    showToast("Price updated!");
}

// Single DOMContentLoaded listener
document.addEventListener("DOMContentLoaded", () => {
    loadProductsFromSupabase();
    const user = localStorage.getItem("admin_user");
    if (user) {
        document.getElementById("loginScreen").style.display = "none";
        document.getElementById("adminPanel").style.display = "block";

        const u = JSON.parse(user);
        document.getElementById("adminName").textContent = u.user_name;

        // Delay to ensure supabaseClient is ready
        setTimeout(loadProductsFromSupabase, 100);
    }

    // Image preview handlers
    const mainInput = document.getElementById("newProductImage");
    const galleryInput = document.getElementById("newProductImages");
    const mainPreview = document.getElementById("mainPreviewGrid");
    const galleryPreview = document.getElementById("galleryPreviewGrid");

    if (mainInput) {
        mainInput.addEventListener("change", () => {
            mainPreview.innerHTML = "";
            Array.from(mainInput.files).forEach(file => {
                const reader = new FileReader();
                reader.onload = function (e) {
                    const img = document.createElement("img");
                    img.src = e.target.result;
                    img.style.width = "90px";
                    img.style.height = "110px";
                    img.style.objectFit = "cover";
                    img.style.borderRadius = "6px";
                    mainPreview.appendChild(img);
                };
                reader.readAsDataURL(file);
            });
        });
    }

    if (galleryInput) {
        galleryInput.addEventListener("change", () => {
            galleryPreview.innerHTML = "";
            Array.from(galleryInput.files).forEach(file => {
                const reader = new FileReader();
                reader.onload = function (e) {
                    const img = document.createElement("img");
                    img.src = e.target.result;
                    img.style.width = "90px";
                    img.style.height = "110px";
                    img.style.objectFit = "cover";
                    img.style.borderRadius = "6px";
                    galleryPreview.appendChild(img);
                };
                reader.readAsDataURL(file);
            });
        });
    }
});

function editProduct(id) {
    const product = products.find(p => p.id === id);
    if (!product) return;

    document.getElementById("editProductId").value = product.id;
    document.getElementById("editTitle").value = product.title;
    document.getElementById("editPrice").value = product.price;
    document.getElementById("editOriginalPrice").value = product.originalPrice || "";
    document.getElementById("editCategory").value = product.category;
    document.getElementById("editImage").value = product.image;
    document.getElementById("editImages").value = product.images ? product.images.join(", ") : "";
    document.getElementById("editDescription").value = product.description || "";
    document.getElementById("editBullets").value = product.bullets ? product.bullets.join(" | ") : "";

    // NEW: Set collection value
    if (document.getElementById("editCollection")) {
        document.getElementById("editCollection").value = product.collection || "";
    }

    // Show image previews
    previewImage(product.image, 'editMainPreview');
    previewMultipleImages(product.images ? product.images.join(", ") : "", 'editAdditionalPreview');

    document.getElementById("editModal").classList.add("active");
}

async function updateProduct(e) {
    e.preventDefault();

    const id = document.getElementById("editProductId").value;

    const updatedData = {
        title: document.getElementById("editTitle").value,
        price: parseInt(document.getElementById("editPrice").value),
        original_price: parseInt(document.getElementById("editOriginalPrice").value) || null,
        category: document.getElementById("editCategory").value,
        image: document.getElementById("editImage").value,
        images: document.getElementById("editImages").value.split(',').map(u => u.trim()).filter(u => u).join(','),
        description: document.getElementById("editDescription").value,
        bullets: document.getElementById("editBullets").value.split('|').map(b => b.trim()).filter(b => b).join('|')
    };

    // NEW: Add collection if field exists
    if (document.getElementById("editCollection")) {
        updatedData.collection = document.getElementById("editCollection").value || null;
    }

    const { error } = await supabaseClient
        .from("products")
        .update(updatedData)
        .eq("product_id", id)
        .select();

    if (error) {
        showToast("Update failed: " + error.message);
        return;
    }

    logActivity('Updated product', id, 'Product details modified');
    await loadProductsFromSupabase();
    closeModal();
    showToast("Product updated successfully!");
}
// Open inventory quick edit modal
function openInventoryEdit(id) {
    const product = products.find(p => p.id === id);
    if (!product) return;

    document.getElementById("invEditProductId").value = product.id;
    document.getElementById("invEditDisplayId").value = product.id;
    document.getElementById("invEditTitle").value = product.title;
    document.getElementById("invEditQuantity").value = product.quantity || 0;
    document.getElementById("invEditStock").checked = product.stock;
    document.getElementById("invEditAvailable").checked = product.available_for_customer;

    document.getElementById("inventoryEditModal").classList.add("active");
}

async function updateProduct(e) {
    e.preventDefault();

    const productId = document.getElementById("editProductId").value;

    const updatedData = {
        title: document.getElementById("editTitle").value,
        category: document.getElementById("editCategory").value,
        collection: document.getElementById("editCollection").value || null,
        price: parseInt(document.getElementById("editPrice").value) || 0,
        original_price: parseInt(document.getElementById("editOriginalPrice").value) || null,
        image: document.getElementById("editImage").value,
        images: document.getElementById("editImages").value || null,
        description: document.getElementById("editDescription").value || null,
        bullets: document.getElementById("editBullets").value || null
    };

    const { error } = await supabaseClient
        .from("products")
        .update(updatedData)
        .eq("product_id", productId);

    if (error) {
        console.error(error);
        showToast("Update failed");
        return;
    }

    showToast("Product updated successfully");

    closeModal();
    await loadProductsFromSupabase();
}

function closeInventoryEditModal() {
    document.getElementById("inventoryEditModal").classList.remove("active");
}

async function saveInventoryEdit(e) {
    e.preventDefault();

    const id = document.getElementById("invEditProductId").value;

    const updatedData = {
        title: document.getElementById("invEditTitle").value,
        quantity: parseInt(document.getElementById("invEditQuantity").value) || 0, // NEW: Quantity
        stock: document.getElementById("invEditStock").checked,
        available_for_customer: document.getElementById("invEditAvailable").checked
    };

    const { error } = await supabaseClient
        .from("products")
        .update(updatedData)
        .eq("product_id", id)
        .select();

    if (error) {
        showToast("Update failed: " + error.message);
        return;
    }

    logActivity('Quick edit', id, 'Updated from inventory');
    await loadProductsFromSupabase();
    closeInventoryEditModal();
    showToast("Product updated!");
}