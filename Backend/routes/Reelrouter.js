import express from "express";
import { isLoggedIn } from "../Middelwares/Isloggeddin.js";
import {
  upload,
  uploadReel,
  uploadReelMultipart,
  getFeedReels,
  getUserReels,
  likeReel,
  getReelComments,
  commentOnReel,
  incrementView,
  incrementShare,
  deleteReel,
} from "../Controllers/Reelcontroller.js";

const Reelrouter = express.Router();

// All routes require authentication
Reelrouter.use(isLoggedIn);

// Feed & user reels
Reelrouter.get("/feed", getFeedReels);
Reelrouter.get("/user/:userId", getUserReels);

// Upload – multipart (streaming) & base64 (legacy fallback)
Reelrouter.post("/upload-multipart", upload.single("video"), uploadReelMultipart);
Reelrouter.post("/upload", uploadReel);

// Single reel actions
Reelrouter.post("/:reelId/like", likeReel);
Reelrouter.post("/:reelId/view", incrementView);
Reelrouter.post("/:reelId/share", incrementShare);
Reelrouter.delete("/:reelId", deleteReel);

// Comments
Reelrouter.get("/:reelId/comments", getReelComments);
Reelrouter.post("/:reelId/comments", commentOnReel);

export default Reelrouter;