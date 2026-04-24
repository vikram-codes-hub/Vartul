import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
    },
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true }
);

const reelSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    videoUrl: {
      type: String,
      required: true,
    },
    thumbnailUrl: {
      type: String,
      default: "",
    },
    description: {
      type: String,
      trim: true,
      default: "",
      maxlength: 2200,
    },
    audioName: {
      type: String,
      default: "Original Audio",
    },
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    comments: [commentSchema],
    views: {
      type: Number,
      default: 0,
    },
    shares: {
      type: Number,
      default: 0,
    },
    tags: [String],
    isPublic: {
      type: Boolean,
      default: true,
    },
    // Decentralized storage (IPFS/Pinata)
    ipfsCid: {
      type: String,
      default: null, // IPFS Content Identifier — null if IPFS not configured
    },
    ipfsUrl: {
      type: String,
      default: null, // Gateway URL for decentralized access
    },
  },
  { timestamps: true }
);

// Index for efficient feed queries
reelSchema.index({ createdAt: -1 });
reelSchema.index({ userId: 1 });

export default mongoose.model("Reel", reelSchema);
