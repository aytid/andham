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

    const inStock = products.filter(p => !p.stock || p.stock === 'in').length;
    const outOfStock = products.filter(p => p.stock === 'out').length;
    const totalValue = products.reduce((sum, p) => sum + (p.price || 0), 0);

    document.getElementById('totalProducts').textContent = products.length;
    document.getElementById('inStock').textContent = inStock;
    document.getElementById('outOfStock').textContent = outOfStock;
    document.getElementById('totalValue').textContent = `₹${totalValue.toLocaleString()}`;

    renderActivityLog();
}

// Render products table and cards
function renderProductsTable(searchTerm = '') {
    if (typeof products === 'undefined') return;

    let filtered = products;
    if (searchTerm) {
        filtered = products.filter(p =>
            p.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.title.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }

    // Desktop table
    const tbody = document.getElementById('productsTable');
    tbody.innerHTML = filtered.map(p => {
        const stockStatus = p.stock || 'in';

        return `
            <tr style="${stockStatus === 'out' ? 'background: #ffebee;' : ''}">
                <td><img src="${p.image}" class="product-img" onerror="this.src='https://via.placeholder.com/50'"></td>
                <td><code style="font-size: 11px;">${p.id}</code></td>
                <td>${p.title}</td>
                <td><span class="badge badge-success">${p.category}</span></td>
                <td>₹${(p.price || 0).toLocaleString()}</td>
                <td class="actions">
                    <button class="btn btn-secondary btn-small" onclick="editProduct('${p.id}')">Edit</button>
                    <button class="btn btn-danger btn-small" onclick="deleteProduct('${p.id}')">Delete</button>
                </td>
            </tr>
        `;
    }).join('');

    // Mobile cards
    document.getElementById('productsCards').innerHTML = filtered.map(p => `
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
                <button class="btn btn-danger btn-small" onclick="deleteProduct('${p.id}')" style="flex: 1;">Delete</button>
            </div>
        </div>
    `).join('');
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

// Inventory
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
    document.getElementById('inventoryTable').innerHTML = filtered.map(p => `
        <tr>
            <td><input type="checkbox" class="inventory-check" data-id="${p.id}"></td>
            <td><code style="font-size: 11px;">${p.id}</code></td>
            <td>${p.title}</td>
            <td>${p.quantity || 0}</td>
            <td>
                <span class="badge badge-${p.stock === 'in' || !p.stock ? 'success' : p.stock === 'low' ? 'warning' : 'danger'}">
                    ${p.stock === 'in' || !p.stock ? 'In Stock' : p.stock === 'low' ? 'Low Stock' : 'Out of Stock'}
                </span>
            </td>
            <td>
                <div class="stock-toggle" onclick="toggleStock('${p.id}')">
                    <div class="toggle-switch ${p.stock === 'in' || !p.stock ? 'active' : ''}"></div>
                </div>
            </td>
        </tr>
    `).join('');

    // Mobile cards
    document.getElementById('inventoryCards').innerHTML = filtered.map(p => `
        <div class="product-card">
            <div class="product-card-header">
                <div class="product-card-info" style="margin-left: 0;">
                    <h4>${p.title}</h4>
                    <p>ID: ${p.id}</p>
                    <p>Stock: ${p.quantity || 0}</p>
                    <span class="badge badge-${p.stock === 'in' || !p.stock ? 'success' : p.stock === 'low' ? 'warning' : 'danger'}">
                        ${p.stock === 'in' || !p.stock ? 'In Stock' : p.stock === 'low' ? 'Low Stock' : 'Out of Stock'}
                    </span>
                </div>
            </div>
            <div class="product-card-actions">
                <button class="btn btn-secondary btn-small" onclick="toggleStock('${p.id}')" style="flex: 1;">
                    Toggle Stock
                </button>
            </div>
        </div>
    `).join('');
}

function searchInventory() {
    renderInventory(document.getElementById('inventorySearch').value);
}

function toggleSelectAll() {
    const checkboxes = document.querySelectorAll('.inventory-check');
    const selectAll = document.getElementById('selectAll');
    checkboxes.forEach(cb => cb.checked = selectAll.checked);
}

async function bulkUpdateStock() {
    const checked = document.querySelectorAll('.inventory-check:checked');
    if (checked.length === 0) {
        showToast('Select products first!');
        return;
    }

    const action = prompt('Enter: in/out/low or quantity number');
    if (!action) return;

    let updateCount = 0;
    const errors = [];

    for (const cb of checked) {
        const id = cb.dataset.id;
        let updateData = {};
        if (['in', 'out', 'low'].includes(action)) {
            updateData = { stock: action === 'in' };
        } else {
            updateData = { quantity: parseInt(action) || 0 };
        }

        const { error } = await supabaseClient
            .from("products")
            .update(updateData)
            .eq("product_id", id)
            .select();

        if (error) {
            errors.push(`${id}: ${error.message}`);
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

    await loadProductsFromSupabase();
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
            categoryStats[p.category] = { count: 0, totalPrice: 0 };
        }
        categoryStats[p.category].count++;
        categoryStats[p.category].totalPrice += p.price || 0;
    });

    document.getElementById('analyticsTotal').textContent = products.length;

    const avgPrice = products.length > 0 ? Math.round(products.reduce((sum, p) => sum + (p.price || 0), 0) / products.length) : 0;
    document.getElementById('avgPrice').textContent = `₹${avgPrice.toLocaleString()}`;

    const topCat = Object.entries(categoryStats).sort((a, b) => b[1].count - a[1].count)[0];
    document.getElementById('topCategory').textContent = topCat ? topCat[0] : '-';

    document.getElementById('categoryStats').innerHTML = Object.entries(categoryStats).map(([cat, stats]) => `
        <tr>
            <td>${cat}</td>
            <td>${stats.count}</td>
            <td>₹${Math.round(stats.totalPrice / stats.count).toLocaleString()}</td>
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
                        quantity: p.quantity || 0
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
        console.error(error);
        showToast("Failed to load products");
        return;
    }

    products = data.map(p => ({
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
        stock: p.stock ? "in" : "out",
        quantity: p.quantity || 0
    }));
    
    renderProductsTable();
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

async function deleteProduct(id) {
    if (!confirm("Delete this product? This cannot be undone.")) return;

    const { error } = await supabaseClient
        .from("products")
        .delete()
        .eq("product_id", id)
        .select();

    if (error) {
        console.error(error);
        showToast("Delete failed: " + error.message);
        return;
    }

    logActivity('Deleted product', id, 'Product removed');
    await loadProductsFromSupabase();
    showToast("Product deleted");
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

async function toggleStock(id) {
    const product = products.find(p => p.id === id);
    if (!product) return;

    const isCurrentlyInStock = product.stock === "in";
    const newStockBoolean = !isCurrentlyInStock;
    
    product.stock = newStockBoolean ? "in" : "out";
    renderInventory(document.getElementById('inventorySearch').value);

    const { error } = await supabaseClient
        .from("products")
        .update({ stock: newStockBoolean })
        .eq("product_id", id)
        .select();

    if (error) {
        console.error(error);
        showToast("Database update failed");
        product.stock = isCurrentlyInStock ? "in" : "out";
        renderInventory();
        return;
    }

    logActivity('Stock toggle', id, newStockBoolean ? 'In stock' : 'Out of stock');
    showToast("Stock updated");
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

document.addEventListener("DOMContentLoaded", () => {

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