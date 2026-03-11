import express from "express";
import { z } from "zod";

import { auth } from "../middleware/auth.js";
import { requireMember, requireManager } from "../middleware/messAccess.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import Payment from "../models/Payment.js";

const router = express.Router();

router.get("/:messId", auth, requireMember(), asyncHandler(async (req, res) => {
  const schema = z.object({
    monthKey: z.string().regex(/^\d{4}-\d{2}$/)
  });

  const parsed = schema.safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ message: "monthKey is required" });

  const { messId } = req.params;
  const { monthKey } = parsed.data;

  if (req.membership.role === "MANAGER") {
    const payments = await Payment.find({ messId, monthKey })
      .populate("userId", "name username")
      .populate("markedBy", "name username")
      .sort({ createdAt: -1 });
    return res.json({ payments });
  }

  const payment = await Payment.findOne({ messId, monthKey, userId: req.user.id });
  return res.json({ payment });
}));

// Member marks themselves as paid
router.post("/:messId/self-paid", auth, requireMember(), asyncHandler(async (req, res) => {
  const schema = z.object({
    monthKey: z.string().regex(/^\d{4}-\d{2}$/)
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "monthKey is required" });

  const { messId } = req.params;
  const { monthKey } = parsed.data;

  const payment = await Payment.findOneAndUpdate(
    { messId, monthKey, userId: req.user.id },
    { status: "PAID", paidAt: new Date(), markedBy: req.user.id },
    { upsert: true, new: true }
  );

  res.json({ payment });
}));

// Manager marks a member's payment status
router.put("/:messId/:userId", auth, requireManager(), asyncHandler(async (req, res) => {
  const schema = z.object({
    monthKey: z.string().regex(/^\d{4}-\d{2}$/),
    status: z.enum(["PAID", "UNPAID"])
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: parsed.error.issues });

  const { messId, userId } = req.params;
  const { monthKey, status } = parsed.data;

  const update = {
    status,
    markedBy: req.user.id,
    paidAt: status === "PAID" ? new Date() : null
  };

  const payment = await Payment.findOneAndUpdate(
    { messId, monthKey, userId },
    update,
    { upsert: true, new: true }
  );

  res.json({ payment });
}));

export default router;
