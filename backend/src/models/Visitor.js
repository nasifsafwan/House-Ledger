import mongoose from "mongoose";

const VisitorSchema = new mongoose.Schema({
    messId: { type: mongoose.Schema.Types.ObjectId, ref: "Mess", required: true },
    visitorName: { type: String, required: true },
    visitedUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true},
    entryTime: { type: Date, required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
}, { timestamps: true });

export default mongoose.model("Visitor", VisitorSchema);
