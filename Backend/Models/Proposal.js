import mongoose from "mongoose";

const voteSchema = new mongoose.Schema({
  voter: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  optionIndex: { type: Number, required: true },
  weight: { type: Number, default: 1 }, // TWT balance at time of vote
  votedAt: { type: Date, default: Date.now },
});

const proposalSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    type: {
      type: String,
      enum: ["reward_rate", "feature", "treasury", "parameter", "emergency"],
      default: "feature",
    },
    options: [{ type: String, required: true }], // e.g. ["Yes", "No"] or ["Option A", "Option B"]
    votes: [voteSchema],
    status: {
      type: String,
      enum: ["draft", "active", "passed", "failed", "cancelled"],
      default: "active",
    },
    quorumRequired: { type: Number, default: 5 }, // % of supply needed
    passThreshold: { type: Number, default: 50 }, // % majority needed
    endsAt: {
      type: Date,
      default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    totalVoteWeight: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Virtual: winner option
proposalSchema.virtual("winnerIndex").get(function () {
  if (!this.votes.length) return null;
  const tally = new Array(this.options.length).fill(0);
  this.votes.forEach((v) => { tally[v.optionIndex] += v.weight; });
  return tally.indexOf(Math.max(...tally));
});

export default mongoose.model("Proposal", proposalSchema);
