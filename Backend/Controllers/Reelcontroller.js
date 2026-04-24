import Reel from "../Models/Reel_Model.js";
import User from "../Models/User.js";
import cloudinary from "../Config/cloudinary.js";
import Follow from "../Models/Follow.js";
import multer from "multer";
import IpfsService from "../Blockchain/IpfsService.js";
import redisClient from "../Config/redis.js";

// Multer memory storage
const storage = multer.memoryStorage();
export const upload = multer({
  storage,
  limits: { fileSize: 200 * 1024 * 1024 }, // 200 MB hard limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("video/")) {
      cb(null, true);
    } else {
      cb(new Error("Only video files are allowed"), false);
    }
  },
});

// Helper: upload a buffer to Cloudinary via stream
const uploadBufferToCloudinary = (buffer, options = {}) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) return reject(error);
      resolve(result);
    });
    stream.end(buffer);
  });

// Upload reel (multipart/form-data)
export const uploadReelMultipart = async (req, res) => {
  try {
    const userId = req.user._id;

    if (!req.file) {
      return res.status(400).json({ success: false, error: "Video file is required" });
    }

    const { description = "", audioName = "Original Audio", tags = "[]" } = req.body;
    const parsedTags = (() => {
      try { return JSON.parse(tags); } catch { return []; }
    })();

    // Upload to Cloudinary (primary CDN)
    const videoUpload = await uploadBufferToCloudinary(req.file.buffer, {
      resource_type: "video",
      folder: "vartul/reels",
      transformation: [{ quality: "auto", fetch_format: "auto" }],
    });

    // Auto-generate thumbnail
    let thumbnailUrl = "";
    try {
      const thumbResult = await cloudinary.uploader.upload(
        videoUpload.secure_url.replace(/\.[^/.]+$/, ".jpg") + "?t=1",
        {
          resource_type: "image",
          folder: "vartul/reels/thumbnails",
          transformation: [{ width: 720, crop: "scale" }],
        }
      );
      thumbnailUrl = thumbResult.secure_url;
    } catch {
      // Thumbnail generation optional – don't fail the whole upload
    }

    // IPFS Upload (decentralized backup via Pinata)
    let ipfsCid = null;
    let ipfsUrl = null;
    try {
      const ipfsResult = await IpfsService.uploadFileToIPFS(
        req.file.buffer,
        req.file.originalname || `reel_${Date.now()}.mp4`,
        req.file.mimetype || "video/mp4"
      );
      if (ipfsResult) {
        ipfsCid = ipfsResult.cid;
        ipfsUrl = ipfsResult.url;
        console.log(`[IPFS] Reel pinned: ${ipfsCid}`);
      }
    } catch (ipfsErr) {
      console.warn("[IPFS] Upload skipped:", ipfsErr.message);
      // Non-fatal — Cloudinary is the primary store
    }

    const reel = await Reel.create({
      userId,
      videoUrl: videoUpload.secure_url,
      thumbnailUrl,
      description: description.trim(),
      audioName,
      tags: parsedTags,
      ipfsCid,     // Stored CID for decentralized content proof
      ipfsUrl,     // IPFS gateway URL (fallback)
    });

    const populatedReel = await Reel.findById(reel._id).populate(
      "userId",
      "username profilePic fullName"
    );

    res.status(201).json({ success: true, reel: populatedReel });
  } catch (error) {
    console.error("Upload reel (multipart) error:", error);
    res.status(500).json({ success: false, error: "Failed to upload reel" });
  }
};

// Upload reel (base64 – legacy fallback)
export const uploadReel = async (req, res) => {
  try {
    const userId = req.user._id;
    const { video, thumbnail, description, audioName, tags } = req.body;

    if (!video) {
      return res.status(400).json({ success: false, error: "Video is required" });
    }

    // Upload video to Cloudinary
    const videoUpload = await cloudinary.uploader.upload(video, {
      resource_type: "video",
      folder: "vartul/reels",
      transformation: [{ quality: "auto", fetch_format: "auto" }],
    });

    let thumbnailUrl = "";
    if (thumbnail) {
      const thumbUpload = await cloudinary.uploader.upload(thumbnail, {
        folder: "vartul/reels/thumbnails",
      });
      thumbnailUrl = thumbUpload.secure_url;
    }

    const reel = await Reel.create({
      userId,
      videoUrl: videoUpload.secure_url,
      thumbnailUrl,
      description: description || "",
      audioName: audioName || "Original Audio",
      tags: tags || [],
    });

    const populatedReel = await Reel.findById(reel._id).populate(
      "userId",
      "username profilePic fullName"
    );

    res.status(201).json({ success: true, reel: populatedReel });
  } catch (error) {
    console.error("Upload reel error:", error);
    res.status(500).json({ success: false, error: "Failed to upload reel" });
  }
};


