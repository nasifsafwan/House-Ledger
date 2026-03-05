import mongoose from "mongoose";
const RentSettingSchema = new mongoose.Schema({
    messId: { type: mongoose.Schema.Types.ObjectId, ref: "Mess", required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    monthKey: { type: String, required: true }, // e.g. "2024-06"
    rent: { type: Number, required: true },
}, { timestamps: true });

RentSettingSchema.index({ messId: 1, userId: 1, monthKey: 1 }, { unique: true });

export default mongoose.model("RentSetting", RentSettingSchema);
