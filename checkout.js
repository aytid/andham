// Global variables
requireLogin();
let checkoutCart = [];
let selectedPaymentMethod = '';
let currentOrderNumber = '';
let paymentStartTime = null;
let paymentCheckInterval = null;

// Validation Configuration
const validationRules = {
    email: {
        required: true,
        alwaysRequired: true,
        validator: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
        message: 'Please enter a valid email address'
    },
    phone: {
        required: true,
        alwaysRequired: true,
        validator: (v) => /^\d{10}$/.test(v),
        message: 'Please enter a valid 10-digit phone number'
    },
    fullName: {
        required: true,
        alwaysRequired: true,
        validator: (v) => v.trim().length >= 3,
        message: 'Please enter your full name (min 3 characters)'
    },
    address1: {
        required: true,
        primaryOnly: true,
        validator: (v) => v.trim().length >= 5,
        message: 'Please enter your street address'
    },
    address2: {
        required: true,
        secondaryOnly: true,
        validator: (v) => v.trim().length >= 5,
        message: 'Please enter your delivery address'
    },
    city: {
        required: true,
        primaryOnly: true,
        validator: (v) => v.trim().length >= 2,
        message: 'Please enter your city'
    },
    state: {
        required: true,
        primaryOnly: true,
        validator: (v) => v !== '',
        message: 'Please select your state'
    },
    pincode: {
        required: true,
        primaryOnly: true,
        validator: (v) => /^\d{6}$/.test(v),
        message: 'Please enter a valid 6-digit PIN code'
    }
};

// Initialize page
document.addEventListener('DOMContentLoaded', async function () {
    const user = getCurrentUser();

    if (!user) {
        window.location.href = "login.html?redirect=checkout.html";
        return;
    }

    await loadCheckoutCart();
    updateCartBadge();

    if (user) {
        const { data, error } = await supabaseClient
            .from("users")
            .select("*")
            .eq("user_id", user.user_id)
            .single();

        if (data) {
            document.getElementById('email').value = data.email || '';
            document.getElementById('phone').value = data.phone || '';
            document.getElementById('fullName').value = data.user_name || '';
            document.getElementById('address1').value = data.address || '';
            document.getElementById('address2').value = data.secondary_address || '';
            document.getElementById('city').value = data.city || '';
            document.getElementById('pincode').value = data.pincode || '';

            const stateSelect = document.getElementById("state");
            if (data.state && stateSelect) {
                stateSelect.value = data.state;
            }
        }
    }
    
    setupRealTimeValidation();
    checkReturnFromPayment();
});

// Load Cart
async function loadCheckoutCart() {
    const user = getCurrentUser();

    if (!user) {
        showToast("Please login to continue");
        window.location.href = "login.html?redirect=checkout.html";
        return;
    }

    const { data, error } = await supabaseClient
        .from("cart")
        .select(`
            cart_id,
            quantity,
            product_id,
            products (
                product_id,
                title,
                price,
                image,
                category
            )
        `)
        .eq("user_id", user.user_id);

    if (error) {
        console.error("Cart fetch error:", error);
        return;
    }

    checkoutCart = data.map(item => ({
        product_id: item.product_id,
        quantity: item.quantity,
        product: item.products
    }));

    if (checkoutCart.length === 0) {
        document.getElementById('checkoutContainer').style.display = 'none';
        document.getElementById('emptyCart').style.display = 'block';
        return;
    }

    renderOrderSummary();
}

