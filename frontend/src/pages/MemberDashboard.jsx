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

  const load = async () => {
    setErr("");
    try {
      const [res, st] = await Promise.all([
        MessAPI.memberSummary(messId, monthKey),
        MessAPI.listSettlements(messId, monthKey),
      ]);
      setData(res.data);
      setSettlements(st.data.settlements || []);
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
          icon={isPaid ? "✅" : "💸"}
          title="Payment Status"
          subtitle={monthKey}
        >
          {data ? (
            <div>
              <div className={`mb-4 flex items-center justify-between rounded-xl p-4 ${isPaid ? "bg-success-50" : "bg-warn-50"
                }`}>
                <div>
                  <div className={`text-sm font-medium ${isPaid ? "text-success-600" : "text-warn-600"}`}>
                    {isPaid ? "Payment confirmed" : "Payment pending"}
                  </div>
                  <div className={`mt-1 text-2xl font-bold ${isPaid ? "text-success-600" : "text-slate-900"}`}>
                    {displayDue}৳
                    {isPaid ? (
                      <span className="ml-2 text-sm font-normal text-success-600">All clear!</span>
                    ) : (
                      <span className="ml-2 text-sm font-normal text-slate-400">due</span>
                    )}
                  </div>
                </div>
                <span className="text-3xl">{isPaid ? "🎉" : "⏳"}</span>
              </div>

              {!isPaid ? (
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
      {/* Expense Analytics */}
      <div className="mt-6">
        <Card icon="📊" title="Mess Analytics" subtitle={`Spending insights for this mess`}>
          <ExpenseAnalytics type="mess" messId={messId} />
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
