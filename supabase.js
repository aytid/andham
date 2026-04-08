//const SUPABASE_URL = "https://lstmvrrqfrlyxcdboybt.supabase.co";
//const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxzdG12cnJxZnJseXhjZGJveWJ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0NjY3NDgsImV4cCI6MjA4OTA0Mjc0OH0.-YdYgC30dTnsSshuVIFIkiQkgJyq1_djrkZfjIbMBeg";
const SUPABASE_URL = "https://cxoammatkxhqizfjqhvs.supabase.co";
const SUPABASE_KEY = "sb_publishable_JiMcO6pY2vY5Np6PYNDhhw_lgRmO4e4";


const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

async function addProduct(name, price) {
    const { data, error } = await supabaseClient
        .from('products')
        .insert([{ name: name, price: price }]);
}
async function loginWithGoogle() {
    const { error } = await supabaseClient.auth.signInWithOAuth({
        provider: "google",
        options: {
            redirectTo: window.location.origin + '/index.html' 
        }
    });

    if (error) {
        console.error("Google login error:", error);
        showToast("Google login failed", "error");
    }
}

async function checkUser() {
    const { data: { user } } = await supabaseClient.auth.getUser();

    if (user) {
        console.log("User logged in:", user);
    } else {
        console.log("No user logged in");
    }
}

async function getUserProfile() {
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) return;
    const { data, error } = await supabaseClient
        .from("users")
        .select("*")
        .eq("user_id", user.id)
        .single();
    console.log("User profile:", data);
}

async function checkAuth() {
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (user && window.location.pathname.includes("login")) {
        window.location.href = "/";
    }

}

// NOTE: getCurrentUser() is defined in script.js and auth.js for custom auth (users table)
// Not used: supabaseClient.auth.getUser() - that's for OAuth, which this app doesn't use

async function requireLogin() {
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
        window.location.href = "/login.html";
    }

}

async function handleGoogleSession() {
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) return;
    const userData = {
        user_id: user.id,
        user_name: user.user_metadata.full_name,
        email: user.email,
        phone: null,
        address: null,
        city: null,
        state: null,
        pincode: null,
        country: "India",
        login_at: new Date().toISOString()
    };
    localStorage.setItem("andham_user", JSON.stringify(userData));
}

// Note: checkUser() and handleGoogleSession() are NOT auto-called.
// The app uses custom auth (users table), not Supabase OAuth.
// Calling supabaseClient.auth.getUser() on every page causes noisy
// "No user logged in" console errors since there is no OAuth session.