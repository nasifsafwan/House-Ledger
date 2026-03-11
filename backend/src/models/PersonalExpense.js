import mongoose from "mongoose";

const PersonalExpenseSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        category: {
            type: String,
            required: true,
            trim: true,
        },
        amount: {
            type: Number,
            required: true,
            min: 0.01,
        },
        description: {
            type: String,
            default: "",
            trim: true,
        },
        date: {
            type: Date,
            required: true,
            default: Date.now,
        },
    },
    { timestamps: true }
);

PersonalExpenseSchema.index({ userId: 1, date: -1 });

export default mongoose.model("PersonalExpense", PersonalExpenseSchema);
