require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const admin = require("firebase-admin");
if (!admin.apps.length) {
  let credential;
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    // Railway / cloud: service account passed as JSON string in env variable
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    credential = admin.credential.cert(serviceAccount);
  } else {
    // Local development: read from file
    credential = admin.credential.cert(
      require(require("path").join(__dirname, "../serviceAccountKey.json")),
    );
  }
  admin.initializeApp({ credential });
}
const db = admin.firestore();
module.exports = { db, admin };
