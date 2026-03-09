import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import Card from "../components/Card";
import { MessAPI } from "../api/mess";

export default function SelectMess() {
  const nav = useNavigate();
  const [memberships, setMemberships] = useState([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState(null);

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
  }, []);

  const open = (m) => {
    const messId = m.messId?._id;
    if (!messId) return;
    if (m.role === "MANAGER") nav(`/manager/${messId}`);
    else nav(`/member/${messId}`);
  };

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Your Messes</h1>
        <p className="mt-1 text-sm text-slate-500">Select a mess to view your dashboard</p>
      </div>

      {err ? (
        <div className="mb-4 flex items-center gap-2 rounded-xl bg-danger-50 px-4 py-3 text-sm font-medium text-danger-600">
          <span>⚠️</span> {err}
        </div>
      ) : null}

      {loading ? (
        <div className="py-12 text-center text-slate-400">Loading your messes…</div>
      ) : memberships.length === 0 ? (
        <Card icon="📭" title="No messes yet" subtitle="Create or join a mess to get started">
          <button
            onClick={() => nav("/choose")}
            className="mt-2 w-full rounded-xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-brand-700"
          >
            Create or Join a Mess
          </button>
        </Card>
      ) : (
        <div className="space-y-3">
          {memberships.map((m) => (
            <button
              key={m._id}
              onClick={() => open(m)}
              className="group flex w-full items-center justify-between rounded-2xl border border-slate-200/60 bg-white p-5 text-left shadow-sm transition-all hover:border-brand-200 hover:shadow-md"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-xl transition-colors group-hover:bg-brand-100">
                  {m.role === "MANAGER" ? "👑" : "👤"}
                </div>
                <div>
                  <div className="font-semibold text-slate-900">{m.messId?.name}</div>
                  <div className="mt-0.5 flex items-center gap-2 text-sm text-slate-500">
                    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${m.role === "MANAGER"
                      ? "bg-warn-50 text-warn-600"
                      : "bg-brand-50 text-brand-600"
                      }`}>
                      {m.role}
                    </span>
                    <span className="text-slate-300">•</span>
                    <div
                      className="flex items-center gap-1.5 rounded-md bg-slate-50 px-2 py-0.5 border border-slate-100 transition-colors hover:border-slate-300 hover:bg-slate-100 cursor-pointer"
                      onClick={(e) => handleCopy(e, m.messId?.inviteCode)}
                      title="Copy invite code"
                    >
                      <span className="font-mono text-xs text-slate-600 tracking-wide">{m.messId?.inviteCode}</span>
                      <div className="text-slate-400 flex items-center justify-center transition-colors">
                        {copiedCode === m.messId?.inviteCode ? (
                          <span className="text-emerald-500 font-bold" style={{ fontSize: '10px' }}>✓</span>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <span className="text-slate-300 transition-colors group-hover:text-brand-600">→</span>
            </button>
          ))}

          <button
            onClick={() => nav("/choose")}
            className="w-full rounded-xl border-2 border-dashed border-slate-200 px-4 py-4 text-sm font-medium text-slate-500 transition-all hover:border-brand-300 hover:bg-brand-50 hover:text-brand-600"
          >
            + Create or Join another mess
          </button>
        </div>
      )}
    </Layout>
  );
}