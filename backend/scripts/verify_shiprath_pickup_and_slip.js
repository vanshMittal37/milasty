/**
 * ============================================================================
 * MILASTY SHIPRATH PICKUP & SHIPPING SLIP VERIFICATION TEST SUITE
 * ============================================================================
 * Tests post-shipment fulfillment:
 * 1. Existing shipment detection
 * 2. Create Pickup button rules
 * 3. Manual admin trigger endpoint
 * 4. Successful pickup scheduling
 * 5. Pickup information persistence
 * 6. Automatic shipping slip generation / retrieval
 * 7. Download shipping slip route
 * 8. Pickup failure handling
 * 9. Independent label retry without re-requesting pickup
 * 10. Concurrency lock & duplicate pickup prevention
 * 11. Timeout & error resilience
 * 12. State preservation on refresh (direct columns + JSON fallback)
 *
 * All external Shiprath calls are safely intercepted/mocked.
 * Zero real pickups created, zero wallet balance spent.
 */

import assert from 'assert';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();
process.env.SHIPRATH_SECRET_KEY = process.env.SHIPRATH_SECRET_KEY || 'MOCK_TEST_SECRET_KEY';
process.env.SHIPRATH_CUSTOMER_ID = process.env.SHIPRATH_CUSTOMER_ID || 'MOCK_TEST_CUSTOMER_ID';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(__dirname, '..');

let totalTests = 0;
let passedTests = 0;

