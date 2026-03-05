import mongoose from "mongoose";

const BillItemSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["ELECTRICITY", "GAS", "WATER", "INTERNET", "OTHER"],
      required: true
    },
    label: { type: String, default: "" },
    amount: { type: Number, required: true, min: 0 }
  },
  { _id: false }
);

const BillSchema = new mongoose.Schema(
  {
    messId: { type: mongoose.Schema.Types.ObjectId, ref: "Mess", required: true },
    monthKey: { type: String, required: true },
    items: { type: [BillItemSchema], default: [] },
    totalAmount: { type: Number, default: 0, min: 0 }
  },
  { timestamps: true }
);

BillSchema.index({ messId: 1, monthKey: 1 }, { unique: true });

export default mongoose.model("Bill", BillSchema);