// Render Order Summary
function renderOrderSummary() {
    const container = document.getElementById('orderItems');
    let subtotal = 0;
    let html = '';

    for (const item of checkoutCart) {
        const product = item.product || {};
        const price = parseFloat(product.price) || 0;
        const qty = parseInt(item.quantity) || 1;
        const itemTotal = price * qty;

        subtotal += itemTotal;

        html += `
<div class="cart-summary-item" 
     onclick="window.open('product.html?id=${item.product_id}', '_blank')" 
     style="cursor:pointer">
    <img src="${product.image || 'https://png.pngtree.com/png-vector/20190820/ourmid/pngtree-no-image-vector-illustration-isolated-png-image_1694547.jpg'}" 
         alt="${product.title || 'Product'}"
         onerror="this.src='https://png.pngtree.com/png-vector/20190820/ourmid/pngtree-no-image-vector-illustration-isolated-png-image_1694547.jpg'">
    <div class="cart-summary-details">
        <div class="cart-summary-title">${product.title || 'Unknown'}</div>
        <div class="cart-summary-meta">${product.category || ''} • Qty: ${qty}</div>
        <div class="cart-summary-price">Rs. ${itemTotal.toLocaleString()}</div>
    </div>
</div>
`;
    }

    container.innerHTML = html;

    const total = subtotal;
    document.getElementById('subtotal').textContent = `Rs. ${subtotal.toLocaleString()}`;
    document.getElementById('shipping').textContent = 'Free';
    document.getElementById('total').textContent = `Rs. ${total.toLocaleString()}`;
}

// Clear All Errors
function clearAllErrors() {
    document.querySelectorAll('.form-group').forEach(group => {
        group.classList.remove('error', 'error-shake', 'success');
    });
}

// Validate Single Field
function validateField(fieldId) {
    const element = document.getElementById(fieldId);
    const formGroup = element?.closest('.form-group');
    const rule = validationRules[fieldId];
    
    if (!element || !rule) return true;
    
    const useDifferentAddress = document.getElementById('useDifferentAddress')?.checked || false;
    
    if (rule.primaryOnly && useDifferentAddress) return true;
    if (rule.secondaryOnly && !useDifferentAddress) return true;
    
    const value = element.value.trim();
    const isValid = !rule.required || (value && rule.validator(value));
    
    if (formGroup) {
        formGroup.classList.remove('error', 'success');
        if (!isValid && value) {
            formGroup.classList.add('error');
        } else if (isValid && value) {
            formGroup.classList.add('success');
        }
    }
    
    return isValid;
}

// Main Validation Function
function validateCheckoutForm() {
    clearAllErrors();
    
    const useDifferentAddress = document.getElementById('useDifferentAddress')?.checked || false;
    const errors = [];
    
    let fieldsToValidate = [];
    
    for (const [fieldId, rule] of Object.entries(validationRules)) {
        if (rule.alwaysRequired) {
            fieldsToValidate.push(fieldId);
            continue;
        }
        
        if (useDifferentAddress) {
            if (rule.secondaryOnly || fieldId === 'email') {
                fieldsToValidate.push(fieldId);
            }
        } else {
            if (rule.primaryOnly || fieldId === 'email') {
                fieldsToValidate.push(fieldId);
            }
        }
    }
    
    for (const fieldId of fieldsToValidate) {
        const rule = validationRules[fieldId];
        const element = document.getElementById(fieldId);
        const value = element?.value?.trim() || '';
        const formGroup = element?.closest('.form-group');
        
        if (!value) {
            errors.push({ fieldId, type: 'empty', message: rule.message });
            if (formGroup) formGroup.classList.add('error');
        } else if (!rule.validator(value)) {
            errors.push({ fieldId, type: 'invalid', message: rule.message });
            if (formGroup) formGroup.classList.add('error');
        }
    }
    
    if (errors.length > 0) {
        const firstError = errors[0];
        const firstElement = document.getElementById(firstError.fieldId);
        const firstGroup = firstElement?.closest('.form-group');
        
        if (firstElement) {
            firstElement.focus();
            firstElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            
            if (firstGroup) {
                firstGroup.classList.add('error-shake');
                setTimeout(() => firstGroup.classList.remove('error-shake'), 500);
            }
        }
        
        const errorCount = errors.length;
        const message = errorCount === 1 
            ? `Please fill the required field: ${getFieldLabel(firstError.fieldId)}`
            : `Please fill all required fields (${errorCount} remaining)`;
        
        showValidationToast(message);
        
        errors.slice(1).forEach((error, index) => {
            setTimeout(() => {
                const group = document.getElementById(error.fieldId)?.closest('.form-group');
                if (group) {
                    group.classList.add('error-shake');
                    setTimeout(() => group.classList.remove('error-shake'), 500);
                }
            }, (index + 1) * 100);
        });
        
        return false;
    }
    
    return true;
}

