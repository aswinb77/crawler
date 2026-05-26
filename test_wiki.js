const axios = require('axios');
const cheerio = require('cheerio');

async function testWiki() {
  const url = `https://en.wikipedia.org/wiki/List_of_Malayalam_films_of_2024`;
  const { data: html } = await axios.get(url);
  const $ = cheerio.load(html);
  
  const movies = [];
  $("table.wikitable tbody tr").each((i, row) => {
    // A reliable way to get film titles is finding the <i> tag which Wikipedia uses for titles.
    const titleCell = $(row).find("i").first().text().trim();
    if (titleCell && titleCell.length > 1) {
      movies.push(titleCell);
    }
  });
  console.log("Found movies:", movies.slice(0, 15));
}
testWiki();
