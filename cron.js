const cron = require("node-cron");
const { exec } = require("child_process");
const path = require("path");

console.log("====================================");
console.log(" MovieCC Automated Crawler Service");
console.log(" Started at:", new Date().toISOString());
console.log(" Scheduling orchestrator to run every 1 hours...");
console.log("====================================");

// Run every 12 hours: "0 */12 * * *"
cron.schedule("0 */1 * * *", () => {
  console.log(`\n[CRON] Triggering orchestrator at ${new Date().toISOString()}`);

  const orchestratorPath = path.join(__dirname, "orchestrator.js");

  exec(`node ${orchestratorPath}`, (error, stdout, stderr) => {
    if (error) {
      console.error(`[CRON ERROR] ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`[CRON STDERR] ${stderr}`);
    }
    console.log(`[CRON OUTPUT]\n${stdout}`);
  });
});