// Helper: Get Field Label
function getFieldLabel(fieldId) {
    const labels = {
        email: 'Email',
        phone: 'Phone',
        fullName: 'Full Name',
        address1: 'Address',
        address2: 'Delivery Address',
        city: 'City',
        state: 'State',
        pincode: 'PIN Code'
    };
    return labels[fieldId] || fieldId;
}

// Show Validation Toast
function showValidationToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = 'toast validation-toast show';
    
    clearTimeout(toast.hideTimeout);
    toast.hideTimeout = setTimeout(() => {
        toast.classList.remove('show', 'validation-toast');
    }, 4000);
}

// Setup Real-time Validation
function setupRealTimeValidation() {
    for (const fieldId of Object.keys(validationRules)) {
        const element = document.getElementById(fieldId);
        if (!element) continue;
        
        element.addEventListener('blur', () => {
            validateField(fieldId);
        });
        
        element.addEventListener('input', function() {
            const group = this.closest('.form-group');
            if (group) {
                group.classList.remove('error', 'error-shake');
                const rule = validationRules[fieldId];
                if (rule && rule.validator(this.value.trim())) {
                    group.classList.add('success');
                } else {
                    group.classList.remove('success');
                }
            }
        });
    }
    
    const checkbox = document.getElementById('useDifferentAddress');
    if (checkbox) {
        checkbox.addEventListener('change', function() {
            clearAllErrors();
            document.querySelectorAll('.form-group').forEach(g => g.classList.remove('success'));
        });
    }
}

// Toggle Address Form
function toggleAddressForm() {
    const checkbox = document.getElementById("useDifferentAddress");
    const primaryFields = document.getElementById("primaryAddressFields");
    const secondaryField = document.getElementById("secondaryAddressGroup");
    
    clearAllErrors();
    document.querySelectorAll('.form-group').forEach(g => g.classList.remove('success'));

    if (checkbox.checked) {
        primaryFields.style.display = "none";
        secondaryField.style.display = "block";
        
        const user = getCurrentUser();
        if (user && user.secondary_address) {
            document.getElementById("address2").value = user.secondary_address;
        }
        
        setTimeout(() => document.getElementById("address2")?.focus(), 100);
    } else {
        primaryFields.style.display = "block";
        secondaryField.style.display = "none";
    }
}

// Calculate Total
function calculateTotal() {
    const subtotal = checkoutCart.reduce((sum, item) => {
        return sum + ((item.product?.price || 0) * (item.quantity || 1));
    }, 0);
    return subtotal;
}

// Place Order
async function placeOrder() {
    if (!validateCheckoutForm()) {
        return;
    }

    const btn = document.getElementById('placeOrderBtn');
    if (btn.disabled) return;

    const spinner = document.getElementById('loadingSpinner');
    const btnText = document.getElementById('btnText');

    btn.disabled = true;
    spinner.style.display = 'inline-block';
    btnText.textContent = 'Opening Payment...';

    try {
        const user = getCurrentUser();

        if (!user) {
            showToast("Please login to continue");
            window.location.href = "login.html?redirect=checkout.html";
            return;
        }

        const amount = calculateTotal();
        const orderNumber = "ORD-" + Date.now();

        startRazorpayPayment(user.user_id, orderNumber, amount);

    } catch (error) {
        console.error(error);
        showToast("Payment failed");

        btn.disabled = false;
        spinner.style.display = 'none';
        btnText.textContent = 'Place Order';
    }
}

