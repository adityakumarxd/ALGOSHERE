const express = require("express");
const router = express.Router();
const axios = require("axios");

// ✅ Middleware: Check If User is Authenticated
const ensureAuthenticated = (req, res, next) => {
  if (req.isAuthenticated() && req.user && req.user.accessToken) {
    return next();
  }
  res.status(401).json({ error: "Unauthorized - Please log in via Spotify" });
};

// 🔹 Route: Get User's Top Artists (Protected Route)
router.get("/top-artists", ensureAuthenticated, async (req, res) => {
  try {
    const accessToken = req.user.accessToken;

    const response = await axios.get("https://api.spotify.com/v1/me/top/artists", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    res.json(response.data);
  } catch (error) {
    console.error("Error fetching Spotify data:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to fetch top artists" });
  }
});

// Route to fetch user data from Spotify and save it
router.get('/user-data', async (req, res) => {
  const { access_token } = req.query;

  try {
      // Fetch user's top artists and tracks from Spotify
      const [topArtists, topTracks] = await Promise.all([
          axios.get('https://api.spotify.com/v1/me/top/artists', {
              headers: { Authorization: `Bearer ${access_token}` },
          }),
          axios.get('https://api.spotify.com/v1/me/top/tracks', {
              headers: { Authorization: `Bearer ${access_token}` },
          }),
      ]);

      const userData = {
          spotify_id: req.user.spotify_id, // Assuming you have the user's Spotify ID
          email: req.user.email, // Assuming you have the user's email
          top_artists: topArtists.data.items,
          top_tracks: topTracks.data.items,
      };

      // Save user data to MongoDB
      const saveResponse = await axios.post('http://localhost:5000/save-user-data', userData);
      res.status(200).json(saveResponse.data);
  } catch (err) {
      console.error('Error fetching or saving user data', err);
      res.status(500).json({ error: 'Failed to fetch or save user data' });
  }
});

module.exports = router;
