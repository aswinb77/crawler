const axios = require('axios');
const cheerio = require('cheerio');

async function testTicketNew() {
  try {
    const { data } = await axios.get('https://www.ticketnew.com/movies/kochi', {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const $ = cheerio.load(data);
    const titles = [];
    $('[class*="MovieCard"], h4, [class*="title"]').each((_, el) => {
      const text = $(el).text().trim();
      if (text.length > 2 && text.length < 50) titles.push(text);
    });
    console.log("TicketNew Titles found:", [...new Set(titles)].slice(0, 10));
  } catch(err) {
    console.error("TicketNew Error:", err.message);
  }
}
testTicketNew();