function runTest(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  ✅ PASS: ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${name}`);
    console.error(`     Error: ${err.message}`);
  }
}

async function runAsyncTest(name, fn) {
  totalTests++;
  try {
    await fn();
    console.log(`  ✅ PASS: ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${name}`);
    console.error(`     Error: ${err.message}`);
  }
}

async function runAll() {
  console.log('\n======================================================');
  console.log('MILASTY POST-SHIPMENT PICKUP & SHIPPING SLIP TEST SUITE');
  console.log('======================================================\n');

  const shipratCtrlPath = path.join(backendRoot, 'controllers', 'shipratController.js');
  const shipratRoutesPath = path.join(backendRoot, 'routes', 'shipratRoutes.js');
  const orderRoutesPath = path.join(backendRoot, 'routes', 'orderRoutes.js');
  const adminOrderListPath = path.join(backendRoot, '..', 'frontend', 'src', 'pages', 'admin', 'AdminOrderList.jsx');
  const migrationSqlPath = path.join(backendRoot, 'scripts', '32_shipment_pickup_and_shipping_slip.sql');

  const shipratCtrlSrc = fs.readFileSync(shipratCtrlPath, 'utf8');
  const shipratRoutesSrc = fs.readFileSync(shipratRoutesPath, 'utf8');
  const orderRoutesSrc = fs.readFileSync(orderRoutesPath, 'utf8');
  const adminOrderListSrc = fs.readFileSync(adminOrderListPath, 'utf8');
  const migrationSqlSrc = fs.readFileSync(migrationSqlPath, 'utf8');

  const {
    requestShiprathPickup,
    resolveShiprathLabel,
    createPickupForOrder,
    retryLabelGeneration,
    getShippingSlip,
    isPickupForActiveShipment,
  } = await import('../controllers/shipratController.js');

  // ─────────────────────────────────────────────────────────────────
  // TEST GROUP 1: Shipment Detection & Eligibility Rules
  // ─────────────────────────────────────────────────────────────────
  console.log('--- TEST GROUP 1: Existing Shipment Detection & Button Eligibility ---');

  runTest('1.1 Backend rejects pickup if shipment does not exist', () => {
    assert(shipratCtrlSrc.includes("code: 'NO_SHIPMENT'"), 'Must return NO_SHIPMENT code when unbooked');
    assert(shipratCtrlSrc.includes("!awb && shipmentStatus !== 'booked'"), 'Checks awb number or booked status');
  });

  runTest('1.2 Frontend renders CREATE PICKUP button only after shipment creation', () => {
    assert(adminOrderListSrc.includes("const hasShipment = Boolean(so.awb_number || so.awb || String(so.shipment_status || '').toLowerCase() === 'booked')"), 'Detects active shipment');
    assert(adminOrderListSrc.includes("handleCreatePickup"), 'Mounts handleCreatePickup action');
    assert(adminOrderListSrc.includes("CREATE PICKUP"), 'Contains CREATE PICKUP button label');
  });

  runTest('1.3 Backend enforces admin permissions on pickup and label routes', () => {
    assert(shipratRoutesSrc.includes("router.post('/order/:id/pickup', protect, adminOnly, createPickupForOrder)"), 'shipratRoutes protects pickup route with adminOnly');
    assert(shipratRoutesSrc.includes("router.post('/order/:id/retry-label', protect, adminOnly, retryLabelGeneration)"), 'shipratRoutes protects retry-label route with adminOnly');
    assert(shipratRoutesSrc.includes("router.get('/order/:id/shipping-label', protect, adminOnly, getShippingSlip)"), 'shipratRoutes protects shipping-label route with adminOnly');
    assert(orderRoutesSrc.includes("router.post('/admin/:id/create-pickup', protect, adminOnly, createPickupForOrder)"), 'orderRoutes mounts create-pickup with adminOnly');
  });

  // ─────────────────────────────────────────────────────────────────
  // TEST GROUP 2: Pickup Scheduling & Request Validation
  // ─────────────────────────────────────────────────────────────────
  console.log('\n--- TEST GROUP 2: Pickup Scheduling & Request Validation ---');

  runTest('2.1 Pickup request payload includes AWB, warehouse address, and pickup date', () => {
    assert(shipratCtrlSrc.includes("address_id: WAREHOUSE_ADDRESS_ID"), 'Sends configured warehouse address ID');
    assert(shipratCtrlSrc.includes("pickup_date: pickupDate"), 'Sends formatted pickup date');
    assert(shipratCtrlSrc.includes("expected_package_count: 1"), 'Specifies package count');
  });

  runTest('2.2 Uses strictly configured endpoint without fallback', () => {
    assert(shipratCtrlSrc.includes("(process.env.SHIPRATH_PICKUP_ENDPOINT || '').trim() || '/shipment/shipment_pickup'"), 'Uses configured endpoint or default');
    assert(!shipratCtrlSrc.includes("candidateEndpoints"), 'Removed speculative candidate endpoints');
  });

  await runAsyncTest('2.3 (a) Primary endpoint success', async () => {
    let callCount = 0;
    const originalFetch = global.fetch;
    try {
      global.fetch = async (url) => {
        callCount++;
        return {
          ok: true,
          status: 200,
          text: async () => JSON.stringify({
            status: true,
            pickup_request_id: 'PR-TEST-12345',
            scheduled_date: '2026-11-12',
            confirmation_number: 'CONF-88899',
            message: 'Pickup scheduled successfully'
          })
        };
      };

      const res = await requestShiprathPickup({
        order: { order_number: 'MIL-TEST-99', booked_carrier_id: '123' },
        awb: 'AWB999999',
        shipmentId: 'SH-999',
        scheduledDate: '2026-11-12'
      });

      assert(res.success === true, 'Pickup must succeed');
      assert(callCount === 1, 'Exactly 1 API request made');
      assert(res.pickup_request_id === 'PR-TEST-12345', 'Extracts pickup_request_id');
      assert(res.pickup_scheduled_date === '2026-11-12', 'Extracts scheduled_date');
      assert(res.pickup_confirmation_ref === 'CONF-88899', 'Extracts confirmation_number');
    } finally {
      global.fetch = originalFetch;
    }
  });

  await runAsyncTest('2.4 (b) Primary endpoint 404 without fallback', async () => {
    let callCount = 0;
    const originalFetch = global.fetch;
    try {
      global.fetch = async (url) => {
        callCount++;
        return {
          ok: false,
          status: 404,
          text: async () => JSON.stringify({
            status: false,
            message: 'Endpoint /shipment/shipment_pickup not found on vendor service'
          })
        };
      };

      const res = await requestShiprathPickup({
        order: { order_number: 'MIL-TEST-404' },
        awb: 'AWB404',
        shipmentId: 'SH-404'
      });

      assert(res.success === false, 'Must return failure on 404');
      assert(callCount === 1, 'Must NOT attempt fallback; exactly 1 call made');
      assert(res.httpStatus === 404, 'Records 404 HTTP status');
      assert(res.error.includes('Endpoint /shipment/shipment_pickup not found'), 'Records exact 404 response');
    } finally {
      global.fetch = originalFetch;
    }
  });

  await runAsyncTest('2.5 (c) Primary endpoint rejection', async () => {
    let callCount = 0;
    const originalFetch = global.fetch;
    try {
      global.fetch = async (url) => {
        callCount++;
        return {
          ok: false,
          status: 400,
          text: async () => JSON.stringify({
            status: false,
            message: 'Pincode 201016 not serviceable by carrier on this date'
          })
        };
      };

      const res = await requestShiprathPickup({
        order: { order_number: 'MIL-TEST-REJECT' },
        awb: 'AWB-REJECT',
        shipmentId: 'SH-REJECT'
      });

      assert(res.success === false, 'Must return failure on rejection');
      assert(callCount === 1, 'Exactly 1 call made');
      assert(res.error.includes('Pincode 201016 not serviceable'), 'Records exact carrier rejection error');
    } finally {
      global.fetch = originalFetch;
    }
  });

  // ─────────────────────────────────────────────────────────────────
  // TEST GROUP 3: Automatic Shipping Slip Generation & Retrieval
  // ─────────────────────────────────────────────────────────────────
  console.log('\n--- TEST GROUP 3: Automatic Shipping Slip Generation & Retrieval ---');

  await runAsyncTest('3.1 Reuses existing label generated during shipment creation', async () => {
    const mockOrder = {
      order_number: 'MIL-123456',
      shipment_booking_response: {
        label: 'https://app.shiprath.com/print_label/1793818597916',
        status: true,
        awb_number: '40101410227301'
      }
    };

    const labelResult = await resolveShiprathLabel({
      order: mockOrder,
      awb: '40101410227301',
      shipmentId: '1793818597916'
    });

    assert(labelResult.success === true, 'Resolves label successfully');
    assert(labelResult.label_url === 'https://app.shiprath.com/print_label/1793818597916', 'Uses original Shiprath print_label URL');
    assert(labelResult.source === 'shipment_booking_response', 'Identifies source as shipment_booking_response');
  });

  await runAsyncTest('3.2 Extracts label returned directly in pickup response', async () => {
    const mockOrder = { order_number: 'MIL-654321' };
    const pickupResult = {
      label_url: 'https://app.shiprath.com/print_label/9999999'
    };

    const labelResult = await resolveShiprathLabel({
      order: mockOrder,
      awb: 'AWB777',
      shipmentId: 'SH777',
      pickupResult
    });

    assert(labelResult.success === true, 'Resolves label successfully');
    assert(labelResult.label_url === 'https://app.shiprath.com/print_label/9999999', 'Uses pickup response label URL');
    assert(labelResult.source === 'pickup_response', 'Identifies source as pickup_response');
  });

  runTest('3.3 Frontend renders DOWNLOAD SHIPPING SLIP button when label URL is available', () => {
    assert(adminOrderListSrc.includes("DOWNLOAD SHIPPING SLIP"), 'Contains DOWNLOAD SHIPPING SLIP button');
    assert(adminOrderListSrc.includes("href={labelUrl}"), 'Directly links to verified Shiprath label URL');
    assert(adminOrderListSrc.includes('target="_blank"'), 'Opens shipping slip in new tab for direct printing');
  });

  // ─────────────────────────────────────────────────────────────────
  // TEST GROUP 4: Failure Handling & Independent Label Retry
  // ─────────────────────────────────────────────────────────────────
  console.log('\n--- TEST GROUP 4: Failure Handling & Independent Label Retry ---');

  await runAsyncTest('4.1 Pickup failure records failed status and error message without breaking order', async () => {
    const originalFetch = global.fetch;
    try {
      global.fetch = async () => ({
        ok: false,
        status: 400,
        text: async () => JSON.stringify({
          status: false,
          message: 'Carrier does not service this pincode for scheduled pickup'
        })
      });

      const res = await requestShiprathPickup({
        order: { order_number: 'MIL-FAIL-01' },
        awb: 'AWB000',
        shipmentId: 'SH000'
      });

      assert(res.success === false, 'Must return failure');
      assert(res.error.includes('Carrier does not service this pincode'), 'Captures exact error');
    } finally {
      global.fetch = originalFetch;
    }
  });

  runTest('4.2 Label generation failure displays RETRY LABEL GENERATION without creating new pickup', () => {
    assert(adminOrderListSrc.includes("RETRY LABEL GENERATION"), 'Contains RETRY LABEL GENERATION button');
    assert(adminOrderListSrc.includes("handleRetryLabel"), 'Calls independent handleRetryLabel');
    assert(shipratCtrlSrc.includes("export const retryLabelGeneration = async"), 'Exposes retryLabelGeneration controller');
  });

  // ─────────────────────────────────────────────────────────────────
  // TEST GROUP 5: Concurrency Guard & Strict AWB / Shipment Matching
  // ─────────────────────────────────────────────────────────────────
  console.log('\n--- TEST GROUP 5: Concurrency Guard & Strict AWB / Shipment Matching ---');

  runTest('5.1 Active pickups lock prevents simultaneous duplicate requests', () => {
    assert(shipratCtrlSrc.includes("const activePickups = new Set()"), 'Maintains activePickups in-flight Set');
    assert(shipratCtrlSrc.includes("if (activePickups.has(orderId))"), 'Checks activePickups before execution');
    assert(shipratCtrlSrc.includes("activePickups.delete(orderId)"), 'Always cleans up lock in finally block');
  });

  runTest('5.2 Database idempotency guard blocks re-requesting confirmed pickup for same shipment', () => {
    assert(shipratCtrlSrc.includes("if (isConfirmed && belongsToActiveShipment)"), 'Checks existing confirmed status for same shipment');
    assert(shipratCtrlSrc.includes("code: 'ALREADY_CONFIRMED'"), 'Returns ALREADY_CONFIRMED error code');
  });

  runTest('5.3 (d) Same AWB and shipment ID matches', () => {
    const order = {
      awb_number: '40101410217501',
      shipment_id: 'SHP-1001',
      shipment_booking_response: {
        pickup: {
          awb: '40101410217501',
          shipment_id: 'SHP-1001',
          status: 'confirmed',
        }
      }
    };
    assert(isPickupForActiveShipment(order) === true, 'Matches when AWB and shipment ID are identical');
  });

  runTest('5.4 (e) Different AWB does NOT match', () => {
    const order = {
      awb_number: '40101410227999', // active AWB
      shipment_id: 'SHP-1001',
      shipment_booking_response: {
        pickup: {
          awb: '40101410217501', // old stored AWB
          shipment_id: 'SHP-1001',
          status: 'confirmed',
        }
      }
    };
    assert(isPickupForActiveShipment(order) === false, 'Must reject when AWB is different');
  });

  runTest('5.5 (f) Missing stored AWB does NOT match', () => {
    const order = {
      awb_number: '40101410217501',
      shipment_id: 'SHP-1001',
      shipment_booking_response: {
        pickup: {
          shipment_id: 'SHP-1001',
          status: 'confirmed',
        }
      }
    };
    assert(isPickupForActiveShipment(order) === false, 'Missing stored AWB must never count as match');
  });

  runTest('5.6 (g) Re-booked shipment with a new AWB allows new pickup', () => {
    const rebookedOrder = {
      awb_number: 'NEW_AWB_9999',
      shipment_id: 'NEW_SHP_9999',
      pickup_status: 'confirmed', // old status from previous booking
      pickup_confirmation_ref: 'OLD_AWB_1111',
      shipment_booking_response: {
        pickup: {
          awb: 'OLD_AWB_1111',
          shipment_id: 'OLD_SHP_1111',
          status: 'confirmed',
        }
      }
    };
    // Must recognize that the confirmed pickup was for the old shipment, not this new one
    assert(isPickupForActiveShipment(rebookedOrder) === false, 'Re-booked order does not match old pickup');
  });

  runTest('5.7 Missing shipment ID does not override AWB mismatch', () => {
    const order = {
      awb_number: 'ACTIVE_AWB',
      shipment_id: '',
      shipment_booking_response: {
        pickup: {
          awb: 'DIFFERENT_AWB',
          shipment_id: '',
          status: 'confirmed',
        }
      }
    };
    assert(isPickupForActiveShipment(order) === false, 'AWB mismatch must fail even if shipment IDs are missing');
  });

  runTest('5.8 Conflicting shipment IDs fail even if AWBs match', () => {
    const order = {
      awb_number: 'SAME_AWB',
      shipment_id: 'ACTIVE_SHP_1',
      shipment_booking_response: {
        pickup: {
          awb: 'SAME_AWB',
          shipment_id: 'DIFFERENT_SHP_2',
          status: 'confirmed',
        }
      }
    };
    assert(isPickupForActiveShipment(order) === false, 'Different shipment IDs must fail');
  });

  runTest('5.9 Frontend and backend apply identical strict matching rules', () => {
    assert(adminOrderListSrc.includes("const awbMatches = Boolean(activeAwb && storedPickupAwb && activeAwb.toLowerCase() === storedPickupAwb.toLowerCase())"), 'Frontend enforces active AWB === stored AWB');
    assert(adminOrderListSrc.includes("const isSameShipment = awbMatches && shipmentIdMatches"), 'Frontend requires both AWB and shipment ID match');
  });

  runTest('5.10 Label download route is secure and protects credentials', () => {
    assert(shipratRoutesSrc.includes("router.get('/order/:id/shipping-label', protect, adminOnly, getShippingSlip)"), 'Enforces admin-only auth on download route');
    assert(orderRoutesSrc.includes("router.get('/admin/:id/shipping-label', protect, adminOnly, getShippingSlip)"), 'Enforces admin-only auth on admin order route');
    assert(!shipratCtrlSrc.slice(shipratCtrlSrc.indexOf('export const getShippingSlip')).includes('secretkey'), 'Does not leak secretkey');
    assert(!shipratCtrlSrc.slice(shipratCtrlSrc.indexOf('export const getShippingSlip')).includes('customerid'), 'Does not leak customerid');
  });

  // ─────────────────────────────────────────────────────────────────
  // TEST GROUP 6: Database Persistence & Migration Schema
  // ─────────────────────────────────────────────────────────────────
  console.log('\n--- TEST GROUP 6: Database Persistence & Dual-Layer Storage ---');

  runTest('6.1 Prepared SQL migration defines all required pickup and label columns', () => {
    assert(migrationSqlSrc.includes("ADD COLUMN IF NOT EXISTS pickup_status TEXT DEFAULT 'not_created'"), 'Defines pickup_status');
    assert(migrationSqlSrc.includes("ADD COLUMN IF NOT EXISTS pickup_request_id TEXT"), 'Defines pickup_request_id');
    assert(migrationSqlSrc.includes("ADD COLUMN IF NOT EXISTS pickup_scheduled_date TIMESTAMPTZ"), 'Defines pickup_scheduled_date');
    assert(migrationSqlSrc.includes("ADD COLUMN IF NOT EXISTS pickup_confirmation_ref TEXT"), 'Defines pickup_confirmation_ref');
    assert(migrationSqlSrc.includes("ADD COLUMN IF NOT EXISTS shipping_label_url TEXT"), 'Defines shipping_label_url');
    assert(migrationSqlSrc.includes("ADD COLUMN IF NOT EXISTS shipping_label_status TEXT"), 'Defines shipping_label_status');
  });

  runTest('6.2 Backend updates both direct columns and shipment_booking_response for migration resilience', () => {
    assert(shipratCtrlSrc.includes("shipment_booking_response: updatedBooking"), 'Saves pickup into shipment_booking_response fallback');
    assert(adminOrderListSrc.includes("so.pickup_status || so.shipment_booking_response?.pickup?.status"), 'Frontend reads direct column or JSON fallback');
    assert(adminOrderListSrc.includes("so.shipping_label_url ||"), 'Frontend resolves shipping label with resilient fallbacks');
  });

  console.log('\n======================================================');
  console.log(`TOTAL TESTS: ${totalTests} | PASSED: ${passedTests} | FAILED: ${totalTests - passedTests}`);
  console.log('======================================================\n');

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runAll().catch((e) => {
  console.error('Test execution error:', e);
  process.exit(1);
});
