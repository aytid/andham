// ============================================
// AUTHENTICATION & USER MANAGEMENT
// ============================================

// Get current user from storage
function getCurrentUser() {
    const user = localStorage.getItem('andham_user') || sessionStorage.getItem('andham_user');
    return user ? JSON.parse(user) : null;
}

// Check if user is logged in
function isLoggedIn() {
    return getCurrentUser() !== null;
}

// Show toast notification
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    if (!toast) return;
    
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Toggle password visibility
function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    if (input) {
        input.type = input.type === 'password' ? 'text' : 'password';
    }
}

// Toggle between login and signup forms
function showForm(formType) {
    // Hide all forms
    document.querySelectorAll('.auth-form').forEach(form => {
        form.classList.remove('active');
    });
    
    // Remove active class from tabs
    document.querySelectorAll('.toggle-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    // Show selected form
    if (formType === 'signin') {
        const signinForm = document.getElementById('signinForm');
        const signinTab = document.getElementById('signinTab');
        if (signinForm) signinForm.classList.add('active');
        if (signinTab) signinTab.classList.add('active');
    } else if (formType === 'signup') {
        const signupForm = document.getElementById('signupForm');
        const signupTab = document.getElementById('signupTab');
        if (signupForm) signupForm.classList.add('active');
        if (signupTab) signupTab.classList.add('active');
    }
}

// ============================================
// SIGN UP
// ============================================

async function handleSignUp(e) {
    if (e) e.preventDefault();
    
    const userName = document.getElementById('userName')?.value.trim();
    const email = document.getElementById('signupEmail')?.value.trim();
    const phone = document.getElementById('signupPhone')?.value.trim();
    const password = document.getElementById('signupPassword')?.value;
    const confirmPassword = document.getElementById('confirmPassword')?.value;

    // Validation
    if (!userName || !email || !password) {
        showToast('Please fill all required fields', 'error');
        return false;
    }

    if (password !== confirmPassword) {
        showToast('Passwords do not match', 'error');
        return false;
    }

    if (password.length < 6) {
        showToast('Password must be at least 6 characters', 'error');
        return false;
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showToast('Please enter a valid email address', 'error');
        return false;
    }

    try {
        // Check if email already exists
        const { data: existingEmail, error: emailCheckError } = await supabaseClient
            .from('users')
            .select('email')
            .eq('email', email)
            .maybeSingle();

        if (existingEmail) {
            showToast('Email already registered. Please sign in.', 'error');
            showForm('signin');
            return false;
        }

        // Check if phone already exists (if provided)
        if (phone) {
            const { data: existingPhone } = await supabaseClient
                .from('users')
                .select('phone')
                .eq('phone', phone)
                .maybeSingle();

            if (existingPhone) {
                showToast('Phone number already registered', 'error');
                return false;
            }
        }

        // Create new user
        const { data: newUser, error: insertError } = await supabaseClient
            .from('users')
            .insert({
                user_name: userName,
                email: email,
                phone: phone || null,
                password: password
            })
            .select()
            .single();

        if (insertError) {
            console.error('Insert error:', insertError);
            showToast('Failed to create account: ' + insertError.message, 'error');
            return false;
        }

        showToast('Account created successfully! Please sign in.', 'success');
        
        // Clear form and switch to sign in
        document.getElementById('signupForm')?.reset();
        
        setTimeout(() => {
            showForm('signin');
            // Pre-fill email in sign in form
            const signinEmail = document.getElementById('signinEmail');
            if (signinEmail) signinEmail.value = email;
        }, 1500);

        return true;

    } catch (error) {
        console.error('Sign up error:', error);
        showToast('Something went wrong. Please try again.', 'error');
        return false;
    }
}

// ============================================
// SIGN IN
// ============================================

async function handleSignIn(e) {
    if (e) e.preventDefault();
    
    const loginInput = document.getElementById('signinEmail')?.value.trim();
    const password = document.getElementById('signinPassword')?.value;
    const rememberMe = document.getElementById('rememberMe')?.checked;

    if (!loginInput || !password) {
        showToast('Please enter email/phone and password', 'error');
        return false;
    }

    try {
        let query;
        
        // Check if input is email or phone
        const isEmail = loginInput.includes('@');
        
        if (isEmail) {
            query = supabaseClient
                .from('users')
                .select('*')
                .eq('email', loginInput)
                .eq('password', password)
                .maybeSingle();
        } else {
            // Assume phone number
            query = supabaseClient
                .from('users')
                .select('*')
                .eq('phone', loginInput)
                .eq('password', password)
                .maybeSingle();
        }

        const { data: user, error } = await query;

        if (error || !user) {
            showToast('Invalid email/phone or password', 'error');
            return false;
        }

        // Create user session — store full profile so checkout can pre-fill without extra DB call
        const userData = {
            user_id:           user.user_id,
            user_name:         user.user_name,
            email:             user.email,
            phone:             user.phone,
            address:           user.address           || null,
            secondary_address: user.secondary_address || null,
            city:              user.city              || null,
            state:             user.state             || null,
            pincode:           user.pincode           || null,
            country:           user.country           || 'India',
            login_at:          new Date().toISOString()
        };

        // Store in appropriate storage
        if (rememberMe) {
            localStorage.setItem('andham_user', JSON.stringify(userData));
        } else {
            sessionStorage.setItem('andham_user', JSON.stringify(userData));
        }

        // Sync local cart to database
        await syncCartOnLogin(user.user_id);

        showToast(`Welcome back, ${user.user_name || 'User'}!`, 'success');
        
        // Redirect after short delay
        setTimeout(() => {
            const urlParams = new URLSearchParams(window.location.search);
            const redirect = urlParams.get('redirect') || 'index.html';
            window.location.href = "index.html";
        }, 1000);

        return true;

    } catch (error) {
        console.error('Sign in error:', error);
        showToast('Something went wrong. Please try again.', 'error');
        return false;
    }
}

// ============================================
// LOGOUT
// ============================================

function logout() {
    // Clear all storage
    localStorage.removeItem('andham_user');
    sessionStorage.removeItem('andham_user');
    
    // Optionally keep cart in localStorage for guest checkout
    // or clear it: localStorage.removeItem('andham_cart');
    
    showToast('You have been logged out', 'success');
    
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 1000);
}

