// Node 24 has built-in global fetch.
// Node 18+ has built-in global fetch.

async function check() {
  const url = 'https://res.cloudinary.com/dmm8lfc3x/raw/upload/v1786967857/milasty/reports/Cardamom_Bajra.pdf';
  try {
    const res = await fetch(url);
    console.log('Status Code:', res.status);
    console.log('Content-Type:', res.headers.get('content-type'));
    const text = await res.text();
    console.log('Body snippet (first 300 chars):');
    console.log(text.substring(0, 300));
  } catch (err) {
    console.error('Error fetching URL:', err);
  }
}

check();
