const { db } = require("./firebase");

// Merge a single movie into Firestore
// If it already exists (by title), update it; otherwise create new
async function mergeMovie(docId, updates) {
  if (!docId) {
    console.warn("  ! mergeMovie called without docId");
    return;
  }

  try {
    await db.collection("movies").doc(docId).update(updates);
  } catch (err) {
    if (err.code === "not-found") {
      // Document doesn't exist, create it
      await db.collection("movies").doc(docId).set(updates);
    } else {
      throw err;
    }
  }
}

async function batchMergeMovies(movies) {
  console.log(` Batch merging ${movies.length} movies...`);

  let batch = db.batch();
  let operationCount = 0;
  
  for (const movie of movies) {
    const titleLower = movie.title.toLowerCase();
    
    // Check for existing movie to prevent duplicates
    const existing = await db.collection("movies")
      .where("title_lower", "==", titleLower)
      .limit(1).get();
      
    let docId;
    if (!existing.empty) {
      docId = existing.docs[0].id;
    } else {
      docId = `${titleLower
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "")}_${movie.year}`;
    }

    batch.set(
      db.collection("movies").doc(docId),
      {
        title: movie.title,
        title_lower: titleLower,
        year: movie.year,
        source: movie.source,
        language: movie.language || "ml", // Default to ml for Malayalam movies
        release_date: movie.release_date || `${movie.year}-01-01`, // Fallback for sorting
        popularity: movie.popularity || 0,
        vote_average: movie.vote_average || 0,
        user_votes: 0,
        total_score: 0,
        createdAt: new Date(),
        ...movie,
      },
      { merge: true },
    );
    
    operationCount++;
    if (operationCount >= 400) {
      await batch.commit();
      batch = db.batch(); // <--- FIX: Create a new batch after commit
      operationCount = 0;
    }
  }

  if (operationCount > 0) {
    await batch.commit();
  }

  console.log(` Batch merged successfully`);
}

module.exports = { mergeMovie, batchMergeMovies };
