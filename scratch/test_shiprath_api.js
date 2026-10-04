const SHIPRATH_BASE_URL = 'https://backend.shiprath.com/vendor/v1';

// Replace with customer ID and secret key if known, or dummy
const customerId = process.env.SHIPRATH_CUSTOMER_ID || 'c1777109293416';
const secretKey = process.env.SHIPRATH_SECRET_KEY || 'XYM8QM';

async function testEndpoint(endpoint, bodyObj, label) {
  try {
    const res = await fetch(`${SHIPRATH_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        secretkey: secretKey,
        customerid: customerId,
      },
      body: JSON.stringify(bodyObj),
    });
    const data = await res.json();
    console.log(`[${label}] (${endpoint}) Status: ${res.status} => ${JSON.stringify(data)}`);
  } catch (err) {
    console.log(`[${label}] (${endpoint}) Exception:`, err.message);
  }
}

async function runAll() {
  console.log("Testing endpoints for missing required fields...");
  
  await testEndpoint('/shipment/shipment_rate_time', {}, 'rate_time empty body');
  await testEndpoint('/shipment/shipment_rate_time', {
    address_id: '1777118843112',
    destination_pincode: '110001',
    weight: 0.5,
    length: 10,
    breadth: 10,
    height: 10,
    declared_value: 200,
    payment_mode: 'prepaid',
    cod_amount: 0,
  }, 'rate_time standard body');

  await testEndpoint('/shipment/new_shipment_create', {}, 'create empty body');
  await testEndpoint('/shipment/create_shipment', {}, 'create_shipment empty body');
}

runAll();
