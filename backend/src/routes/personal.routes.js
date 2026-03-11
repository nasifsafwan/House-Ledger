import express from "express";
import { z } from "zod";
import { auth } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import PersonalExpense from "../models/PersonalExpense.js";

const router = express.Router();

const CATEGORIES = ["Food", "Rent", "Utilities", "Transport", "Shopping", "Entertainment", "Others"];
// Note: CATEGORIES is kept for reference; custom category names are allowed.

// Create a personal expense
router.post(
    "/",
    auth,
    asyncHandler(async (req, res) => {
        const schema = z.object({
            category: z.string().min(1),
            amount: z.number().min(0.01),
            description: z.string().optional(),
            date: z.string().optional(), // ISO date string
        });

        const parsed = schema.safeParse(req.body);
        if (!parsed.success) return res.status(400).json({ message: parsed.error.issues });

        const doc = await PersonalExpense.create({
            userId: req.user.id,
            category: parsed.data.category,
            amount: parsed.data.amount,
            description: parsed.data.description || "",
            date: parsed.data.date ? new Date(parsed.data.date) : new Date(),
        });

        res.json({ expense: doc });
    })
);

// List personal expenses (with optional date filter)
router.get(
    "/",
    auth,
    asyncHandler(async (req, res) => {
        const filter = { userId: req.user.id };

        if (req.query.startDate || req.query.endDate) {
            filter.date = {};
            if (req.query.startDate) filter.date.$gte = new Date(req.query.startDate);
            if (req.query.endDate) filter.date.$lte = new Date(req.query.endDate);
        }

        const expenses = await PersonalExpense.find(filter).sort({ date: -1 });
        res.json({ expenses });
    })
);

// Delete a personal expense
router.delete(
    "/:id",
    auth,
    asyncHandler(async (req, res) => {
        const doc = await PersonalExpense.findOneAndDelete({
            _id: req.params.id,
            userId: req.user.id,
        });

        if (!doc) return res.status(404).json({ message: "Expense not found" });

        res.json({ message: "Deleted" });
    })
);

export default router;
