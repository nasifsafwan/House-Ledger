import { useEffect, useState, useMemo } from "react";
import Layout from "../components/Layout";
import ExpenseAnalytics from "../components/ExpenseAnalytics";
import { PersonalAPI } from "../api/personal";

const CATEGORIES = [
  { name: "Food", emoji: "🍔", color: "from-orange-50 to-amber-50 ring-orange-100 text-orange-600" },
  { name: "Rent", emoji: "🏠", color: "from-indigo-50 to-violet-50 ring-indigo-100 text-indigo-600" },
  { name: "Utilities", emoji: "⚡", color: "from-cyan-50 to-sky-50 ring-cyan-100 text-cyan-600" },
  { name: "Transport", emoji: "🚗", color: "from-yellow-50 to-amber-50 ring-yellow-100 text-yellow-600" },
  { name: "Shopping", emoji: "🛍️", color: "from-pink-50 to-rose-50 ring-pink-100 text-pink-600" },
  { name: "Entertainment", emoji: "🎬", color: "from-purple-50 to-violet-50 ring-purple-100 text-purple-600" },
  { name: "Others", emoji: "📦", color: "from-slate-50 to-gray-50 ring-slate-200 text-slate-600" },
];

const CATEGORY_EMOJI = Object.fromEntries(CATEGORIES.map((c) => [c.name, c.emoji]));

const BAR_COLORS = [
  "from-orange-400 to-amber-500",
  "from-indigo-400 to-violet-500",
  "from-cyan-400 to-sky-500",
  "from-yellow-400 to-amber-500",
  "from-pink-400 to-rose-500",
  "from-purple-400 to-violet-500",
  "from-slate-400 to-gray-500",
];

function getBarColor(cat) {
  const idx = CATEGORIES.findIndex((c) => c.name === cat);
  return BAR_COLORS[idx >= 0 ? idx : BAR_COLORS.length - 1];
}

