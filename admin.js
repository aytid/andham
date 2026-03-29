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
async function showSection(sectionId, e) {
    localStorage.setItem('andham_admin_current_section', sectionId);

    // 1. Ensure core product data is loaded before showing product-related sections
    if (['dashboard', 'products', 'inventory', 'priceManager', 'analytics'].includes(sectionId)) {
        if (!products || products.length === 0) {
            await loadProductsFromSupabase();
        }
    }

    // 2. UI Switching Logic
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.getElementById(sectionId).classList.add('active');

    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    // (Keep your existing nav item highlighting logic here...)

    // 3. Section-Specific Loading
    switch (sectionId) {
        case 'dashboard':
            loadDashboard();
            break;
        case 'products':
            renderProductsTable();
            break;
        case 'inventory':
            renderInventory();
            break;
        case 'priceManager':
            renderPriceManager();
            break;
        case 'analytics':
            loadAllAnalytics();
            break;
        case 'customers':
            await loadCustomersFromSupabase();
            break;
        case 'orders':
            await loadOrders();
            break;
    }

    closeSidebarMobile();
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
    let filtered = products.filter(p => p.available_for_customer && p.quantity > 0);

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
                <td><img src="${p.image}" class="product-img" onerror="this.src='https://png.pngtree.com/png-vector/20190820/ourmid/pngtree-no-image-vector-illustration-isolated-png-image_1694547.jpg'"></td>
                <td><code style="font-size: 11px;">${p.id}</code></td>
                <td>${p.title}</td>
                <td><span class="badge badge-success">${p.category}</span></td>
                <td>₹${(p.price || 0).toLocaleString()}</td>
                <td class="actions">
                    <button class="btn btn-secondary btn-small" onclick="editProduct('${p.id}')">Edit</button>
                    <button class="btn btn-danger btn-small" onclick="confirmDeleteProduct('${p.id}', '${p.title.replace(/'/g, "\\'")}')">Delete</button>
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
                    <button class="btn btn-danger btn-small" onclick="confirmDeleteProduct('${p.id}', '${p.title.replace(/'/g, "\\'")}')" style="flex: 1;">Delete</button>
                </div>
            </div>
        `).join('');
    }
}
//Load Customers
// Add this function to load users from Supabase
async function loadCustomersFromSupabase() {
    const { data, error } = await supabaseClient
        .from("users")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        showToast("Failed to load customers: " + error.message);
        console.error(error);
        return;
    }

    // Store in global variable that loadCustomers() expects
    window.customers = data || [];

    // Now render the customers
    loadCustomers();
}

// Update your existing loadCustomers function
function loadCustomers() {
    // Check if customers data exists
    if (!window.customers || window.customers.length === 0) {
        const tbody = document.getElementById('customersTable');
        const cardsContainer = document.getElementById('customersCards');

        if (tbody) tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 40px;">Loading customers...</td></tr>';
        if (cardsContainer) cardsContainer.innerHTML = '<div style="text-align: center; padding: 40px;">Loading customers...</div>';
        return;
    }

    const searchTerm = document.getElementById('customerSearch')?.value?.toLowerCase() || '';

    // Filter customers
    let filtered = window.customers.filter(c => {
        const matchesSearch = !searchTerm ||
            c.user_name?.toLowerCase().includes(searchTerm) ||
            c.email?.toLowerCase().includes(searchTerm) ||
            c.phone?.includes(searchTerm) ||
            c.city?.toLowerCase().includes(searchTerm);

        return matchesSearch;
    });

    // Desktop table
    const tbody = document.getElementById('customersTable');
    if (!tbody) return;

    if (filtered.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 40px; color: #666;">
                    ${searchTerm ? 'No matching customers found' : 'No customers found'}
                </td>
            </tr>
        `;
    } else {
        tbody.innerHTML = filtered.map(c => `
            <tr>
                <td>${c.user_name || 'N/A'}</td>
                <td>
                    ${c.email ? `<div>📧 ${c.email}</div>` : ''}
                    ${c.phone ? `<div>📱 ${c.phone}</div>` : ''}
                </td>
                <td>
                    ${c.city ? `${c.city}, ` : ''}${c.state || ''}<br>
                    <small style="color: #666;">${c.pincode || ''} ${c.country || 'India'}</small>
                </td>
                <td>${new Date(c.created_at).toLocaleDateString()}</td>
            </tr>
        `).join('');
    }

    // Mobile cards
    const cardsContainer = document.getElementById('customersCards');
    if (!cardsContainer) return;

    if (filtered.length === 0) {
        cardsContainer.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #666;">
                ${searchTerm ? 'No matching customers found' : 'No customers found'}
            </div>
        `;
    } else {
        cardsContainer.innerHTML = filtered.map(c => `
            <div class="customer-card" style="background: white; border: 1px solid var(--border); border-radius: 8px; padding: 15px; margin-bottom: 15px;">
                <div class="customer-card-header" style="display: flex; gap: 15px; margin-bottom: 15px;">
                    <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(c.user_name || 'User')}&background=random&color=fff" 
                        style="width: 50px; height: 50px; border-radius: 50%; object-fit: cover;"
                        onerror="this.style.display='none'">
                    <div class="customer-card-info" style="flex: 1;">
                        <h4 style="margin: 0 0 5px 0;">${c.user_name || 'N/A'}</h4>
                        <p style="margin: 0; font-size: 12px; color: #666;"><code>${c.user_id}</code></p>
                        <p style="margin: 5px 0 0 0; font-size: 13px;">${c.email || c.phone || 'No contact info'}</p>
                        <small style="color: #666;">${c.city || ''}${c.city && c.state ? ', ' : ''}${c.state || ''}</small>
                    </div>
                </div>
                <div class="customer-card-actions" style="display: flex; gap: 10px;">
                    <button class="btn btn-secondary btn-small" onclick="viewCustomer('${c.user_id}')" style="flex: 1;">View</button>
                    <button class="btn btn-primary btn-small" onclick="editCustomer('${c.user_id}')" style="flex: 1;">Edit</button>
                </div>
            </div>
        `).join('');
    }
}

// Search function for customers
function searchCustomers() {
    loadCustomers();
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

async function generateProductId(category) {
    // Determine prefix
    let prefix;
    switch (category?.toUpperCase()) {
        case 'KANCHIPATTU':
            prefix = 'KAN';
            break;
        case 'GADWAL':
            prefix = 'GAD';
            break;
        case 'BANARAS':
            prefix = 'BAN';
            break;
        case 'FANCY':
            prefix = 'FAN';
            break;
        default:
            prefix = 'GEN';
    }

    // Get last ID with this prefix
    const { data, error } = await supabaseClient
        .from("products")
        .select("product_id")
        .ilike("product_id", `${prefix}%`)
        .order("product_id", { ascending: false })
        .limit(1);

    if (error || !data || data.length === 0) {
        return `${prefix}00001`;
    }

    const lastId = data[0].product_id;
    const numberPart = lastId.substring(3);
    const number = parseInt(numberPart);

    if (isNaN(number)) {
        return `${prefix}00001`;
    }

    const nextNumber = number + 1;
    return `${prefix}${String(nextNumber).padStart(5, "0")}`;
}
// Generate and set Product ID when category changes
async function generateAndSetProductId() {
    const categorySelect = document.getElementById('newProductCategory');
    const idField = document.getElementById('newProductID');
    const category = categorySelect.value;

    if (!category) {
        idField.value = '';
        idField.placeholder = 'Select category to generate ID';
        return;
    }

    // Show loading state
    idField.value = 'Generating...';

    try {
        const newId = await generateProductId(category);
        idField.value = newId;
    } catch (err) {
        console.error('Error generating ID:', err);
        idField.value = '';
        showToast('Error generating Product ID');
    }
}
// Save product - using URLs only, no file upload
async function saveProduct(e) {
    e.preventDefault();

    const productId = document.getElementById('newProductID').value;

    if (!productId) {
        showToast('Please select a category first to generate Product ID');
        return;
    }

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
            .join(',');

        // Insert product with generated ID
        const { error } = await supabaseClient.from("products").insert({
            product_id: productId,  // Use the generated ID
            title: document.getElementById('newProductTitle').value,
            price: parseInt(document.getElementById('newProductPrice').value),
            original_price: parseInt(document.getElementById('newProductOriginalPrice').value) || null,
            image: mainImageUrl,
            images: galleryUrls.length ? galleryUrls.join(",") : null,
            category: document.getElementById('newProductCategory').value,
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
    document.getElementById('newProductID').value = '';
    document.getElementById('newProductID').placeholder = 'Select category to generate ID';
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
        product.stock = !newStock;
        if (updateData.quantity) product.quantity = 0;
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
async function loadAnalytics() {

    if (!products || products.length === 0) {
        await loadProductsFromSupabase();
    }
    if (products.length === 0) return;
    if (typeof products === 'undefined') return;

    /* PRODUCT METRICS */

    document.getElementById('analyticsTotal').textContent = products.length;

    const categories = [...new Set(products.map(p => p.category))];
    document.getElementById('analyticsCategories').textContent = categories.length;

    const avgPrice = products.length
        ? products.reduce((sum, p) => sum + (p.price || 0), 0) / products.length
        : 0;

    document.getElementById('avgPrice').textContent =
        "₹" + Math.round(avgPrice).toLocaleString();


    /* INVENTORY VALUE */

    const inventoryValue = products.reduce(
        (sum, p) => sum + (p.price || 0) * (p.quantity || 0),
        0
    );

    document.getElementById('inventoryValue').textContent =
        "₹" + inventoryValue.toLocaleString();


    /* CATEGORY STATS */

    const categoryStats = {};

    products.forEach(p => {

        if (!categoryStats[p.category]) {
            categoryStats[p.category] = {
                count: 0,
                totalPrice: 0,
                totalQuantity: 0
            };
        }

        categoryStats[p.category].count++;
        categoryStats[p.category].totalPrice += p.price || 0;
        categoryStats[p.category].totalQuantity += p.quantity || 0;

    });

    const topCat = Object.entries(categoryStats)
        .sort((a, b) => b[1].count - a[1].count)[0];

    document.getElementById('topCategory').textContent =
        topCat ? topCat[0] : '-';


    document.getElementById('categoryStats').innerHTML =
        Object.entries(categoryStats).map(([cat, stats]) => `
        <tr>
            <td>${cat}</td>
            <td>${stats.count}</td>
            <td>₹${Math.round(stats.totalPrice / stats.count).toLocaleString()}</td>
            <td>${stats.totalQuantity}</td>
        </tr>
    `).join('');


    /* PRICE DISTRIBUTION */

    const ranges = {
        'Under ₹2k': products.filter(p => (p.price || 0) < 2000).length,
        '₹2k-5k': products.filter(p => (p.price || 0) >= 2000 && (p.price || 0) < 5000).length,
        '₹5k-10k': products.filter(p => (p.price || 0) >= 5000 && (p.price || 0) < 10000).length,
        '₹10k-15k': products.filter(p => (p.price || 0) >= 10000 && (p.price || 0) < 15000).length,
        'Over ₹15k': products.filter(p => (p.price || 0) >= 15000).length
    };

    document.getElementById('priceDistribution').innerHTML =
        Object.entries(ranges).map(([range, count]) => `
        <tr>
            <td>${range}</td>
            <td>${count}</td>
            <td>${products.length ? Math.round((count / products.length) * 100) : 0}%</td>
        </tr>
    `).join('');


    /* SALES METRICS */

    const { data: revenueData } = await supabaseClient
        .from("orders")
        .select("total_amount, created_at")
        .eq("payment_status", "paid");


    const totalRevenue = (revenueData || [])
        .reduce((sum, o) => sum + Number(o.total_amount), 0);

    document.getElementById("totalRevenue").textContent =
        "₹" + totalRevenue.toLocaleString();


    const today = new Date().toISOString().split("T")[0];

    const todayRevenue = (revenueData || [])
        .filter(o => o.created_at?.startsWith(today))
        .reduce((sum, o) => sum + Number(o.total_amount), 0);

    document.getElementById("todayRevenue").textContent =
        "₹" + todayRevenue.toLocaleString();


    const avgOrder = revenueData?.length
        ? totalRevenue / revenueData.length
        : 0;

    document.getElementById("avgOrder").textContent =
        "₹" + Math.round(avgOrder).toLocaleString();


    /* ITEMS SOLD */

    const { data: itemsData } = await supabaseClient
        .from("order_items")
        .select("quantity");

    const itemsSold = (itemsData || [])
        .reduce((sum, i) => sum + Number(i.quantity), 0);

    document.getElementById("itemsSold").textContent = itemsSold;


    /* TOP SELLING PRODUCTS */

    const { data: topProducts } = await supabaseClient
        .from("order_items")
        .select("product_id, product_name, quantity, total_price");

    const grouped = {};

    (topProducts || []).forEach(item => {

        if (!grouped[item.product_id]) {
            grouped[item.product_id] = {
                name: item.product_name,
                sold: 0,
                revenue: 0
            };
        }

        grouped[item.product_id].sold += item.quantity;
        grouped[item.product_id].revenue += Number(item.total_price);

    });

    const sorted = Object.values(grouped)
        .sort((a, b) => b.sold - a.sold)
        .slice(0, 10);


    const table = document.getElementById("topSellingTable");

    if (!sorted.length) {

        table.innerHTML = `
            <tr>
                <td colspan="3" style="text-align:center;padding:30px;color:#666;">
                    No sales yet
                </td>
            </tr>
        `;

        return;
    }

    table.innerHTML = sorted.map(p => `
        <tr>
            <td>${p.name}</td>
            <td>${p.sold}</td>
            <td>₹${p.revenue.toLocaleString()}</td>
        </tr>
    `).join('');

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
    const savedSection = localStorage.getItem('andham_admin_current_section');
    if (savedSection && savedSection !== 'dashboard') {
        showSection(savedSection);
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
        products = data.map(p => ({
            sys_id: p.sys_id,
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
            stock: p.stock,
            available_for_customer: p.available_for_customer,
            quantity: p.quantity || 0
        }));
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

document.addEventListener("DOMContentLoaded", () => {
    const user = localStorage.getItem("admin_user");
    if (user) {
        document.getElementById("loginScreen").style.display = "none";
        document.getElementById("adminPanel").style.display = "block";

        const u = JSON.parse(user);
        document.getElementById("adminName").textContent = u.user_name;

        loadProductsFromSupabase();
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
    document.getElementById("editCategory").value = product.category;
    document.getElementById("editDescription").value = product.description || "";

    // Show current main image
    const mainPreview = document.getElementById('editMainPreview');
    mainPreview.innerHTML = product.image ? `<img src="${product.image}" style="width: 100px; height: 120px; object-fit: cover; border-radius: 4px;">` : 'No image';

    // Show current gallery images
    const galleryPreview = document.getElementById('editAdditionalPreview');
    galleryPreview.innerHTML = product.images && product.images.length > 0
        ? product.images.map(img => `<img src="${img}" style="width: 60px; height: 70px; object-fit: cover; border-radius: 4px;">`).join('')
        : 'No gallery images';

    // Reset file inputs
    document.getElementById("editMainFileInput").value = "";
    document.getElementById("editGalleryFileInput").value = "";

    document.getElementById("editModal").classList.add("active");
}

// Helper to clear gallery
function clearGallerySelection() {
    if (confirm("This will remove all additional images from this product. Continue?")) {
        document.getElementById('editAdditionalPreview').innerHTML = 'Gallery Cleared (Click Save to confirm)';
        // We will handle the actual data removal in the updateProduct function
        window.clearGalleryRequested = true;
    }
}

async function updateProduct(e) {
    e.preventDefault();

    const id = document.getElementById("editProductId").value;
    const product = products.find(p => p.id === id);

    const mainFile = document.getElementById("editMainFileInput").files[0];
    const galleryFiles = document.getElementById("editGalleryFileInput").files;

    try {
        let mainImageUrl = product.image; // Default to existing
        let galleryUrls = window.clearGalleryRequested ? [] : [...(product.images || [])];

        // 1. Upload new Main Image if selected
        if (mainFile) {
            const fileName = `edit-${Date.now()}-${mainFile.name}`;
            const { error: uploadError } = await supabaseClient.storage.from("product-images").upload(fileName, mainFile);
            if (uploadError) throw uploadError;
            const { data } = supabaseClient.storage.from("product-images").getPublicUrl(fileName);
            mainImageUrl = data.publicUrl;
        }

        // 2. Upload new Gallery Images if selected
        if (galleryFiles.length > 0) {
            for (const file of galleryFiles) {
                const fileName = `gallery-${Date.now()}-${file.name}`;
                const { error } = await supabaseClient.storage.from("product-images").upload(fileName, file);
                if (!error) {
                    const { data } = supabaseClient.storage.from("product-images").getPublicUrl(fileName);
                    galleryUrls.push(data.publicUrl);
                }
            }
        }

        const updatedData = {
            title: document.getElementById("editTitle").value,
            price: parseInt(document.getElementById("editPrice").value),
            category: document.getElementById("editCategory").value,
            image: mainImageUrl,
            images: galleryUrls.length > 0 ? galleryUrls.join(',') : null,
            description: document.getElementById("editDescription").value,
            // Removing requested fields by excluding them from the update object
        };

        const { error } = await supabaseClient.from("products").update(updatedData).eq("product_id", id);

        if (error) throw error;

        window.clearGalleryRequested = false;
        showToast("Product updated successfully!");
        await loadProductsFromSupabase();
        closeModal();

    } catch (err) {
        showToast("Update failed: " + err.message);
        console.error(err);
    }
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

let deleteProductId = null;

function confirmDeleteProduct(id, title) {

    deleteProductId = id;

    document.getElementById("deleteProductInfo").textContent =
        `${id} — ${title}`;

    document.getElementById("deleteModal").classList.add("active");

    document.getElementById("confirmDeleteBtn").onclick = async function () {
        await deleteProduct(deleteProductId);
        closeDeleteModal();
    };
}

function closeDeleteModal() {
    document.getElementById("deleteModal").classList.remove("active");
}
// Delete product from Supabase
async function deleteProduct(id) {

    console.log("Deleting product:", id);

    const { error } = await supabaseClient
        .from("products")
        .delete()
        .eq("product_id", id);

    if (error) {
        console.error(error);
        showToast("Delete failed");
        return;
    }

    showToast("Product deleted successfully");

    await loadProductsFromSupabase();
    renderProductsTable();
}

async function loadSalesTrend() {
    const { data: orders } = await supabaseClient
        .from("orders")
        .select("total_amount, created_at, payment_status")
        .eq("payment_status", "paid")
        .order("created_at", { ascending: true });

    if (!orders?.length) return;

    // Group by date (last 30 days)
    const last30Days = {};
    const today = new Date();

    for (let i = 29; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        last30Days[d.toISOString().split("T")[0]] = 0;
    }

    orders.forEach(o => {
        const date = o.created_at?.split("T")[0];
        if (last30Days.hasOwnProperty(date)) {
            last30Days[date] += Number(o.total_amount);
        }
    });

    const labels = Object.keys(last30Days);
    const values = Object.values(last30Days);

    // Create canvas chart
    const canvas = document.getElementById('salesTrendChart');
    const ctx = canvas.getContext('2d');

    // Simple bar chart rendering
    const maxVal = Math.max(...values) || 1;
    const barWidth = (canvas.width - 60) / labels.length;
    const chartHeight = canvas.height - 40;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw bars with gradient
    values.forEach((val, i) => {
        const height = (val / maxVal) * chartHeight;
        const x = 30 + i * barWidth;
        const y = canvas.height - 20 - height;

        const gradient = ctx.createLinearGradient(0, y, 0, canvas.height - 20);
        gradient.addColorStop(0, '#6366f1');
        gradient.addColorStop(1, '#8b5cf6');

        ctx.fillStyle = gradient;
        ctx.fillRect(x + 2, y, barWidth - 4, height);

        // Hover effect data attribute
        canvas.dataset[`tooltip${i}`] = `₹${val.toLocaleString()} on ${labels[i]}`;
    });

    // Add to HTML: <canvas id="salesTrendChart" width="800" height="300"></canvas>
}

async function loadCategoryChart() {
    const { data: items } = await supabaseClient
        .from("order_items")
        .select("product_id, quantity, total_price");

    // Get product categories
    const productIds = [...new Set(items?.map(i => i.product_id) || [])];

    const { data: products } = await supabaseClient
        .from("products")
        .select("product_id, category")
        .in("product_id", productIds);

    const productMap = Object.fromEntries(products?.map(p => [p.product_id, p.category]) || []);

    // Aggregate by category
    const catRevenue = {};
    items?.forEach(item => {
        const cat = productMap[item.product_id] || 'Unknown';
        catRevenue[cat] = (catRevenue[cat] || 0) + Number(item.total_price);
    });

    // Render donut chart using SVG
    const total = Object.values(catRevenue).reduce((a, b) => a + b, 0);
    let currentAngle = 0;
    const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6'];

    const svgSegments = Object.entries(catRevenue).map(([cat, val], i) => {
        const angle = (val / total) * 360;
        const startAngle = currentAngle;
        currentAngle += angle;

        // SVG arc path calculation
        const x1 = 100 + 80 * Math.cos(Math.PI * startAngle / 180);
        const y1 = 100 + 80 * Math.sin(Math.PI * startAngle / 180);
        const x2 = 100 + 80 * Math.cos(Math.PI * currentAngle / 180);
        const y2 = 100 + 80 * Math.sin(Math.PI * currentAngle / 180);

        const largeArc = angle > 180 ? 1 : 0;

        return `
            <path d="M100,100 L${x1},${y1} A80,80 0 ${largeArc},1 ${x2},${y2} Z" 
                  fill="${colors[i % colors.length]}" 
                  stroke="white" stroke-width="2"
                  data-category="${cat}"
                  data-value="₹${val.toLocaleString()}"
                  class="chart-segment">
                <title>${cat}: ₹${val.toLocaleString()} (${Math.round(val / total * 100)}%)</title>
            </path>
        `;
    }).join('');

    document.getElementById('categoryDonut').innerHTML = `
        <svg viewBox="0 0 200 200" class="donut-chart">
            ${svgSegments}
            <circle cx="100" cy="100" r="50" fill="white"/>
            <text x="100" y="95" text-anchor="middle" font-size="12" fill="#666">Total</text>
            <text x="100" y="115" text-anchor="middle" font-size="14" font-weight="bold" fill="#333">₹${total.toLocaleString()}</text>
        </svg>
        <div class="chart-legend">
            ${Object.keys(catRevenue).map((cat, i) => `
                <div class="legend-item">
                    <span class="dot" style="background:${colors[i % colors.length]}"></span>
                    <span>${cat}</span>
                </div>
            `).join('')}
        </div>
    `;
}
async function loadHourlyHeatmap() {
    const { data: orders } = await supabaseClient
        .from("orders")
        .select("created_at, total_amount")
        .eq("payment_status", "paid");

    // Group by hour of day (0-23)
    const hourlyData = new Array(24).fill(0).map(() => ({ count: 0, revenue: 0 }));

    orders?.forEach(o => {
        const hour = new Date(o.created_at).getHours();
        hourlyData[hour].count++;
        hourlyData[hour].revenue += Number(o.total_amount);
    });

    const maxRevenue = Math.max(...hourlyData.map(h => h.revenue)) || 1;

    const heatmapHtml = hourlyData.map((data, hour) => {
        const intensity = data.revenue / maxRevenue;
        const opacity = 0.2 + (intensity * 0.8);
        const timeLabel = hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`;

        return `
            <div class="heatmap-cell" 
                 style="background: rgba(99, 102, 241, ${opacity})"
                 title="${timeLabel}: ${data.count} orders, ₹${data.revenue.toLocaleString()}">
                <span class="hour-label">${timeLabel}</span>
                <span class="hour-value">${data.count}</span>
            </div>
        `;
    }).join('');

    document.getElementById('hourlyHeatmap').innerHTML = `
        <div class="heatmap-grid">${heatmapHtml}</div>
        <div class="heatmap-legend">
            <span>Low</span>
            <div class="gradient-bar"></div>
            <span>High</span>
        </div>
    `;
}
async function loadInventoryHealth() {
    const { data: products } = await supabaseClient
        .from("products")
        .select("title, quantity, price, category, stock");

    // Categorize inventory health
    const health = {
        outOfStock: products?.filter(p => !p.stock || p.quantity === 0) || [],
        lowStock: products?.filter(p => p.stock && p.quantity > 0 && p.quantity <= 3) || [],
        healthy: products?.filter(p => p.stock && p.quantity > 3) || []
    };

    const healthScore = products?.length ? Math.round((health.healthy.length / products.length) * 100) : 0;

    document.getElementById('inventoryHealth').innerHTML = `
        <div class="health-score">
            <div class="circular-progress" style="--progress: ${healthScore}">
                <span>${healthScore}%</span>
            </div>
            <p>Inventory Health Score</p>
        </div>
        
        <div class="health-breakdown">
            <div class="health-item critical">
                <span class="count">${health.outOfStock.length}</span>
                <span class="label">Out of Stock</span>
            </div>
            <div class="health-item warning">
                <span class="count">${health.lowStock.length}</span>
                <span class="label">Low Stock (≤3)</span>
            </div>
            <div class="health-item good">
                <span class="count">${health.healthy.length}</span>
                <span class="label">Healthy</span>
            </div>
        </div>
        
        <div id="criticalProducts" class="product-alert-list">
            ${health.outOfStock.slice(0, 5).map(p => `
                <div class="alert-item critical">
                    <span>${p.title}</span>
                    <span class="badge">Restock Now</span>
                </div>
            `).join('')}
        </div>
    `;
}
async function loadRecentActivity() {
    const { data: recentOrders } = await supabaseClient
        .from("orders")
        .select("order_number, total_amount, created_at, payment_status, status")
        .order("created_at", { ascending: false })
        .limit(10);

    const activityHtml = recentOrders?.map(order => {
        const timeAgo = getTimeAgo(new Date(order.created_at));
        const icon = order.payment_status === 'paid' ? '💰' : '⏳';
        const statusClass = order.payment_status === 'paid' ? 'success' : 'pending';

        return `
            <div class="activity-item ${statusClass}">
                <div class="activity-icon">${icon}</div>
                <div class="activity-content">
                    <p>Order <strong>#${order.order_number}</strong> - ₹${Number(order.total_amount).toLocaleString()}</p>
                    <span class="activity-time">${timeAgo}</span>
                </div>
                <span class="status-badge ${statusClass}">${order.status}</span>
            </div>
        `;
    }).join('');

    document.getElementById('activityFeed').innerHTML = activityHtml || '<p>No recent activity</p>';
}

function getTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
}

function showProductList(type) {
    // Filter products based on type
    let filtered;
    if (type === 'outOfStock') {
        filtered = products.filter(p => !p.stock || p.quantity === 0);
    } else if (type === 'lowStock') {
        filtered = products.filter(p => p.stock && p.quantity > 0 && p.quantity <= 3);
    }

    // Switch to inventory section and show filtered
    showSection('inventory');
    document.getElementById('inventorySearch').value = type === 'outOfStock' ? 'out of stock' : 'low stock';
    renderInventory(filtered.map(p => p.id).join(' '));
}
async function loadAllAnalytics() {
    await Promise.all([
        loadAnalytics(),
        loadSalesTrend(),
        loadCategoryChart(),
        loadHourlyHeatmap(),
        loadInventoryHealth(),
        loadRecentActivity()
    ]);
}

// Auto-refresh every 5 minutes
setInterval(loadAllAnalytics, 300000);
