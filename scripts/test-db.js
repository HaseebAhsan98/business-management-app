const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read from .env.local if available
let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://heqwheucrnlrrhefjufn.supabase.co';
let anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_9ObMKpHncUpevznyhs_h6A_uScDIfjY';
let secretKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const envPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const [k, ...v] = trimmed.split('=');
      const val = v.join('=').replace(/^["']|["']$/g, '');
      if (k === 'NEXT_PUBLIC_SUPABASE_URL') supabaseUrl = val;
      if (k === 'NEXT_PUBLIC_SUPABASE_ANON_KEY') anonKey = val;
      if (k === 'SUPABASE_SERVICE_ROLE_KEY') secretKey = val;
    }
  }
}

const anonClient = createClient(supabaseUrl, anonKey);
const adminClient = secretKey ? createClient(supabaseUrl, secretKey) : anonClient;

async function check() {
  console.log("Checking Supabase tables with admin client...");
  
  const { data: catData, error: catError } = await adminClient.from('categories').select('*');
  console.log("Categories:", { count: catData?.length, error: catError?.message });

  const { data: prodData, error: prodError } = await adminClient.from('products').select('*');
  console.log("Products:", { count: prodData?.length, error: prodError?.message });

  const { data: custData, error: custError } = await adminClient.from('customers').select('*');
  console.log("Customers:", { count: custData?.length, error: custError?.message });

  const { data: areaData, error: areaError } = await adminClient.from('areas').select('*');
  console.log("Areas:", { count: areaData?.length, error: areaError?.message });
}

check();
