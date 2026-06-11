const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Manually parse .env.local
const envPath = path.join(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = (match[2] || '').trim();
      if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
      if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
      process.env[key] = value;
    }
  });
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error('❌ Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are not loaded properly.');
  process.exit(1);
}

const supabase = createClient(url, key);

async function test() {
  console.log('Connecting to Supabase endpoint:', url);
  
  console.log('\n--- Checking Table Structures ---');
  
  const tables = ['kiosks', 'pricing', 'print_jobs', 'admin_sessions'];
  
  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('*').limit(1);
    if (error) {
      console.log(`❌ Table "${table}" query FAILED:`, error.message);
      if (error.message.includes('does not exist')) {
        console.log(`   👉 SUGGESTION: Run the SQL in schema.sql inside the Supabase SQL editor.`);
      }
    } else {
      console.log(`✅ Table "${table}" is ONLINE! Row count sample: ${data.length}`);
    }
  }
}

test();
