import express from "express";
import { z } from "zod";
import { auth } from "../middleware/auth.js";
import { requireManager } from "../middleware/messAccess.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import Membership from "../models/Membership.js";
import RentSetting from "../models/RentSetting.js";
import User from "../models/User.js";
import { nextMonthKey, toMonthKey } from "../utils/monthKey.js";

const router = express.Router();

router.get("/:messId", auth, requireManager(), asyncHandler(async (req, res) => {
  const members = await Membership.find({ messId: req.params.messId, isActive: true })
    .populate("userId", "name username")
    .sort({ createdAt: 1 });

  res.json({ members });
}));

router.patch("/:messId/:memberId/rent", auth, requireManager(), asyncHandler(async (req, res) => {
  const schema = z.object({
    rent: z.number().min(0),
    effectiveMonthKey: z.string().optional() // default next month
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: parsed.error.issues });

  const { rent, effectiveMonthKey } = parsed.data;
  const messId = req.params.messId;
  const memberId = req.params.memberId;

  const membership = await Membership.findById(memberId);
  if (!membership || String(membership.messId) !== String(messId) || !membership.isActive) {
    return res.status(404).json({ message: "Member not found" });
  }

  const currentMK = toMonthKey(new Date());
  const targetMK = effectiveMonthKey || nextMonthKey(currentMK);

  await RentSetting.findOneAndUpdate(
    { messId, userId: membership.userId, monthKey: targetMK },
    { rent },
    { upsert: true, new: true }
  );

  if (targetMK === currentMK) {
    membership.rentCurrent = rent;
    await membership.save();
  }

  res.json({ message: "Rent updated", monthKey: targetMK, rent });
}));

router.delete("/:messId/:memberId", auth, requireManager(), asyncHandler(async (req, res) => {
  const membership = await Membership.findById(req.params.memberId);
  if (!membership || String(membership.messId) !== String(req.params.messId)) {
    return res.status(404).json({ message: "Member not found" });
  }

  // prevent manager removing self if you want
  if (String(membership.userId) === String(req.user.id)) {
    return res.status(400).json({ message: "Manager cannot remove self" });
  }

  membership.isActive = false;
  await membership.save();

  res.json({ message: "Member removed" });
}));

export default router;