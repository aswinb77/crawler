require("dotenv").config();
const axios = require("axios");
const { delay } = require("../lib/delay");
const { db, admin } = require("../lib/firebase");
const { mergeMovie } = require("../lib/merge");

const TMDB_KEY = process.env.TMDB_KEY;

// Fetch Malayalam movies currently in theaters using TMDB Discover
async function fetchInTheaters() {
  console.log("  Fetching Malayalam movies currently in theaters from TMDB...");
  const today = new Date().toISOString().split("T")[0];
  const oneMonthAgo = new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  const url = `https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_KEY}&with_original_language=ml&region=IN&with_release_type=2|3&primary_release_date.gte=${oneMonthAgo}&primary_release_date.lte=${today}`;

  try {
    const { data } = await axios.get(url, { timeout: 15000 });
    const inTheaterIds = new Set(data.results.map((m) => m.id));
    console.log(`    Found ${inTheaterIds.size} theatrical releases.`);
    return inTheaterIds;
  } catch (err) {
    console.warn(`    ! Error fetching theatrical releases: ${err.message}`);
    return new Set();
  }
}

// Search TMDB for a movie title and year
async function searchTmdb(title, year) {
  const query = encodeURIComponent(title);
  // Attempt search with exact year first, fallback to without year if not found
  let url = `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_KEY}&query=${query}&primary_release_year=${year}&language=ml`;
  
  try {
    let { data } = await axios.get(url, { timeout: 12000 });
    
    if (data.results.length === 0) {
       // Fallback search without year constraints
       url = `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_KEY}&query=${query}`;
       const res = await axios.get(url, { timeout: 12000 });
       data = res.data;
    }

    if (data.results.length > 0) {
      // Pick the first result that seems relevant
      const result = data.results[0];
      return {
        tmdb_id: result.id,
        poster_path: result.poster_path || null,
        backdrop_path: result.backdrop_path || null,
        vote_average: result.vote_average || 0,
        overview: result.overview || "",
        release_date: result.release_date || null,
        popularity_raw: result.popularity || 0,
      };
    }
    return null;
  } catch (e) {
    console.warn(`    ! Search TMDB failed for ${title}: ${e.message}`);
    return null;
  }
}

// Fetch full details including watch/providers
async function fetchFullDetails(tmdbId) {
  try {
    const url = `https://api.themoviedb.org/3/movie/${tmdbId}?api_key=${TMDB_KEY}&append_to_response=watch/providers`;
    const { data } = await axios.get(url, { timeout: 12000 });
    
    let on_ott = false;
    if (data['watch/providers'] && data['watch/providers'].results && data['watch/providers'].results.IN) {
       const inProviders = data['watch/providers'].results.IN;
       if (inProviders.flatrate || inProviders.buy || inProviders.rent) {
         on_ott = true;
       }
    }
    return { on_ott };
  } catch (e) {
    return { on_ott: false };
  }
}

async function runTmdbCrawler() {
  console.log("[TMDB Crawler] Starting pure metadata enrichment...");
  
  if (!TMDB_KEY) {
    throw new Error("TMDB_KEY is not set in environment variables.");
  }

  const inTheaterIds = await fetchInTheaters();

  try {
    const snapshot = await db.collection("movies")
        .orderBy("createdAt", "desc")
        .limit(100)
        .get();

    for (const doc of snapshot.docs) {
      const film = doc.data();
      
      // Let it re-enrich recently created docs even if they have some basic TMDB info,
      // but maybe skip if we just enriched them yesterday.
      if (film.lastTmdbUpdate) {
        const diffHours = (new Date() - film.lastTmdbUpdate.toDate()) / (1000 * 60 * 60);
        if (diffHours < 24) continue;
      }

      try {
        console.log(`  Enriching: ${film.title} (${film.year})`);
        const details = await searchTmdb(film.title, film.year);
        
        if (!details) {
          console.log(`  ✗ Not found on TMDB: ${film.title}`);
          continue;
        }

        // Fetch OTT data
        const { on_ott } = await fetchFullDetails(details.tmdb_id);
        const rDate = details.release_date || film.release_date || `${film.year}-01-01`;
        
        // BookMyShow is the true source for local Kerala theatrical data.
        // If it's already in theaters from BMS, keep it true. Otherwise fallback to TMDB data.
        let in_theaters = film.in_theaters === true || (film.theatres && film.theatres.length > 0);
        if (!in_theaters) {
          in_theaters = inTheaterIds.has(details.tmdb_id);
        }
        
        // If it's on OTT, it's very rarely still in major theaters, but let's trust TMDB's inTheaters array if it's there.
        // Actually if it's in theaters and NOT on OTT, it's definitely a theatrical run.
        if (on_ott && in_theaters) {
          // If it's heavily pushed on OTT, sometimes TMDB lags. We'll leave it as true but OTT=true
        }

        const basePopularity = film.popularity > details.popularity_raw ? film.popularity : details.popularity_raw;
        
        // Total score = base popularity + any existing user votes
        let total_score = basePopularity + ((film.user_votes || 0) * 50);
        
        // Massive boost to trending for movies currently in theaters so they show up at the top
        if (in_theaters) {
           total_score += 300; // Match BMS boost
        }

        await mergeMovie(doc.id, {
          tmdb_id: details.tmdb_id,
          poster_path: details.poster_path || film.poster_path || "",
          backdrop_path: details.backdrop_path || film.backdrop_path || "",
          vote_average: details.vote_average || film.vote_average || 0,
          overview: details.overview || film.overview || "",
          release_date: rDate,
          popularity: basePopularity,
          total_score: total_score,
          in_theaters: in_theaters,
          on_ott: on_ott,
          lastTmdbUpdate: admin.firestore.Timestamp.now(),
        });

        console.log(`  ✓ Enriched: ${film.title} (TMDB ID: ${details.tmdb_id}) | InTheaters: ${in_theaters} | OTT: ${on_ott}`);
        
        await delay(500, 1000);
      } catch (err) {
        console.warn(`  ! Error enriching ${film.title}: ${err.message}`);
      }
    }
  } catch (err) {
    console.error("[TMDB Crawler] Error:", err);
    throw err;
  }

  console.log("[TMDB Crawler] Finished");
}

module.exports = runTmdbCrawler;
