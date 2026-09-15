import { supabase } from '../config/supabase.js';

async function addStockColumn() {
  // Test running sql via rpc exec_sql if available, or postgres query
  const { data: rpcData, error: rpcErr } = await supabase.rpc('exec_sql', { sql: 'ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS stock integer DEFAULT 50;' });
  console.log('RPC exec_sql result:', rpcData, 'rpcErr:', rpcErr);

  if (rpcErr) {
    // Let's test if raw SQL can be executed or another rpc function exists
    const { data: rpcData2, error: rpcErr2 } = await supabase.rpc('pg_exec', { query: 'ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS stock integer DEFAULT 50;' });
    console.log('RPC pg_exec result:', rpcData2, 'rpcErr2:', rpcErr2);
  }
}

addStockColumn();
