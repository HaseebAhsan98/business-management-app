const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://heqwheucrnlrrhefjufn.supabase.co';
const supabaseKey = 'sb_publishable_9ObMKpHncUpevznyhs_h6A_uScDIfjY';
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  console.log("Checking connection to Supabase...");
  const { data, error } = await supabase.from('users').select('*').limit(1);
  if (error) {
    console.log("Supabase responded with code:", error.code, "message:", error.message);
  } else {
    console.log("Successfully connected! Data:", data);
  }
}

check();