// Get feed reels (ML-ranked)
export const getFeedReels = async (req, res) => {
  try {
    const userId = req.user._id;
    const page = Math.max(1, parseInt(req.query.page || "1"));
    const limit = Math.min(20, parseInt(req.query.limit || "10"));
    const skip = (page - 1) * limit;

    const reels = await Reel.find({ isPublic: true })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("userId", "username profilePic fullName isVerified")
      .populate("comments.userId", "username profilePic")
      .lean();

    const userIdStr = userId.toString();

    // ML feed ranking
    // Score each reel via the ML service. Use Redis cache (key: ml:reel:<id>)
    // to avoid calling ML on every request. Falls back to 0.5 if ML is down.
    const { callML } = await import("../Utils/mlService.js");

    const scoredReels = await Promise.all(
      reels.map(async (reel) => {
        const cacheKey = `ml:reel:${reel._id}`;

        // Try Redis cache first
        let mlScore = null;
        try {
          const cached = await redisClient.get(cacheKey);
          if (cached) mlScore = parseFloat(cached);
        } catch { /* Redis miss — continue */ }

        if (mlScore === null) {
          // Fetch creator engagement data for reputation signal
          let stakeAmount = 0;
          let creatorFollowers = reel.userId?.followersCount || 0;
          try {
            const eng = await import("../Models/Engagement_Model.js");
            const creatorEng = await eng.default.findOne({ user: reel.userId?._id }).select("stakeAmount").lean();
            stakeAmount = creatorEng?.stakeAmount || 0;
          } catch { /* non-fatal */ }

          const mlResult = await callML({
            // Content signals
            caption:            reel.description || "",
            watch_time:         Math.round((reel.views || 0) * 0.4), // estimate
            watch_percentage:   60,
            likes:              reel.likes?.length || 0,
            shares:             reel.shares || 0,
            comments:           reel.comments?.length || 0,
            views:              reel.views || 0,
            video_length:       reel.duration || 60,
            is_viral_video:     (reel.views || 0) > 10000 ? 1 : 0,
            replay_count:       0,
            save_video:         0,
            // Creator signals
            creator_reputation: Math.min(1, (creatorFollowers / 50000)),
            creator_followers:  creatorFollowers,
            stake_amount:       stakeAmount,
          });

          mlScore = mlResult ? mlResult.feed_score : 0.5;

          // Cache for 5 minutes
          try {
            await redisClient.setEx(cacheKey, 300, String(mlScore));
          } catch { /* cache write optional */ }
        }

        return {
          ...reel,
          likesCount:    reel.likes.length,
          commentsCount: reel.comments.length,
          isLiked:       reel.likes.some((id) => id.toString() === userIdStr),
          comments:      reel.comments.slice(-3),
          mlScore,
        };
      })
    );

    // Sort by ML feed score (highest first)
    scoredReels.sort((a, b) => b.mlScore - a.mlScore);

    const total = await Reel.countDocuments({ isPublic: true });

    res.status(200).json({
      success: true,
      reels: scoredReels,
      meta: {
        page,
        limit,
        total,
        hasMore: skip + reels.length < total,
        mlRanked: true,
      },
    });
  } catch (error) {
    console.error("Feed reels error:", error);
    res.status(500).json({ success: false, error: "Failed to fetch reels" });
  }
};


// Get user reels
export const getUserReels = async (req, res) => {
  try {
    const { userId } = req.params;
    const reels = await Reel.find({ userId, isPublic: true })
      .sort({ createdAt: -1 })
      .populate("userId", "username profilePic fullName")
      .lean();

    res.status(200).json({ success: true, reels });
  } catch (error) {
    console.error("User reels error:", error);
    res.status(500).json({ success: false, error: "Failed to fetch user reels" });
  }
};


