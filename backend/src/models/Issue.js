import mongoose from "mongoose";

const IssueSchema = new mongoose.Schema(
  {
    messId: { type: mongoose.Schema.Types.ObjectId, ref: "Mess", required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    description: { type: String, required: true },
    status: { type: String, enum: ["OPEN", "RESOLVED"], default: "OPEN" },
  },
  { timestamps: true }
);

export default mongoose.model("Issue", IssueSchema);
