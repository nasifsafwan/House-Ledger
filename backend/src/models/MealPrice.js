import mongoose from "mongoose";

const MealPriceSchema = new mongoose.Schema({
    messId: { type: mongoose.Schema.Types.ObjectId, ref: "Mess", required: true },
    monthKey: { type: String, required: true }, // e.g. "2024-06"
    unitPrice: { type: Number, required: true, min: 0 },
}, { timestamps: true });

MealPriceSchema.index({ messId: 1, monthKey: 1 }, { unique: true });

export default mongoose.model("MealPrice", MealPriceSchema);
