/**
 * MILASTY Email Diagnostic Script
 * Run: node scripts/testEmail.js
 * This tests every step of the forgot-password flow and logs exact errors.
 */
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const EMAIL_TO_TEST = process.argv[2] || 'mvansh322@gmail.com';

console.log('\n========================================');
console.log('  MILASTY Email Diagnostic Tool');
console.log('========================================\n');

// ── Step 1: Env Check ──────────────────────────────────────────
console.log('📋 STEP 1: Environment Variable Check');
const vars = {
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY ? `${process.env.SUPABASE_SECRET_KEY.substring(0, 20)}...` : 'MISSING',
  RESEND_API_KEY: process.env.RESEND_API_KEY ? `${process.env.RESEND_API_KEY.substring(0, 10)}...` : 'MISSING',
  FRONTEND_URL: process.env.FRONTEND_URL,
  EMAIL_FROM: process.env.EMAIL_FROM || '(not set — will use default)',
};
console.table(vars);

if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === 'your_resend_api_key_here') {
  console.error('\n❌ FATAL: RESEND_API_KEY is missing or still placeholder!');
  process.exit(1);
}

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SECRET_KEY) {
  console.error('\n❌ FATAL: SUPABASE_URL or SUPABASE_SECRET_KEY is missing!');
  process.exit(1);
}

// ── Step 2: Supabase Admin listUsers ──────────────────────────
console.log('\n📋 STEP 2: Supabase Admin API Test (listUsers)');
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } }
);
try {
  const { data, error } = await supabase.auth.admin.listUsers({ perPage: 1 });
  if (error) {
    console.error('❌ admin.listUsers FAILED:', error.message);
    console.log('   YOUR SUPABASE_SECRET_KEY IS THE WRONG TYPE.');
    console.log('   Go to: https://supabase.com/dashboard/project/vwstzycakjwjogtojzzg/settings/api');
    console.log('   Copy the "service_role" key (long JWT starting with "eyJ...")');
    console.log('   Set SUPABASE_SECRET_KEY=eyJ... in your .env');
  } else {
    console.log(`✅ admin.listUsers OK — total ${data?.users?.length} user(s)`);
  }
} catch (e) {
  console.error('❌ admin.listUsers EXCEPTION:', e.message);
}

// ── Step 3: generateLink ───────────────────────────────────────
console.log(`\n📋 STEP 3: generateLink for ${EMAIL_TO_TEST}`);
let recoveryUrl = null;
try {
  const { data: linkData, error: linkErr } = await supabase.auth.admin.generateLink({
    type: 'recovery',
    email: EMAIL_TO_TEST,
    options: {
      redirectTo: `${process.env.FRONTEND_URL || 'https://milasty.vercel.app'}/reset-password`,
    },
  });
  if (linkErr) {
    console.error('❌ generateLink FAILED:', linkErr.message);
  } else if (linkData?.properties?.action_link) {
    recoveryUrl = linkData.properties.action_link;
    console.log('✅ generateLink OK — URL:', recoveryUrl.substring(0, 80) + '...');
  } else {
    console.log('⚠️  generateLink returned no action_link:', JSON.stringify(linkData));
  }
} catch (e) {
  console.error('❌ generateLink EXCEPTION:', e.message);
}

// ── Step 4: Resend API email ───────────────────────────────────
console.log(`\n📋 STEP 4: Send Email via Resend to ${EMAIL_TO_TEST}`);
if (!recoveryUrl) {
  recoveryUrl = `${process.env.FRONTEND_URL || 'https://milasty.vercel.app'}/reset-password?test=true`;
  console.log('   Using dummy link (generateLink failed) — only testing delivery');
}

try {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM || 'MILASTY <onboarding@resend.dev>',
      to: [EMAIL_TO_TEST],
      subject: '[TEST] MILASTY Password Reset Diagnostic',
      html: `<div style="font-family:sans-serif;padding:24px;background:#FAF7F2;max-width:480px;margin:0 auto;border-radius:16px;border:1px solid #E8DCCB;"><h2 style="color:#244f21;">Email Test OK</h2><p>If you see this email, delivery is working!</p><p><a href="${recoveryUrl}" style="background:#244f21;color:#fff;padding:12px 24px;text-decoration:none;border-radius:10px;font-weight:bold;display:inline-block;">Reset Link</a></p><p style="font-size:0.8rem;color:#888;">Sent: ${new Date().toISOString()}</p></div>`,
    }),
  });

  const data = await response.json();
  console.log(`\n   HTTP Status: ${response.status}`);
  console.log('   Response:', JSON.stringify(data, null, 2));

  if (response.status === 200 || response.status === 201) {
    console.log(`\n✅ EMAIL SENT! Check inbox for ${EMAIL_TO_TEST}`);
  } else {
    console.error('\n❌ EMAIL FAILED.');
    if (data.statusCode === 403) {
      console.log('   403: onboarding@resend.dev can ONLY send to your Resend account email.');
      console.log('   If ' + EMAIL_TO_TEST + ' is NOT your Resend signup email, you need a custom domain.');
    }
    if (data.statusCode === 401) {
      console.log('   401: RESEND_API_KEY is invalid! Create a new one at https://resend.com/api-keys');
    }
  }
} catch (e) {
  console.error('\n❌ Resend fetch EXCEPTION:', e.message);
}

console.log('\n========================================');
console.log('  Diagnostic Complete');
console.log('========================================\n');
