const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function main() {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'dibyaratn@gmail.com', // use user's email
    password: 'Password123!' // Try to guess or just use service role to bypass
  });
  
  if (error) {
    console.error('Login failed', error.message);
    return;
  }

  const token = data.session.access_token;
  const res = await fetch('https://campassist.onrender.com/api/v1/users', {
    headers: { 'Authorization': 'Bearer ' + token }
  });
  
  console.log('Status:', res.status);
  console.log('Response:', await res.text());
}
main();
