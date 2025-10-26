import express from "express";
import axios from "axios";

const app = express();
const port = 3000;

const CLIENT_ID = "b8ddac2e45754f0bbc791142fe6d3f30";
const CLIENT_SECRET = "256c302b39cd40e2ad4c725709e6b416";

app.use(express.static("public"));

const getSpotifyToken = async () => {
  const tokenUrl = "https://accounts.spotify.com/api/token";
  
  // Use URLSearchParams, which is built into Node.js
  const bodyParams = new URLSearchParams();
  bodyParams.append('grant_type', 'client_credentials');

  const headers = {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Authorization': 'Basic ' + Buffer.from(CLIENT_ID + ':' + CLIENT_SECRET).toString('base64')
  };

  try {
    const response = await axios.post(tokenUrl, bodyParams, { headers });
    return response.data.access_token; // This is the temporary token
  } catch (err) {
    console.error("Error getting Spotify token:", err.response ? err.response.data : "Unknown error");
    return null;
  }
};

//  API endpoint for songs
app.get("/songs", async (req, res) => {
  const genre = req.query.mood || "pop";
  
  //fresh token *every time* this is called
  const token = await getSpotifyToken();

  if (!token) {
    return res.status(500).json({ error: "Failed to get Spotify token" });
  }
  
  // Use that token to search for songs
  try {
    const { data } = await axios.get("https://api.spotify.com/v1/search", {
      headers: {
        Authorization: `Bearer ${token}`, // Use the token we just got
      },
      params: {
        q: `genre:${genre}`,
        type: "track",
        limit: 5,
      },
    });

    const songs = data.tracks.items.map((t) => ({
      name: t.name,
      artist: t.artists[0].name,
      url: t.external_urls.spotify,
    }));

    res.json(songs);

  } catch (err) {
    console.error("Spotify Search Error:", err.response ? err.response.data : "Unknown error");
    res.status(500).json({ error: "Failed to fetch songs from Spotify." });
  }
});

app.listen(port, () => {
  console.log(`✅ Server running at http://localhost:${port}`);
});