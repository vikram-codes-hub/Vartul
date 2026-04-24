import express from "express";
import { callML } from "../Utils/mlService.js";
import { isLoggedIn } from "../Middelwares/Isloggeddin.js";

const router = express.Router();

// POST /api/ml/score-reel
// Manually score a reel with the ML pipeline.
// Body: all the fields that /predict expects.
router.post("/score-reel", isLoggedIn, async (req, res) => {
  try {
    const result = await callML(req.body);
    if (!result) {
      return res.status(503).json({ message: "ML service unavailable" });
    }
    res.json({ success: true, ...result });
  } catch (err) {
    console.error("[ML Route] score-reel error:", err);
    res.status(500).json({ message: "Error scoring reel" });
  }
});

// POST /api/ml/bot-check
// Run bot detection on a session payload.
// Body: scroll_speed, skip_time, watch_percentage, session_duration,
//       videos_per_session, watch_time, likes, shares, comments, stake_amount
router.post("/bot-check", isLoggedIn, async (req, res) => {
  try {
    const result = await callML({
      ...req.body,
      // defaults for engagement/feed fields not needed for bot check
      creator_reputation: 0.5,
      creator_followers: 100,
      views: 0,
    });

    if (!result) {
      return res.status(503).json({ message: "ML service unavailable" });
    }

    res.json({
      success: true,
      bot: result.bot,
      engagement_score: result.engagement_score,
    });
  } catch (err) {
    console.error("[ML Route] bot-check error:", err);
    res.status(500).json({ message: "Error running bot check" });
  }
});

// GET /api/ml/health
// Check if the ML service is reachable.
router.get("/health", async (req, res) => {
  try {
    const ML_URL = process.env.ML_SERVICE_URL || "http://localhost:5001";
    const r = await fetch(ML_URL, { signal: AbortSignal.timeout(3000) });
    const text = await r.text();
    res.json({ success: true, status: "online", message: text });
  } catch {
    res.status(503).json({ success: false, status: "offline", message: "ML service unreachable" });
  }
});

export default router;
