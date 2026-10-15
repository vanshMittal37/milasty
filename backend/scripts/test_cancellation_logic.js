// Test script for MILASTY cancellation, refund calculation, and 9-day estimated delivery date
import assert from 'assert';

console.log('--- Testing MILASTY Order Cancellation & Date/Time Logic ---');

const HOUR = 3600;
const CANCELLATION_WINDOW_S = 3 * HOUR;
const CANCELLATION_CHARGE_PERCENTAGE = 10;
const REFUND_PERCENTAGE = 90;

function refundPercentageFor(elapsedSeconds, paymentMethod) {
  const method = String(paymentMethod || '').toLowerCase();
  if (method === 'cod' || method === 'cash on delivery') {
    return elapsedSeconds <= CANCELLATION_WINDOW_S ? 0 : 0;
  }
  if (elapsedSeconds <= CANCELLATION_WINDOW_S) {
    return REFUND_PERCENTAGE;
  }
  return 0;
}

function calculateRefundAndCharge(grandTotal, paymentMethod, elapsedSeconds) {
  const isPrepaid = String(paymentMethod || '').toLowerCase() === 'razorpay' ||
                    String(paymentMethod || '').toLowerCase() === 'prepaid';
  const amountPaidPaise = isPrepaid ? Math.round(Number(grandTotal || 0) * 100) : 0;

  if (elapsedSeconds > CANCELLATION_WINDOW_S) {
    return {
      eligible: false,
      code: 'WINDOW_CLOSED',
      message: 'You can no longer cancel this order because the 3-hour cancellation window has expired. Please contact customer support if you need assistance.',
    };
  }

  const pct = refundPercentageFor(elapsedSeconds, paymentMethod);
  const cancellationChargePaise = isPrepaid ? Math.round(amountPaidPaise * (CANCELLATION_CHARGE_PERCENTAGE / 100)) : 0;
  const refundAmountPaise = isPrepaid ? Math.max(0, amountPaidPaise - cancellationChargePaise) : 0;

  return {
    eligible: true,
    code: 'OK',
    refundPercentage: pct,
    cancellationChargePercentage: isPrepaid ? CANCELLATION_CHARGE_PERCENTAGE : 0,
    amountPaid: amountPaidPaise / 100,
    cancellationCharge: cancellationChargePaise / 100,
    refundAmount: refundAmountPaise / 100,
    amountPaidPaise,
    cancellationChargePaise,
    refundAmountPaise,
  };
}

function calculateEstimatedDeliveryDate(orderPlacementDate, days = 9) {
  if (!orderPlacementDate) return '—';
  const placed = new Date(orderPlacementDate);
  if (isNaN(placed.getTime())) return '—';

  const est = new Date(placed.getTime() + days * 24 * 60 * 60 * 1000);
  return est.toLocaleDateString('en-IN', {
    timeZone: 'Asia/Kolkata',
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

// 1. Order placed 2 hours ago (prepaid Razorpay of ₹1250)
console.log('\nTest 1: Order placed 2 hours ago (within 3h window, prepaid ₹1,250)');
const order2h = calculateRefundAndCharge(1250, 'razorpay', 2 * HOUR);
assert.strictEqual(order2h.eligible, true, 'Should be eligible');
assert.strictEqual(order2h.refundPercentage, 90, 'Refund percentage must be 90%');
assert.strictEqual(order2h.cancellationChargePercentage, 10, 'Cancellation charge must be 10%');
assert.strictEqual(order2h.amountPaid, 1250, 'Amount paid is ₹1250');
assert.strictEqual(order2h.cancellationCharge, 125, '10% of 1250 is ₹125');
assert.strictEqual(order2h.refundAmount, 1125, '90% of 1250 is ₹1125');
assert.strictEqual(order2h.cancellationChargePaise + order2h.refundAmountPaise, order2h.amountPaidPaise, 'Paise sum must equal total');
console.log('✓ PASS: Test 1 Passed (Eligible, 10% charge = ₹125, 90% refund = ₹1125)');

// 2. Order placed 2 hours ago with uneven amount (e.g. ₹499.50)
console.log('\nTest 2: Currency rounding check (Prepaid ₹499.50)');
const orderUneven = calculateRefundAndCharge(499.5, 'razorpay', 2 * HOUR);
assert.strictEqual(orderUneven.eligible, true);
assert.strictEqual(orderUneven.amountPaidPaise, 49950);
// 10% of 49950 paise = 4995 paise = ₹49.95
assert.strictEqual(orderUneven.cancellationChargePaise, 4995);
// 90% of 49950 paise = 44955 paise = ₹449.55
assert.strictEqual(orderUneven.refundAmountPaise, 44955);
assert.strictEqual(orderUneven.cancellationCharge, 49.95);
assert.strictEqual(orderUneven.refundAmount, 449.55);
assert.strictEqual(orderUneven.cancellationChargePaise + orderUneven.refundAmountPaise, orderUneven.amountPaidPaise);
console.log('✓ PASS: Test 2 Passed (No floating-point discrepancy: ₹49.95 charge + ₹449.55 refund = ₹499.50)');

// 3. Order placed 3 hours and 1 minute ago (expired)
console.log('\nTest 3: Order placed 3 hours and 1 minute ago (> 3h window)');
const orderExpired = calculateRefundAndCharge(1250, 'razorpay', 3 * HOUR + 60);
assert.strictEqual(orderExpired.eligible, false, 'Should not be eligible');
assert.strictEqual(orderExpired.code, 'WINDOW_CLOSED');
assert.strictEqual(
  orderExpired.message,
  'You can no longer cancel this order because the 3-hour cancellation window has expired. Please contact customer support if you need assistance.'
);
console.log('✓ PASS: Test 3 Passed (Window closed with exact required message)');

// 4. COD Order placed 1 hour ago
console.log('\nTest 4: Cash on Delivery order within 3h');
const orderCod = calculateRefundAndCharge(850, 'cod', 1 * HOUR);
assert.strictEqual(orderCod.eligible, true);
assert.strictEqual(orderCod.amountPaid, 0);
assert.strictEqual(orderCod.cancellationCharge, 0);
assert.strictEqual(orderCod.refundAmount, 0);
console.log('✓ PASS: Test 4 Passed (COD has 0 charge and 0 refund)');

// 5. Estimated delivery date (9 days)
console.log('\nTest 5: Estimated delivery calculation (9 days from order placement)');
const sampleOrderPlacement = '2026-10-15T10:00:00.000Z';
const estDelivery = calculateEstimatedDeliveryDate(sampleOrderPlacement, 9);
console.log(`Order Placed: ${sampleOrderPlacement} -> Estimated Delivery: ${estDelivery}`);
assert.ok(estDelivery.includes('24 Oct') && estDelivery.includes('2026'), 'Expected 9 days delivery date to include 24 Oct 2026');
console.log('✓ PASS: Test 5 Passed (Estimated delivery is 9 days after order placement)');

console.log('\nALL TESTS PASSED SUCCESSFULLY! 🎉');
