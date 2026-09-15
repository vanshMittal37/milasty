import { supabase } from '../config/supabase.js';

async function listRpc() {
  const { data, error } = await supabase.rpc('help');
  console.log('rpc help:', data, error);
}

listRpc();
