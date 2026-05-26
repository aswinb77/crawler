const axios = require('axios');
async function testTicketNew() {
  const { data } = await axios.get('https://www.ticketnew.com/movies/kochi', {
    headers: { 'User-Agent': 'Mozilla/5.0' }
  });
  // TicketNew usually has __NEXT_DATA__ or similar script tag
  const match = data.match(/<script id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/);
  if (match) {
    const json = JSON.parse(match[1]);
    console.log("TicketNew Found Next Data! Keys:", Object.keys(json.props.pageProps));
    // Let's dump the first few movies
    const movies = json.props.pageProps.initialState?.movies?.movieList || [];
    console.log("Movies:", movies.map(m => m.movieName).slice(0, 10));
  } else {
    console.log("No NEXT_DATA found.");
    // Try finding "movieName" in the raw HTML
    const movieMatches = data.match(/"movieName":"([^"]+)"/g);
    console.log("Regex matches:", movieMatches ? movieMatches.slice(0,10) : "None");
  }
}
testTicketNew();
