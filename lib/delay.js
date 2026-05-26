// Wait for a random time between min and max milliseconds
// Using random delay makes your crawler less detectable
function delay(minMs = 1000, maxMs = 2500) {
  const ms = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
  return new Promise((resolve) => setTimeout(resolve, ms));
}
// Retry a function up to maxRetries times with exponential backoff
async function withRetry(fn, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt === maxRetries) throw err;
      const wait = attempt * 3000; // 3s, 6s, 9s
      console.warn(` Attempt ${attempt} failed: ${err.message}. Retrying in
${wait / 1000}s...`);
      await new Promise((r) => setTimeout(r, wait));
    }
  }
}
module.exports = { delay, withRetry };
