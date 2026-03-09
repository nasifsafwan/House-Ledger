// backend/src/config/db.js
import mongoose from "mongoose";
async function connectDB(uri) {
  mongoose.set("strictQuery", false);
  await mongoose.connect(uri);
  console.log("Connected to MongoDB");
}

// backend/src/app.js
import express5 from "express";
import cors from "cors";

// backend/src/routes/auth.routes.js
import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";

// backend/src/models/User.js
import mongoose2 from "mongoose";
var userSchema = new mongoose2.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  passwordHash: {
    type: String,
    required: true
  }
}, { timestamps: true });
var User_default = mongoose2.model("User", userSchema);

// backend/src/middleware/asyncHandler.js
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// backend/src/routes/auth.routes.js
var router = express.Router();
router.post("/register", asyncHandler(async (req, res) => {
  const schema = z.object({
    name: z.string().min(1),
    email: z.string().email(),
    password: z.string().min(6)
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: parsed.error.errors[0].message });
  }
  const exists = await User_default.findOne({ email: parsed.data.email });
  if (exists) {
    return res.status(400).json({ message: "Email already in use" });
  }
  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  await User_default.create({ name: parsed.data.name, email: parsed.data.email, passwordHash });
  res.json({ message: "User registered successfully" });
}));
router.post("/login", asyncHandler(async (req, res) => {
  const schema = z.object({
    email: z.string().email(),
    password: z.string().min(6)
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: parsed.error.errors[0].message });
  }
  const user = await User_default.findOne({ email: parsed.data.email });
  if (!user) {
    return res.status(400).json({ message: "Invalid email or password" });
  }
  const ok = await bcrypt.compare(parsed.data.password, user.passwordHash);
  if (!ok) {
    return res.status(400).json({ message: "Invalid email or password" });
  }
  const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: "7d" });
  return res.json({ token, user: { id: user._id, name: user.name, email: user.email } });
}));
var auth_routes_default = router;

// backend/src/routes/mess.routes.js
import express2 from "express";
import { z as z2 } from "zod";

// backend/src/middleware/auth.js
import jwt2 from "jsonwebtoken";
function auth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: "Missing token" });
  try {
    const payload = jwt2.verify(token, process.env.JWT_SECRET);
    req.user = { id: payload.id, email: payload.email };
    next();
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
}

