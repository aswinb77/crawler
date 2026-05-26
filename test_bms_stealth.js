const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

async function testBMS() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });
  
  const page = await browser.newPage();
  
  try {
    await page.goto('https://in.bookmyshow.com/explore/home/kochi', { waitUntil: 'networkidle2', timeout: 30000 });
    
    // Output page title and some HTML to see if we're blocked
    const title = await page.title();
    console.log("Page Title:", title);
    
    // Wait for the movie cards to appear. They might have changed classes.
    // Let's just dump all text inside elements that look like movie cards or images.
    const movies = await page.evaluate(() => {
      const results = [];
      // Look for images with alt text, specifically those in links or div grids
      document.querySelectorAll('img[alt]').forEach(el => {
        const alt = el.getAttribute('alt');
        if (alt && !alt.toLowerCase().includes('offer') && !alt.toLowerCase().includes('ad')) {
          results.push(alt);
        }
      });
      return [...new Set(results)].slice(0, 10); // Deduplicate and limit
    });
    
    console.log("Found movies:", movies);
  } catch (err) {
    console.error("Stealth BMS Error:", err.message);
  } finally {
    await browser.close();
  }
}

testBMS();
