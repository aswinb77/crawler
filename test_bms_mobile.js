const axios = require('axios');
const cheerio = require('cheerio');

async function testMobileBMS() {
  const url = 'https://in.bookmyshow.com/explore/home/kochi';
  try {
    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      }
    });
    console.log("Success! HTML length:", data.length);
  } catch (err) {
    console.error("BMS Mobile Error:", err.response ? err.response.status : err.message);
  }
}
testMobileBMS();
