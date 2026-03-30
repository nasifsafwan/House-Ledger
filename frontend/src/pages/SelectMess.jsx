import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import { MessAPI } from "../api/mess";
import { PersonalAPI } from "../api/personal";
import { authStore } from "../store/authStore";

/* ── Helpers ── */
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return { text: "Good morning", emoji: "☀️" };
  if (h < 17) return { text: "Good afternoon", emoji: "🌤️" };
  return { text: "Good evening", emoji: "🌙" };
}

function formatDate() {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

function formatTime() {
  return new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function timeAgo(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now - d) / 1000);
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const CATEGORY_EMOJI = {
  Food: "🍔", Rent: "🏠", Utilities: "⚡", Transport: "🚗",
  Shopping: "🛍️", Entertainment: "🎬", Others: "📦",
};

/* ── Skeleton Card ── */
function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-3">
        <div className="skeleton h-12 w-12 shrink-0 rounded-xl" />
        <div className="flex-1 space-y-2">
          <div className="skeleton h-3 w-16 rounded" />
        </div>
      </div>
      <div className="skeleton mb-3 h-5 w-3/4 rounded-lg" />
      <div className="skeleton h-7 w-24 rounded-lg" />
    </div>
  );
}

/* ── Main Component ── */
export default function SelectMess() {
  const nav = useNavigate();
  const [memberships, setMemberships] = useState([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [now, setNow] = useState(new Date());
  const [allExpenses, setAllExpenses] = useState([]);
  const [expensesLoading, setExpensesLoading] = useState(true);
  const user = authStore.getUser();
  const greeting = getGreeting();

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const handleCopy = (e, code) => {
    e.stopPropagation();
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  useEffect(() => {
    (async () => {
      try {
        const res = await MessAPI.myMesses();
        setMemberships(res.data.memberships || []);
      } catch (e) {
        setErr(e?.response?.data?.message || "Failed to load messes");
      } finally {
        setLoading(false);
      }
    })();
    // Fetch personal expenses
    (async () => {
      try {
        const res = await PersonalAPI.list();
        setAllExpenses(res.data.expenses || []);
      } catch {
        // silent — not critical
      } finally {
        setExpensesLoading(false);
      }
    })();
  }, []);

  const open = (m) => {
    const messId = m.messId?._id;
    if (!messId) return;
    if (m.role === "MANAGER") nav(`/manager/${messId}`);
    else nav(`/member/${messId}`);
  };

  const managerCount = memberships.filter((m) => m.role === "MANAGER").length;
  const memberCount = memberships.filter((m) => m.role === "MEMBER").length;

  const filtered = useMemo(() => {
    let list = memberships;
    if (roleFilter !== "ALL") list = list.filter((m) => m.role === roleFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((m) => m.messId?.name?.toLowerCase().includes(q));
    }
    return list;
  }, [memberships, roleFilter, search]);

  // Compute personal spending this month from ALL expenses
  const thisMonthSpent = useMemo(() => {
    const now = new Date();
    return allExpenses
      .filter((e) => {
        const d = new Date(e.date);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      })
      .reduce((s, e) => s + e.amount, 0);
  }, [allExpenses]);

  // Slice only the top 5 for the recent feed
  const recentExpenses = useMemo(() => allExpenses.slice(0, 5), [allExpenses]);

  return (
    <Layout>
      {/* ─── Hero ─── */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="dashboard-card">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-slate-200/60 bg-white/80 px-3.5 py-1 text-xs font-semibold text-slate-500 shadow-sm backdrop-blur-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-500 live-dot" />
            {formatDate()} • {formatTime()}
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            {greeting.text},{" "}
            <span className="bg-gradient-to-r from-brand-600 to-brand-500 bg-clip-text text-transparent">
              {user?.name?.split(" ")[0] || "User"}
            </span>{" "}
            {greeting.emoji}
          </h1>
          <p className="mt-1.5 text-sm text-slate-500 font-medium">
            Manage your personal and shared expenses in one place.
          </p>
        </div>
      </div>

      {/* ─── Quick Stats Row ─── */}
      {!loading && (
        <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4 dashboard-card" style={{ animationDelay: "0.05s" }}>
          {[
            { icon: "🏠", label: "Shared Messes", value: memberships.length, color: "text-brand-600" },
            { icon: "👑", label: "Managing", value: managerCount, color: "text-amber-600" },
            { icon: "👤", label: "Member In", value: memberCount, color: "text-sky-600" },
            { icon: "💸", label: "This Month", value: `${Math.round(thisMonthSpent)}৳`, color: "text-emerald-600" },
          ].map((s) => (
            <div
              key={s.label}
              className="flex items-center gap-3 rounded-xl border border-slate-200/40 bg-white/70 px-4 py-3 shadow-sm backdrop-blur-sm transition-all duration-200 hover:shadow-md hover:scale-[1.02]"
            >
              <span className="text-lg">{s.icon}</span>
              <div className="min-w-0">
                <div className={`text-xl font-extrabold tracking-tight ${s.color}`}>{s.value}</div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 truncate">{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── Search & Filter ─── */}
      {!loading && memberships.length > 0 && (
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between dashboard-card" style={{ animationDelay: "0.1s" }}>
          <h2 className="text-lg font-extrabold tracking-tight text-slate-900">Your Spaces</h2>
          <div className="flex items-center gap-2">
            <div className="relative">
              <svg
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
              <input
                id="mess-search"
                type="text"
                placeholder="Search…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="search-glow w-36 rounded-lg border border-slate-200 bg-white py-1.5 pl-8 pr-3 text-xs font-medium text-slate-700 shadow-sm transition-all placeholder:text-slate-400 focus:w-48 focus:border-brand-300"
              />
            </div>
            <div className="flex items-center gap-1">
              {["ALL", "MANAGER", "MEMBER"].map((r) => (
                <button
                  key={r}
                  onClick={() => setRoleFilter(r)}
                  className={`rounded-lg px-2.5 py-1.5 text-[11px] font-bold tracking-wide transition-all duration-200 ${
                    roleFilter === r
                      ? "filter-chip-active"
                      : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                  }`}
                >
                  {r === "ALL" ? "All" : r === "MANAGER" ? "👑" : "👤"}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {err && (
        <div className="mb-5 flex items-center gap-3 rounded-xl border border-danger-200 bg-danger-50/50 px-4 py-3 text-sm font-semibold text-danger-700">
          <span>⚠️</span> {err}
        </div>
      )}

      {/* ─── Unified Grid: Personal + Mess Cards ─── */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">

            {/* ── Personal Expenses Card ── */}
            <button
              onClick={() => nav("/personal")}
              className="glass-hover group relative flex h-full w-full flex-col overflow-hidden rounded-2xl border border-emerald-200/50 bg-gradient-to-br from-white to-emerald-50/40 p-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md dashboard-card"
            >
              <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-emerald-100/40 blur-2xl transition-all duration-500 group-hover:bg-emerald-100/70" />
              <div className="relative z-10 flex h-full flex-col">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-100 to-teal-100 text-lg shadow-sm ring-1 ring-inset ring-emerald-200/60 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                    💰
                  </div>
                  <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                    Private
                  </span>
                </div>
                <h3 className="mb-1 text-lg font-extrabold text-slate-900 tracking-tight transition-colors group-hover:text-emerald-700">
                  Personal Expenses
                </h3>
                <p className="mb-4 text-xs font-medium text-slate-500">Track your private spending</p>
                <div className="mt-auto flex items-center gap-2 text-sm font-bold text-emerald-600 transition-all group-hover:gap-3">
                  Open Dashboard
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="transition-transform group-hover:translate-x-1">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                  </svg>
                </div>
              </div>
            </button>

            {/* ── Mess Cards ── */}
            {filtered.map((m, idx) => (
              <button
                key={m._id}
                onClick={() => open(m)}
                className="glass-hover group relative flex h-full w-full flex-col overflow-hidden rounded-2xl border border-slate-200/60 bg-white p-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md dashboard-card"
                style={{ animationDelay: `${0.05 * (idx + 1)}s` }}
              >
                {m.role === "MANAGER" && (
                  <div className="absolute right-0 top-0 rounded-bl-xl bg-gradient-to-bl from-warn-400 to-warn-500 px-3 py-1 font-bold text-white shadow-sm">
                    <span className="text-[9px] uppercase tracking-wider">Manager</span>
                  </div>
                )}
                <div className="mb-4 flex items-center gap-3">
                  <div
                    className={`relative flex h-11 w-11 items-center justify-center rounded-xl text-lg shadow-sm ring-1 ring-inset transition-all duration-300 group-hover:scale-110 ${
                      m.role === "MANAGER"
                        ? "bg-warn-50 text-warn-600 ring-warn-100"
                        : "bg-brand-50 text-brand-600 ring-brand-100"
                    }`}
                  >
                    {m.role === "MANAGER" ? "👑" : "👤"}
                    <span className={`live-dot absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white shadow-sm ${m.role === "MANAGER" ? "bg-amber-400" : "bg-brand-500"}`} />
                  </div>
                  <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${m.role === "MANAGER" ? "bg-warn-50 text-warn-600" : "bg-brand-50 text-brand-600"}`}>
                    {m.role}
                  </span>
                </div>
                <h3 className="mb-1 truncate text-lg font-extrabold text-slate-900 tracking-tight transition-colors group-hover:text-brand-700">
                  {m.messId?.name}
                </h3>
                <p className="mb-4 text-xs font-medium text-slate-500">Shared mess</p>
                <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-3">
                  <div
                    className="group/code relative flex items-center gap-1.5 rounded-md bg-slate-50 px-2 py-1 transition-all hover:bg-brand-50"
                    onClick={(e) => handleCopy(e, m.messId?.inviteCode)}
                    title="Copy invite code"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400 group-hover/code:text-brand-500">
                      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                    </svg>
                    <span className="font-mono text-[10px] font-bold tracking-widest text-slate-500 group-hover/code:text-brand-700">{m.messId?.inviteCode}</span>
                    {copiedCode === m.messId?.inviteCode && (
                      <span className="absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm z-10">Copied!</span>
                    )}
                  </div>
                  <div className="flex h-7 w-7 items-center justify-center rounded-full text-slate-400 opacity-0 transition-all duration-300 group-hover:text-brand-600 group-hover:opacity-100">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                    </svg>
                  </div>
                </div>
              </button>
            ))}

            {/* Empty state */}
            {memberships.length === 0 && (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-center shadow-sm dashboard-card" style={{ animationDelay: "0.1s" }}>
                <div className="mb-3 text-3xl">🏡</div>
                <h3 className="text-sm font-bold text-slate-700">No shared messes yet</h3>
                <p className="mt-1 text-xs text-slate-500">Create or join one below!</p>
              </div>
            )}

            {/* No search results */}
            {memberships.length > 0 && filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200/60 bg-white py-8 shadow-sm dashboard-card sm:col-span-2">
                <div className="mb-2 text-2xl">🔍</div>
                <h3 className="text-sm font-bold text-slate-700">No messes found</h3>
                <button onClick={() => { setSearch(""); setRoleFilter("ALL"); }} className="mt-3 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200">
                  Clear Filters
                </button>
              </div>
            )}
          </div>

          {/* ─── Join or Create ─── */}
          <div className="mt-6 dashboard-card" style={{ animationDelay: "0.2s" }}>
            <button
              onClick={() => nav("/choose")}
              className="group flex w-full items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/30 px-6 py-5 transition-all duration-300 hover:border-brand-300 hover:bg-brand-50/50 hover:shadow-lg"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-brand-600 shadow-sm ring-1 ring-slate-200 transition-all duration-300 group-hover:scale-110 group-hover:bg-brand-600 group-hover:text-white group-hover:ring-brand-600 group-hover:rotate-90">
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              </div>
              <div className="text-left">
                <h3 className="text-base font-bold text-slate-700 transition-colors group-hover:text-brand-700">Join or Create a Mess</h3>
                <p className="text-xs font-medium text-slate-500">Start managing shared expenses with others</p>
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="ml-auto text-slate-400 transition-all group-hover:text-brand-600 group-hover:translate-x-1">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </button>
          </div>

          {/* ─── Bottom Row: Recent Activity + Quick Actions ─── */}
          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-5">

            {/* ── Recent Personal Expenses (3 cols) ── */}
            <div className="lg:col-span-3 rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm dashboard-card" style={{ animationDelay: "0.25s" }}>
              <div className="mb-4 flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-sm">📋</span>
                  Recent Personal Expenses
                </h3>
                <button
                  onClick={() => nav("/personal")}
                  className="text-xs font-bold text-brand-600 transition-colors hover:text-brand-700"
                >
                  View All →
                </button>
              </div>

              {expensesLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="skeleton h-9 w-9 rounded-lg" />
                      <div className="flex-1 space-y-1.5">
                        <div className="skeleton h-3 w-24 rounded" />
                        <div className="skeleton h-2.5 w-16 rounded" />
                      </div>
                      <div className="skeleton h-4 w-12 rounded" />
                    </div>
                  ))}
                </div>
              ) : recentExpenses.length === 0 ? (
                <div className="flex flex-col items-center py-6 text-center">
                  <div className="mb-2 text-2xl">🧾</div>
                  <p className="text-xs font-semibold text-slate-500">No expenses logged yet</p>
                  <button
                    onClick={() => nav("/personal")}
                    className="mt-3 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-600 transition-colors hover:bg-emerald-100"
                  >
                    Add your first expense
                  </button>
                </div>
              ) : (
                <div className="space-y-1">
                  {recentExpenses.map((exp, i) => (
                    <div
                      key={exp._id}
                      className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-slate-50 dashboard-card"
                      style={{ animationDelay: `${0.03 * i}s` }}
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-slate-50 to-slate-100 text-base ring-1 ring-inset ring-slate-200/60">
                        {CATEGORY_EMOJI[exp.category] || "📦"}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-800 truncate">{exp.category}</span>
                          {exp.description && (
                            <span className="truncate text-xs text-slate-400">· {exp.description}</span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 font-medium">{timeAgo(exp.date)}</div>
                      </div>
                      <span className="text-sm font-extrabold text-slate-900 whitespace-nowrap">{exp.amount}৳</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── Quick Actions + Tips (2 cols) ── */}
            <div className="lg:col-span-2 space-y-4">
              {/* Quick Actions */}
              <div className="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm dashboard-card" style={{ animationDelay: "0.3s" }}>
                <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-800">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-50 text-sm">⚡</span>
                  Quick Actions
                </h3>
                <div className="space-y-2">
                  <button
                    onClick={() => nav("/personal")}
                    className="group flex w-full items-center gap-3 rounded-xl bg-emerald-50/60 px-4 py-3 text-left transition-all hover:bg-emerald-50 hover:shadow-sm"
                  >
                    <span className="text-base">💰</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-slate-800">Log Expense</div>
                      <div className="text-[11px] text-slate-500">Add a personal expense</div>
                    </div>
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-emerald-600">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                  </button>
                  <button
                    onClick={() => nav("/notices")}
                    className="group flex w-full items-center gap-3 rounded-xl bg-sky-50/60 px-4 py-3 text-left transition-all hover:bg-sky-50 hover:shadow-sm"
                  >
                    <span className="text-base">📢</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-slate-800">Notice Board</div>
                      <div className="text-[11px] text-slate-500">Check updates & announcements</div>
                    </div>
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-sky-600">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                  </button>
                  <button
                    onClick={() => nav("/choose")}
                    className="group flex w-full items-center gap-3 rounded-xl bg-violet-50/60 px-4 py-3 text-left transition-all hover:bg-violet-50 hover:shadow-sm"
                  >
                    <span className="text-base">🏠</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-slate-800">New Mess</div>
                      <div className="text-[11px] text-slate-500">Create or join a shared mess</div>
                    </div>
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-violet-600">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Tips */}
              <div className="rounded-2xl border border-slate-200/60 bg-gradient-to-br from-white to-amber-50/30 p-5 shadow-sm dashboard-card" style={{ animationDelay: "0.35s" }}>
                <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-800">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-sm">💡</span>
                  Pro Tip
                </h3>
                <p className="text-xs leading-relaxed text-slate-600">
                  <span className="font-bold text-slate-800">Track daily expenses</span> to get accurate monthly analytics.
                  Categorize each expense for better spending insights on your Personal Dashboard.
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </Layout>
  );
}