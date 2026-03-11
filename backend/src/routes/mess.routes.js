import express from "express";
import { z } from "zod";

import { auth } from "../middleware/auth.js";
import { requireMember, requireManager } from "../middleware/messAccess.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

import Mess from "../models/Mess.js";
import Membership from "../models/Membership.js";
import MealLog from "../models/MealLog.js";
import MealPrice from "../models/MealPrice.js";
import Bill from "../models/Bill.js";
import Visitor from "../models/Visitor.js";
import ReminderSetting from "../models/ReminderSetting.js";
import RentSetting from "../models/RentSetting.js";
import Payment from "../models/Payment.js";
import Settlement from "../models/Settlement.js";

import { generateInviteCode } from "../utils/inviteCode.js";
import { sum, round2 } from "../utils/calc.js";
import { toMonthKey } from "../utils/monthKey.js";

const router = express.Router();

router.post("/", auth, asyncHandler(async (req, res) => {
  const schema = z.object({
    name: z.string().min(2),
    address: z.string().optional()
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: parsed.error.issues });

  let inviteCode = generateInviteCode();
  while (await Mess.findOne({ inviteCode })) inviteCode = generateInviteCode();

  const mess = await Mess.create({
    name: parsed.data.name,
    address: parsed.data.address || "",
    inviteCode,
    createdBy: req.user.id
  });

  await Membership.create({
    messId: mess._id,
    userId: req.user.id,
    role: "MANAGER",
    rentCurrent: 0
  });

  await ReminderSetting.create({ messId: mess._id, dayOfMonth: 5, enabled: true });

  res.json({ mess });
}));

router.post("/join", auth, asyncHandler(async (req, res) => {
  const schema = z.object({ inviteCode: z.string().min(4) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: parsed.error.issues });

  const mess = await Mess.findOne({ inviteCode: parsed.data.inviteCode });
  if (!mess) return res.status(404).json({ message: "Invalid invite code" });

  const existing = await Membership.findOne({ messId: mess._id, userId: req.user.id });

  if (existing && existing.isActive) {
    return res.status(409).json({ message: "Already joined" });
  }

  if (existing && !existing.isActive) {
    // Reactivate previously removed member
    existing.isActive = true;
    existing.role = "MEMBER";
    await existing.save();
    return res.json({ mess, membership: existing });
  }

  const membership = await Membership.create({
    messId: mess._id,
    userId: req.user.id,
    role: "MEMBER",
    rentCurrent: 0
  });

  res.json({ mess, membership });
}));

router.post("/:messId/settlements", auth, requireMember(), async (req, res) => {
  const schema = z.object({
    monthKey: z.string().regex(/^\d{4}-\d{2}$/),
    toUserId: z.string().min(1),
    amount: z.number().min(0.01),
    reason: z.enum(["RENT", "BILLS", "MEALS", "OTHER"]).optional(),
    note: z.string().optional()
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: parsed.error.issues });

  const { monthKey, toUserId, amount, reason, note } = parsed.data;
  const messId = req.params.messId;

  // ensure toUser is in same mess and active
  const ok = await Membership.findOne({ messId, userId: toUserId, isActive: true });
  if (!ok) return res.status(400).json({ message: "Target user is not in this mess" });

  // prevent self-split
  if (String(toUserId) === String(req.user.id)) {
    return res.status(400).json({ message: "You cannot create a split to yourself" });
  }

  const doc = await Settlement.create({
    messId,
    monthKey,
    fromUserId: req.user.id,
    toUserId,
    reason: reason || "OTHER",
    note: note || "",
    originalAmount: amount,
    remainingAmount: amount,
    status: "OPEN",
    payments: []
  });

  res.json({ settlement: doc });
});

router.get("/:messId/settlements", auth, requireMember(), async (req, res) => {
  const messId = req.params.messId;
  const monthKey = req.query.monthKey;

  const filter = { messId };
  if (monthKey) filter.monthKey = monthKey;

  // if not manager, limit to relevant settlements only
  if (req.membership.role !== "MANAGER") {
    filter.$or = [{ fromUserId: req.user.id }, { toUserId: req.user.id }];
  }

  const docs = await Settlement.find(filter)
    .populate("fromUserId", "name username")
    .populate("toUserId", "name username")
    .sort({ createdAt: -1 });

  res.json({ settlements: docs });
});

