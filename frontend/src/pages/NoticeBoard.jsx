import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "../components/Layout";
import { MessAPI } from "../api/mess";

/* ── Relative time helper ── */
function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function NoticeBoard() {
  const [memberships, setMemberships] = useState([]);
  const [selectedMessId, setSelectedMessId] = useState("");
  const [notices, setNotices] = useState([]);
  const [loadingMesses, setLoadingMesses] = useState(true);
  const [loadingNotices, setLoadingNotices] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [form, setForm] = useState({ title: "", body: "", pinned: false });
  const [showCompose, setShowCompose] = useState(false);

  const selectedMembership = useMemo(
    () => memberships.find((item) => String(item.messId?._id) === String(selectedMessId)) || null,
    [memberships, selectedMessId]
  );

  const loadMesses = async () => {
    setErr("");
    setLoadingMesses(true);
    try {
      const res = await MessAPI.myMesses();
      const list = res.data.memberships || [];
      setMemberships(list);
      if (list.length > 0) {
        setSelectedMessId((prev) => prev || list[0].messId?._id || "");
      }
    } catch (e) {
      setErr(e?.response?.data?.message || "Failed to load your messes");
    } finally {
      setLoadingMesses(false);
    }
  };

  const loadNotices = async (messId) => {
    if (!messId) return;
    setErr("");
    setLoadingNotices(true);
    try {
      const res = await MessAPI.listNotices(messId);
      setNotices(res.data.notices || []);
    } catch (e) {
      setErr(e?.response?.data?.message || "Failed to load notices");
    } finally {
      setLoadingNotices(false);
    }
  };

  useEffect(() => { loadMesses(); }, []);
  useEffect(() => { if (selectedMessId) loadNotices(selectedMessId); }, [selectedMessId]);

  const createNotice = async () => {
    if (!selectedMessId) return;
    if (!form.title.trim() || !form.body.trim()) {
      setErr("Title and notice text are required");
      return;
    }
    setErr("");
    setMsg("");
    setSaving(true);
    try {
      await MessAPI.createNotice(selectedMessId, {
        title: form.title.trim(),
        body: form.body.trim(),
        pinned: form.pinned,
      });
      setForm({ title: "", body: "", pinned: false });
      setMsg("Notice posted successfully!");
      setShowCompose(false);
      await loadNotices(selectedMessId);
    } catch (e) {
      setErr(e?.response?.data?.message || "Failed to post notice");
    } finally {
      setSaving(false);
    }
  };

  const deleteNotice = async (noticeId) => {
    if (!selectedMessId) return;
    setErr("");
    setMsg("");
    try {
      await MessAPI.deleteNotice(selectedMessId, noticeId);
      setMsg("Notice deleted");
      await loadNotices(selectedMessId);
    } catch (e) {
      setErr(e?.response?.data?.message || "Failed to delete notice");
    }
  };

  // Separate pinned and unpinned
  const pinnedNotices = notices.filter((n) => n.pinned);
  const regularNotices = notices.filter((n) => !n.pinned);

  return (
    <Layout>
      {/* ─── Hero ─── */}
      <div className="mb-8 dashboard-card">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 text-2xl shadow-sm ring-1 ring-inset ring-orange-100">
            📢
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Notice Board</h1>
            <p className="text-sm text-slate-500 font-medium">Stay updated with announcements from your mess</p>
          </div>
        </div>
      </div>

      {/* ─── Toasts ─── */}
      {err && (
        <div className="mb-5 flex items-center gap-3 rounded-2xl border border-red-200/60 bg-red-50/50 px-5 py-3.5 text-sm font-semibold text-red-600 shadow-sm dashboard-card">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-red-100 text-base">⚠️</span>
          {err}
          <button onClick={() => setErr("")} className="ml-auto text-red-400 hover:text-red-600 transition-colors">✕</button>
        </div>
      )}
      {msg && (
        <div className="mb-5 flex items-center gap-3 rounded-2xl border border-emerald-200/60 bg-emerald-50/50 px-5 py-3.5 text-sm font-semibold text-emerald-600 shadow-sm dashboard-card">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-base">✅</span>
          {msg}
          <button onClick={() => setMsg("")} className="ml-auto text-emerald-400 hover:text-emerald-600 transition-colors">✕</button>
        </div>
      )}

      {loadingMesses ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <div className="mb-6 h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-brand-600" />
          <p className="text-sm font-semibold tracking-wide">Loading your messes…</p>
        </div>
      ) : memberships.length === 0 ? (
        <div className="group relative overflow-hidden rounded-3xl border border-slate-200/60 bg-white p-12 text-center shadow-sm transition-all duration-500 hover:shadow-xl dashboard-card">
          <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-amber-50/60 blur-3xl" />
          <div className="relative z-10 mx-auto flex max-w-sm flex-col items-center">
            <div className="mb-6 text-5xl">📭</div>
            <h2 className="mb-2 text-xl font-extrabold text-slate-900">No messes joined yet</h2>
            <p className="mb-8 text-sm text-slate-500 font-medium">Join or create a mess to access the notice board.</p>
            <Link
              to="/choose"
              className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-3 text-sm font-bold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-brand-700 hover:shadow-md"
            >
              Join or Create a Mess
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* ─── Mess Tab Selector ─── */}
          <div className="flex flex-wrap items-center gap-2 dashboard-card" style={{ animationDelay: "0.1s" }}>
            {memberships.map((membership) => {
              const isActive = String(membership.messId?._id) === String(selectedMessId);
              return (
                <button
                  key={membership._id}
                  onClick={() => setSelectedMessId(membership.messId?._id)}
                  className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold tracking-wide transition-all duration-200 ${
                    isActive
                      ? "filter-chip-active"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  <span className="text-base">{membership.role === "MANAGER" ? "👑" : "👤"}</span>
                  {membership.messId?.name}
                </button>
              );
            })}
          </div>

          {/* ─── Compose Button / Form (Managers) ─── */}
          {selectedMembership?.role === "MANAGER" && (
            <div className="dashboard-card" style={{ animationDelay: "0.15s" }}>
              {!showCompose ? (
                <button
                  onClick={() => setShowCompose(true)}
                  className="group flex w-full items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50/50 py-5 text-sm font-bold text-slate-600 transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-400 hover:bg-brand-50/50 hover:text-brand-700 hover:shadow-md pulse-border"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-lg shadow-sm ring-1 ring-slate-200 transition-all group-hover:bg-brand-600 group-hover:text-white group-hover:ring-brand-600">
                    ✍️
                  </span>
                  Compose New Notice
                </button>
              ) : (
                <div className="glass-hover overflow-hidden rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm dashboard-card">
                  <div className="mb-5 flex items-center justify-between">
                    <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900">
                      <span>✍️</span> New Notice
                    </h3>
                    <button
                      onClick={() => setShowCompose(false)}
                      className="rounded-lg p-1.5 text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-600"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">Title</label>
                      <input
                        className="search-glow w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm font-medium transition-all placeholder:text-slate-400 focus:border-brand-300 focus:bg-white"
                        placeholder="Notice title…"
                        value={form.title}
                        onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                      />
                    </div>
                    <div>
                      <div className="mb-1.5 flex items-center justify-between">
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">Body</label>
                        <span className="text-[11px] font-medium text-slate-400">{form.body.length} chars</span>
                      </div>
                      <textarea
                        className="search-glow min-h-32 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm transition-all placeholder:text-slate-400 focus:border-brand-300 focus:bg-white"
                        placeholder="Write the notice content here…"
                        value={form.body}
                        onChange={(e) => setForm((p) => ({ ...p, body: e.target.value }))}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      {/* Toggle switch for pin */}
                      <label className="flex cursor-pointer items-center gap-3">
                        <div className="relative">
                          <input
                            type="checkbox"
                            className="sr-only"
                            checked={form.pinned}
                            onChange={(e) => setForm((p) => ({ ...p, pinned: e.target.checked }))}
                          />
                          <div className={`h-6 w-11 rounded-full transition-colors duration-200 ${form.pinned ? "bg-brand-600" : "bg-slate-200"}`} />
                          <div className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${form.pinned ? "translate-x-5" : "translate-x-0"}`} />
                        </div>
                        <span className="text-sm font-medium text-slate-600">📌 Pin this notice</span>
                      </label>
                      <button
                        onClick={createNotice}
                        disabled={saving}
                        className="rounded-xl bg-brand-600 px-6 py-3 text-sm font-bold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-brand-700 hover:shadow-md disabled:opacity-50"
                      >
                        {saving ? "Posting…" : "Post Notice"}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ─── Notices Feed ─── */}
          {loadingNotices ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="skeleton h-4 w-32" />
                    <div className="skeleton h-4 w-16" />
                  </div>
                  <div className="skeleton mb-2 h-3 w-full" />
                  <div className="skeleton h-3 w-3/4" />
                </div>
              ))}
            </div>
          ) : notices.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200/60 bg-white py-16 shadow-sm dashboard-card">
              <div className="mb-4 text-4xl">📝</div>
              <h3 className="text-lg font-bold text-slate-700">No notices yet</h3>
              <p className="mt-1 text-sm text-slate-500">
                {selectedMembership?.role === "MANAGER"
                  ? "Post your first notice to keep everyone informed."
                  : "Your manager hasn't posted any notices yet."}
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Pinned notices */}
              {pinnedNotices.length > 0 && (
                <div className="dashboard-card" style={{ animationDelay: "0.2s" }}>
                  <h3 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400">
                    <span>📌</span> Pinned
                  </h3>
                  <div className="space-y-3">
                    {pinnedNotices.map((notice, idx) => (
                      <NoticeCard
                        key={notice._id}
                        notice={notice}
                        isPinned
                        isManager={selectedMembership?.role === "MANAGER"}
                        onDelete={deleteNotice}
                        delay={0.05 * idx}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Regular notices */}
              {regularNotices.length > 0 && (
                <div className="dashboard-card" style={{ animationDelay: "0.25s" }}>
                  {pinnedNotices.length > 0 && (
                    <h3 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400">
                      <span>💬</span> Recent
                    </h3>
                  )}
                  {/* Timeline */}
                  <div className="relative space-y-4 pl-8 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:rounded-full before:bg-slate-200">
                    {regularNotices.map((notice, idx) => (
                      <div key={notice._id} className="relative dashboard-card" style={{ animationDelay: `${0.05 * idx}s` }}>
                        {/* Timeline dot */}
                        <div className="absolute -left-8 top-5 flex h-6 w-6 items-center justify-center">
                          <div className="h-2.5 w-2.5 rounded-full bg-brand-500 ring-4 ring-white" />
                        </div>
                        <NoticeCard
                          notice={notice}
                          isManager={selectedMembership?.role === "MANAGER"}
                          onDelete={deleteNotice}
                          delay={0}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </Layout>
  );
}

/* ── Notice Card Sub-component ── */
function NoticeCard({ notice, isPinned = false, isManager, onDelete, delay = 0 }) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div
      className={`glass-hover group overflow-hidden rounded-2xl border bg-white p-5 shadow-sm transition-all duration-300 hover:shadow-md ${
        isPinned
          ? "border-amber-200/60 ring-1 ring-inset ring-amber-100/50"
          : "border-slate-200/60"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h3 className="text-base font-bold text-slate-900 tracking-tight">{notice.title}</h3>
            {isPinned && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-600 ring-1 ring-inset ring-amber-200/60">
                📌 Pinned
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-50 text-[10px] font-bold text-brand-700">
              {notice.createdBy?.name?.charAt(0)?.toUpperCase() || "M"}
            </span>
            <span className="font-medium text-slate-500">{notice.createdBy?.name || "Manager"}</span>
            <span className="text-slate-300">•</span>
            <span>{timeAgo(notice.createdAt)}</span>
          </div>
        </div>
        {isManager && (
          <div className="relative">
            {!confirmDelete ? (
              <button
                onClick={() => setConfirmDelete(true)}
                className="rounded-lg border border-slate-200 p-2 text-slate-400 opacity-0 transition-all duration-200 group-hover:opacity-100 hover:border-red-200 hover:bg-red-50 hover:text-red-500"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                </svg>
              </button>
            ) : (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => { onDelete(notice._id); setConfirmDelete(false); }}
                  className="rounded-lg bg-red-500 px-3 py-1.5 text-[11px] font-bold text-white transition-all hover:bg-red-600"
                >
                  Delete
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-[11px] font-bold text-slate-500 transition-all hover:bg-slate-50"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-600">{notice.body}</p>
    </div>
  );
}