/* ── Date group helper ── */
function getDateGroup(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diff = Math.floor((today - new Date(d.getFullYear(), d.getMonth(), d.getDate())) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff < 7) return "This Week";
  return "Earlier";
}

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

  useEffect(() => { load(); }, []);

  const addExpense = async () => {
    const amount = Number(form.amount);
    if (!amount || amount <= 0) { setErr("Amount must be greater than 0"); return; }
    let category = form.category;
    if (category === "Others" && form.customCategory.trim()) category = form.customCategory.trim();
    setErr(""); setMsg(""); setSaving(true);
    try {
      await PersonalAPI.create({ category, amount, description: form.description, date: form.date || undefined });
      setMsg("Expense added ✅");
      setForm({ category: "Food", customCategory: "", amount: "", description: "", date: "" });
      await load();
      setRefreshKey((k) => k + 1);
    } catch (e) {
      setErr(e?.response?.data?.message || "Failed to add expense");
    } finally { setSaving(false); }
  };

  const deleteExpense = async (id) => {
    setErr(""); setMsg("");
    try {
      await PersonalAPI.remove(id);
      setMsg("Expense deleted");
      await load();
      setRefreshKey((k) => k + 1);
    } catch (e) {
      setErr(e?.response?.data?.message || "Failed to delete");
    }
  };

  // Computed stats
  const totalAmount = expenses.reduce((s, e) => s + e.amount, 0);
  const thisMonthTotal = useMemo(() => {
    const now = new Date();
    return expenses
      .filter((e) => {
        const d = new Date(e.date);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      })
      .reduce((s, e) => s + e.amount, 0);
  }, [expenses]);

  // Category breakdown
  const breakdownMap = {};
  expenses.forEach((exp) => {
    if (!breakdownMap[exp.category]) breakdownMap[exp.category] = { total: 0, count: 0 };
    breakdownMap[exp.category].total += exp.amount;
    breakdownMap[exp.category].count += 1;
  });
  const breakdownEntries = Object.entries(breakdownMap).sort((a, b) => b[1].total - a[1].total);

  // Monthly breakdown
  const monthlyMap = {};
  expenses.forEach((exp) => {
    const d = new Date(exp.date);
    const mk = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (!monthlyMap[mk]) monthlyMap[mk] = { total: 0, count: 0 };
    monthlyMap[mk].total += exp.amount;
    monthlyMap[mk].count += 1;
  });
  const monthlyEntries = Object.entries(monthlyMap).sort((a, b) => b[0].localeCompare(a[0]));

  // Group expenses by date
  const grouped = useMemo(() => {
    const groups = {};
    expenses.forEach((exp) => {
      const group = getDateGroup(exp.date);
      if (!groups[group]) groups[group] = [];
      groups[group].push(exp);
    });
    return groups;
  }, [expenses]);
  const groupOrder = ["Today", "Yesterday", "This Week", "Earlier"];

  const inputCls = "search-glow w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm font-medium transition-all placeholder:text-slate-400 focus:border-brand-300 focus:bg-white";

  return (
    <Layout>
      {/* ─── Hero ─── */}
      <div className="mb-8 dashboard-card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 text-2xl shadow-sm ring-1 ring-inset ring-emerald-100">
              💰
            </div>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Personal Expenses</h1>
              <p className="text-sm text-slate-500 font-medium">Track and analyze your private spending</p>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Quick Stats ─── */}
      <div className="mb-8 grid grid-cols-3 gap-4">
        <div className="stat-pill flex items-center gap-3 rounded-2xl border border-slate-200/40 bg-white/70 px-5 py-3.5 shadow-sm backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-md" style={{ animationDelay: "0.1s" }}>
          <span className="text-xl">💸</span>
          <div>
            <div className="text-2xl font-extrabold tracking-tight text-slate-900">{Math.round(totalAmount)}৳</div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Total Spent</div>
          </div>
        </div>
        <div className="stat-pill flex items-center gap-3 rounded-2xl border border-slate-200/40 bg-white/70 px-5 py-3.5 shadow-sm backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-md" style={{ animationDelay: "0.2s" }}>
          <span className="text-xl">📅</span>
          <div>
            <div className="text-2xl font-extrabold tracking-tight text-slate-900">{Math.round(thisMonthTotal)}৳</div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">This Month</div>
          </div>
        </div>
        <div className="stat-pill flex items-center gap-3 rounded-2xl border border-slate-200/40 bg-white/70 px-5 py-3.5 shadow-sm backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-md" style={{ animationDelay: "0.3s" }}>
          <span className="text-xl">🧾</span>
          <div>
            <div className="text-2xl font-extrabold tracking-tight text-slate-900">{expenses.length}</div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Transactions</div>
          </div>
        </div>
      </div>

      {/* ─── Toasts ─── */}
      {err && (
        <div className="mb-5 flex items-center gap-3 rounded-2xl border border-red-200/60 bg-red-50/50 px-5 py-3.5 text-sm font-semibold text-red-600 shadow-sm dashboard-card">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-red-100 text-base">⚠️</span>
          {err}
          <button onClick={() => setErr("")} className="ml-auto text-red-400 hover:text-red-600">✕</button>
        </div>
      )}
      {msg && (
        <div className="mb-5 flex items-center gap-3 rounded-2xl border border-emerald-200/60 bg-emerald-50/50 px-5 py-3.5 text-sm font-semibold text-emerald-600 shadow-sm dashboard-card">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-base">✅</span>
          {msg}
          <button onClick={() => setMsg("")} className="ml-auto text-emerald-400 hover:text-emerald-600">✕</button>
        </div>
      )}

      {/* ─── 1. Analytics Charts (Top) ─── */}
      <div className="mb-8">
        <div className="glass-hover rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm dashboard-card" style={{ animationDelay: "0.1s" }}>
          <div className="mb-5 flex items-center gap-3">
            <span className="text-2xl">📈</span>
            <div>
              <h2 className="text-lg font-bold tracking-tight text-slate-900">Spending Analytics</h2>
              <p className="text-sm text-slate-500">Visualize your personal spending at a glance</p>
            </div>
          </div>
          <ExpenseAnalytics type="personal" refreshKey={refreshKey} hideDetails={true} />
        </div>
      </div>

      {/* ─── 2. Add Expense Card ─── */}
      <div className="mb-8">
        <div className="dashboard-card" style={{ animationDelay: "0.15s" }}>
          <div className="glass-hover rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">➕</span>
                <div>
                  <h2 className="text-lg font-bold tracking-tight text-slate-900">Add Expense</h2>
                  <p className="text-sm text-slate-500">Log a new personal expense</p>
                </div>
              </div>
            </div>

            {/* Category emoji grid */}
            <div className="mb-4">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-400">Category</label>
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.name}
                    onClick={() => setForm((p) => ({ ...p, category: cat.name, customCategory: "" }))}
                    className={`flex flex-col items-center gap-1 rounded-xl px-2 py-3 text-center transition-all duration-200 ring-1 ring-inset ${form.category === cat.name
                      ? `bg-gradient-to-br ${cat.color} scale-105 shadow-sm ring-2`
                      : "bg-slate-50 ring-slate-100 text-slate-500 hover:bg-slate-100"
                      }`}
                  >
                    <span className="text-xl">{cat.emoji}</span>
                    <span className="text-[10px] font-bold uppercase tracking-wide">{cat.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {form.category === "Others" && (
              <div className="mb-3">
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">Category Name</label>
                <input
                  className={inputCls}
                  type="text"
                  placeholder="e.g. Medical, Education"
                  value={form.customCategory}
                  onChange={(e) => setForm((p) => ({ ...p, customCategory: e.target.value }))}
                />
              </div>
            )}

            <div className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">Amount (৳)</label>
                  <input className={inputCls} type="number" min="0.01" step="0.01" placeholder="0.00" value={form.amount} onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))} />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">Date</label>
                  <input className={inputCls} type="date" value={form.date} onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">Description (optional)</label>
                <input className={inputCls} placeholder="e.g. Lunch at restaurant" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
              </div>
              <button
                onClick={addExpense}
                disabled={saving}
                className="w-full rounded-xl bg-brand-600 px-4 py-3.5 text-sm font-bold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-brand-700 hover:shadow-md disabled:opacity-50"
              >
                {saving ? "Saving…" : "Add Expense"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ─── 3. Recent Expenses ─── */}
      <div className="mb-8">
        <div className="glass-hover rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm dashboard-card" style={{ animationDelay: "0.2s" }}>
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📋</span>
              <div>
                <h2 className="text-lg font-bold tracking-tight text-slate-900">Recent Expenses</h2>
                <p className="text-sm text-slate-500">{expenses.length} total transactions</p>
              </div>
            </div>
          </div>

          {expenses.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 py-12 text-center">
              <div className="mb-3 text-4xl">🧾</div>
              <p className="text-sm font-semibold text-slate-500">No expenses yet</p>
              <p className="mt-1 text-xs text-slate-400">Add one to start tracking!</p>
            </div>
          ) : (
            <div className="max-h-[28rem] space-y-5 overflow-y-auto pr-1">
              {groupOrder.map((group) => {
                const items = grouped[group];
                if (!items || items.length === 0) return null;
                return (
                  <div key={group}>
                    <h4 className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400">
                      <div className="h-px flex-1 bg-slate-200" />
                      {group}
                      <div className="h-px flex-1 bg-slate-200" />
                    </h4>
                    <div className="space-y-2">
                      {items.map((exp, idx) => (
                        <div
                          key={exp._id}
                          className="group flex items-center justify-between rounded-xl border border-slate-200/60 bg-white p-3.5 transition-all duration-200 hover:border-slate-300 hover:shadow-sm dashboard-card"
                          style={{ animationDelay: `${0.03 * idx}s` }}
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 text-lg ring-1 ring-inset ring-slate-200/60">
                              {CATEGORY_EMOJI[exp.category] || "📦"}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-500">{exp.category}</span>
                                <span className="text-sm font-extrabold text-slate-900">{exp.amount}৳</span>
                              </div>
                              {exp.description && (
                                <div className="mt-0.5 truncate text-xs text-slate-400 max-w-[200px]">{exp.description}</div>
                              )}
                              <div className="mt-0.5 text-[11px] text-slate-400">{new Date(exp.date).toLocaleDateString()}</div>
                            </div>
                          </div>
                          <button
                            onClick={() => deleteExpense(exp._id)}
                            className="rounded-lg border border-transparent p-2 text-slate-300 opacity-0 transition-all duration-200 group-hover:opacity-100 hover:border-red-200 hover:bg-red-50 hover:text-red-500"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ─── 4. Summary Details (Bottom) ─── */}
      <div className="mb-8">
        <div className="glass-hover rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm dashboard-card" style={{ animationDelay: "0.25s" }}>
          <div className="mb-5 flex items-center gap-3">
            <span className="text-2xl">📊</span>
            <div>
              <h2 className="text-lg font-bold tracking-tight text-slate-900">Summary Details</h2>
              <p className="text-sm text-slate-500">Full breakdown of your spending habits</p>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <h4 className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-400">By Category</h4>
              {breakdownEntries.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-400">No expenses yet</div>
              ) : (
                <div className="space-y-2.5">
                  {breakdownEntries.map(([cat, info]) => {
                    const pct = totalAmount > 0 ? Math.round((info.total / totalAmount) * 100) : 0;
                    return (
                      <div key={cat} className="group rounded-xl bg-slate-50/80 p-3 transition-all hover:bg-slate-100/80">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-sm">{CATEGORY_EMOJI[cat] || "📦"}</span>
                            <span className="text-sm font-bold text-slate-700">{cat}</span>
                            <span className="text-[11px] font-medium text-slate-400">({info.count})</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="rounded-md bg-white px-2 py-0.5 text-[11px] font-bold text-slate-500 shadow-sm ring-1 ring-slate-100">{pct}%</span>
                            <span className="text-sm font-extrabold text-slate-900">{Math.round(info.total)}৳</span>
                          </div>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200/80">
                          <div className={`h-full rounded-full bg-gradient-to-r ${getBarColor(cat)} transition-all duration-700 ease-out`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            {monthlyEntries.length > 0 && (
              <div>
                <h4 className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-400">By Month</h4>
                <div className="space-y-1.5">
                  {monthlyEntries.map(([month, info]) => (
                    <div key={month} className="flex items-center justify-between rounded-xl bg-slate-50/80 px-4 py-3 transition-all hover:bg-slate-100/80">
                      <div className="flex items-center gap-2.5">
                        <span className="text-sm">📅</span>
                        <span className="text-sm font-bold text-slate-700">{month}</span>
                        <span className="text-[11px] font-medium text-slate-400">({info.count} items)</span>
                      </div>
                      <span className="text-sm font-extrabold text-slate-900">{Math.round(info.total)}৳</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