router.post("/:messId/settlements/:settlementId/pay", auth, requireMember(), async (req, res) => {
  const schema = z.object({
    amount: z.number().min(0.01),
    note: z.string().optional()
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: parsed.error.issues });

  const { amount, note } = parsed.data;
  const messId = req.params.messId;
  const settlementId = req.params.settlementId;

  const s = await Settlement.findById(settlementId);
  if (!s || String(s.messId) !== String(messId)) {
    return res.status(404).json({ message: "Settlement not found" });
  }

  if (s.status === "SETTLED" || s.remainingAmount <= 0) {
    return res.status(400).json({ message: "This settlement is already settled" });
  }

  // Only the owing person (toUser) OR manager can record repayment
  const isToUser = String(s.toUserId) === String(req.user.id);
  const isManager = req.membership.role === "MANAGER";
  if (!isToUser && !isManager) {
    return res.status(403).json({ message: "Only the owing member or manager can add a repayment" });
  }

  if (amount > s.remainingAmount) {
    return res.status(400).json({ message: "Amount exceeds remaining amount" });
  }

  s.payments.push({
    amount,
    paidBy: req.user.id,
    paidAt: new Date(),
    note: note || ""
  });

  s.remainingAmount = Number((s.remainingAmount - amount).toFixed(2));

  if (s.remainingAmount <= 0) {
    s.remainingAmount = 0;
    s.status = "SETTLED";
  } else {
    s.status = "PARTIAL";
  }

  await s.save();

  const populated = await Settlement.findById(s._id)
    .populate("fromUserId", "name username")
    .populate("toUserId", "name username");

  res.json({ settlement: populated });
});

router.patch("/:messId/settlements/:settlementId/settle", auth, requireManager(), async (req, res) => {
  const messId = req.params.messId;
  const settlementId = req.params.settlementId;

  const s = await Settlement.findById(settlementId);
  if (!s || String(s.messId) !== String(messId)) {
    return res.status(404).json({ message: "Settlement not found" });
  }

  s.remainingAmount = 0;
  s.status = "SETTLED";
  await s.save();

  res.json({ message: "Settlement marked settled" });
});

router.get("/me", auth, asyncHandler(async (req, res) => {
  const memberships = await Membership.find({ userId: req.user.id, isActive: true }).populate(
    "messId"
  );
  res.json({ memberships });
}));

/* ------------------------------------------------------------------ */
/*  MEALS: log + list                                                   */
/*  POST /api/mess/:messId/meals                                        */
/*  GET  /api/mess/:messId/meals?monthKey=YYYY-MM&onlyMine=true          */
/* ------------------------------------------------------------------ */

router.post("/:messId/meals", auth, requireMember(), asyncHandler(async (req, res) => {
  const schema = z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    mealsCount: z.number().min(0)
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: parsed.error.issues });

  const { date, mealsCount } = parsed.data;

  const doc = await MealLog.findOneAndUpdate(
    { messId: req.params.messId, userId: req.user.id, date },
    { mealsCount },
    { upsert: true, new: true }
  );

  res.json({ mealLog: doc });
}));

router.get("/:messId/meals", auth, requireMember(), asyncHandler(async (req, res) => {
  const { messId } = req.params;
  const monthKey = req.query.monthKey;
  const onlyMine = req.query.onlyMine === "true";

  const filter = { messId };
  if (onlyMine) filter.userId = req.user.id;

  if (monthKey) {
    if (!/^\d{4}-\d{2}$/.test(monthKey)) {
      return res.status(400).json({ message: "monthKey must be YYYY-MM" });
    }
    filter.date = { $regex: `^${monthKey}-` };
  }

  const logs = await MealLog.find(filter).sort({ date: 1 });
  res.json({ logs });
}));

/* ------------------------------------------------------------------ */
/*  MEAL UNIT PRICE (monthly): manager sets                              */
/*  PUT /api/mess/:messId/meal-price                                     */
/*  GET /api/mess/:messId/meal-price?monthKey=YYYY-MM                    */
/* ------------------------------------------------------------------ */

router.put("/:messId/meal-price", auth, requireManager(), asyncHandler(async (req, res) => {
  const schema = z.object({
    monthKey: z.string().regex(/^\d{4}-\d{2}$/),
    unitPrice: z.number().min(0)
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: parsed.error.issues });

  const doc = await MealPrice.findOneAndUpdate(
    { messId: req.params.messId, monthKey: parsed.data.monthKey },
    { unitPrice: parsed.data.unitPrice },
    { upsert: true, new: true }
  );

  res.json({ mealPrice: doc });
}));

router.get("/:messId/meal-price", auth, requireMember(), asyncHandler(async (req, res) => {
  const monthKey = req.query.monthKey;
  if (!monthKey) return res.status(400).json({ message: "monthKey is required" });

  const doc = await MealPrice.findOne({ messId: req.params.messId, monthKey });
  res.json({ mealPrice: doc });
}));

