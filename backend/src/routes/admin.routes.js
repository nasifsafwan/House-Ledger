import express from "express";
import mongoose from "mongoose";
import { z } from "zod";
import { auth } from "../middleware/auth.js";
import { requireSystemAdmin } from "../middleware/admin.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import User from "../models/User.js";
import Mess from "../models/Mess.js";
import Membership from "../models/Membership.js";
import Payment from "../models/Payment.js";
import PersonalExpense from "../models/PersonalExpense.js";
import Notice from "../models/Notice.js";
import Admin from "../models/Admin.js";

const router = express.Router();

router.use(auth, asyncHandler(requireSystemAdmin));

router.get("/overview", asyncHandler(async (_req, res) => {
  const [users, admins, messes, activeMemberships, payments, personalExpenses, notices, recentUsers, recentMesses] =
    await Promise.all([
      User.countDocuments(),
      Admin.countDocuments(),
      Mess.countDocuments(),
      Membership.countDocuments({ isActive: true }),
      Payment.countDocuments(),
      PersonalExpense.countDocuments(),
      Notice.countDocuments(),
      User.find().sort({ createdAt: -1 }).limit(8).select("name username email createdAt"),
      Mess.find().sort({ createdAt: -1 }).limit(8).populate("createdBy", "name username"),
    ]);

  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);
  sixMonthsAgo.setHours(0, 0, 0, 0);

  const [userGrowthRaw, messGrowthRaw] = await Promise.all([
    User.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]),
    Mess.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]),
  ]);

  const timeline = [];
  for (let i = 0; i < 6; i += 1) {
    const date = new Date(sixMonthsAgo);
    date.setMonth(sixMonthsAgo.getMonth() + i);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const label = date.toLocaleString("en-US", { month: "short", year: "numeric" });
    const usersForMonth = userGrowthRaw.find((row) => row._id.year === year && row._id.month === month)?.count || 0;
    const messesForMonth = messGrowthRaw.find((row) => row._id.year === year && row._id.month === month)?.count || 0;
    timeline.push({ label, users: usersForMonth, messes: messesForMonth });
  }

  res.json({
    counts: { users, admins, messes, activeMemberships, payments, personalExpenses, notices },
    timeline,
    recentUsers,
    recentMesses,
  });
}));

router.get("/users", asyncHandler(async (_req, res) => {
  const users = await User.find()
    .sort({ createdAt: -1 })
    .limit(100)
    .select("name username email createdAt");
  res.json({ users });
}));

router.get("/admins", asyncHandler(async (_req, res) => {
  const admins = await Admin.find().select("username createdAt");
  res.json({ admins });
}));

router.delete("/remove-admin/:adminId", asyncHandler(async (req, res) => {
  const adminId = req.params.adminId;

  if (req.user.id === adminId) {
    return res.status(400).json({ message: "You cannot delete yourself." });
  }

  const adminCount = await Admin.countDocuments();
  if (adminCount <= 1) {
    return res.status(400).json({ message: "Cannot delete the last admin account." });
  }

  const admin = await Admin.findByIdAndDelete(adminId);
  if (!admin) {
    return res.status(404).json({ message: "Admin not found." });
  }

  res.json({ message: "Admin deleted successfully" });
}));

router.patch("/users/:userId", asyncHandler(async (req, res) => {
  const schema = z.object({
    name: z.string().trim().min(1).max(80).optional(),
    username: z.string().trim().min(3).max(40).optional(),
    email: z.string().trim().email().optional(),
  }).refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required",
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: parsed.error.issues[0]?.message || "Invalid payload" });
  }

  const user = await User.findById(req.params.userId);
  if (!user) return res.status(404).json({ message: "User not found" });

  if (parsed.data.username && parsed.data.username.toLowerCase() !== user.username) {
    const exists = await User.findOne({ username: parsed.data.username.toLowerCase(), _id: { $ne: user._id } });
    if (exists) return res.status(409).json({ message: "Username already in use" });
    user.username = parsed.data.username.toLowerCase();
  }

  if (parsed.data.email && parsed.data.email.toLowerCase() !== user.email) {
    const exists = await User.findOne({ email: parsed.data.email.toLowerCase(), _id: { $ne: user._id } });
    if (exists) return res.status(409).json({ message: "Email already in use" });
    user.email = parsed.data.email.toLowerCase();
  }

  if (parsed.data.name) user.name = parsed.data.name;

  await user.save();
  res.json({
    user: {
      _id: user._id,
      name: user.name,
      username: user.username,
      email: user.email,
      createdAt: user.createdAt,
    },
  });
}));

router.get("/messes", asyncHandler(async (_req, res) => {
  const messes = await Mess.find()
    .sort({ createdAt: -1 })
    .limit(100)
    .populate("createdBy", "name username")
    .lean();

  const messIds = messes.map((mess) => mess._id);
  const memberships = messIds.length
    ? await Membership.find({ messId: { $in: messIds }, isActive: true })
      .populate("userId", "name email username")
      .lean()
    : [];

  // Map members to their messes
  const membersByMessId = new Map();
  for (const mb of memberships) {
    const mId = String(mb.messId);
    if (!membersByMessId.has(mId)) {
      membersByMessId.set(mId, []);
    }
    membersByMessId.get(mId).push({
      _id: mb.userId?._id,
      name: mb.userId?.name,
      email: mb.userId?.email,
      username: mb.userId?.username,
      role: mb.role
    });
  }

  res.json({
    messes: messes.map((mess) => ({
      ...mess,
      members: membersByMessId.get(String(mess._id)) || [],
      activeMembers: (membersByMessId.get(String(mess._id)) || []).length,
    })),
  });
}));

router.patch("/messes/:messId", asyncHandler(async (req, res) => {
  const schema = z.object({
    name: z.string().trim().min(1).max(100).optional(),
    address: z.string().trim().max(200).optional(),
  }).refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required",
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: parsed.error.issues[0]?.message || "Invalid payload" });
  }

  const mess = await Mess.findById(req.params.messId).populate("createdBy", "name username");
  if (!mess) return res.status(404).json({ message: "Mess not found" });

  if (parsed.data.name) mess.name = parsed.data.name;
  if (typeof parsed.data.address === "string") mess.address = parsed.data.address;
  await mess.save();

  const activeMembers = await Membership.countDocuments({ messId: mess._id, isActive: true });
  res.json({ mess: { ...mess.toObject(), activeMembers } });
}));


router.patch("/messes/:messId/members/:userId", asyncHandler(async (req, res) => {
  const { role } = req.body;
  if (!["MANAGER", "MEMBER"].includes(role)) {
    return res.status(400).json({ message: "Invalid role" });
  }

  const membership = await Membership.findOne({
    messId: req.params.messId,
    userId: req.params.userId
  });

  if (!membership) {
    return res.status(404).json({ message: "Membership not found" });
  }

  membership.role = role;
  await membership.save();

  res.json({ message: "Member role updated successfully", membership });
}));

router.delete("/messes/:messId/members/:userId", asyncHandler(async (req, res) => {
  const membership = await Membership.findOneAndDelete({
    messId: req.params.messId,
    userId: req.params.userId
  });

  if (!membership) {
    return res.status(404).json({ message: "Membership not found" });
  }

  res.json({ message: "Member removed from mess successfully" });
}));

export default router;
