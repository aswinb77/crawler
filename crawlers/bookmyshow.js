const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
puppeteer.use(StealthPlugin());

const { delay } = require("../lib/delay");
const { db, admin } = require("../lib/firebase");

// Kerala cities to check — BookMyShow URL slugs
const CITIES = [
  { name: "Kochi", slug: "kochi" },
  { name: "Thiruvananthapuram", slug: "thiruvananthapuram" },
  { name: "Kottayam", slug: "kottayam" },
  { name: "Kozhikode", slug: "kozhikode" },
];

const MALAYALAM_KEYWORDS = ["Malayalam"];

// Scrape current theatre listings from BookMyShow for a city
async function scrapeCity(browser, city) {
  console.log(`  Scraping ${city.name}...`);
  let page;
  try {
    page = await browser.newPage();
    await page.goto(
      `https://in.bookmyshow.com/explore/home/${city.slug}`,
      { waitUntil: "networkidle2", timeout: 30000 },
    );

    // Wait for movie cards to load (using broad selectors that might appear on BookMyShow)
    await page.waitForSelector("img[alt], .movieCardImg, [class*='movieCard']", {
      timeout: 10000,
    });

    // Extract movie titles safely
    const movies = await page.evaluate(() => {
      const titles = [];
      document.querySelectorAll("img[alt], .movieCardImg, [class*='movieCard']").forEach((el) => {
        const title = el.getAttribute("alt") || el.getAttribute("title") || el.textContent;
        if (title && !title.toLowerCase().includes("offer") && !title.toLowerCase().includes("ad")) {
          titles.push(title.trim());
        }
      });
      return [...new Set(titles)]; // Deduplicate
    });

    // In a real scenario, we might have to filter by 'Malayalam', but BMS home page
    // often shows movies from multiple languages. We'll cross-reference with our Firestore.
    // If it exists in Firestore as a Malayalam movie, it's valid!
    console.log(`    Found ${movies.length} raw titles in ${city.name}. Cross-referencing...`);

    // Update Firestore with theatre information
    let matches = 0;
    for (const title of movies) {
      const titleLower = title.toLowerCase();
      // Simple text match in Firestore
      const query = await db.collection("movies")
          .where("title_lower", "==", titleLower)
          .limit(1).get();
          
      if (!query.empty) {
        matches++;
        const doc = query.docs[0];
        const data = doc.data();
        const theatres = data.theatres || [];
        
        let updateData = {};
        let needsUpdate = false;

        if (!theatres.includes(city.name)) {
          theatres.push(city.name);
          updateData.theatres = theatres;
          needsUpdate = true;
        }

        // Always ensure in_theaters is true and total_score is boosted if it's currently showing
        if (data.in_theaters !== true) {
          updateData.in_theaters = true;
          needsUpdate = true;
        }
        
        // Massive boost to make it trend above OTT movies
        const boostedScore = (data.popularity || 10) + ((data.user_votes || 0) * 50) + 300;
        if (data.total_score !== boostedScore) {
          updateData.total_score = boostedScore;
          needsUpdate = true;
        }

        if (needsUpdate) {
          updateData.popularity = 100;
          updateData.lastTheatreUpdate = admin.firestore.Timestamp.now();
          await doc.ref.update(updateData);
        }
      }
    }
    
    console.log(`    ✓ Updated ${matches} Malayalam films in ${city.name} to 'In Theaters'`);
    return matches;
  } catch (err) {
    console.warn(`    Error scraping ${city.name}: ${err.message}`);
    return [];
  } finally {
    if (page) await page.close();
  }
}

async function runBookMyShowCrawler() {
  console.log("[BookMyShow Crawler] Starting with Stealth Puppeteer...");

  const browser = await puppeteer.launch({
    headless: true, // Uses new headless mode in modern puppeteer
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    for (const city of CITIES) {
      await scrapeCity(browser, city);
      await delay(2000, 4000);
    }
  } catch (err) {
    console.error("[BookMyShow Crawler] Error:", err);
    throw err;
  } finally {
    await browser.close();
  }

  console.log("[BookMyShow Crawler] Finished");
}

module.exports = runBookMyShowCrawler;