/* ------------------------------------------------------------------ */
/*  BILLS (monthly): manager uploads                                      */
/*  PUT /api/mess/:messId/bills                                           */
/*  GET /api/mess/:messId/bills?monthKey=YYYY-MM                          */
/* ------------------------------------------------------------------ */

router.put("/:messId/bills", auth, requireManager(), asyncHandler(async (req, res) => {
  const schema = z.object({
    monthKey: z.string().regex(/^\d{4}-\d{2}$/),
    items: z.array(
      z.object({
        type: z.enum(["ELECTRICITY", "GAS", "WATER", "INTERNET", "OTHER"]),
        label: z.string().optional(),
        amount: z.number().min(0)
      })
    )
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: parsed.error.issues });

  const totalAmount = sum(parsed.data.items.map((x) => x.amount));

  const doc = await Bill.findOneAndUpdate(
    { messId: req.params.messId, monthKey: parsed.data.monthKey },
    { items: parsed.data.items, totalAmount },
    { upsert: true, new: true }
  );

  res.json({ bill: doc });
}));

router.get("/:messId/bills", auth, requireMember(), asyncHandler(async (req, res) => {
  const monthKey = req.query.monthKey;
  if (!monthKey) return res.status(400).json({ message: "monthKey is required" });

  const doc = await Bill.findOne({ messId: req.params.messId, monthKey });
  res.json({ bill: doc });
}));

/* ------------------------------------------------------------------ */
/*  VISITORS: any member add, manager view all                            */
/*  POST /api/mess/:messId/visitors                                       */
/*  GET  /api/mess/:messId/visitors  (manager only)                       */
/* ------------------------------------------------------------------ */

router.post("/:messId/visitors", auth, requireMember(), asyncHandler(async (req, res) => {
  const schema = z.object({
    visitorName: z.string().min(1),
    visitedUserId: z.string().min(1),
    entryTime: z.string().min(1) // ISO string
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: parsed.error.issues });

  // ensure visited user is an active member of this mess
  const ok = await Membership.findOne({
    messId: req.params.messId,
    userId: parsed.data.visitedUserId,
    isActive: true
  });
  if (!ok) return res.status(400).json({ message: "Visited user is not in this mess" });

  const doc = await Visitor.create({
    messId: req.params.messId,
    visitorName: parsed.data.visitorName,
    visitedUserId: parsed.data.visitedUserId,
    entryTime: new Date(parsed.data.entryTime),
    createdBy: req.user.id
  });

  res.json({ visitor: doc });
}));

router.get("/:messId/visitors", auth, requireManager(), asyncHandler(async (req, res) => {
  const docs = await Visitor.find({ messId: req.params.messId })
    .populate("visitedUserId", "name username")
    .populate("createdBy", "name username")
    .sort({ entryTime: -1 });

  res.json({ visitors: docs });
}));

/* ------------------------------------------------------------------ */
/*  REMINDER: manager sets reminder day                                   */
/*  PUT /api/mess/:messId/reminder                                         */
/*  GET /api/mess/:messId/reminder                                         */
/* ------------------------------------------------------------------ */

router.put("/:messId/reminder", auth, requireManager(), asyncHandler(async (req, res) => {
  const schema = z.object({
    dayOfMonth: z.number().min(1).max(28),
    enabled: z.boolean()
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: parsed.error.issues });

  const doc = await ReminderSetting.findOneAndUpdate(
    { messId: req.params.messId },
    { dayOfMonth: parsed.data.dayOfMonth, enabled: parsed.data.enabled },
    { upsert: true, new: true }
  );

  res.json({ reminder: doc });
}));

router.get("/:messId/reminder", auth, requireMember(), asyncHandler(async (req, res) => {
  const doc = await ReminderSetting.findOne({ messId: req.params.messId });
  res.json({ reminder: doc });
}));

/* ------------------------------------------------------------------ */
/*  SUMMARY: member + manager endpoints                                   */
/*  GET /api/mess/:messId/summary/member?monthKey=YYYY-MM                  */
/*  GET /api/mess/:messId/summary/manager?monthKey=YYYY-MM                 */
/* ------------------------------------------------------------------ */

async function getRentForMonth({ messId, userId, monthKey }) {
  const rentSetting = await RentSetting.findOne({ messId, userId, monthKey });
  if (rentSetting) return rentSetting.rent;

  const membership = await Membership.findOne({ messId, userId, isActive: true });
  return membership ? membership.rentCurrent : 0;
}

async function getMealCount({ messId, userId, monthKey }) {
  const logs = await MealLog.find({
    messId,
    userId,
    date: { $regex: `^${monthKey}-` }
  });

  return logs.reduce((a, b) => a + (b.mealsCount || 0), 0);
}

