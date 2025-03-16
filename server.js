require("dotenv").config();
const express = require("express");
const passport = require("passport");
const SpotifyStrategy = require("passport-spotify").Strategy;
const session = require("express-session");
const axios = require("axios");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 5000;

// Serve static files from the "public" folder
app.use(express.static(path.join(__dirname, "public")));

// CORS Setup
app.use(cors({ origin: "http://localhost:5000", credentials: true }));

// Session Setup
app.use(
  session({
    secret: "your-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }, // Set to `true` if using HTTPS
  })
);

app.use(passport.initialize());
app.use(passport.session());

// Spotify Passport Strategy
passport.use(
  new SpotifyStrategy(
    {
      clientID: process.env.SPOTIFY_CLIENT_ID,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
      callbackURL: "http://localhost:5000/auth/spotify/callback",
    },
    (accessToken, refreshToken, expires_in, profile, done) => {
      console.log("Authenticated User:", profile.displayName); // Debugging
      return done(null, { profile, accessToken });
    }
  )
);

// Serialize & Deserialize User
passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((obj, done) => {
  done(null, obj);
});

// Auth Route
app.get(
  "/auth/spotify",
  passport.authenticate("spotify", { scope: ["user-top-read"] })
);

app.get(
  "/auth/spotify/callback",
  passport.authenticate("spotify", {
    failureRedirect: "/auth/fail",
    successRedirect: "/dashboard",
  })
);

// Logout Route
app.get("/logout", (req, res) => {
  req.logout((err) => {
    if (err) return res.status(500).send("Logout Failed");
    req.session.destroy(() => {
      res.redirect("/");
    });
  });
});

// Debug Route (Check User in Session)
app.get("/debug", (req, res) => {
  console.log("Session User:", req.user); // Debugging
  res.json({ user: req.user || "No user in session" });
});

// Protected API Route
app.get("/api/spotify/top-artists", async (req, res) => {
  if (!req.user || !req.user.accessToken) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const response = await axios.get("https://api.spotify.com/v1/me/top/artists", {
      headers: { Authorization: `Bearer ${req.user.accessToken}` },
    });

    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch data" });
  }
});

// Serve Dashboard
app.get("/dashboard", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});