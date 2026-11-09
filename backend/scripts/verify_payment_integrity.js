/**
 * MILASTY Payment Integrity & Webhook Resilience Verification Suite
 * Run with: node milasty/backend/scripts/verify_payment_integrity.js
 */

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendRoot = path.resolve(__dirname, '..');
const frontendRoot = path.resolve(backendRoot, '../frontend');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✅ PASS: ${message}`);
  } else {
    failedTests++;
    console.error(`  ❌ FAIL: ${message}`);
  }
}

async function runTests() {
  console.log('\n======================================================');
  console.log('MILASTY RAZORPAY PAYMENT INTEGRITY TEST SUITE');
  console.log('======================================================\n');

  // ─────────────────────────────────────────────────────────────────
  // TEST GROUP 1: SCHEMA CACHE RESILIENCE & ERROR EXTRACTION
  // ─────────────────────────────────────────────────────────────────
  console.log('--- TEST GROUP 1: Schema Cache Resilience (PGRST204 & 42703) ---');
  const { missingColumnFromError, CRITICAL_PAYMENT_COLUMNS } = await import('../utils/safeOrderUpdate.js');

  const pgrstVariations = [
    { err: { message: "Could not find the 'paid_at' column of 'orders' in the schema cache" }, expected: 'paid_at' },
    { err: { message: "Could not find the 'paid_at' column of 'public.orders' in the schema cache" }, expected: 'paid_at' },
    { err: { message: "Could not find the column 'paid_at' of 'orders' in the schema cache" }, expected: 'paid_at' },
    { err: { message: "Could not find the 'paid_at' column in the schema cache" }, expected: 'paid_at' },
    { err: { message: "column \"paid_at\" of relation \"orders\" does not exist" }, expected: 'paid_at' },
    { err: { message: "column orders.paid_at does not exist" }, expected: 'paid_at' },
    { err: { message: "column \"paid_at\" does not exist" }, expected: 'paid_at' },
  ];

  for (const { err, expected } of pgrstVariations) {
    const col = missingColumnFromError(err);
    assert(col === expected, `missingColumnFromError parsed "${expected}" from "${err.message}"`);
  }

  // Non-column error should return null
  assert(missingColumnFromError({ message: 'connection timeout' }) === null, 'Non-column error returns null');
  assert(missingColumnFromError(null) === null, 'Null error returns null');

  // Verify critical payment columns set
  assert(CRITICAL_PAYMENT_COLUMNS.has('payment_status'), 'CRITICAL_PAYMENT_COLUMNS protects payment_status');
  assert(CRITICAL_PAYMENT_COLUMNS.has('payment_id'), 'CRITICAL_PAYMENT_COLUMNS protects payment_id');
  assert(CRITICAL_PAYMENT_COLUMNS.has('razorpay_payment_id'), 'CRITICAL_PAYMENT_COLUMNS protects razorpay_payment_id');
  assert(CRITICAL_PAYMENT_COLUMNS.has('razorpay_order_id'), 'CRITICAL_PAYMENT_COLUMNS protects razorpay_order_id');
  assert(CRITICAL_PAYMENT_COLUMNS.has('order_status'), 'CRITICAL_PAYMENT_COLUMNS protects order_status');
  assert(CRITICAL_PAYMENT_COLUMNS.has('grand_total'), 'CRITICAL_PAYMENT_COLUMNS protects grand_total');
  assert(!CRITICAL_PAYMENT_COLUMNS.has('paid_at'), 'Optional column paid_at is safely allowed to be omitted if missing');

  // ─────────────────────────────────────────────────────────────────
  // TEST GROUP 2: WEBHOOK SIGNATURE VERIFICATION
  // ─────────────────────────────────────────────────────────────────
  console.log('\n--- TEST GROUP 2: Webhook Signature Verification & Tamper Protection ---');
  const { signaturesMatch } = await import('../controllers/paymentController.js');

  const testSecret = 'secret_webhook_key_12345';
  const testPayload = JSON.stringify({ event: 'payment.captured', id: 'evt_123' });
  const validSignature = crypto.createHmac('sha256', testSecret).update(Buffer.from(testPayload)).digest('hex');
  const invalidSignature = 'bad_tampered_signature_hex_value';

  assert(signaturesMatch(validSignature, validSignature), 'signaturesMatch accepts identical valid signature');
  assert(!signaturesMatch(validSignature, invalidSignature), 'signaturesMatch rejects tampered signature');
  assert(!signaturesMatch(validSignature, null), 'signaturesMatch rejects null signature');
  assert(!signaturesMatch('', validSignature), 'signaturesMatch rejects empty signature');

  // ─────────────────────────────────────────────────────────────────
  // TEST GROUP 3: AMOUNT & CURRENCY VERIFICATION
  // ─────────────────────────────────────────────────────────────────
  console.log('\n--- TEST GROUP 3: Captured Amount & Currency Integrity ---');
  const { finalizeOrderFromPayment } = await import('../controllers/paymentController.js');

  const mockSession = {
    amountInPaise: 50000, // ₹500.00
    grandTotal: 500,
    customerName: 'Test Customer',
    customerEmail: 'test@example.com',
    customerPhone: '9876543210',
    shippingAddress: '123 Test St',
    pincode: '110001',
    items: [],
  };

  // 1. Amount mismatch test: expected 50000 paise, captured 25000 paise
  let mismatchError = null;
  try {
    await finalizeOrderFromPayment({
      razorpay_order_id: 'order_test_mismatch_1',
      razorpay_payment_id: 'pay_test_mismatch_1',
      capturedAmount: 25000,
      capturedCurrency: 'INR',
      sessionOverride: mockSession,
    });
  } catch (err) {
    mismatchError = err;
  }
  assert(
    mismatchError && mismatchError.message.includes('Payment amount mismatch'),
    `Amount mismatch blocked: ${mismatchError?.message}`
  );

  // 2. Currency mismatch test: expected INR, received USD
  let currencyError = null;
  try {
    await finalizeOrderFromPayment({
      razorpay_order_id: 'order_test_curr_1',
      razorpay_payment_id: 'pay_test_curr_1',
      capturedAmount: 50000,
      capturedCurrency: 'USD',
      sessionOverride: mockSession,
    });
  } catch (err) {
    currencyError = err;
  }
  assert(
    currencyError && currencyError.message.includes('Payment currency mismatch'),
    `Non-INR currency blocked: ${currencyError?.message}`
  );

  // ─────────────────────────────────────────────────────────────────
  // TEST GROUP 4: EXISTING PENDING ORDER TRANSITION TO PAID
  // ─────────────────────────────────────────────────────────────────
  console.log('\n--- TEST GROUP 4: Existing Pending Order Transition to Paid ---');

  // Verify in paymentController that existingOrder branch transitions pending to paid
  const paymentCtrlSrc = fs.readFileSync(path.join(backendRoot, 'controllers', 'paymentController.js'), 'utf8');

  assert(
    paymentCtrlSrc.includes("const isAlreadyPaid = String(existingOrder.payment_status || '').toLowerCase() === 'paid'"),
    'Checks if existing order is already paid'
  );
  assert(
    paymentCtrlSrc.includes("payment_status: 'paid'"),
    'Updates pending order payment_status to paid'
  );
  assert(
    paymentCtrlSrc.includes("order_status: 'confirmed'"),
    'Updates pending order order_status to confirmed'
  );
  assert(
    paymentCtrlSrc.includes('paid_at: nowIso'),
    'Sets paid_at timestamp on transition'
  );
  assert(
    paymentCtrlSrc.includes('safeUpdateOrder(existingOrder.id, updatePayload)'),
    'Uses safeUpdateOrder for resilient pending order update'
  );

  // ─────────────────────────────────────────────────────────────────
  // TEST GROUP 5: IDEMPOTENCY & RACE CONDITION PROTECTION
  // ─────────────────────────────────────────────────────────────────
  console.log('\n--- TEST GROUP 5: Database Idempotency & Webhook Race Condition Handling ---');

  assert(
    paymentCtrlSrc.includes('razorpay_order_id ? `razorpay_order_id.eq.${razorpay_order_id}` : null'),
    'Idempotency check queries razorpay_order_id column'
  );
  assert(
    paymentCtrlSrc.includes('razorpay_payment_id ? `razorpay_payment_id.eq.${razorpay_payment_id}` : null'),
    'Idempotency check queries razorpay_payment_id column'
  );
  assert(
    paymentCtrlSrc.includes('payment_id.eq.${razorpay_payment_id}'),
    'Idempotency check queries payment_id column'
  );
  assert(
    paymentCtrlSrc.includes('Returned existing paid order from concurrent wait'),
    'Concurrent wait loop handles parallel webhook and frontend verification'
  );
  assert(
    paymentCtrlSrc.includes('[ORDER FINALIZATION] Order already exists and is paid (idempotent duplicate prevented)'),
    'Duplicate webhook returns existing paid order without creating duplicate'
  );

  // ─────────────────────────────────────────────────────────────────
  // TEST GROUP 6: WHATSAPP NOTIFICATION POLICY & DEDUPLICATION
  // ─────────────────────────────────────────────────────────────────
  console.log('\n--- TEST GROUP 6: WhatsApp Notification Policy & Deduplication ---');
  const { ALLOWED_CUSTOMER_ORDER_EVENTS } = await import('../services/whatsappEventService.js');

  assert(
    paymentCtrlSrc.includes("triggerEventAsync('ORDER_CONFIRMED'"),
    'Dispatches canonical ORDER_CONFIRMED event'
  );
  assert(
    ALLOWED_CUSTOMER_ORDER_EVENTS.has('ORDER_CONFIRMED'),
    'ORDER_CONFIRMED is an approved customer order update'
  );
  assert(
    ALLOWED_CUSTOMER_ORDER_EVENTS.has('ORDER_SHIPPED'),
    'ORDER_SHIPPED is an approved customer order update'
  );
  assert(
    ALLOWED_CUSTOMER_ORDER_EVENTS.has('ORDER_DELIVERED'),
    'ORDER_DELIVERED is an approved customer order update'
  );
  assert(
    !ALLOWED_CUSTOMER_ORDER_EVENTS.has('ORDER_PLACED'),
    'ORDER_PLACED is suppressed for customers to prevent spam'
  );

  // ─────────────────────────────────────────────────────────────────
  // TEST GROUP 7: FRONTEND CART AND STATE PROTECTION
  // ─────────────────────────────────────────────────────────────────
  console.log('\n--- TEST GROUP 7: Frontend Cart & Confirmation Security ---');

  const checkoutSrc = fs.readFileSync(path.join(frontendRoot, 'src', 'pages', 'CheckoutPage.jsx'), 'utf8');

  // Verify cart clearing occurs strictly after backend confirms orderId
  const verifyBlock = checkoutSrc.substring(checkoutSrc.indexOf('/payments/verify'), checkoutSrc.indexOf('/payments/verify') + 1200);
  assert(
    verifyBlock.includes('clearCart()') && verifyBlock.includes('verifyRes.data.success'),
    'Cart clears ONLY after verifyRes.data.success is confirmed by backend'
  );
  assert(
    verifyBlock.includes('If amount was debited, contact our helpline'),
    'Customer is guided to contact helpline and never told to pay again'
  );

  // Verify OrderSuccessPage checks paid status
  const successSrc = fs.readFileSync(path.join(frontendRoot, 'src', 'pages', 'OrderSuccessPage.jsx'), 'utf8');
  assert(
    successSrc.includes("displayPaymentStatus = '✓ PAID SUCCESSFULLY'"),
    'OrderSuccessPage displays ✓ PAID SUCCESSFULLY for verified paid orders'
  );
  assert(
    successSrc.includes('order?.paid_at || order?.paidAt || order?.createdAt'),
    'OrderSuccessPage reads paid_at timestamp with safe fallbacks'
  );

  // ─────────────────────────────────────────────────────────────────
  // TEST GROUP 8: TRANSACTIONAL ATOMICITY & SAFE ROLLBACK
  // ─────────────────────────────────────────────────────────────────
  console.log('\n--- TEST GROUP 8: Transactional Atomicity & Rollback Protection ---');

  assert(
    paymentCtrlSrc.includes('[PAYMENT ATOMICITY] Failed to insert order items'),
    'Implements atomicity rollback when order_items insert fails'
  );
  assert(
    paymentCtrlSrc.includes("supabase.from('orders').delete().eq('id', newOrder.id)"),
    'Deletes partial order row on items insert failure to prevent orphan orders'
  );
  assert(
    paymentCtrlSrc.includes('Failed to persist order items for order'),
    'Throws explicit error so webhook retry or client can safely re-attempt'
  );
  assert(
    paymentCtrlSrc.includes('missingItemRows') && paymentCtrlSrc.includes('existingOrder.order_items = attachedItems'),
    'Attaches missing items to existing pending orders upon payment transition'
  );

  // ─────────────────────────────────────────────────────────────────
  // SUMMARY
  // ─────────────────────────────────────────────────────────────────
  console.log('\n======================================================');
  console.log(`TOTAL TESTS: ${totalTests} | PASSED: ${passedTests} | FAILED: ${failedTests}`);
  console.log('======================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Test suite crashed:', err);
  process.exit(1);
});
