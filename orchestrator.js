// Master orchestrator — runs all crawlers in sequence
// Usage: node orchestrator.js
// node orchestrator.js --only=wikipedia
// node orchestrator.js --only=tmdb
const runWikipedia = require("./crawlers/wikipedia");
const runTmdb = require("./crawlers/tmdb");
const runBookMyShow = require("./crawlers/bookmyshow");

async function main() {
  const args = process.argv.slice(2);
  const onlyFlag = args.find((a) => a.startsWith("--only="));
  const only = onlyFlag ? onlyFlag.split("=")[1] : null;

  const start = Date.now();
  console.log("====================================");
  console.log(" MovieCC Crawler Orchestrator");
  console.log(` Started: ${new Date().toISOString()}`);
  console.log("====================================");

  try {
    if (!only || only === "wikipedia") {
      await runWikipedia();
    }

    if (!only || only === "tmdb") {
      // TMDB enrichment — run after Wikipedia so new films are in Firestore
      await runTmdb();
    }
  } catch (err) {
    console.error("Orchestrator error:", err);
    process.exit(1);
  }

  const mins = ((Date.now() - start) / 60000).toFixed(1);
  console.log("====================================");
  console.log(` All crawlers finished in ${mins} minutes`);
  console.log("====================================");
  process.exit(0);
}

main();
