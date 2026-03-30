import mongoose from "mongoose";

const noticeSchema = new mongoose.Schema(
  {
    messId: { type: mongoose.Schema.Types.ObjectId, ref: "Mess", required: true },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    body: { type: String, required: true, trim: true, maxlength: 2000 },
    pinned: { type: Boolean, default: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

noticeSchema.index({ messId: 1, pinned: -1, createdAt: -1 });

export default mongoose.model("Notice", noticeSchema);
