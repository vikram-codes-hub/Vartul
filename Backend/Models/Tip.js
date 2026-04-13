import mongoose from "mongoose";

const tipSchema = new mongoose.Schema(
  {
    from: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    to: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    amount: { type: Number, required: true, min: 0.1 },
    type: { type: String, enum: ["micro", "super"], default: "micro" },
    message: { type: String, default: "", maxlength: 200 },
    txHash: { type: String, default: "" }, // on-chain tx hash when available
    // Fee breakdown (5% platform fee)
    creatorReceived: { type: Number }, // 95% of amount
    platformFee: { type: Number },    // 5% of amount
    status: { type: String, enum: ["pending", "completed", "failed"], default: "completed" },
  },
  { timestamps: true }
);

tipSchema.pre("save", function (next) {
  this.platformFee = Math.round(this.amount * 0.05 * 10000) / 10000;
  this.creatorReceived = Math.round(this.amount * 0.95 * 10000) / 10000;
  next();
});

export default mongoose.model("Tip", tipSchema);
