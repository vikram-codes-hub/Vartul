import mongoose from "mongoose";

const savedPostSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      required: true,
    },
  },
  { timestamps: true }
);

// Prevent duplicate saves (same user can't save same post twice)
savedPostSchema.index({ userId: 1, postId: 1 }, { unique: true });

export default mongoose.model("SavedPost", savedPostSchema);
