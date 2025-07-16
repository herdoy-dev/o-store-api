import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    type: { type: String, enum: ["deposit", "checkout"] },
    amount: Number,
    status: { type: String, enum: ["pending", "completed", "failed"] },
    gatewayRef: String,
  },
  { timestamps: true }
);

export const Transaction = mongoose.model("Transaction", transactionSchema);