// Like / unlike reel
export const likeReel = async (req, res) => {
  try {
    const { reelId } = req.params;
    const userId = req.user._id;

    const reel = await Reel.findById(reelId);
    if (!reel) return res.status(404).json({ success: false, error: "Reel not found" });

    const alreadyLiked = reel.likes.some((id) => id.toString() === userId.toString());

    if (alreadyLiked) {
      reel.likes = reel.likes.filter((id) => id.toString() !== userId.toString());
    } else {
      reel.likes.push(userId);
    }

    await reel.save();

    res.status(200).json({
      success: true,
      liked: !alreadyLiked,
      likesCount: reel.likes.length,
    });
  } catch (error) {
    console.error("Like reel error:", error);
    res.status(500).json({ success: false, error: "Failed to like reel" });
  }
};


// Get comments
export const getReelComments = async (req, res) => {
  try {
    const { reelId } = req.params;
    const reel = await Reel.findById(reelId)
      .populate("comments.userId", "username profilePic fullName")
      .lean();

    if (!reel) return res.status(404).json({ success: false, error: "Reel not found" });

    res.status(200).json({ success: true, comments: reel.comments });
  } catch (error) {
    console.error("Get comments error:", error);
    res.status(500).json({ success: false, error: "Failed to get comments" });
  }
};


// Add comment
export const commentOnReel = async (req, res) => {
  try {
    const { reelId } = req.params;
    const { text } = req.body;
    const userId = req.user._id;

    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, error: "Comment cannot be empty" });
    }

    const reel = await Reel.findById(reelId);
    if (!reel) return res.status(404).json({ success: false, error: "Reel not found" });

    reel.comments.push({ userId, text: text.trim() });
    await reel.save();

    const populated = await Reel.findById(reelId)
      .populate("comments.userId", "username profilePic fullName")
      .lean();

    const newComment = populated.comments[populated.comments.length - 1];

    res.status(201).json({
      success: true,
      comment: newComment,
      commentsCount: populated.comments.length,
    });
  } catch (error) {
    console.error("Comment on reel error:", error);
    res.status(500).json({ success: false, error: "Failed to add comment" });
  }
};


// Increment view count
export const incrementView = async (req, res) => {
  try {
    const { reelId } = req.params;
    await Reel.findByIdAndUpdate(reelId, { $inc: { views: 1 } });
    res.status(200).json({ success: true });
  } catch {
    res.status(200).json({ success: true }); // Silent fail
  }
};


// Increment share count
export const incrementShare = async (req, res) => {
  try {
    const { reelId } = req.params;
    const updated = await Reel.findByIdAndUpdate(
      reelId,
      { $inc: { shares: 1 } },
      { new: true }
    );
    if (!updated) return res.status(404).json({ success: false, error: "Reel not found" });
    res.status(200).json({ success: true, shares: updated.shares });
  } catch (error) {
    console.error("Share reel error:", error);
    res.status(200).json({ success: true }); // Silent fail
  }
};


// Delete reel
export const deleteReel = async (req, res) => {
  try {
    const { reelId } = req.params;
    const userId = req.user._id;

    const reel = await Reel.findById(reelId);
    if (!reel) return res.status(404).json({ success: false, error: "Reel not found" });

    if (reel.userId.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, error: "Unauthorized" });
    }

    // Extract public_id and delete from Cloudinary
    if (reel.videoUrl) {
      try {
        // e.g. https://res.cloudinary.com/.../vartul/reels/abc123.mp4
        const parts = reel.videoUrl.split("/");
        const filenameWithExt = parts[parts.length - 1];
        const filename = filenameWithExt.split(".")[0];
        const folder = parts.slice(parts.indexOf("vartul")).slice(0, -1).join("/");
        const publicId = `${folder}/${filename}`;
        await cloudinary.uploader.destroy(publicId, { resource_type: "video" });
      } catch (e) {
        console.warn("Cloudinary cleanup warning:", e.message);
      }
    }

    await Reel.findByIdAndDelete(reelId);

    res.status(200).json({ success: true, message: "Reel deleted" });
  } catch (error) {
    console.error("Delete reel error:", error);
    res.status(500).json({ success: false, error: "Failed to delete reel" });
  }
};
