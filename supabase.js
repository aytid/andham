const SUPABASE_URL = "https://lstmvrrqfrlyxcdboybt.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxzdG12cnJxZnJseXhjZGJveWJ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0NjY3NDgsImV4cCI6MjA4OTA0Mjc0OH0.-YdYgC30dTnsSshuVIFIkiQkgJyq1_djrkZfjIbMBeg";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

async function addProduct(name, price) {
    const { data, error } = await supabaseClient
        .from('products')
        .insert([{ name: name, price: price }]);
}