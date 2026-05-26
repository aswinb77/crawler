const { db } = require('./lib/firebase');

async function test() {
  const snap = await db.collection("movies").orderBy("createdAt", "desc").limit(20).get();
  snap.docs.forEach(doc => {
    console.log(doc.data().title, doc.data().release_date, doc.data().popularity);
  });
}
test();