// Start Razorpay Payment
function startRazorpayPayment(userId, orderNumber, amount) {
    const options = {
        key: "rzp_live_SRVTReKEmGiNZl",
        amount: amount * 100,
        currency: "INR",
        name: "Andham",
        description: "Order " + orderNumber,
        handler: async function (response) {
            const paymentId = response.razorpay_payment_id;

            try {
                await createOrder(
                    userId,
                    orderNumber,
                    amount,
                    paymentId,
                    "razorpay",
                    "paid"
                );
            } catch (error) {
                showToast("Order creation failed");
            }
        },
        prefill: {
            name: document.getElementById("fullName").value,
            email: document.getElementById("email").value,
            contact: document.getElementById("phone").value
        },
        theme: {
            color: "#8b0000"
        }
    };

    const rzp = new Razorpay(options);
    rzp.open();
}

// Create Order
async function createOrder(userId, orderNumber, total, paymentId, paymentMethod, paymentStatus) {
    try {
        const useDifferentAddress = document.getElementById('useDifferentAddress')?.checked || false;
        
        let shippingAddress;
        
        if (useDifferentAddress) {
            shippingAddress = {
                name: document.getElementById('fullName').value.trim(),
                address: document.getElementById('address2').value.trim(),
                city: 'N/A',
                state: 'N/A',
                pincode: 'N/A',
                country: 'India',
                phone: document.getElementById('phone').value.trim(),
                email: document.getElementById('email').value.trim(),
                address_type: 'secondary'
            };
        } else {
            shippingAddress = {
                name: document.getElementById('fullName').value.trim(),
                address: document.getElementById('address1').value.trim(),
                city: document.getElementById('city').value.trim(),
                state: document.getElementById('state').value,
                pincode: document.getElementById('pincode').value.trim(),
                country: 'India',
                phone: document.getElementById('phone').value.trim(),
                email: document.getElementById('email').value.trim(),
                address_type: 'primary'
            };
        }

        const { data: order, error: orderError } = await supabaseClient
            .from('orders')
            .insert({
                user_id: userId,
                order_number: orderNumber,
                total_amount: total,
                shipping_address: shippingAddress,
                payment_method: paymentMethod,
                payment_id: paymentId,
                status: 'confirmed',
                payment_status: paymentStatus
            })
            .select()
            .single();

        if (orderError) throw orderError;

        const orderItems = checkoutCart.map(item => ({
            order_id: order.order_id,
            product_id: String(item.product_id),
            product_name: item.product.title,
            quantity: parseInt(item.quantity),
            unit_price: parseFloat(item.product.price),
            total_price: parseFloat(item.product.price * item.quantity)
        }));

        const { error: itemsError } = await supabaseClient
            .from('order_items')
            .insert(orderItems);

        if (itemsError) throw itemsError;

        await supabaseClient.from('cart').delete().eq('user_id', userId);
        localStorage.removeItem('andham_cart');
        localStorage.removeItem('activePayment');

        window.location.href = `order-success.html?order=${orderNumber}&payment=${paymentId || 'pending'}&method=${paymentMethod}&status=${paymentStatus}`;

    } catch (error) {
        console.error('Create order error:', error);
        throw error;
    }
}

// Show Toast
function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.style.opacity = '1';
    toast.style.transform = 'translateX(-50%) translateY(0)';
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(-50%) translateY(100px)';
    }, 3000);
}

// Check Return From Payment
function checkReturnFromPayment() {
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get('payment_status');
    const orderNumber = urlParams.get('order');
    
    if (paymentStatus === 'success' && orderNumber) {
        showToast('Payment completed successfully!');
    } else if (paymentStatus === 'failed') {
        showToast('Payment failed. Please try again.');
    }
}

// Handle Visibility Change
function handleVisibilityChange() {
    if (document.visibilityState === 'visible') {
        const orderData = JSON.parse(localStorage.getItem('activePayment') || '{}');
        if (orderData && orderData.status === 'pending') {
            console.log('Page visible, checking payment status...');
        }
    }
}

document.addEventListener('visibilitychange', handleVisibilityChange);