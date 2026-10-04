const SHIPRATH_BASE_URL = 'https://backend.shiprath.com/vendor/v1';

const customerId = 'c1777109293416';
const secretKey = 'XYM8QM';

async function testHeaderKey(headers, label) {
  try {
    const res = await fetch(`${SHIPRATH_BASE_URL}/shipment/shipment_rate_time`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        address_id: '1777118843112',
        destination_pincode: '110001',
        weight: 0.5,
        length: 10,
        breadth: 10,
        height: 10,
        declared_value: 200,
        payment_mode: 'prepaid',
        cod_amount: 0,
      }),
    });
    const data = await res.json();
    console.log(`[${label}] Status: ${res.status} => ${JSON.stringify(data)}`);
  } catch (err) {
    console.log(`[${label}] Exception:`, err.message);
  }
}

async function runAll() {
  await testHeaderKey({ 'Content-Type': 'application/json', secretkey: secretKey, customerid: customerId }, 'secretkey + customerid');
  await testHeaderKey({ 'Content-Type': 'application/json', secretkey: secretKey.toLowerCase(), customerid: customerId }, 'secretkey lowercase');
  await testHeaderKey({ 'Content-Type': 'application/json', secret_key: secretKey, customer_id: customerId }, 'secret_key + customer_id');
  await testHeaderKey({ 'Content-Type': 'application/json', authorization: `Bearer ${secretKey}`, customerid: customerId }, 'authorization bearer');
  await testHeaderKey({ 'Content-Type': 'application/json', 'x-api-key': secretKey, 'x-customer-id': customerId }, 'x-api-key + x-customer-id');
  await testHeaderKey({ 'Content-Type': 'application/json', token: secretKey, customerid: customerId }, 'token + customerid');
}

runAll();
