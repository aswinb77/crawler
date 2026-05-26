const cron = require("node-cron");
const runWikipedia = require("./crawlers/wikipedia");
const runImdb = require("./crawlers/imdb");
const runBookMyShow = require("./crawlers/bookmyshow");
const runOtt = require("./crawlers/ott");
console.log("MovieCC Scheduler started. Running crawlers on schedule...");
console.log("Press Ctrl+C to stop.\n");
// ■■ BookMyShow: runs EVERY DAY at 8:00 AM IST (2:30 UTC) ■■■■■■■■■■■■■
// Theatre listings change daily so we check every morning
cron.schedule(
  "30 2 * * *",
  async () => {
    console.log(`[${new Date().toISOString()}] Running BookMyShow crawler...`);
    await runBookMyShow().catch(console.error);
  },
  { timezone: "UTC" },
);
// ■■ OTT: runs EVERY DAY at 10:00 AM IST (4:30 UTC) ■■■■■■■■■■■■■■■■■■
// OTT catalogues update frequently
cron.schedule(
  "30 4 * * *",
  async () => {
    console.log(`[${new Date().toISOString()}] Running OTT crawler...`);
    await runOtt().catch(console.error);
  },
  { timezone: "UTC" },
);
// ■■ Wikipedia + IMDb: runs EVERY SUNDAY at 1:00 AM IST (19:30 Sat UTC)
// New films are added weekly — no need to check daily
cron.schedule(
  "30 19 * * 0",
  async () => {
    console.log(
      `[${new Date().toISOString()}] Running Wikipedia + IMDb crawlers...`,
    );
    await runWikipedia().catch(console.error);
    await runImdb().catch(console.error);
  },
  { timezone: "UTC" },
);
console.log("Schedules set:");
console.log(" BookMyShow — every day at 8:00 AM IST");
console.log(" OTT check — every day at 10:00 AM IST");
console.log(" Wikipedia — every Sunday at 1:00 AM IST");
console.log(" IMDb enrich — every Sunday after Wikipedia");
