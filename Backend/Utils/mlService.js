/**
 * mlService.js — Backend utility to call the Vartul ML Flask API
 *
 * Flask API runs on ML_SERVICE_URL (default: http://localhost:5001)
 * POST /predict  →  { engagement_score, bot, feed_score }
 */

const ML_URL = process.env.ML_SERVICE_URL || "http://localhost:5001";

/**
 * Call the ML /predict endpoint.
 *
 * @param {object} payload  — fields for the ML models (see below)
 * @returns {Promise<{ engagement_score: number, bot: object, feed_score: number } | null>}
 *          Returns null on network/timeout failure so callers can fall back gracefully.
 *
 * Required fields:
 *   watch_time, watch_percentage, likes, shares, comments, views,
 *   scroll_speed, skip_time, session_duration, videos_per_session,
 *   stake_amount, creator_reputation, creator_followers
 *
 * Optional fields (have defaults):
 *   caption, is_viral_video, replay_count, video_category,
 *   follow_creator, viewer_reward, video_length,
 *   device_type, network_type
 */
export async function callML(payload) {
  // Apply defaults for fields the frontend may not always provide
  const body = {
    // Text / content
    caption: payload.caption || "",

    // Engagement signals (Model 1)
    watch_time:         payload.watch_time         ?? 30,
    watch_percentage:   payload.watch_percentage   ?? 50,
    likes:              payload.likes              ?? 0,
    shares:             payload.shares             ?? 0,
    comments:           payload.comments           ?? 0,
    views:              payload.views              ?? 0,
    save_video:         payload.save_video         ?? 0,
    replay_count:       payload.replay_count       ?? 0,
    video_length:       payload.video_length       ?? 60,
    is_viral_video:     payload.is_viral_video     ?? 0,

    // Bot detection signals (Model 2)
    scroll_speed:       payload.scroll_speed       ?? 1.5,   // normal human ~1–3
    skip_time:          payload.skip_time          ?? 5,     // seconds before skip
    session_duration:   payload.session_duration   ?? 600,   // 10 minutes typical
    videos_per_session: payload.videos_per_session ?? 6,
    stake_amount:       payload.stake_amount       ?? 0,
    device_type:        payload.device_type        ?? 0,     // 0=mobile
    network_type:       payload.network_type       ?? 0,     // 0=wifi

    // Feed ranking signals (Model 3)
    creator_reputation: payload.creator_reputation ?? 0.5,
    creator_followers:  payload.creator_followers  ?? 100,
    video_category:     payload.video_category     ?? 1,
    follow_creator:     payload.follow_creator     ?? 0,
    viewer_reward:      payload.viewer_reward      ?? 0.5,
  };

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000); // 5s timeout

    const res = await fetch(`${ML_URL}/predict`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(body),
      signal:  controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) {
      console.warn(`[ML] /predict returned HTTP ${res.status}`);
      return null;
    }

    return await res.json();
  } catch (err) {
    if (err.name === "AbortError") {
      console.warn("[ML] /predict timed out after 5s — skipping ML scoring");
    } else {
      console.warn("[ML] /predict error:", err.message);
    }
    return null;
  }
}
