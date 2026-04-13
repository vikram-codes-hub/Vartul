import mongoose from "mongoose";

const creatorStakeSchema = new mongoose.Schema(
  {
    staker: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    creator: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    amount: { type: Number, required: true, min: 1 },
    lockDays: { type: Number, default: 7, enum: [7, 30, 90] },
    startDate: { type: Date, default: Date.now },
    unlockDate: {
      type: Date,
      default: function () {
        return new Date(Date.now() + this.lockDays * 24 * 60 * 60 * 1000);
      },
    },
    pstTokens: { type: Number, default: 0 }, // Pool Share Tokens minted
    yieldEarned: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    // Early unstake: 3% penalty
    penaltyPaid: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Compound index so one staker can stake on multiple creators but not duplicate
creatorStakeSchema.index({ staker: 1, creator: 1, isActive: 1 });

export default mongoose.model("CreatorStake", creatorStakeSchema);
