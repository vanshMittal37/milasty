import { supabase } from '../config/supabase.js';

async function checkSupabaseTables() {
  console.log('Testing Supabase query for customer_inquiries...');
  const { data: customerInquiries, error: ciErr } = await supabase.from('customer_inquiries').select('*').limit(5);
  console.log('customer_inquiries error:', ciErr);
  console.log('customer_inquiries data:', customerInquiries);

  console.log('Testing Supabase query for contact_inquiries...');
  const { data: contactInquiries, error: coErr } = await supabase.from('contact_inquiries').select('*').limit(5);
  console.log('contact_inquiries error:', coErr);

  console.log('Testing Supabase query for inquiries...');
  const { data: inquiries, error: inqErr } = await supabase.from('inquiries').select('*').limit(5);
  console.log('inquiries error:', inqErr);

  console.log('Testing Supabase query for contacts...');
  const { data: contacts, error: cntErr } = await supabase.from('contacts').select('*').limit(5);
  console.log('contacts error:', cntErr);
}

checkSupabaseTables();
