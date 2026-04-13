import mongoose from "mongoose";

const transactionLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["reward", "stake", "unstake", "transfer", "tip", "airdrop", "ivtg", "creator_stake", "creator_unstake"],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    // For on-chain transactions
    txSignature: {
      type: String,
      default: null,
    },
    network: {
      type: String,
      default: "devnet",
    },
    // counterparty user (tip sender/receiver, creator, etc.)
    relatedUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "failed"],
      default: "confirmed",
    },
    note: {
      type: String,
      default: "",
    },
    // For staking: lock duration
    lockDays: {
      type: Number,
      default: null,
    },
  },
  { timestamps: true }
);

// Index for fast user-specific queries
transactionLogSchema.index({ user: 1, createdAt: -1 });

export default mongoose.model("TransactionLog", transactionLogSchema);
