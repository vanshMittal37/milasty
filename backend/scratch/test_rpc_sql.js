import { supabase } from '../config/supabase.js';

async function testRpc() {
  const sql = `
    CREATE TABLE IF NOT EXISTS public.customer_inquiries (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      inquiry_number VARCHAR(50) NOT NULL UNIQUE,
      user_id UUID DEFAULT NULL,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT DEFAULT '',
      message TEXT NOT NULL,
      status VARCHAR(20) NOT NULL DEFAULT 'new',
      admin_response TEXT DEFAULT '',
      admin_notes TEXT DEFAULT '',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      contacted_at TIMESTAMPTZ DEFAULT NULL,
      resolved_at TIMESTAMPTZ DEFAULT NULL,
      closed_at TIMESTAMPTZ DEFAULT NULL
    );
  `;

  const rpcNames = ['exec_sql', 'execute_sql', 'exec', 'run_sql', 'sql'];
  for (const name of rpcNames) {
    console.log(`Trying RPC '${name}'...`);
    const { data, error } = await supabase.rpc(name, { query: sql, sql: sql });
    if (!error) {
      console.log(`RPC '${name}' SUCCESS:`, data);
      return;
    } else {
      console.log(`RPC '${name}' failed:`, error.message);
    }
  }
}

testRpc();
