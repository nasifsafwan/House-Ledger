import mongoose from "mongoose";

const SettlePaymentSchema = new mongoose.Schema({
    amount: { type: Number, required: true, min: 0.01},
    paidBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    paidAt: { type: Date, default: Date.now },
    note: { type: String, default: "" },
}, { _id: false });

const SettlementSchema = new mongoose.Schema({
    messId: { type: mongoose.Schema.Types.ObjectId, ref: "Mess", required: true },
    monthKey: { type: String, required: true },
    fromUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    toUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    reason: { type: String, enum: ["RENT", "BILLS", "MEALS", "OTHER"], default: "OTHER" },
    note: { type: String, default: "" },
    originalAmount: { type: Number, required: true, min: 0.01 },
    remainingAmount: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ["OPEN", "PARTIAL", "SETTLED"], default: "OPEN" },
    payments: [SettlePaymentSchema],
    createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Settlement", SettlementSchema);