// ============================================
// CART SYNC ON LOGIN
// ============================================

async function syncCartOnLogin(userId) {
    const localCart = JSON.parse(localStorage.getItem('andham_cart') || '[]');
    
    if (localCart.length === 0) return;
    
    try {
        // Merge each local cart item with database
        for (const item of localCart) {
            // Check if item already exists in database cart
            const { data: existingItem } = await supabaseClient
                .from('cart')
                .select('quantity')
                .eq('user_id', userId)
                .eq('product_id', item.product_id)
                .maybeSingle();
            
            if (existingItem) {
                // Update quantity (add local quantity to existing)
                await supabaseClient
                    .from('cart')
                    .update({ 
                        quantity: existingItem.quantity + item.quantity,
                        updated_at: new Date().toISOString()
                    })
                    .eq('user_id', userId)
                    .eq('product_id', item.product_id);
            } else {
                // Insert new item
                await supabaseClient
                    .from('cart')
                    .insert({
                        user_id: userId,
                        product_id: item.product_id,
                        quantity: item.quantity
                    });
            }
        }
        
        // Clear local cart after successful sync
        localStorage.removeItem('andham_cart');
        console.log('Cart synced successfully');
        
    } catch (error) {
        console.error('Cart sync error:', error);
        // Don't throw - login should still work even if cart sync fails
    }
}

// ============================================
// PASSWORD RECOVERY (Optional)
// ============================================

async function handleForgotPassword(e) {
    if (e) e.preventDefault();
    
    const email = document.getElementById('forgotEmail')?.value.trim();
    
    if (!email) {
        showToast('Please enter your email', 'error');
        return false;
    }
    
    try {
        // Check if email exists
        const { data: user } = await supabaseClient
            .from('users')
            .select('user_id')
            .eq('email', email)
            .maybeSingle();
        
        if (!user) {
            showToast('If this email exists, you will receive reset instructions', 'success');
            return true;
        }
        
        // In a real app, you would send an email here
        // For now, just show a message
        showToast('Password reset feature coming soon. Contact support.', 'success');
        
        return true;
        
    } catch (error) {
        console.error('Forgot password error:', error);
        showToast('Something went wrong', 'error');
        return false;
    }
}

// ============================================
// AUTH CHECK ON PAGE LOAD
// ============================================

function checkAuth() {
    const user = getCurrentUser();
    
    // Update UI based on auth state
    updateAuthUI(user);
    
    return user;
}

// Update UI elements based on login state
function updateAuthUI(user) {
    // Update header/account icon if exists
    const accountBtn = document.querySelector('.account-btn');
    if (accountBtn) {
        if (user) {
            accountBtn.innerHTML = `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                </svg>
                <span class="user-name">${user.user_name?.split(' ')[0] || 'Account'}</span>
            `;
            accountBtn.onclick = () => window.location.href = 'account.html';
        } else {
            accountBtn.onclick = () => window.location.href = 'login.html';
        }
    }
    
    // Show/hide logout buttons
    const logoutBtns = document.querySelectorAll('.logout-btn');
    logoutBtns.forEach(btn => {
        btn.style.display = user ? 'block' : 'none';
    });
}

// Protect route - redirect if not logged in
function requireAuth(redirectUrl = window.location.href) {
    if (!isLoggedIn()) {
        window.location.href = `login.html?redirect=${encodeURIComponent(redirectUrl)}`;
        return false;
    }
    return true;
}

// Redirect if already logged in (for login page)
function redirectIfLoggedIn() {
    if (isLoggedIn()) {
        const urlParams = new URLSearchParams(window.location.search);
        const redirect = urlParams.get('redirect') || 'index.html';
        window.location.href = redirect;
        return true;
    }
    return false;
}

// ============================================
// INITIALIZE
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    // Check auth state on every page
    checkAuth();
    
    // If on login page and already logged in, redirect
    if (document.getElementById('signinForm')) {
        redirectIfLoggedIn();
    }
});