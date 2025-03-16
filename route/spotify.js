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

module.exports = router;
