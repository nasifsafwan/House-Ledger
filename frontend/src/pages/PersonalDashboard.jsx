import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import Card from "../components/Card";
import ExpenseAnalytics from "../components/ExpenseAnalytics";
import { PersonalAPI } from "../api/personal";

const CATEGORIES = ["Food", "Rent", "Utilities", "Transport", "Shopping", "Entertainment", "Others"];

export default function PersonalDashboard() {
    const [expenses, setExpenses] = useState([]);
    const [form, setForm] = useState({ category: "Food", customCategory: "", amount: "", description: "", date: "" });
    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState("");
    const [msg, setMsg] = useState("");
    const [refreshKey, setRefreshKey] = useState(0);

    const load = async () => {
        try {
            const res = await PersonalAPI.list();
            setExpenses(res.data.expenses || []);
        } catch (e) {
            setErr(e?.response?.data?.message || "Failed to load expenses");
        }
    };

    useEffect(() => {
        load();
    }, []);

    const addExpense = async () => {
        const amount = Number(form.amount);
        if (!amount || amount <= 0) {
            setErr("Amount must be greater than 0");
            return;
        }

        // Determine the actual category to send
        let category = form.category;
        if (category === "Others" && form.customCategory.trim()) {
            category = form.customCategory.trim();
        }

        setErr("");
        setMsg("");
        setSaving(true);
        try {
            await PersonalAPI.create({
                category,
                amount,
                description: form.description,
                date: form.date || undefined,
            });
            setMsg("Expense added ✅");
            setForm({ category: "Food", customCategory: "", amount: "", description: "", date: "" });
            await load();
            setRefreshKey((k) => k + 1);
        } catch (e) {
            setErr(e?.response?.data?.message || "Failed to add expense");
        } finally {
            setSaving(false);
        }
    };

    const deleteExpense = async (id) => {
        setErr("");
        setMsg("");
        try {
            await PersonalAPI.remove(id);
            setMsg("Expense deleted");
            await load();
            setRefreshKey((k) => k + 1);
        } catch (e) {
            setErr(e?.response?.data?.message || "Failed to delete");
        }
    };

    // --- Compute breakdown by category ---
    const breakdownMap = {};
    let totalAmount = 0;
    expenses.forEach((exp) => {
        if (!breakdownMap[exp.category]) {
            breakdownMap[exp.category] = { total: 0, count: 0, items: [] };
        }
        breakdownMap[exp.category].total += exp.amount;
        breakdownMap[exp.category].count += 1;
        breakdownMap[exp.category].items.push(exp);
        totalAmount += exp.amount;
    });

    const breakdownEntries = Object.entries(breakdownMap).sort((a, b) => b[1].total - a[1].total);

    // --- Compute breakdown by month ---
    const monthlyMap = {};
    expenses.forEach((exp) => {
        const d = new Date(exp.date);
        const mk = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        if (!monthlyMap[mk]) monthlyMap[mk] = { total: 0, count: 0 };
        monthlyMap[mk].total += exp.amount;
        monthlyMap[mk].count += 1;
    });
    const monthlyEntries = Object.entries(monthlyMap).sort((a, b) => b[0].localeCompare(a[0]));

    const inputCls =
        "w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2.5 text-sm transition-all placeholder:text-slate-400 focus:bg-white";

    const CATEGORY_EMOJI = {
        Food: "🍔", Rent: "🏠", Utilities: "⚡", Transport: "🚗",
        Shopping: "🛍️", Entertainment: "🎬", Others: "📦",
    };

    return (
        <Layout>
            <div className="mb-6">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">Personal Expenses</h1>
                <p className="mt-1 text-sm text-slate-500">Track and analyze your private spending</p>
            </div>

            {err && (
                <div className="mb-5 flex items-center gap-2 rounded-xl bg-danger-50 px-4 py-3 text-sm font-medium text-danger-600">
                    <span>⚠️</span> {err}
                </div>
            )}
            {msg && (
                <div className="mb-5 flex items-center gap-2 rounded-xl bg-success-50 px-4 py-3 text-sm font-medium text-success-600">
                    <span>✅</span> {msg}
                </div>
            )}

            <div className="grid gap-6 lg:grid-cols-2">
                {/* Add Expense Form */}
                <Card icon="➕" title="Add Expense" subtitle="Log a new personal expense">
                    <div className="space-y-3">
                        <div className="grid gap-3 sm:grid-cols-2">
                            <div>
                                <label className="mb-1 block text-xs font-medium text-slate-500">Category</label>
                                <select
                                    className={inputCls}
                                    value={form.category}
                                    onChange={(e) => setForm((p) => ({ ...p, category: e.target.value, customCategory: "" }))}
                                >
                                    {CATEGORIES.map((c) => (
                                        <option key={c} value={c}>
                                            {c}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="mb-1 block text-xs font-medium text-slate-500">Amount (৳)</label>
                                <input
                                    className={inputCls}
                                    type="number"
                                    min="0.01"
                                    step="0.01"
                                    placeholder="0.00"
                                    value={form.amount}
                                    onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))}
                                />
                            </div>
                        </div>

                        {/* Custom category input - shown when Others is selected */}
                        {form.category === "Others" && (
                            <div>
                                <label className="mb-1 block text-xs font-medium text-slate-500">
                                    Category Name <span className="text-slate-400">(e.g. Medical, Education)</span>
                                </label>
                                <input
                                    className={inputCls}
                                    type="text"
                                    placeholder="Enter custom category name"
                                    value={form.customCategory}
                                    onChange={(e) => setForm((p) => ({ ...p, customCategory: e.target.value }))}
                                />
                            </div>
                        )}

                        <div>
                            <label className="mb-1 block text-xs font-medium text-slate-500">
                                Description (optional)
                            </label>
                            <input
                                className={inputCls}
                                placeholder="e.g. Lunch at restaurant"
                                value={form.description}
                                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-medium text-slate-500">
                                Date (optional, defaults to today)
                            </label>
                            <input
                                className={inputCls}
                                type="date"
                                value={form.date}
                                onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
                            />
                        </div>
                        <button
                            onClick={addExpense}
                            disabled={saving}
                            className="w-full rounded-xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-brand-700 disabled:opacity-50"
                        >
                            {saving ? "Saving…" : "Add Expense"}
                        </button>
                    </div>
                </Card>

                {/* Summary Stats */}
                <Card icon="💰" title="Summary" subtitle="Your spending at a glance">
                    <div className="space-y-4">
                        {/* Total */}
                        <div className="flex items-center justify-between rounded-xl bg-gradient-to-r from-brand-50 to-slate-50 p-4">
                            <span className="text-sm font-medium text-slate-600">Total Spending</span>
                            <span className="text-xl font-bold text-slate-900">{Math.round(totalAmount * 100) / 100}৳</span>
                        </div>

                        {/* Category breakdown */}
                        <div>
                            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">By Category</h4>
                            {breakdownEntries.length === 0 ? (
                                <div className="rounded-lg border border-dashed border-slate-200 p-4 text-center text-xs text-slate-400">
                                    No expenses yet
                                </div>
                            ) : (
                                <div className="space-y-1.5">
                                    {breakdownEntries.map(([cat, info]) => {
                                        const pct = totalAmount > 0 ? Math.round((info.total / totalAmount) * 100) : 0;
                                        return (
                                            <div key={cat} className="rounded-lg bg-slate-50 px-3 py-2.5">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm">{CATEGORY_EMOJI[cat] || "📦"}</span>
                                                        <span className="text-sm font-medium text-slate-700">{cat}</span>
                                                        <span className="text-xs text-slate-400">({info.count})</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs text-slate-400">{pct}%</span>
                                                        <span className="text-sm font-semibold text-slate-900">{Math.round(info.total * 100) / 100}৳</span>
                                                    </div>
                                                </div>
                                                {/* Progress bar */}
                                                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                                                    <div
                                                        className="h-full rounded-full bg-brand-500 transition-all"
                                                        style={{ width: `${pct}%` }}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Monthly breakdown */}
                        {monthlyEntries.length > 0 && (
                            <div>
                                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">By Month</h4>
                                <div className="space-y-1.5">
                                    {monthlyEntries.map(([month, info]) => (
                                        <div key={month} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm">📅</span>
                                                <span className="text-sm font-medium text-slate-700">{month}</span>
                                                <span className="text-xs text-slate-400">({info.count} items)</span>
                                            </div>
                                            <span className="text-sm font-semibold text-slate-900">{Math.round(info.total * 100) / 100}৳</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </Card>
            </div>

            {/* Recent Expenses List */}
            <div className="mt-6">
                <Card icon="📋" title="Recent Expenses" subtitle={`${expenses.length} total`}>
                    {expenses.length === 0 ? (
                        <div className="rounded-lg border border-dashed border-slate-200 p-6 text-center text-sm text-slate-400">
                            No personal expenses yet. Add one to get started!
                        </div>
                    ) : (
                        <div className="max-h-96 space-y-2 overflow-y-auto pr-1">
                            {expenses.map((exp) => (
                                <div
                                    key={exp._id}
                                    className="flex items-center justify-between rounded-lg border border-slate-200/60 bg-white p-3 transition-all hover:shadow-sm"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-base">
                                            {CATEGORY_EMOJI[exp.category] || "📦"}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="inline-flex rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                                                    {exp.category}
                                                </span>
                                                <span className="text-sm font-bold text-slate-900">{exp.amount}৳</span>
                                            </div>
                                            {exp.description && (
                                                <div className="mt-0.5 text-xs text-slate-400">{exp.description}</div>
                                            )}
                                            <div className="mt-0.5 text-xs text-slate-400">
                                                {new Date(exp.date).toLocaleDateString()}
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => deleteExpense(exp._id)}
                                        className="ml-2 rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-400 transition-all hover:border-red-200 hover:bg-red-50 hover:text-red-500"
                                    >
                                        ✕
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>
            </div>

            {/* Analytics Charts */}
            <div className="mt-6">
                <Card icon="📊" title="Spending Analytics" subtitle="Visualize your personal spending">
                    <ExpenseAnalytics type="personal" refreshKey={refreshKey} />
                </Card>
            </div>
        </Layout>
    );
}