async function getMealUnitPrice({ messId, monthKey }) {
  const mp = await MealPrice.findOne({ messId, monthKey });
  return mp ? mp.unitPrice : 0;
}

async function getBillShare({ messId, monthKey }) {
  const bill = await Bill.findOne({ messId, monthKey });
  const totalBills = bill ? bill.totalAmount : 0;

  const activeMembers = await Membership.countDocuments({ messId, isActive: true });
  const share = activeMembers > 0 ? totalBills / activeMembers : 0;

  return { totalBills, activeMembers, share };
}

async function getSettlementBalances({ messId, userId, monthKey }) {
  const owedDocs = await Settlement.find({
    messId,
    monthKey,
    toUserId: userId,
    status: { $ne: "SETTLED" }
  }).select("remainingAmount");

  const recvDocs = await Settlement.find({
    messId,
    monthKey,
    fromUserId: userId,
    status: { $ne: "SETTLED" }
  }).select("remainingAmount");

  const owed = owedDocs.reduce((a, b) => a + (b.remainingAmount || 0), 0);
  const receivable = recvDocs.reduce((a, b) => a + (b.remainingAmount || 0), 0);

  return { owed: round2(owed), receivable: round2(receivable), net: round2(owed - receivable) };
}

router.get("/:messId/summary/member", auth, requireMember(), asyncHandler(async (req, res) => {
  const monthKey = req.query.monthKey;
  if (!monthKey) return res.status(400).json({ message: "monthKey is required" });

  const messId = req.params.messId;
  const userId = req.user.id;

  const rent = await getRentForMonth({ messId, userId, monthKey });

  const mealCount = await getMealCount({ messId, userId, monthKey });
  const unitPrice = await getMealUnitPrice({ messId, monthKey });
  const mealCost = mealCount * unitPrice;

  const { totalBills, activeMembers, share } = await getBillShare({ messId, monthKey });

  const payment = await Payment.findOne({ messId, monthKey, userId });
  const paymentStatus = payment ? payment.status : "UNPAID";

  const totalDue = rent + share + mealCost;

  const settlements = await getSettlementBalances({ messId, userId, monthKey });
  const adjustedDue = totalDue + settlements.owed - settlements.receivable;

  res.json({
    monthKey,
    rent: round2(rent),
    bills: { totalBills: round2(totalBills), activeMembers, share: round2(share) },
    meals: { mealCount, unitPrice: round2(unitPrice), mealCost: round2(mealCost) },
    totalDue: round2(totalDue),
    paymentStatus,
    settlements,
    adjustedDue: round2(adjustedDue)
  });
}));

router.get("/:messId/summary/manager", auth, requireManager(), asyncHandler(async (req, res) => {
  const monthKey = req.query.monthKey;
  if (!monthKey) return res.status(400).json({ message: "monthKey is required" });

  const messId = req.params.messId;

  const members = await Membership.find({ messId, isActive: true }).populate("userId", "name username");

  const unitPrice = await getMealUnitPrice({ messId, monthKey });
  const { totalBills, activeMembers, share } = await getBillShare({ messId, monthKey });

  const payments = await Payment.find({ messId, monthKey });
  const paymentMap = new Map(payments.map((p) => [String(p.userId), p]));

  const rows = [];
  let totalExpected = 0;
  let totalCollected = 0;

  for (const mem of members) {
    const uid = String(mem.userId._id);

    const rent = await getRentForMonth({ messId, userId: uid, monthKey });
    const mealCount = await getMealCount({ messId, userId: uid, monthKey });
    const mealCost = mealCount * unitPrice;
    const totalDue = rent + share + mealCost;
    const settlements = await getSettlementBalances({ messId, userId: uid, monthKey });
    const adjustedDue = totalDue + settlements.owed - settlements.receivable;

    const pay = paymentMap.get(uid);
    const status = pay ? pay.status : "UNPAID";

    totalExpected += totalDue;
    if (status === "PAID") totalCollected += totalDue;

    rows.push({
      user: { id: uid, name: mem.userId.name, username: mem.userId.username },
      rent: round2(rent),
      mealCount,
      mealCost: round2(mealCost),
      billShare: round2(share),
      totalDue: round2(totalDue),
      paymentStatus: status
    });
  }

  res.json({
    monthKey,
    unitPrice: round2(unitPrice),
    bills: { totalBills: round2(totalBills), activeMembers, share: round2(share) },
    members: rows,
    totals: { expected: round2(totalExpected), collected: round2(totalCollected) }
  });
}));

export default router;