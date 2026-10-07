// Offline test of the automatic shipping logic. No DB writes (orders have no id), no real Shiprath calls.
// Run: node scratch/test_shipping_automation.js
process.env.SHIPRATH_SECRET_KEY = 'test-secret';
process.env.SHIPRATH_CUSTOMER_ID = 'test-customer';
process.env.SHIPRATH_LOG_PAYLOAD = 'false';

const {
  normalizeShiprathRate, rateInvalidReason, bookShiprathShipment, fetchLiveShiprathRate,
  getPackageDimensions, calculatePackage, parseGramsFromWeightString, toShiprathBookingWeight,
  assertValidPackage, sanitizeBookingPayload, getChargeableWeight,
} = await import('../controllers/shipratController.js');

let failures = 0;
const check = (name, cond, extra = '') => {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${extra ? '  -- ' + extra : ''}`);
  if (!cond) failures++;
};
const dims = (d) => `${d.length}x${d.width}x${d.height}`;
const item = (grams, qty = 1, title = 'Item') => ({ product_title: title, variant_name: `${grams}g`, quantity: qty });
const throwsMsg = async (fn) => { try { await fn(); return null; } catch (e) { return e.message; } };

// -- A. Weight parsing (variant weights are stored as text in grams) --
check('"45g" -> 45', parseGramsFromWeightString('45g') === 45);
check('"130g" -> 130', parseGramsFromWeightString('130g') === 130);
check('"12.5g" -> 12.5', parseGramsFromWeightString('12.5g') === 12.5);
check('"0.5kg" -> 500', parseGramsFromWeightString('0.5kg') === 500);
check('"3 x 100g" -> 300', parseGramsFromWeightString('3 x 100g') === 300);
check('"Standard" -> null (no guessed 100g)', parseGramsFromWeightString('Standard') === null);
check('bare number -> null (unit ambiguous)', parseGramsFromWeightString(5) === null);

// -- B. Box sizes --
const cases = [
  ['0.2kg', [item(200)], 0.2, '20x10x5'],
  ['500g', [item(500)], 0.5, '20x10x5'],
  ['750g', [item(750)], 0.75, '25x15x8'],
  ['1.5kg', [item(1500)], 1.5, '30x20x10'],
  ['2.5kg', [item(2500)], 2.5, '35x25x12'],
  ['4kg (no tier given above 3kg)', [item(4000)], 4, '40x30x20'],
  ['500g + 400g + 300g', [item(500), item(400), item(300)], 1.2, '30x20x10'],
];
for (const [name, items, kg, box] of cases) {
  const p = await calculatePackage(items);
  check(`${name} -> ${kg}kg, ${box} cm`, p.totalWeightKg === kg && dims(p.dimensions) === box, `${p.totalWeightKg}kg ${dims(p.dimensions)}`);
}
check('Quantity multiplied once (250g x2 = 0.5kg)', (await calculatePackage([item(250, 2)])).totalWeightKg === 0.5);
check('Boundary: 0.501kg -> 25x15x8', dims(getPackageDimensions(0.501)) === '25x15x8');
check('Packaging weight defaults to 0', (await calculatePackage([item(100)])).packagingWeightKg === 0);
check('camelCase cart items weigh the same', (await calculatePackage([{ title: 'X', variantName: '130g', quantity: 1 }])).totalWeightKg === 0.13);

// -- C. Volumetric weight (formula confirmed by the Shiprath Rate Calculator) --
const calc = getChargeableWeight(0.2, { length: 20, width: 15, height: 10 });
check('Calculator match: 0.2kg in 20x15x10 -> volumetric 0.6, applicable 0.6', calc.volumetricWeightKg === 0.6 && calc.applicableWeightKg === 0.6, JSON.stringify(calc));
const small = getChargeableWeight(0.2, getPackageDimensions(0.2));
check('New box: 0.2kg in 20x10x5 -> volumetric 0.2, applicable 0.2', small.volumetricWeightKg === 0.2 && small.applicableWeightKg === 0.2, JSON.stringify(small));
for (const kg of [0.5, 1, 2, 3]) {
  const w = getChargeableWeight(kg, getPackageDimensions(kg));
  check(`Tier ceiling ${kg}kg: volumetric ${w.volumetricWeightKg} <= actual`, w.volumetricWeightKg <= kg && w.applicableWeightKg === kg);
}
const light = getChargeableWeight(0.1, getPackageDimensions(0.1));
console.log(`INFO  0.1kg order -> applicable ${light.applicableWeightKg}kg (smallest box sets a 0.2kg floor)`);
check('Actual weight never reduced (0.4kg -> applicable 0.4)', getChargeableWeight(0.4, getPackageDimensions(0.4)).applicableWeightKg === 0.4);

// -- D. Validation --
const unk = await throwsMsg(() => calculatePackage([{ product_title: 'Bajra Masala Crunch', variant_name: 'Standard', quantity: 1 }]));
check('Unknown weight -> refuses with item name', unk && unk.includes('Bajra Masala Crunch'), unk);
check('Invalid quantity -> refuses', !!(await throwsMsg(() => calculatePackage([item(100, 0)]))));
check('Huge weight -> refuses', !!(await throwsMsg(() => assertValidPackage({ totalWeightKg: 500, dimensions: getPackageDimensions(500) }))));
check('NaN weight -> refuses', !!(await throwsMsg(() => assertValidPackage({ totalWeightKg: NaN, dimensions: getPackageDimensions(1) }))));
check('Booking weight sent in kg by default', toShiprathBookingWeight(0.23) === 0.23);

// -- E. Rates & booking (fake Shiprath) --
const RATE_LIST = [
  { service_name: 'Delhivery 0.250 KG', carrier_id: '1345673056', courier_id: '1456787971', product_id: '1750322472274', total_charges: 40 },
  { service_name: 'Amazon', carrier_id: '1733448522', courier_id: '', product_id: '1744974856252', total_charges: 33 },
  { service_name: 'Xpressbees billing', carrier_id: '1658300056', courier_id: '7167', product_id: '1746101030534', total_charges: 68 },
  { service_name: 'Broken (no product)', carrier_id: '999', courier_id: '1', product_id: '', total_charges: 10 },
];
const realFetch = globalThis.fetch;
const calls = [];
function stubFetch(bookingBehaviour) {
  globalThis.fetch = async (url, opts) => {
    const body = JSON.parse(opts.body);
    calls.push({ url, body });
    if (url.endsWith('/shipment/shipment_rate_time')) {
      return { ok: true, status: 200, json: async () => ({ status: true, rate_list: RATE_LIST }) };
    }
    const result = bookingBehaviour(body);
    if (result instanceof Error) throw result;
    return { ok: true, status: 200, text: async () => JSON.stringify(result), json: async () => result };
  };
}
const bookCalls = () => calls.filter((c) => c.url.includes('shipment_create'));

stubFetch(() => ({ status: false }));
const orderItems = [item(100, 1, 'Choco Ragi Brownie'), item(100, 1, 'Choco Ragi Cracker')];
const quote = await fetchLiveShiprathRate({ pincode: '203205', items: orderItems });
const rb = calls[0].body;
check('Amazon (empty courier_id) valid & auto-selected Rs33', quote.selectedRate.courier_id === '' && quote.shippingCharge === 33 && rateInvalidReason(normalizeShiprathRate(RATE_LIST[1])) === null);
check('Rate API got 0.2kg and the 20x10x5 box', rb.weight === 0.2 && rb.length === 20 && rb.width === 10 && rb.height === 5, JSON.stringify({ w: rb.weight, l: rb.length, wd: rb.width, h: rb.height }));

const baseOrder = {
  order_number: 'MIL-TEST01', pincode: '203205', payment_method: 'razorpay',
  customer_name: 'Test Customer', customer_phone: '9999999999', customer_email: 't@example.com',
  shipping_address: 'Flat 1, Some Street, Aligarh, Uttar Pradesh, India',
  grand_total: 233, subtotal: 200, delivery_fee: 33,
  order_items: orderItems,
  selected_carrier_id: '1733448522', selected_courier_id: '', selected_product_id: '1744974856252',
  selected_service_name: 'Amazon', selected_delivery_fee: 33,
  shipping_rate_options: quote.rateList.map(({ raw, ...r }) => r),
};

calls.length = 0;
stubFetch(() => ({ status: true, awb_number: 'AWB111', shipment_id: 'S1' }));
let r = await bookShiprathShipment({ ...baseOrder });
let sent = bookCalls()[0]?.body || {};
check('Prepaid order booked with selected Amazon rate', r.success && r.awb === 'AWB111' && bookCalls().length === 1);
check('courier_id "" and exact carrier/product IDs sent', sent.courier_id === '' && sent.carrier_id === '1733448522' && sent.product_id === '1744974856252');
check('Create Shipment weight 0.2 (real weight, not altered)', sent.weight === 0.2, `got ${sent.weight}`);
check('Create Shipment box = quote box (20x10x5)', sent.length === 20 && sent.width === 10 && sent.breadth === 10 && sent.height === 5);
check('Prepaid, COD 0', sent.payment_mode === 'prepaid' && sent.cod_amount === 0);
const masked = JSON.stringify(sanitizeBookingPayload(sent));
check('Logged payload masks phone/email/street', !masked.includes('9999999999') && !masked.includes('t@example.com') && masked.includes('[street masked]'));

calls.length = 0;
stubFetch((b) => (b.carrier_id === '1733448522' ? { status: false, message: 'FL- TOTAL WEIGHT IS MAXIMUM THAN THE CARRIER WEIGHT LIMIT' } : { status: true, awb_number: 'AWB222' }));
r = await bookShiprathShipment({ ...baseOrder });
check('Amazon rejected -> fallback Delhivery Rs40 booked', r.success && r.fallbackUsed && r.carrier_id === '1345673056' && bookCalls().length === 2);

calls.length = 0;
stubFetch((b) => ({ status: false, message: `rejected ${b.carrier_id}` }));
r = await bookShiprathShipment({ ...baseOrder });
check('All rejected -> error with exact Shiprath messages', !r.success && r.courierFailures.length === 3);

calls.length = 0;
r = await bookShiprathShipment({ ...baseOrder, awb_number: 'EXISTING' });
check('Existing AWB -> no Create Shipment call', r.alreadyBooked && bookCalls().length === 0);

calls.length = 0;
stubFetch(() => new Error('The operation was aborted due to timeout'));
r = await bookShiprathShipment({ ...baseOrder });
check('Uncertain response -> stops, no second courier', r.uncertain && bookCalls().length === 1);

calls.length = 0;
stubFetch(() => ({ status: true, awb_number: 'SHOULD-NOT-HAPPEN' }));
r = await bookShiprathShipment({ ...baseOrder, payment_method: 'cod' });
check('COD order is NOT booked as prepaid', !r.success && /COD/.test(r.error) && bookCalls().length === 0);

calls.length = 0;
stubFetch(() => ({ status: true, awb_number: 'AWB333' }));
r = await bookShiprathShipment({ ...baseOrder }, { packageOverride: { weightKg: 0.6, length: 22, width: 18, height: 9 } });
sent = bookCalls()[0]?.body || {};
check('Manual box override used', r.success && sent.weight === 0.6 && sent.length === 22 && sent.width === 18 && sent.height === 9);

calls.length = 0;
r = await bookShiprathShipment({ ...baseOrder, order_items: [{ product_title: 'Jowar Cracker', variant_name: 'Standard', quantity: 1 }] });
check('Unknown weight -> booking refused, Shiprath not called', !r.success && /Weight unknown/.test(r.error) && calls.length === 0);

globalThis.fetch = realFetch;
console.log(failures ? `\n${failures} FAILED` : '\nALL PASSED');
process.exit(failures ? 1 : 0);
