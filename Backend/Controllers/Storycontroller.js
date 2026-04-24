import Story from "../Models/Story_Model.js"
import Follow from "../Models/Follow.js";
import cloudinary from "../config/cloudinary.js";
import redisClient, { redisReady } from "../Config/redis.js"

// Upload story
export const uploadStory = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    const isVideo = req.file.mimetype.startsWith("video");

    const result = await cloudinary.uploader.upload_stream(
      {
        resource_type: isVideo ? "video" : "image",
        folder: "stories",
      },
      async (error, uploadResult) => {
        if (error) {
          console.error("Cloudinary upload error:", error);
          return res.status(500).json({
            success: false,
            message: "Cloudinary upload failed",
          });
        }

        const story = await Story.create({
          userId: req.user._id,
          mediaUrl: uploadResult.secure_url,
          mediaType: isVideo ? "video" : "image",
          cloudinaryPublicId: uploadResult.public_id,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        });

        // Clear Redis cache
        const userId = req.user._id.toString();
        if (redisReady) {
          await redisClient.del([
            `stories:feed:${userId}`,
            `stories:me:${userId}`,
          ]);
        }

        res.status(201).json({
          success: true,
          story,
        });
      }
    );

    result.end(req.file.buffer);
  } catch (err) {
    console.error("Upload story error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to upload story",
    });
  }
};


// Get stories feed
export const getStoriesFeed = async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const cacheKey = `stories:feed:${userId}`;

    // Redis cache
    if (redisReady) {
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        return res.json({
          success: true,
          stories: JSON.parse(cached),
          fromCache: true,
        });
      }
    }

    const following = await Follow.find({ follower: req.user._id }).select(
      "following"
    );

    const followingIds = following.map((f) => f.following);
    const userIds = [req.user._id, ...followingIds];

    const stories = await Story.aggregate([
      {
        $match: {
          userId: { $in: userIds },
          isActive: true,
          expiresAt: { $gt: new Date() },
        },
      },
      { $sort: { createdAt: 1 } }, // oldest → newest per user
      {
        $group: {
          _id: "$userId",
          stories: { $push: "$$ROOT" },
          latestStory: { $last: "$$ROOT" },
          hasUnviewed: {
            $max: {
              $cond: [
                {
                  $in: [
                    req.user._id,
                    {
                      $map: {
                        input: "$viewers",
                        as: "v",
                        in: "$$v.userId",
                      },
                    },
                  ],
                },
                0,
                1,
              ],
            },
          },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
      {
        $project: {
          userId: "$_id",
          username: "$user.username",
          profilePic: "$user.profilePic",
          stories: 1,
          storyCount: { $size: "$stories" },
          latestStoryTime: "$latestStory.createdAt",
          hasUnviewed: 1,
        },
      },
      {
        $sort: {
          hasUnviewed: -1,
          latestStoryTime: -1,
        },
      },
    ]);

    // Cache for 60 seconds
    if (redisReady) await redisClient.setEx(cacheKey, 60, JSON.stringify(stories));

    res.json({ success: true, stories });
  } catch (err) {
    console.error("Get stories feed error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch stories",
    });
  }
};

// View story
export const viewStory = async (req, res) => {
  try {
    const { storyId } = req.params;

    const story = await Story.findById(storyId);
    if (!story) {
      return res.status(404).json({
        success: false,
        message: "Story not found",
      });
    }

    if (story.isExpired()) {
      return res.status(410).json({
        success: false,
        message: "Story expired",
      });
    }

    // Own story → ignore
    if (story.userId.toString() === req.user._id.toString()) {
      return res.json({ success: true });
    }

    await story.addViewer(req.user._id);

    res.json({ success: true });
  } catch (err) {
    console.error("View story error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to view story",
    });
  }
};

// Get my stories
export const getMyStories = async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const cacheKey = `stories:me:${userId}`;

    if (redisReady) {
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        return res.json({
          success: true,
          stories: JSON.parse(cached),
          fromCache: true,
        });
      }
    }

    const stories = await Story.find({
      userId: req.user._id,
      isActive: true,
      expiresAt: { $gt: new Date() },
    })
      .sort({ createdAt: -1 })
      .populate("viewers.userId", "username profilePic");

    if (redisReady) await redisClient.setEx(cacheKey, 60, JSON.stringify(stories));

    res.json({ success: true, stories });
  } catch (err) {
    console.error("Get my stories error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch my stories",
    });
  }
};

// Get user stories
export const getUserStories = async (req, res) => {
  try {
    const { userId } = req.params;
    const cacheKey = `stories:user:${userId}`;

    const cached = redisReady ? await redisClient.get(cacheKey) : null;
    if (cached) {
      return res.json({
        success: true,
        stories: JSON.parse(cached),
        fromCache: true,
      });
    }

    const stories = await Story.find({
      userId,
      isActive: true,
      expiresAt: { $gt: new Date() },
    })
      .sort({ createdAt: 1 })
      .populate("userId", "username profilePic");

    if (redisReady) await redisClient.setEx(cacheKey, 60, JSON.stringify(stories));

    res.json({ success: true, stories });
  } catch (err) {
    console.error("Get user stories error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch user stories",
    });
  }
};

// Get story viewers
export const getStoryViewers = async (req, res) => {
  try {
    const { storyId } = req.params;

    const story = await Story.findById(storyId).populate(
      "viewers.userId",
      "username profilePic"
    );

    if (!story) {
      return res.status(404).json({
        success: false,
        message: "Story not found",
      });
    }

    if (story.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized",
      });
    }

    res.json({
      success: true,
      viewers: story.viewers,
      viewCount: story.viewCount,
    });
  } catch (err) {
    console.error("Get story viewers error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch viewers",
    });
  }
};

// Delete story
export const deleteStory = async (req, res) => {
  try {
    const { storyId } = req.params;

    const story = await Story.findById(storyId);
    if (!story) {
      return res.status(404).json({
        success: false,
        message: "Story not found",
      });
    }

    if (story.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // Delete from Cloudinary
    if (story.cloudinaryPublicId) {
      await cloudinary.uploader.destroy(story.cloudinaryPublicId, {
        resource_type: story.mediaType === "video" ? "video" : "image",
      });
    }

    // Delete from DB
    await Story.findByIdAndDelete(storyId);

    // Clear Redis caches
    const userId = req.user._id.toString();
    if (redisReady) {
      await redisClient.del([
        `stories:feed:${userId}`,
        `stories:me:${userId}`,
        `stories:user:${userId}`,
      ]);
    }

    res.json({
      success: true,
      message: "Story deleted successfully",
    });
  } catch (err) {
    console.error("Delete story error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to delete story",
    });
  }
};
