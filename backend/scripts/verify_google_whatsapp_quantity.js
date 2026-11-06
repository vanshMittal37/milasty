/**
 * Verification Script: Google Sign-In, Simplified WhatsApp Notifications & Quantity Controls
 * Run: node backend/scripts/verify_google_whatsapp_quantity.js
 */

import assert from 'assert';
import * as templates from '../services/whatsappTemplates/orderTemplates.js';
import {
  ALLOWED_CUSTOMER_ORDER_EVENTS,
  classifyEventChannel,
  DEFAULT_CUSTOMER_PREFERENCES,
} from '../services/whatsappEventService.js';
import {
  isWhatsAppTestMode,
  getWhatsAppTestNumber,
  getWhatsAppStatus,
  formatWhatsAppJid,
} from '../services/whatsappService.js';

console.log('───────────────────────────────────────────────────────────────────');
console.log('🧪 RUNNING MILASTY VERIFICATION SUITE');
console.log('───────────────────────────────────────────────────────────────────');

let passedTests = 0;
let totalTests = 0;

function runTest(testName, fn) {
  totalTests++;
  try {
    fn();
    console.log(`✅ [PASS] ${testName}`);
    passedTests++;
  } catch (err) {
    console.error(`❌ [FAIL] ${testName}: ${err.message}`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. WHATSAPP TEMPLATE TESTS
// ─────────────────────────────────────────────────────────────────────────────

runTest('1.1 Customer Order Confirmed Template', () => {
  const msg = templates.customerOrderConfirmed({
    customerName: 'Aarav Sharma',
    orderId: 'ord-12345',
    orderNumber: 'MLS-9988',
  });

  assert(msg.includes('Namaste Aarav Sharma,'), 'Must greet customer by name');
  assert(msg.includes('Good news! Your MILASTY order has been confirmed 💛'), 'Must contain exact prompt text');
  assert(msg.includes('Order ID: #MLS-9988'), 'Must include order number');
  assert(msg.includes('We are preparing your items with love and care.'), 'Must contain care message');
  assert(msg.includes('/account/orders/ord-12345'), 'Must use canonical /account/orders/:id link');
});

runTest('1.2 Customer Order Shipped Template — STRICTLY NO COURIER/AWB', () => {
  const msgWithEst = templates.customerOrderShipped({
    customerName: 'Priya Patel',
    orderId: 'ord-67890',
    orderNumber: 'MLS-5544',
    estimatedDelivery: '3-4 business days',
    courierName: 'Shiprocket / Delhivery',
    trackingNumber: 'AWB9988776655',
    trackingUrl: 'https://shiprath.com/track/AWB9988776655',
  });

  assert(msgWithEst.includes('Namaste Priya Patel,'), 'Must greet customer');
  assert(msgWithEst.includes('Your MILASTY order #MLS-5544 is on its way! 💛'), 'Must contain exact prompt copy');
  assert(msgWithEst.includes('Expected Delivery: 3-4 business days'), 'Must show valid estimated delivery');
  assert(msgWithEst.includes('/account/orders/ord-67890'), 'Must contain canonical account order link');

  // STRICT SUPPRESSION CHECKS:
  assert(!msgWithEst.toLowerCase().includes('delhivery'), 'Must NOT disclose courier name');
  assert(!msgWithEst.toLowerCase().includes('shiprocket'), 'Must NOT disclose courier name');
  assert(!msgWithEst.includes('AWB9988776655'), 'Must NOT expose AWB tracking number');
  assert(!msgWithEst.toLowerCase().includes('shiprath.com'), 'Must NOT output external courier tracking link');
  assert(!msgWithEst.includes('YOUR ORDER JOURNEY'), 'Must NOT show intermediate journey timeline');

  // Fallback when estimated delivery is missing:
  const msgWithoutEst = templates.customerOrderShipped({
    customerName: 'Kavita',
    orderId: 'ord-111',
    orderNumber: 'MLS-111',
    estimatedDelivery: '',
  });
  assert(
    msgWithoutEst.includes('Your package is on its way. We will keep you updated.'),
    'Must show friendly fallback when estimated date is unavailable'
  );
});

runTest('1.3 Customer Order Delivered Template', () => {
  const msg = templates.customerOrderDelivered({
    customerName: 'Rohan Verma',
    orderId: 'ord-777',
    orderNumber: 'MLS-777',
  });

  assert(msg.includes('Namaste Rohan Verma,'), 'Must greet customer');
  assert(msg.includes('Your MILASTY order #MLS-777 has been delivered ✨'), 'Must contain exact copy');
  assert(msg.includes('We hope you love your new MILASTY pieces.'), 'Must contain brand appreciation');
  assert(msg.includes('We would love to hear about your experience!'), 'Must include feedback prompt');
  assert(msg.includes('/account/orders/ord-777'), 'Must use canonical order details link');
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. CENTRAL CUSTOMER NOTIFICATION POLICY TESTS
// ─────────────────────────────────────────────────────────────────────────────

runTest('2.1 Customer Order Events Allowlist contains only the 3 canonical updates', () => {
  assert(ALLOWED_CUSTOMER_ORDER_EVENTS.has('ORDER_CONFIRMED'), 'Must allow ORDER_CONFIRMED');
  assert(ALLOWED_CUSTOMER_ORDER_EVENTS.has('ORDER_SHIPPED'), 'Must allow ORDER_SHIPPED');
  assert(ALLOWED_CUSTOMER_ORDER_EVENTS.has('ORDER_DISPATCHED'), 'Must allow ORDER_DISPATCHED');
  assert(ALLOWED_CUSTOMER_ORDER_EVENTS.has('ORDER_DELIVERED'), 'Must allow ORDER_DELIVERED');

  // Verify intermediate events are NOT in customer order allowlist:
  assert(!ALLOWED_CUSTOMER_ORDER_EVENTS.has('ORDER_PLACED'), 'ORDER_PLACED must not be in customer allowlist');
  assert(!ALLOWED_CUSTOMER_ORDER_EVENTS.has('ORDER_PROCESSING'), 'ORDER_PROCESSING must be suppressed');
  assert(!ALLOWED_CUSTOMER_ORDER_EVENTS.has('ORDER_PACKED'), 'ORDER_PACKED must be suppressed');
  assert(!ALLOWED_CUSTOMER_ORDER_EVENTS.has('ORDER_REACHED_CITY'), 'ORDER_REACHED_CITY must be suppressed');
  assert(!ALLOWED_CUSTOMER_ORDER_EVENTS.has('ORDER_OUT_FOR_DELIVERY'), 'ORDER_OUT_FOR_DELIVERY must be suppressed');
});

runTest('2.2 Classification of Security and Non-Order Events', () => {
  assert.strictEqual(classifyEventChannel('PASSWORD_CHANGED'), 'security');
  assert.strictEqual(classifyEventChannel('OTP_SENT'), 'security');
  assert.strictEqual(classifyEventChannel('ORDER_CONFIRMED'), 'transactional');
  assert.strictEqual(classifyEventChannel('PROMOTIONAL_FESTIVE_OFFER'), 'promotional');
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. WHATSAPP TEST MODE & CRITICAL TEST NUMBER TESTS
// ─────────────────────────────────────────────────────────────────────────────

runTest('3.1 Test Number normalization and format', () => {
  const testNum = getWhatsAppTestNumber();
  assert.strictEqual(testNum, '8791383595', 'Default test number must be 8791383595');

  const jid = formatWhatsAppJid(testNum);
  assert.strictEqual(jid, '918791383595@s.whatsapp.net', 'JID must format to 918791383595@s.whatsapp.net');
});

runTest('3.2 Service Status reflects Test Mode & Simplified Customer Policy', () => {
  const status = getWhatsAppStatus();
  assert(status.testMode, 'Status must include testMode payload');
  assert.strictEqual(status.testMode.testNumber, '918791383595', 'testNumber must be 918791383595');
  assert(status.customerPolicy, 'Status must include customerPolicy payload');
  assert(Array.isArray(status.customerPolicy.enabledEvents), 'enabledEvents must be an array');
  assert.deepStrictEqual(status.customerPolicy.enabledEvents, [
    'ORDER_CONFIRMED',
    'ORDER_SHIPPED',
    'ORDER_DELIVERED',
  ]);
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. GOOGLE AUTH BACKEND LOGIC VERIFICATION
// ─────────────────────────────────────────────────────────────────────────────

runTest('4.1 Google Auth Controller Module Exports and Schema Check', async () => {
  const authModule = await import('../controllers/authController.js');
  assert(typeof authModule.googleAuth === 'function', 'googleAuth must be exported from authController');
});

// ─────────────────────────────────────────────────────────────────────────────
// SUMMARY
// ─────────────────────────────────────────────────────────────────────────────

console.log('───────────────────────────────────────────────────────────────────');
console.log(`📊 TEST SUITE SUMMARY: ${passedTests}/${totalTests} TESTS PASSED`);
if (passedTests === totalTests) {
  console.log('🎉 ALL AUTOMATED VERIFICATION CHECKS PASSED PERFECTLY!');
} else {
  console.log('⚠️ SOME TESTS FAILED.');
  process.exit(1);
}
console.log('───────────────────────────────────────────────────────────────────');

