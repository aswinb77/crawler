const { db } = require("./lib/firebase");

async function cleanup() {
  console.log("Cleaning up corrupted movies...");
  const snap = await db.collection("movies").get();
  
  const batch = db.batch();
  let deletedCount = 0;

  const months = ['january','february','march','april','may','june','july','august','september','october','november','december'];

  for (const doc of snap.docs) {
    const title = doc.data().title_lower || "";
    
    // If title is just a number, or just a month name, it's corrupt
    const isNumber = /^\d+$/.test(title);
    const isMonth = months.includes(title);
    
    if (isNumber || isMonth || title.length < 2) {
      console.log(`Deleting corrupted: ${doc.data().title}`);
      batch.delete(doc.ref);
      deletedCount++;
    }
  }

  if (deletedCount > 0) {
    await batch.commit();
    console.log(`Successfully deleted ${deletedCount} corrupted movies.`);
  } else {
    console.log("No corrupted movies found.");
  }
}

cleanup();
