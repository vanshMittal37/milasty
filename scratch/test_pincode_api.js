async function testPin() {
  try {
    const res = await fetch('https://api.postalpincode.in/pincode/263153');
    const data = await res.json();
    console.log('PIN 263153 result:', JSON.stringify(data, null, 2));

    const res2 = await fetch('https://api.postalpincode.in/postoffice/Kichha');
    const data2 = await res2.json();
    console.log('City Kichha result:', JSON.stringify(data2, null, 2));
  } catch (err) {
    console.error('API Error:', err);
  }
}

testPin();
