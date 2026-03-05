import mongoose from "mongoose";

const PaymentSchema = new mongoose.Schema(
  {
    messId: { type: mongoose.Schema.Types.ObjectId, ref: "Mess", required: true },
    monthKey: { type: String, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, enum: ["PAID", "UNPAID"], default: "UNPAID" },
    paidAt: { type: Date, default: null },
    markedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null }
  },
  { timestamps: true }
);

PaymentSchema.index({ messId: 1, monthKey: 1, userId: 1 }, { unique: true });

export default mongoose.model("Payment", PaymentSchema);