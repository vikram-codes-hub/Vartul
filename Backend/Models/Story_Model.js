import mongoose from "mongoose";

const storySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    mediaUrl: {
      type: String,
      required: true,
    },

    mediaType: {
      type: String,
      enum: ["image", "video"],
      required: true,
    },

    caption: {
      type: String,
      maxLength: 500,
      default: "",
    },

    duration: {
      type: Number,
      default: 5,
    },

    viewers: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        viewedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    viewCount: {
      type: Number,
      default: 0,
    },

    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },

    visibility: {
      type: String,
      enum: ["public", "friends", "close_friends"],
      default: "public",
    },
    cloudinaryPublicId: {
  type: String,
  required: true,
},

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

/* ✅ TTL INDEX — auto delete after expiry */
storySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

/* ✅ Check expired */
storySchema.methods.isExpired = function () {
  return new Date() > this.expiresAt;
};

/* ✅ Add viewer safely */
storySchema.methods.addViewer = async function (viewerId) {
  const alreadyViewed = this.viewers.some(
    (v) => v.userId.toString() === viewerId.toString()
  );

  if (!alreadyViewed) {
    this.viewers.push({ userId: viewerId });
    this.viewCount += 1;
    await this.save();
  }
};

export default mongoose.model("Story", storySchema);
