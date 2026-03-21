const SUPABASE_URL = "https://lstmvrrqfrlyxcdboybt.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxzdG12cnJxZnJseXhjZGJveWJ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0NjY3NDgsImV4cCI6MjA4OTA0Mjc0OH0.-YdYgC30dTnsSshuVIFIkiQkgJyq1_djrkZfjIbMBeg";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

async function addProduct(name, price) {
    const { data, error } = await supabaseClient
        .from('products')
        .insert([{ name: name, price: price }]);
}
async function loginWithGoogle() {
    const { data, error } = await supabaseClient.auth.signInWithOAuth({
        provider: "google"
    });

    if (error) {
        console.error("Google login error:", error);
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

checkUser();

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

async function requireLogin() {

    const { data: { user } } = await supabaseClient.auth.getUser();

    if (!user) {
        window.location.href = "/login.html";
    }

}