const axios = require('axios');

async function testPaytm() {
  try {
    // Paytm usually uses this API for movies
    const { data } = await axios.get('https://apiproxy.paytm.com/v2/movies/upcoming', {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    console.log("Paytm upcoming keys:", Object.keys(data));
  } catch(e) {
    console.log("Paytm API Error:", e.message);
  }
}
testPaytm();
