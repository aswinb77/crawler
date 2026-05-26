const axios = require('axios');
const cheerio = require('cheerio');

async function testNowRunning() {
  try {
    const { data } = await axios.get('https://www.nowrunning.com/movies/malayalam/now-showing/', {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const $ = cheerio.load(data);
    const movies = [];
    $('.mov-card a').each((_, el) => {
      const title = $(el).attr('title');
      if (title) movies.push(title);
    });
    console.log("NowRunning:", movies);
  } catch(e) {
    console.log("NowRunning Error", e.message);
  }
}

async function testFilmibeat() {
  try {
    const { data } = await axios.get('https://www.filmibeat.com/malayalam/movies/now-playing.html', {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const $ = cheerio.load(data);
    const movies = [];
    $('.mov-name').each((_, el) => {
      movies.push($(el).text().trim());
    });
    console.log("Filmibeat:", movies);
  } catch(e) {
    console.log("Filmibeat Error", e.message);
  }
}

testNowRunning();
testFilmibeat();
