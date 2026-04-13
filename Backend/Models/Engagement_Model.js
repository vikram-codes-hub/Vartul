import mongoose from "mongoose";

const engagementSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true
  },
  stakeAmount: {
    type: Number,
    required: true,
    default: 0
  },
  stakeStartTime: {
    type: Date,
    default: Date.now
  },
  lockDurationDays: {
    type: Number,
    default: 1
  },
  accumulatedWatchTimeMs: {
    type: Number,
    default: 0
  },
  validWatchPercentageAvg: {
    type: Number,
    default: 0
  },
  lastRewardCalculation: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ["active", "inactive", "locked"],
    default: "inactive"
  },
  totalRewardsEarned: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

const Engagement = mongoose.model("Engagement", engagementSchema);
export default Engagement;