// backend/src/models/Membership.js
import mongoose3 from "mongoose";
var MembershipSchema = new mongoose3.Schema(
  {
    messId: {
      type: mongoose3.Schema.Types.ObjectId,
      ref: "Mess",
      required: true
    },
    userId: {
      type: mongoose3.Schema.Types.ObjectId,
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
var Membership_default = mongoose3.model("Membership", MembershipSchema);

// backend/src/middleware/messAccess.js
function requireMember() {
  return async (req, res, next) => {
    const messId = req.params.messId || req.body.messId;
    if (!messId) return res.status(400).json({ message: "Missing messId" });
    const mem = await Membership_default.findOne({ messId, userId: req.user.id, isActive: true });
    if (!mem) return res.status(403).json({ message: "Not a member of this mess" });
    req.membership = mem;
    next();
  };
}
function requireManager() {
  return async (req, res, next) => {
    const messId = req.params.messId || req.body.messId;
    if (!messId) return res.status(400).json({ message: "Missing messId" });
    const mem = await Membership_default.findOne({ messId, userId: req.user.id, isActive: true });
    if (!mem || mem.role !== "MANAGER") {
      return res.status(403).json({ message: "Manager only" });
    }
    req.membership = mem;
    next();
  };
}

// backend/src/models/Mess.js
import mongoose4 from "mongoose";
var messSchema = new mongoose4.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  address: {
    type: String,
    required: false,
    default: "",
    trim: true
  },
  inviteCode: {
    type: String,
    required: true,
    unique: true
  },
  createdBy: {
    type: mongoose4.Schema.Types.ObjectId,
    ref: "User",
    required: true
  }
}, { timestamps: true });
var Mess_default = mongoose4.model("Mess", messSchema);

// backend/src/models/MealLog.js
import mongoose5 from "mongoose";
var MealLogSchema = new mongoose5.Schema({
  messId: {
    type: mongoose5.Schema.Types.ObjectId,
    ref: "Mess",
    required: true
  },
  userId: {
    type: mongoose5.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  date: {
    type: String,
    required: true,
    match: /^\d{4}-\d{2}-\d{2}$/
  },
  mealsCount: {
    type: Number,
    required: true,
    min: 0
  }
}, { timestamps: true });
MealLogSchema.index({ messId: 1, userId: 1, date: 1 }, { unique: true });
var MealLog_default = mongoose5.model("MealLog", MealLogSchema);

// backend/src/models/MealPrice.js
import mongoose6 from "mongoose";
var MealPriceSchema = new mongoose6.Schema({
  messId: { type: mongoose6.Schema.Types.ObjectId, ref: "Mess", required: true },
  monthKey: { type: String, required: true },
  // e.g. "2024-06"
  unitPrice: { type: Number, required: true, min: 0 }
}, { timestamps: true });
MealPriceSchema.index({ messId: 1, monthKey: 1 }, { unique: true });
var MealPrice_default = mongoose6.model("MealPrice", MealPriceSchema);

// backend/src/models/Bill.js
import mongoose7 from "mongoose";
var BillItemSchema = new mongoose7.Schema(
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
var BillSchema = new mongoose7.Schema(
  {
    messId: { type: mongoose7.Schema.Types.ObjectId, ref: "Mess", required: true },
    monthKey: { type: String, required: true },
    items: { type: [BillItemSchema], default: [] },
    totalAmount: { type: Number, default: 0, min: 0 }
  },
  { timestamps: true }
);
BillSchema.index({ messId: 1, monthKey: 1 }, { unique: true });
var Bill_default = mongoose7.model("Bill", BillSchema);

// backend/src/models/Visitor.js
import mongoose8 from "mongoose";
var VisitorSchema = new mongoose8.Schema({
  messId: { type: mongoose8.Schema.Types.ObjectId, ref: "Mess", required: true },
  visitorName: { type: String, required: true },
  visitedUserId: { type: mongoose8.Schema.Types.ObjectId, ref: "User", required: true },
  entryTime: { type: Date, required: true },
  createdBy: { type: mongoose8.Schema.Types.ObjectId, ref: "User", required: true }
}, { timestamps: true });
var Visitor_default = mongoose8.model("Visitor", VisitorSchema);

// backend/src/models/ReminderSetting.js
import mongoose9 from "mongoose";
var ReminderSettingSchema = new mongoose9.Schema({
  messId: { type: mongoose9.Schema.Types.ObjectId, ref: "Mess", required: true },
  dayOfMonth: { type: Number, required: true },
  // e.g. 25
  enabled: { type: Boolean, default: true }
}, { timestamps: true });
ReminderSettingSchema.index({ messId: 1 }, { unique: true });
var ReminderSetting_default = mongoose9.model("ReminderSetting", ReminderSettingSchema);

// backend/src/models/RentSetting.js
import mongoose10 from "mongoose";
var RentSettingSchema = new mongoose10.Schema({
  messId: { type: mongoose10.Schema.Types.ObjectId, ref: "Mess", required: true },
  userId: { type: mongoose10.Schema.Types.ObjectId, ref: "User", required: true },
  monthKey: { type: String, required: true },
  // e.g. "2024-06"
  rent: { type: Number, required: true }
}, { timestamps: true });
RentSettingSchema.index({ messId: 1, userId: 1, monthKey: 1 }, { unique: true });
var RentSetting_default = mongoose10.model("RentSetting", RentSettingSchema);

// backend/src/models/Payment.js
import mongoose11 from "mongoose";
var PaymentSchema = new mongoose11.Schema(
  {
    messId: { type: mongoose11.Schema.Types.ObjectId, ref: "Mess", required: true },
    monthKey: { type: String, required: true },
    userId: { type: mongoose11.Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, enum: ["PAID", "UNPAID"], default: "UNPAID" },
    paidAt: { type: Date, default: null },
    markedBy: { type: mongoose11.Schema.Types.ObjectId, ref: "User", default: null }
  },
  { timestamps: true }
);
PaymentSchema.index({ messId: 1, monthKey: 1, userId: 1 }, { unique: true });
var Payment_default = mongoose11.model("Payment", PaymentSchema);

// backend/src/models/Settlement.js
import mongoose12 from "mongoose";
var SettlePaymentSchema = new mongoose12.Schema({
  amount: { type: Number, required: true, min: 0.01 },
  paidBy: { type: mongoose12.Schema.Types.ObjectId, ref: "User", required: true },
  paidAt: { type: Date, default: Date.now },
  note: { type: String, default: "" }
}, { _id: false });
var SettlementSchema = new mongoose12.Schema({
  messId: { type: mongoose12.Schema.Types.ObjectId, ref: "Mess", required: true },
  monthKey: { type: String, required: true },
  fromUserId: { type: mongoose12.Schema.Types.ObjectId, ref: "User", required: true },
  toUserId: { type: mongoose12.Schema.Types.ObjectId, ref: "User", required: true },
  reason: { type: String, enum: ["RENT", "BILLS", "MEALS", "OTHER"], default: "OTHER" },
  note: { type: String, default: "" },
  originalAmount: { type: Number, required: true, min: 0.01 },
  remainingAmount: { type: Number, required: true, min: 0 },
  status: { type: String, enum: ["OPEN", "PARTIAL", "SETTLED"], default: "OPEN" },
  payments: [SettlePaymentSchema],
  createdAt: { type: Date, default: Date.now }
});
var Settlement_default = mongoose12.model("Settlement", SettlementSchema);

// backend/src/utils/inviteCode.js
function generateInviteCode(len = 8) {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < len; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

// backend/src/utils/calc.js
function sum(nums) {
  return nums.reduce((a, b) => a + b, 0);
}
function round2(x) {
  return Math.round((x + Number.EPSILON) * 100) / 100;
}

// backend/src/utils/monthKey.js
function toMonthKey(date = /* @__PURE__ */ new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}
function nextMonthKey(monthKey) {
  const [yStr, mStr] = monthKey.split("-");
  const y = Number(yStr);
  const m = Number(mStr);
  if (m === 12) return `${y + 1}-01`;
  return `${y}-${String(m + 1).padStart(2, "0")}`;
}

// backend/src/routes/mess.routes.js
var router2 = express2.Router();
router2.post("/", auth, asyncHandler(async (req, res) => {
  const schema = z2.object({
    name: z2.string().min(2),
    address: z2.string().optional()
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: parsed.error.issues });
  let inviteCode = generateInviteCode();
  while (await Mess_default.findOne({ inviteCode })) inviteCode = generateInviteCode();
  const mess = await Mess_default.create({
    name: parsed.data.name,
    address: parsed.data.address || "",
    inviteCode,
    createdBy: req.user.id
  });
  await Membership_default.create({
    messId: mess._id,
    userId: req.user.id,
    role: "MANAGER",
    rentCurrent: 0
  });
  await ReminderSetting_default.create({ messId: mess._id, dayOfMonth: 5, enabled: true });
  res.json({ mess });
}));
router2.post("/join", auth, asyncHandler(async (req, res) => {
  const schema = z2.object({ inviteCode: z2.string().min(4) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: parsed.error.issues });
  const mess = await Mess_default.findOne({ inviteCode: parsed.data.inviteCode });
  if (!mess) return res.status(404).json({ message: "Invalid invite code" });
  const existing = await Membership_default.findOne({ messId: mess._id, userId: req.user.id });
  if (existing && existing.isActive) {
    return res.status(409).json({ message: "Already joined" });
  }
  if (existing && !existing.isActive) {
    existing.isActive = true;
    existing.role = "MEMBER";
    await existing.save();
    return res.json({ mess, membership: existing });
  }
  const membership = await Membership_default.create({
    messId: mess._id,
    userId: req.user.id,
    role: "MEMBER",
    rentCurrent: 0
  });
  res.json({ mess, membership });
}));
router2.post("/:messId/settlements", auth, requireMember(), async (req, res) => {
  const schema = z2.object({
    monthKey: z2.string().regex(/^\d{4}-\d{2}$/),
    toUserId: z2.string().min(1),
    amount: z2.number().min(0.01),
    reason: z2.enum(["RENT", "BILLS", "MEALS", "OTHER"]).optional(),
    note: z2.string().optional()
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: parsed.error.issues });
  const { monthKey, toUserId, amount, reason, note } = parsed.data;
  const messId = req.params.messId;
  const ok = await Membership_default.findOne({ messId, userId: toUserId, isActive: true });
  if (!ok) return res.status(400).json({ message: "Target user is not in this mess" });
  if (String(toUserId) === String(req.user.id)) {
    return res.status(400).json({ message: "You cannot create a split to yourself" });
  }
  const doc = await Settlement_default.create({
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
router2.get("/:messId/settlements", auth, requireMember(), async (req, res) => {
  const messId = req.params.messId;
  const monthKey = req.query.monthKey;
  const filter = { messId };
  if (monthKey) filter.monthKey = monthKey;
  if (req.membership.role !== "MANAGER") {
    filter.$or = [{ fromUserId: req.user.id }, { toUserId: req.user.id }];
  }
  const docs = await Settlement_default.find(filter).populate("fromUserId", "name email").populate("toUserId", "name email").sort({ createdAt: -1 });
  res.json({ settlements: docs });
});
router2.post("/:messId/settlements/:settlementId/pay", auth, requireMember(), async (req, res) => {
  const schema = z2.object({
    amount: z2.number().min(0.01),
    note: z2.string().optional()
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: parsed.error.issues });
  const { amount, note } = parsed.data;
  const messId = req.params.messId;
  const settlementId = req.params.settlementId;
  const s = await Settlement_default.findById(settlementId);
  if (!s || String(s.messId) !== String(messId)) {
    return res.status(404).json({ message: "Settlement not found" });
  }
  if (s.status === "SETTLED" || s.remainingAmount <= 0) {
    return res.status(400).json({ message: "This settlement is already settled" });
  }
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
    paidAt: /* @__PURE__ */ new Date(),
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
  const populated = await Settlement_default.findById(s._id).populate("fromUserId", "name email").populate("toUserId", "name email");
  res.json({ settlement: populated });
});
router2.patch("/:messId/settlements/:settlementId/settle", auth, requireManager(), async (req, res) => {
  const messId = req.params.messId;
  const settlementId = req.params.settlementId;
  const s = await Settlement_default.findById(settlementId);
  if (!s || String(s.messId) !== String(messId)) {
    return res.status(404).json({ message: "Settlement not found" });
  }
  s.remainingAmount = 0;
  s.status = "SETTLED";
  await s.save();
  res.json({ message: "Settlement marked settled" });
});
router2.get("/me", auth, asyncHandler(async (req, res) => {
  const memberships = await Membership_default.find({ userId: req.user.id, isActive: true }).populate(
    "messId"
  );
  res.json({ memberships });
}));
router2.post("/:messId/meals", auth, requireMember(), asyncHandler(async (req, res) => {
  const schema = z2.object({
    date: z2.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    mealsCount: z2.number().min(0)
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: parsed.error.issues });
  const { date, mealsCount } = parsed.data;
  const doc = await MealLog_default.findOneAndUpdate(
    { messId: req.params.messId, userId: req.user.id, date },
    { mealsCount },
    { upsert: true, new: true }
  );
  res.json({ mealLog: doc });
}));
router2.get("/:messId/meals", auth, requireMember(), asyncHandler(async (req, res) => {
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
  const logs = await MealLog_default.find(filter).sort({ date: 1 });
  res.json({ logs });
}));
router2.put("/:messId/meal-price", auth, requireManager(), asyncHandler(async (req, res) => {
  const schema = z2.object({
    monthKey: z2.string().regex(/^\d{4}-\d{2}$/),
    unitPrice: z2.number().min(0)
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: parsed.error.issues });
  const doc = await MealPrice_default.findOneAndUpdate(
    { messId: req.params.messId, monthKey: parsed.data.monthKey },
    { unitPrice: parsed.data.unitPrice },
    { upsert: true, new: true }
  );
  res.json({ mealPrice: doc });
}));
router2.get("/:messId/meal-price", auth, requireMember(), asyncHandler(async (req, res) => {
  const monthKey = req.query.monthKey;
  if (!monthKey) return res.status(400).json({ message: "monthKey is required" });
  const doc = await MealPrice_default.findOne({ messId: req.params.messId, monthKey });
  res.json({ mealPrice: doc });
}));
router2.put("/:messId/bills", auth, requireManager(), asyncHandler(async (req, res) => {
  const schema = z2.object({
    monthKey: z2.string().regex(/^\d{4}-\d{2}$/),
    items: z2.array(
      z2.object({
        type: z2.enum(["ELECTRICITY", "GAS", "WATER", "INTERNET", "OTHER"]),
        label: z2.string().optional(),
        amount: z2.number().min(0)
      })
    )
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: parsed.error.issues });
  const totalAmount = sum(parsed.data.items.map((x) => x.amount));
  const doc = await Bill_default.findOneAndUpdate(
    { messId: req.params.messId, monthKey: parsed.data.monthKey },
    { items: parsed.data.items, totalAmount },
    { upsert: true, new: true }
  );
  res.json({ bill: doc });
}));
router2.get("/:messId/bills", auth, requireMember(), asyncHandler(async (req, res) => {
  const monthKey = req.query.monthKey;
  if (!monthKey) return res.status(400).json({ message: "monthKey is required" });
  const doc = await Bill_default.findOne({ messId: req.params.messId, monthKey });
  res.json({ bill: doc });
}));
router2.post("/:messId/visitors", auth, requireMember(), asyncHandler(async (req, res) => {
  const schema = z2.object({
    visitorName: z2.string().min(1),
    visitedUserId: z2.string().min(1),
    entryTime: z2.string().min(1)
    // ISO string
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: parsed.error.issues });
  const ok = await Membership_default.findOne({
    messId: req.params.messId,
    userId: parsed.data.visitedUserId,
    isActive: true
  });
  if (!ok) return res.status(400).json({ message: "Visited user is not in this mess" });
  const doc = await Visitor_default.create({
    messId: req.params.messId,
    visitorName: parsed.data.visitorName,
    visitedUserId: parsed.data.visitedUserId,
    entryTime: new Date(parsed.data.entryTime),
    createdBy: req.user.id
  });
  res.json({ visitor: doc });
}));
router2.get("/:messId/visitors", auth, requireManager(), asyncHandler(async (req, res) => {
  const docs = await Visitor_default.find({ messId: req.params.messId }).populate("visitedUserId", "name email").populate("createdBy", "name email").sort({ entryTime: -1 });
  res.json({ visitors: docs });
}));
router2.put("/:messId/reminder", auth, requireManager(), asyncHandler(async (req, res) => {
  const schema = z2.object({
    dayOfMonth: z2.number().min(1).max(28),
    enabled: z2.boolean()
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: parsed.error.issues });
  const doc = await ReminderSetting_default.findOneAndUpdate(
    { messId: req.params.messId },
    { dayOfMonth: parsed.data.dayOfMonth, enabled: parsed.data.enabled },
    { upsert: true, new: true }
  );
  res.json({ reminder: doc });
}));
router2.get("/:messId/reminder", auth, requireMember(), asyncHandler(async (req, res) => {
  const doc = await ReminderSetting_default.findOne({ messId: req.params.messId });
  res.json({ reminder: doc });
}));
async function getRentForMonth({ messId, userId, monthKey }) {
  const rentSetting = await RentSetting_default.findOne({ messId, userId, monthKey });
  if (rentSetting) return rentSetting.rent;
  const membership = await Membership_default.findOne({ messId, userId, isActive: true });
  return membership ? membership.rentCurrent : 0;
}
async function getMealCount({ messId, userId, monthKey }) {
  const logs = await MealLog_default.find({
    messId,
    userId,
    date: { $regex: `^${monthKey}-` }
  });
  return logs.reduce((a, b) => a + (b.mealsCount || 0), 0);
}
async function getMealUnitPrice({ messId, monthKey }) {
  const mp = await MealPrice_default.findOne({ messId, monthKey });
  return mp ? mp.unitPrice : 0;
}
async function getBillShare({ messId, monthKey }) {
  const bill = await Bill_default.findOne({ messId, monthKey });
  const totalBills = bill ? bill.totalAmount : 0;
  const activeMembers = await Membership_default.countDocuments({ messId, isActive: true });
  const share = activeMembers > 0 ? totalBills / activeMembers : 0;
  return { totalBills, activeMembers, share };
}
async function getSettlementBalances({ messId, userId, monthKey }) {
  const owedDocs = await Settlement_default.find({
    messId,
    monthKey,
    toUserId: userId,
    status: { $ne: "SETTLED" }
  }).select("remainingAmount");
  const recvDocs = await Settlement_default.find({
    messId,
    monthKey,
    fromUserId: userId,
    status: { $ne: "SETTLED" }
  }).select("remainingAmount");
  const owed = owedDocs.reduce((a, b) => a + (b.remainingAmount || 0), 0);
  const receivable = recvDocs.reduce((a, b) => a + (b.remainingAmount || 0), 0);
  return { owed: round2(owed), receivable: round2(receivable), net: round2(owed - receivable) };
}
router2.get("/:messId/summary/member", auth, requireMember(), asyncHandler(async (req, res) => {
  const monthKey = req.query.monthKey;
  if (!monthKey) return res.status(400).json({ message: "monthKey is required" });
  const messId = req.params.messId;
  const userId = req.user.id;
  const rent = await getRentForMonth({ messId, userId, monthKey });
  const mealCount = await getMealCount({ messId, userId, monthKey });
  const unitPrice = await getMealUnitPrice({ messId, monthKey });
  const mealCost = mealCount * unitPrice;
  const { totalBills, activeMembers, share } = await getBillShare({ messId, monthKey });
  const payment = await Payment_default.findOne({ messId, monthKey, userId });
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
router2.get("/:messId/summary/manager", auth, requireManager(), asyncHandler(async (req, res) => {
  const monthKey = req.query.monthKey;
  if (!monthKey) return res.status(400).json({ message: "monthKey is required" });
  const messId = req.params.messId;
  const members = await Membership_default.find({ messId, isActive: true }).populate("userId", "name email");
  const unitPrice = await getMealUnitPrice({ messId, monthKey });
  const { totalBills, activeMembers, share } = await getBillShare({ messId, monthKey });
  const payments = await Payment_default.find({ messId, monthKey });
  const paymentMap = new Map(payments.map((p) => [String(p.userId), p]));
  const rows = [];
  let totalExpected = 0;
  let totalCollected = 0;
  let totalAdjustedExpected = 0;
  let totalAdjustedCollected = 0;
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
    totalAdjustedExpected += adjustedDue;
    if (status === "PAID") totalCollected += totalDue;
    if (status === "PAID") totalAdjustedCollected += adjustedDue;
    rows.push({
      user: { id: uid, name: mem.userId.name, email: mem.userId.email },
      rent: round2(rent),
      mealCount,
      mealCost: round2(mealCost),
      billShare: round2(share),
      totalDue: round2(totalDue),
      settlements,
      adjustedDue: round2(adjustedDue),
      paymentStatus: status
    });
  }
  res.json({
    monthKey,
    unitPrice: round2(unitPrice),
    bills: { totalBills: round2(totalBills), activeMembers, share: round2(share) },
    members: rows,
    totals: {
      expected: round2(totalExpected),
      collected: round2(totalCollected),
      adjustedExpected: round2(totalAdjustedExpected),
      adjustedCollected: round2(totalAdjustedCollected)
    }
  });
}));
var mess_routes_default = router2;

// backend/src/routes/members.routes.js
import express3 from "express";
import { z as z3 } from "zod";
var router3 = express3.Router();
router3.get("/:messId", auth, requireManager(), asyncHandler(async (req, res) => {
  const members = await Membership_default.find({ messId: req.params.messId, isActive: true }).populate("userId", "name email").sort({ createdAt: 1 });
  res.json({ members });
}));
router3.patch("/:messId/:memberId/rent", auth, requireManager(), asyncHandler(async (req, res) => {
  const schema = z3.object({
    rent: z3.number().min(0),
    effectiveMonthKey: z3.string().optional()
    // default next month
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: parsed.error.issues });
  const { rent, effectiveMonthKey } = parsed.data;
  const messId = req.params.messId;
  const memberId = req.params.memberId;
  const membership = await Membership_default.findById(memberId);
  if (!membership || String(membership.messId) !== String(messId) || !membership.isActive) {
    return res.status(404).json({ message: "Member not found" });
  }
  const currentMK = toMonthKey(/* @__PURE__ */ new Date());
  const targetMK = effectiveMonthKey || nextMonthKey(currentMK);
  await RentSetting_default.findOneAndUpdate(
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
router3.delete("/:messId/:memberId", auth, requireManager(), asyncHandler(async (req, res) => {
  const membership = await Membership_default.findById(req.params.memberId);
  if (!membership || String(membership.messId) !== String(req.params.messId)) {
    return res.status(404).json({ message: "Member not found" });
  }
  if (String(membership.userId) === String(req.user.id)) {
    return res.status(400).json({ message: "Manager cannot remove self" });
  }
  membership.isActive = false;
  await membership.save();
  res.json({ message: "Member removed" });
}));
var members_routes_default = router3;

// backend/src/routes/payments.routes.js
import express4 from "express";
import { z as z4 } from "zod";
var router4 = express4.Router();
router4.get("/:messId", auth, requireMember(), asyncHandler(async (req, res) => {
  const schema = z4.object({
    monthKey: z4.string().regex(/^\d{4}-\d{2}$/)
  });
  const parsed = schema.safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ message: "monthKey is required" });
  const { messId } = req.params;
  const { monthKey } = parsed.data;
  if (req.membership.role === "MANAGER") {
    const payments = await Payment_default.find({ messId, monthKey }).populate("userId", "name email").populate("markedBy", "name email").sort({ createdAt: -1 });
    return res.json({ payments });
  }
  const payment = await Payment_default.findOne({ messId, monthKey, userId: req.user.id });
  return res.json({ payment });
}));
router4.post("/:messId/self-paid", auth, requireMember(), asyncHandler(async (req, res) => {
  const schema = z4.object({
    monthKey: z4.string().regex(/^\d{4}-\d{2}$/)
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "monthKey is required" });
  const { messId } = req.params;
  const { monthKey } = parsed.data;
  const payment = await Payment_default.findOneAndUpdate(
    { messId, monthKey, userId: req.user.id },
    { status: "PAID", paidAt: /* @__PURE__ */ new Date(), markedBy: req.user.id },
    { upsert: true, new: true }
  );
  res.json({ payment });
}));
router4.put("/:messId/:userId", auth, requireManager(), asyncHandler(async (req, res) => {
  const schema = z4.object({
    monthKey: z4.string().regex(/^\d{4}-\d{2}$/),
    status: z4.enum(["PAID", "UNPAID"])
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: parsed.error.issues });
  const { messId, userId } = req.params;
  const { monthKey, status } = parsed.data;
  const update = {
    status,
    markedBy: req.user.id,
    paidAt: status === "PAID" ? /* @__PURE__ */ new Date() : null
  };
  const payment = await Payment_default.findOneAndUpdate(
    { messId, monthKey, userId },
    update,
    { upsert: true, new: true }
  );
  res.json({ payment });
}));
var payments_routes_default = router4;

// backend/src/middleware/error.js
function notFound(req, res) {
  res.status(404).json({ message: "Not found" });
}
function errorHandler(err, req, res, next) {
  console.error(err.stack);
  res.status(500).json({ message: "Internal server error" });
}

// backend/src/app.js
var app = express5();
var configuredOrigins = (process.env.CORS_ORIGIN || "").split(",").map((x) => x.trim()).filter(Boolean);
app.use(
  cors({
    origin(origin, cb) {
      if (!origin) return cb(null, true);
      if (process.env.NODE_ENV !== "production" && /^http:\/\/localhost:\d+$/.test(origin)) {
        return cb(null, true);
      }
      if (configuredOrigins.includes(origin)) return cb(null, true);
      return cb(null, false);
    },
    credentials: true
  })
);
app.use(express5.json({ limit: "2mb" }));
app.get("/", (req, res) => res.json({ ok: true }));
app.use("/api/auth", auth_routes_default);
app.use("/api/mess", mess_routes_default);
app.use("/api/members", members_routes_default);
app.use("/api/payments", payments_routes_default);
app.use(notFound);
app.use(errorHandler);
var app_default = app;

// api/index.js
async function ensureDB() {
  if (mongoose.connection.readyState >= 1) {
    return;
  }
  const uri = process.env.MONGO_URI;
  if (!uri) {
    throw new Error("Missing MONGO_URI environment variable");
  }
  await connectDB(uri);
}
async function handler(req, res) {
  try {
    await ensureDB();
    return app_default(req, res);
  } catch (error) {
    console.error("Vercel Function Error:", error);
    return res.status(500).json({
      error: "Internal Server Error",
      message: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : void 0
    });
  }
}
export {
  handler as default
};
