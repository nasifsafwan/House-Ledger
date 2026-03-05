import mongoose from "mongoose";

const MembershipSchema = new mongoose.Schema(
  {
    messId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Mess",
      required: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    role: {
      type: String,
      enum: ["MANAGER", "MEMBER"],
      default: "MEMBER"
    },
    isActive: {
      type: Boolean,
      default: true
    },
    rentCurrent: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

MembershipSchema.index({ messId: 1, userId: 1 }, { unique: true });

export default mongoose.model("Membership", MembershipSchema);
