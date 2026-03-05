import mongoose from "mongoose";

const ReminderSettingSchema = new mongoose.Schema({
    messId: { type: mongoose.Schema.Types.ObjectId, ref: "Mess", required: true },
    dayOfMonth: { type: Number, required: true }, // e.g. 25
    enabled: { type: Boolean, default: true }
}, { timestamps: true });

ReminderSettingSchema.index({ messId: 1 }, { unique: true });

export default mongoose.model("ReminderSetting", ReminderSettingSchema);
