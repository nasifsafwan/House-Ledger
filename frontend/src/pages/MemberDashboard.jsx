import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Layout from "../components/Layout";
import Card from "../components/Card";
import ExpenseAnalytics from "../components/ExpenseAnalytics";
import { MessAPI } from "../api/mess";
import { PaymentsAPI } from "../api/payments";
import { currentMonthKey } from "../utils/monthKey";
import { authStore } from "../store/authStore";

export default function MemberDashboard() {
  const { messId } = useParams();
  const user = authStore.getUser();
  const [monthKey, setMonthKey] = useState(currentMonthKey());
  const [data, setData] = useState(null);
  const [settlements, setSettlements] = useState([]);
  const [payDrafts, setPayDrafts] = useState({});
  const [payingSettlementId, setPayingSettlementId] = useState("");
  const [settlementMsg, setSettlementMsg] = useState("");
  const [err, setErr] = useState("");
  
  const [issues, setIssues] = useState([]);
  const [issueText, setIssueText] = useState("");
  const [savingIssue, setSavingIssue] = useState(false);

  const load = async () => {
    setErr("");
    try {
      const [res, st, iss] = await Promise.all([
        MessAPI.memberSummary(messId, monthKey),
        MessAPI.listSettlements(messId, monthKey),
        MessAPI.listIssues(messId),
      ]);
      setData(res.data);
      setSettlements(st.data.settlements || []);
      setIssues(iss.data.issues || []);
    } catch (e) {
      setErr(e?.response?.data?.message || "Failed to load summary");
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messId, monthKey]);

  const markPaid = async () => {
    setErr("");
    try {
      await PaymentsAPI.selfPaid(messId, { monthKey });
      await load();
    } catch (e) {
      setErr(e?.response?.data?.message || "Failed to mark paid");
    }
  };

  const isPaid = data?.paymentStatus === "PAID";
  const isPending = data?.paymentStatus === "PENDING";
  const displayDue = isPaid ? 0 : (data?.adjustedDue ?? data?.totalDue ?? 0);

  const myPayableSettlements = settlements.filter(
    (s) =>
      String(s?.toUserId?._id || s?.toUserId) === String(user?.id || user?._id) &&
      Number(s?.remainingAmount || 0) > 0
  );

  const paySettlement = async (settlementId) => {
    const amount = Number(payDrafts[settlementId] || "");
    if (Number.isNaN(amount) || amount <= 0) {
      setErr("Repayment amount must be greater than 0");
      return;
    }

    setErr("");
    setSettlementMsg("");
    setPayingSettlementId(settlementId);
    try {
      await MessAPI.paySettlement(messId, settlementId, { amount });
      setPayDrafts((prev) => ({ ...prev, [settlementId]: "" }));
      setSettlementMsg("Repayment added");
      await load();
    } catch (e) {
      setErr(e?.response?.data?.message || "Failed to add repayment");
    } finally {
      setPayingSettlementId("");
    }
  };

  const submitIssue = async () => {
    if (!issueText.trim() || issueText.length < 5) {
      setErr("Issue description must be at least 5 characters");
      return;
    }
    setErr("");
    setSavingIssue(true);
    try {
      await MessAPI.createIssue(messId, { description: issueText });
      setIssueText("");
      await load();
    } catch (e) {
      setErr(e?.response?.data?.message || "Failed to submit issue");
    } finally {
      setSavingIssue(false);
    }
  };

  const deleteIssue = async (issueId) => {
    if (!confirm("Delete this issue?")) return;
    try {
      await MessAPI.deleteIssue(messId, issueId);
      await load();
    } catch (e) {
      setErr(e?.response?.data?.message || "Failed to delete issue");
    }
  };

  return (
    <Layout>
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Member Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">Your monthly summary and meal log</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-slate-600">Month:</label>
          <input
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium shadow-sm"
            type="month"
            value={monthKey}
            onChange={(e) => setMonthKey(e.target.value)}
          />
          <button
            onClick={load}
            className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-600 transition-all hover:bg-slate-200"
            title="Refresh Data"
          >
            ↻ Refresh
          </button>
        </div>
      </div>

      {err ? (
        <div className="mb-5 flex items-center gap-2 rounded-xl bg-danger-50 px-4 py-3 text-sm font-medium text-danger-600">
          <span>⚠️</span> {err}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Payment status card */}
        <Card
          icon={isPaid ? "✅" : isPending ? "⏳" : "💸"}
          title="Payment Status"
          subtitle={monthKey}
        >
          {data ? (
            <div>
              <div
                className={`mb-4 flex items-center justify-between rounded-xl p-4 ${
                  isPaid ? "bg-success-50" : isPending ? "bg-amber-50" : "bg-warn-50"
                }`}
              >
                <div>
                  <div
                    className={`text-sm font-medium ${
                      isPaid ? "text-success-600" : isPending ? "text-amber-600" : "text-warn-600"
                    }`}
                  >
                    {isPaid ? "Payment confirmed" : isPending ? "Pending approval" : "Payment due"}
                  </div>
                  <div
                    className={`mt-1 text-2xl font-bold ${
                      isPaid ? "text-success-600" : "text-slate-900"
                    }`}
                  >
                    {displayDue}৳
                    {isPaid ? (
                      <span className="ml-2 text-sm font-normal text-success-600">All clear!</span>
                    ) : isPending ? (
                      <span className="ml-2 text-sm font-normal text-amber-600">waiting</span>
                    ) : (
                      <span className="ml-2 text-sm font-normal text-slate-400">due</span>
                    )}
                  </div>
                </div>
                <span className="text-3xl">{isPaid ? "🎉" : isPending ? "🤔" : "⏳"}</span>
              </div>

              {!isPaid && !isPending ? (
                <button
                  onClick={markPaid}
                  className="w-full rounded-xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-brand-700"
                >
                  Mark myself as paid
                </button>
              ) : null}
            </div>
          ) : (
            <div className="py-6 text-center text-sm text-slate-400">Loading…</div>
          )}
        </Card>

        {/* Bill breakdown */}
        <Card icon="📋" title="Detailed Breakdown" subtitle="Your cost this month">
          {data ? (
            <div className="space-y-1">
              <DetailRow label="🏠 Rent" value={data.rent} />
              <DetailRow label="🧾 Bill share" value={data.bills.share} />
              <div className="pl-5 text-xs text-slate-400">
                Total bills: {data.bills.totalBills}৳ ÷ {data.bills.activeMembers} members
              </div>
              <DetailRow label={`🍛 Meals (${data.meals.mealCount} × ${data.meals.unitPrice}৳)`} value={data.meals.mealCost} />
              <DetailRow label="🤝 Settlement owed" value={data.settlements?.owed ?? 0} />
              <DetailRow label="💳 Settlement receivable" value={data.settlements?.receivable ?? 0} />
              <div className="border-t border-slate-100 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-900">Total</span>
                  <span className="text-sm font-bold text-slate-900">{data.totalDue}৳</span>
                </div>
                <div className="mt-1 flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-900">Adjusted Total</span>
                  <span className="text-sm font-bold text-slate-900">{data.adjustedDue ?? data.totalDue}৳</span>
                </div>
              </div>
              {isPaid ? (
                <div className="mt-2 flex items-center justify-between rounded-lg bg-success-50 px-3 py-2">
                  <span className="text-sm font-medium text-success-600">Amount due</span>
                  <span className="text-sm font-bold text-success-600">0৳</span>
                </div>
              ) : (
                <div className="mt-2 flex items-center justify-between rounded-lg bg-danger-50 px-3 py-2">
                  <span className="text-sm font-medium text-danger-600">Amount due</span>
                  <span className="text-sm font-bold text-danger-600">{data.adjustedDue ?? data.totalDue}৳</span>
                </div>
              )}
            </div>
          ) : (
            <div className="py-6 text-center text-sm text-slate-400">Loading…</div>
          )}
        </Card>
      </div>

      {/* Meal log */}
      <div className="mt-6">
        <Card icon="🍽️" title="Quick Meal Log" subtitle="Log your meals for today">
          <MealQuickLog messId={messId} onSaved={load} />
        </Card>
      </div>

      {/* Expense Analytics */}
      <div className="mt-6">
        <Card icon="📊" title="Mess Analytics" subtitle={`Spending insights for this mess`}>
          <ExpenseAnalytics type="mess" messId={messId} />
        </Card>
      </div>

      <div className="mt-6">
        <Card icon="🤝" title="Settlement Repayments" subtitle={`Pending settlements for ${monthKey}`}>
          {settlementMsg ? <div className="mb-3 text-sm text-success-600">{settlementMsg}</div> : null}
          {myPayableSettlements.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-200 p-4 text-sm text-slate-500">
              No pending settlements to repay.
            </div>
          ) : (
            <div className="space-y-2">
              {myPayableSettlements.map((s) => (
                <div key={s._id} className="rounded-lg border border-slate-200 p-3">
                  <div className="text-sm">
                    You owe <b>{s.fromUserId?.name}</b> • Remaining: <b>{s.remainingAmount}৳</b> • Reason: {s.reason}
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <input
                      className="w-36 rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={payDrafts[s._id] ?? ""}
                      onChange={(e) => setPayDrafts((prev) => ({ ...prev, [s._id]: e.target.value }))}
                      placeholder="Amount"
                      disabled={payingSettlementId === s._id}
                    />
                    <button
                      className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700 disabled:opacity-60"
                      onClick={() => paySettlement(s._id)}
                      disabled={payingSettlementId === s._id}
                    >
                      {payingSettlementId === s._id ? "Saving..." : "Add repayment"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Report Issue */}
      <div className="mt-6">
        <Card icon="💬" title="Raise an Issue" subtitle="Report a problem to the manager">
          <div className="relative">
            <textarea
              className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-sm transition-all focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              rows="3"
              placeholder="What's on your mind? e.g. The water filter is broken..."
              value={issueText}
              onChange={(e) => setIssueText(e.target.value)}
              disabled={savingIssue}
            />
            <div className="mt-2 flex justify-end">
              <button
                onClick={submitIssue}
                disabled={savingIssue || issueText.length < 5}
                className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-brand-700 disabled:opacity-50"
              >
                {savingIssue ? "Sending..." : "Submit Issue"}
              </button>
            </div>
          </div>

          {issues.length > 0 && (
            <div className="mt-6 space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Your Recent Issues</h4>
              {issues.map(iss => (
                <div key={iss._id} className="group relative overflow-hidden rounded-xl border border-slate-200/60 bg-white p-4 transition-all hover:shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <p className="whitespace-pre-wrap text-sm text-slate-700">{iss.description}</p>
                    <div className="flex flex-shrink-0 flex-col items-end gap-2">
                      <span className={`inline-flex items-center rounded-lg px-2 py-1 text-[10px] font-bold tracking-wide uppercase ${
                        iss.status === 'RESOLVED' ? 'bg-success-50 text-success-600' : 'bg-warn-50 text-warn-600'
                      }`}>
                        {iss.status}
                      </span>
                      <button
                        onClick={() => deleteIssue(iss._id)}
                        className="rounded p-1 text-slate-400 opacity-0 transition-opacity hover:bg-danger-50 hover:text-danger-600 group-hover:opacity-100"
                        title="Delete Issue"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <div className="mt-3 text-[10px] font-medium text-slate-400">
                    Submitted on {new Date(iss.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </Layout>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="text-sm font-semibold text-slate-700">{value}৳</span>
    </div>
  );
}

function MealQuickLog({ messId, onSaved }) {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [mealsCount, setMealsCount] = useState(0);
  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setMsg("");
    setSaving(true);
    try {
      await MessAPI.logMeal(messId, { date, mealsCount: Number(mealsCount) });
      setMsg("Saved ✅");
      onSaved?.();
    } catch {
      setMsg("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const inputCls = "w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2.5 text-sm transition-all placeholder:text-slate-400 focus:bg-white";

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Date</label>
          <input
            className={inputCls}
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Meals count</label>
          <input
            className={inputCls}
            type="number"
            min="0"
            value={mealsCount}
            onChange={(e) => setMealsCount(e.target.value)}
            placeholder="0"
          />
        </div>
      </div>
      <button
        onClick={save}
        disabled={saving}
        className="w-full rounded-xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-brand-700 disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save Meals"}
      </button>
      {msg ? <div className="text-center text-sm text-slate-500">{msg}</div> : null}
    </div>
  );
}
