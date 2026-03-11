import express from "express";
import { auth } from "../middleware/auth.js";
import { requireMember } from "../middleware/messAccess.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

import mongoose from "mongoose";
import PersonalExpense from "../models/PersonalExpense.js";
import Bill from "../models/Bill.js";
import MealLog from "../models/MealLog.js";
import MealPrice from "../models/MealPrice.js";
import Membership from "../models/Membership.js";
import RentSetting from "../models/RentSetting.js";
import Settlement from "../models/Settlement.js";

const router = express.Router();

/* ------------------------------------------------------------------ */
/*  PERSONAL ANALYTICS                                                  */
/*  GET /api/analytics/personal?startDate=&endDate=                     */
/* ------------------------------------------------------------------ */
router.get(
    "/personal",
    auth,
    asyncHandler(async (req, res) => {
        const filter = { userId: new mongoose.Types.ObjectId(req.user.id) };

        if (req.query.startDate || req.query.endDate) {
            filter.date = {};
            if (req.query.startDate) filter.date.$gte = new Date(req.query.startDate);
            if (req.query.endDate) filter.date.$lte = new Date(req.query.endDate);
        }

        // Category-wise totals
        const categoryAgg = await PersonalExpense.aggregate([
            { $match: filter },
            { $group: { _id: "$category", total: { $sum: "$amount" } } },
            { $sort: { total: -1 } },
        ]);

        // Monthly trend
        const monthlyAgg = await PersonalExpense.aggregate([
            { $match: filter },
            {
                $group: {
                    _id: {
                        year: { $year: "$date" },
                        month: { $month: "$date" },
                    },
                    total: { $sum: "$amount" },
                },
            },
            { $sort: { "_id.year": 1, "_id.month": 1 } },
        ]);

        const categories = categoryAgg.map((c) => ({
            category: c._id,
            total: Math.round(c.total * 100) / 100,
        }));

        const monthly = monthlyAgg.map((m) => ({
            month: `${m._id.year}-${String(m._id.month).padStart(2, "0")}`,
            total: Math.round(m.total * 100) / 100,
        }));

        const grandTotal = categories.reduce((s, c) => s + c.total, 0);

        res.json({ categories, monthly, grandTotal: Math.round(grandTotal * 100) / 100 });
    })
);

/* ------------------------------------------------------------------ */
/*  MESS ANALYTICS                                                      */
/*  GET /api/analytics/mess/:messId?startDate=&endDate=                 */
/* ------------------------------------------------------------------ */
router.get(
    "/mess/:messId",
    auth,
    requireMember(),
    asyncHandler(async (req, res) => {
        const { messId } = req.params;
        const { startDate, endDate } = req.query;

        // Build monthKey range from date params
        let startMonthKey = null;
        let endMonthKey = null;

        if (startDate) {
            const d = new Date(startDate);
            startMonthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        }
        if (endDate) {
            const d = new Date(endDate);
            endMonthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        }

        const monthFilter = {};
        if (startMonthKey || endMonthKey) {
            monthFilter.monthKey = {};
            if (startMonthKey) monthFilter.monthKey.$gte = startMonthKey;
            if (endMonthKey) monthFilter.monthKey.$lte = endMonthKey;
        }

        // --- Bills → Utilities category ---
        const bills = await Bill.find({ messId, ...monthFilter });
        let utilitiesTotal = 0;
        const monthlyMap = new Map();

        for (const bill of bills) {
            utilitiesTotal += bill.totalAmount || 0;
            const prev = monthlyMap.get(bill.monthKey) || 0;
            monthlyMap.set(bill.monthKey, prev + (bill.totalAmount || 0));
        }

        // --- Meals → Food category ---
        const dateFilter = {};
        if (startDate) dateFilter.$gte = startDate;
        if (endDate) dateFilter.$lte = endDate;

        const mealLogFilter = { messId };
        if (startDate || endDate) mealLogFilter.date = dateFilter;

        const mealLogs = await MealLog.find(mealLogFilter);

        // Get all relevant meal prices
        const mealPrices = await MealPrice.find({ messId, ...monthFilter });
        const priceMap = new Map(mealPrices.map((mp) => [mp.monthKey, mp.unitPrice]));

        let foodTotal = 0;
        for (const log of mealLogs) {
            const mk = log.date.slice(0, 7); // "YYYY-MM"
            const price = priceMap.get(mk) || 0;
            const cost = (log.mealsCount || 0) * price;
            foodTotal += cost;
            const prev = monthlyMap.get(mk) || 0;
            monthlyMap.set(mk, prev + cost);
        }

        // --- Rent category ---
        const activeMembers = await Membership.find({ messId, isActive: true });
        let rentTotal = 0;

        // Determine which months to check rent for
        const allMonthKeys = new Set([...monthlyMap.keys()]);
        for (const bill of bills) allMonthKeys.add(bill.monthKey);
        // Also add months from the date range
        if (startMonthKey && endMonthKey) {
            let [sy, sm] = startMonthKey.split("-").map(Number);
            const [ey, em] = endMonthKey.split("-").map(Number);
            while (sy < ey || (sy === ey && sm <= em)) {
                allMonthKeys.add(`${sy}-${String(sm).padStart(2, "0")}`);
                sm++;
                if (sm > 12) { sm = 1; sy++; }
            }
        }

        for (const mk of allMonthKeys) {
            let monthRent = 0;
            for (const mem of activeMembers) {
                const rs = await RentSetting.findOne({ messId, userId: mem.userId, monthKey: mk });
                if (rs) {
                    monthRent += rs.rent;
                } else {
                    monthRent += mem.rentCurrent || 0;
                }
            }
            rentTotal += monthRent;
            const prev = monthlyMap.get(mk) || 0;
            monthlyMap.set(mk, prev + monthRent);
        }

        // --- Settlements → Others category ---
        const settlementFilter = { messId };
        if (startMonthKey || endMonthKey) {
            settlementFilter.monthKey = {};
            if (startMonthKey) settlementFilter.monthKey.$gte = startMonthKey;
            if (endMonthKey) settlementFilter.monthKey.$lte = endMonthKey;
        }

        const settlements = await Settlement.find(settlementFilter);
        let othersTotal = 0;
        for (const s of settlements) {
            othersTotal += s.originalAmount || 0;
            const prev = monthlyMap.get(s.monthKey) || 0;
            monthlyMap.set(s.monthKey, prev + (s.originalAmount || 0));
        }

        // Build response
        const categories = [];
        if (rentTotal > 0) categories.push({ category: "Rent", total: Math.round(rentTotal * 100) / 100 });
        if (foodTotal > 0) categories.push({ category: "Food", total: Math.round(foodTotal * 100) / 100 });
        if (utilitiesTotal > 0) categories.push({ category: "Utilities", total: Math.round(utilitiesTotal * 100) / 100 });
        if (othersTotal > 0) categories.push({ category: "Others", total: Math.round(othersTotal * 100) / 100 });

        categories.sort((a, b) => b.total - a.total);

        const monthly = [...monthlyMap.entries()]
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([month, total]) => ({ month, total: Math.round(total * 100) / 100 }));

        const grandTotal = categories.reduce((s, c) => s + c.total, 0);

        res.json({ categories, monthly, grandTotal: Math.round(grandTotal * 100) / 100 });
    })
);

export default router;
