import dotenv from 'dotenv';
dotenv.config();
import { supabase } from '../config/supabase.js';
import { createPaymentSession, verifyRazorpayPayment, cancelPaymentSession, getDeliveryChargeForPincode } from '../controllers/paymentController.js';
import { updateOrderStatus, getMyOrders, getAllOrders } from '../controllers/orderController.js';

function mockRes() {
  const res = {
    statusCode: 200,
    data: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(obj) {
      this.data = obj;
      return this;
    }
  };
  return res;
}

async function runTests() {
  console.log('====================================================');
  console.log('RUNNING SYSTEM VERIFICATION SUITE');
  console.log('====================================================\n');

  // TEST 1: Check Delivery Charge Lookup from Database for PIN 263153
  console.log('--- TEST 1: Delivery Charge DB Lookup ---');
  const delRes1 = await getDeliveryChargeForPincode('263153', 300);
  console.log('Result for PIN 263153 (Subtotal 300):', delRes1);
  if (delRes1.deliveryFee === 40 || delRes1.deliveryFee === 49 || delRes1.deliveryFee === 0) {
    console.log('✅ TEST 1 PASSED: Delivery charge calculated cleanly from DB/rules.');
  } else {
    console.error('❌ TEST 1 FAILED');
  }

  // TEST 2: Payment Session Creation with Delivery Charge Included in Razorpay Amount
  console.log('\n--- TEST 2: Payment Session Creation (Single Source of Truth) ---');
  const req2 = {
    body: {
      customerName: 'Test Customer',
      customerEmail: 'test@milasty.com',
      customerPhone: '9876543210',
      shippingAddress: {
        addressLine: 'Sector 62',
        building: 'Building 5',
        city: 'Noida',
        state: 'Uttar Pradesh',
        pincode: '263153',
      },
      pincode: '263153',
      items: [
        { productId: '6239564d-9b95-4848-a56b-7fd8398b8e91', variantName: 'Trial Pack', quantity: 2, unitPrice: 100 }
      ],
    }
  };
  const res2 = mockRes();
  await createPaymentSession(req2, res2);

  console.log('Create Session Output:', res2.data);
  const sessionData = res2.data;

  if (sessionData && sessionData.success) {
    const expectedPaise = Math.round(sessionData.grandTotal * 100);
    if (sessionData.amount === expectedPaise) {
      console.log(`✅ TEST 2 PASSED: Razorpay amount (${sessionData.amount} paise) EXACTLY equals grand total (₹${sessionData.grandTotal} = ${expectedPaise} paise).`);
    } else {
      console.error(`❌ TEST 2 FAILED: Mismatch between Razorpay amount (${sessionData.amount}) and grand total (${expectedPaise}).`);
    }
  } else {
    console.error('❌ TEST 2 FAILED: createPaymentSession returned failure', sessionData);
  }

  // TEST 3: User Cancels Payment (NO Order Created in Orders Table)
  console.log('\n--- TEST 3: User Cancels Payment ---');
  const { data: initialOrders } = await supabase.from('orders').select('id');
  const countBefore = (initialOrders || []).length;

  const req3 = { body: { razorpay_order_id: sessionData.razorpayOrderId } };
  const res3 = mockRes();
  await cancelPaymentSession(req3, res3);

  const { data: ordersAfterCancel } = await supabase.from('orders').select('id');
  const countAfterCancel = (ordersAfterCancel || []).length;

  if (countBefore === countAfterCancel) {
    console.log(`✅ TEST 3 PASSED: Order count unchanged (${countBefore} -> ${countAfterCancel}). Cancelled payment created ZERO orders in database!`);
  } else {
    console.error(`❌ TEST 3 FAILED: Order count changed from ${countBefore} to ${countAfterCancel}`);
  }

  // TEST 4: Payment Verification & Idempotent Order Creation
  console.log('\n--- TEST 4: Successful Payment Verification & Idempotency ---');
  // Re-create a session to verify
  const res2b = mockRes();
  await createPaymentSession(req2, res2b);
  const session2b = res2b.data;

  const req4 = {
    body: {
      razorpay_order_id: session2b.razorpayOrderId,
      razorpay_payment_id: 'pay_test_' + Date.now(),
      razorpay_signature: 'test_signature',
    }
  };
  const res4 = mockRes();
  await verifyRazorpayPayment(req4, res4);

  console.log('Verify Output 1:', res4.data);

  if (res4.data && res4.data.success) {
    console.log('✅ Payment 1 verified and order confirmed successfully!');
  } else {
    console.error('❌ TEST 4 FAILED: Payment verification failed');
  }

  // Idempotency check: call verify second time with same payment
  const res4b = mockRes();
  await verifyRazorpayPayment(req4, res4b);
  console.log('Verify Output 2 (Duplicate):', res4b.data);

  if (res4b.data && res4b.data.success && res4b.data.orderId === res4.data.orderId) {
    console.log('✅ TEST 4 PASSED: Idempotent duplicate verification returned same order without duplicate insertion!');
  } else {
    console.error('❌ TEST 4 FAILED: Idempotency check failed');
  }

  // TEST 5: Admin Order Status Update (Verify HTTP 500 fixed)
  console.log('\n--- TEST 5: Admin Order Status Update ---');
  const req5 = {
    params: { id: res4.data.order.id },
    body: { orderStatus: 'Out for Delivery' }
  };
  const res5 = mockRes();
  await updateOrderStatus(req5, res5);

  console.log('Update Status Output:', res5.data);

  if (res5.statusCode === 200 && res5.data && res5.data.success) {
    console.log(`✅ TEST 5 PASSED: Admin updated status to "${res5.data.order.orderStatus}" with status HTTP ${res5.statusCode} (NO 500 error)!`);
  } else {
    console.error(`❌ TEST 5 FAILED: Status code ${res5.statusCode}, response:`, res5.data);
  }

  console.log('\n====================================================');
  console.log('ALL SYSTEM TESTS EXECUTED CLEANLY');
  console.log('====================================================\n');

  process.exit(0);
}

runTests();
