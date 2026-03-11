import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import Layout from "../components/Layout";
import Card from "../components/Card";
import ExpenseAnalytics from "../components/ExpenseAnalytics";
import { MessAPI } from "../api/mess";
import { MembersAPI } from "../api/members";
import { PaymentsAPI } from "../api/payments";
import { currentMonthKey } from "../utils/monthKey";
import { authStore } from "../store/authStore";

export default function ManagerDashboard() {
  const { messId } = useParams();
  const user = authStore.getUser();
  const [monthKey, setMonthKey] = useState(currentMonthKey());
  const [summary, setSummary] = useState(null);
  const [members, setMembers] = useState([]);
  const [settlements, setSettlements] = useState([]);
  const [rentDrafts, setRentDrafts] = useState({});
  const [newSettlement, setNewSettlement] = useState({
    toUserId: "",
    amount: "",
    reason: "OTHER",
    note: "",
  });
  const [payDrafts, setPayDrafts] = useState({});
  const [savingRentFor, setSavingRentFor] = useState("");
  const [savingSettlement, setSavingSettlement] = useState(false);
  const [payingSettlementId, setPayingSettlementId] = useState("");
  const [settlementMsg, setSettlementMsg] = useState("");
  const [err, setErr] = useState("");

  const memberByUserId = useMemo(() => {
    const map = new Map();
    for (const m of members) {
      const uid = m?.userId?._id;
      if (uid) map.set(String(uid), m);
    }
    return map;
  }, [members]);

  const load = async () => {
    setErr("");
    try {
      const [s, m, st] = await Promise.all([
        MessAPI.managerSummary(messId, monthKey),
        MembersAPI.list(messId),
        MessAPI.listSettlements(messId, monthKey),
      ]);
      setSummary(s.data);
      const memberList = m.data.members || [];
      setMembers(memberList);
      setSettlements(st.data.settlements || []);

      const nextDrafts = {};
      for (const row of s.data.members || []) {
        const member = memberList.find((item) => String(item?.userId?._id) === String(row?.user?.id));
        if (member?._id) nextDrafts[member._id] = String(row.rent ?? 0);
      }
      setRentDrafts(nextDrafts);
    } catch (e) {
      setErr(e?.response?.data?.message || "Failed to load dashboard");
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messId, monthKey]);

  const markReceived = async (userId, status) => {
    setErr("");
    try {
      await PaymentsAPI.markReceived(messId, userId, { monthKey, status });
      await load();
    } catch (e) {
      setErr(e?.response?.data?.message || "Failed to update payment");
    }
  };

  const saveRent = async (memberId) => {
    const raw = rentDrafts[memberId];
    const rent = Number(raw);
    if (raw === "" || Number.isNaN(rent) || rent < 0) {
      setErr("Rent must be a valid non-negative number");
      return;
    }
    setErr("");
    setSavingRentFor(memberId);
    try {
      await MembersAPI.setRent(messId, memberId, { rent, effectiveMonthKey: monthKey });
      await load();
    } catch (e) {
      setErr(e?.response?.data?.message || "Failed to update rent");
    } finally {
      setSavingRentFor("");
    }
  };

  const createSettlement = async () => {
    const amount = Number(newSettlement.amount);
    if (!newSettlement.toUserId) {
      setErr("Please select a member for settlement");
      return;
    }
    if (Number.isNaN(amount) || amount <= 0) {
      setErr("Settlement amount must be greater than 0");
      return;
    }

    setErr("");
    setSettlementMsg("");
    setSavingSettlement(true);
    try {
      await MessAPI.createSettlement(messId, {
        monthKey,
        toUserId: newSettlement.toUserId,
        amount,
        reason: newSettlement.reason,
        note: newSettlement.note,
      });
      setNewSettlement({ toUserId: "", amount: "", reason: "OTHER", note: "" });
      setSettlementMsg("Settlement created");
      await load();
    } catch (e) {
      setErr(e?.response?.data?.message || "Failed to create settlement");
    } finally {
      setSavingSettlement(false);
    }
  };

  const addSettlementPayment = async (settlementId) => {
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

  const forceSettle = async (settlementId) => {
    setErr("");
    setSettlementMsg("");
    setPayingSettlementId(settlementId);
    try {
      await MessAPI.settleSettlement(messId, settlementId);
      setSettlementMsg("Settlement marked as settled");
      await load();
    } catch (e) {
      setErr(e?.response?.data?.message || "Failed to settle");
    } finally {
      setPayingSettlementId("");
    }
  };

  return (
    <Layout>
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Manager Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">Overview and member management</p>
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

      {/* Summary cards row */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SumCard label="Total Bills" value={summary?.bills?.totalBills} icon="🧾" />
        <SumCard label="Bill / Member" value={summary?.bills?.share} icon="📊" />
        <SumCard label="Meal Price" value={summary?.unitPrice} icon="🍛" suffix="/meal" />
        <SumCard
          label="Adjusted Collected"
          value={summary?.totals?.adjustedCollected ?? summary?.totals?.collected}
          total={summary?.totals?.adjustedExpected ?? summary?.totals?.expected}
          icon="💰"
        />
      </div>

      {/* Two-column: Quick settings + Bills breakdown */}
      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <Card icon="⚙️" title="Quick Settings" subtitle={`Set for ${monthKey}`}>
          <ManagerQuickSettings messId={messId} monthKey={monthKey} onSaved={load} />
        </Card>

        <Card icon="🧾" title="Bill Breakdown" subtitle="Detailed cost split">
          {summary ? (
            <div className="space-y-3">
              <DetailRow label="Total Bills" value={summary.bills.totalBills} bold />
              <DetailRow label="Active members" value={summary.bills.activeMembers} suffix="" />
              <DetailRow label="Bill share / member" value={summary.bills.share} />
              <DetailRow label="Meal unit price" value={summary.unitPrice} />
              <div className="border-t border-slate-100 pt-3">
                <DetailRow label="Total expected" value={summary.totals.expected} bold />
                <DetailRow label="Total collected" value={summary.totals.collected} highlight={summary.totals.collected >= summary.totals.expected ? "success" : "warn"} />
                <DetailRow label="Adjusted expected" value={summary.totals.adjustedExpected ?? summary.totals.expected} bold />
                <DetailRow label="Adjusted collected" value={summary.totals.adjustedCollected ?? summary.totals.collected} highlight={(summary.totals.adjustedCollected ?? summary.totals.collected) >= (summary.totals.adjustedExpected ?? summary.totals.expected) ? "success" : "warn"} />
              </div>
            </div>
          ) : (
            <div className="py-4 text-center text-sm text-slate-400">Loading…</div>
          )}
        </Card>
      </div>

      {/* Members table */}
      <Card icon="👥" title="Members" subtitle="Payment status & rent management">
        {summary ? (
          <div className="space-y-3">
            {summary.members.map((r) => {
              const member = memberByUserId.get(String(r.user.id));
              const memberId = member?._id;
              const rentValue = memberId ? (rentDrafts[memberId] ?? String(r.rent ?? 0)) : "";
              const isPaid = r.paymentStatus === "PAID";
              const displayDue = isPaid ? 0 : r.totalDue;

              return (
                <div key={r.user.id} className="rounded-xl border border-slate-200/60 bg-white p-4 transition-all hover:shadow-sm">
                  {/* Top row: user info + payment */}
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 text-sm font-bold text-brand-700">
                        {r.user.name?.charAt(0)?.toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900">{r.user.name}</div>
                        <div className="text-xs text-slate-400">{r.user.username}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center rounded-lg px-3 py-1.5 text-xs font-semibold ${isPaid
                        ? "bg-success-50 text-success-600"
                        : "bg-danger-50 text-danger-600"
                        }`}>
                        {isPaid ? "✅ PAID" : "⏳ UNPAID"}
                      </span>
                      {isPaid ? (
                        <button
                          onClick={() => markReceived(r.user.id, "UNPAID")}
                          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-500 transition-all hover:bg-slate-50"
                        >
                          Undo
                        </button>
                      ) : (
                        <button
                          onClick={() => markReceived(r.user.id, "PAID")}
                          className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm transition-all hover:bg-brand-700"
                        >
                          Mark Paid
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Cost details */}
                  <div className="mt-3 grid grid-cols-4 gap-2 rounded-lg bg-slate-50 p-3 text-xs">
                    <div className="text-center">
                      <div className="text-slate-400">Rent</div>
                      <div className="mt-0.5 font-semibold text-slate-700">{r.rent}৳</div>
                    </div>
                    <div className="text-center">
                      <div className="text-slate-400">Meals ({r.mealCount})</div>
                      <div className="mt-0.5 font-semibold text-slate-700">{r.mealCost}৳</div>
                    </div>
                    <div className="text-center">
                      <div className="text-slate-400">Bills</div>
                      <div className="mt-0.5 font-semibold text-slate-700">{r.billShare}৳</div>
                    </div>
                    <div className="text-center">
                      <div className="text-slate-400">Due</div>
                      <div className={`mt-0.5 font-bold ${isPaid ? "text-success-600" : "text-danger-600"}`}>
                        {displayDue}৳
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-slate-500">
                    Settlement adj: +{r.settlements?.owed ?? 0}৳ / -{r.settlements?.receivable ?? 0}৳
                    {" • "}
                    Adjusted due: <b>{isPaid ? 0 : (r.adjustedDue ?? r.totalDue)}৳</b>
                  </div>

                  {/* Rent editor */}
                  <div className="mt-3 flex items-center gap-2">
                    <input
                      className="flex-1 rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm transition-all focus:bg-white"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Rent"
                      value={rentValue}
                      onChange={(e) => {
                        if (!memberId) return;
                        setRentDrafts((prev) => ({ ...prev, [memberId]: e.target.value }));
                      }}
                      disabled={!memberId || savingRentFor === memberId}
                    />
                    <button
                      onClick={() => memberId && saveRent(memberId)}
                      className="whitespace-nowrap rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 transition-all hover:bg-slate-50 disabled:opacity-50"
                      disabled={!memberId || savingRentFor === memberId}
                    >
                      {savingRentFor === memberId ? "Saving…" : "Update Rent"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-8 text-center text-sm text-slate-400">Loading members…</div>
        )}
      </Card>

      <div className="mt-6">
        <Card icon="🤝" title="Settlement Management" subtitle={`Adjustments for ${monthKey}`}>
          <div className="grid gap-3 rounded-xl border border-slate-200/60 bg-slate-50 p-4 md:grid-cols-4">
            <select
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
              value={newSettlement.toUserId}
              onChange={(e) => setNewSettlement((prev) => ({ ...prev, toUserId: e.target.value }))}
            >
              <option value="">Select member</option>
              {members
                .filter((m) => String(m?.userId?._id) !== String(user?.id || user?._id))
                .map((m) => (
                  <option key={m._id} value={m.userId._id}>
                    {m.userId.name}
                  </option>
                ))}
            </select>
            <input
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
              placeholder="Amount"
              type="number"
              min="0.01"
              step="0.01"
              value={newSettlement.amount}
              onChange={(e) => setNewSettlement((prev) => ({ ...prev, amount: e.target.value }))}
            />
            <select
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
              value={newSettlement.reason}
              onChange={(e) => setNewSettlement((prev) => ({ ...prev, reason: e.target.value }))}
            >
              <option value="RENT">Rent</option>
              <option value="BILLS">Bills</option>
              <option value="MEALS">Meals</option>
              <option value="OTHER">Other</option>
            </select>
            <button
              className="rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
              disabled={savingSettlement}
              onClick={createSettlement}
            >
              {savingSettlement ? "Creating..." : "Create"}
            </button>
            <input
              className="md:col-span-4 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
              placeholder="Note (optional)"
              value={newSettlement.note}
              onChange={(e) => setNewSettlement((prev) => ({ ...prev, note: e.target.value }))}
            />
          </div>

          {settlementMsg ? <div className="mt-3 text-sm text-success-600">{settlementMsg}</div> : null}

          <div className="mt-4 space-y-2">
            {settlements.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-200 p-4 text-sm text-slate-500">
                No settlements for this month.
              </div>
            ) : (
              settlements.map((s) => {
                const isSettled = s.status === "SETTLED" || Number(s.remainingAmount) <= 0;
                return (
                  <div key={s._id} className="rounded-lg border border-slate-200 p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="text-sm">
                        <b>{s.toUserId?.name}</b> owes <b>{s.fromUserId?.name}</b>
                        {" • "}Reason: {s.reason}
                        {" • "}Remaining: <b>{s.remainingAmount}৳</b>
                      </div>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium">{s.status}</span>
                    </div>
                    {!isSettled ? (
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <input
                          className="w-36 rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                          type="number"
                          min="0.01"
                          step="0.01"
                          placeholder="Repay amount"
                          value={payDrafts[s._id] ?? ""}
                          onChange={(e) => setPayDrafts((prev) => ({ ...prev, [s._id]: e.target.value }))}
                          disabled={payingSettlementId === s._id}
                        />
                        <button
                          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium"
                          onClick={() => addSettlementPayment(s._id)}
                          disabled={payingSettlementId === s._id}
                        >
                          Add repayment
                        </button>
                        <button
                          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium"
                          onClick={() => forceSettle(s._id)}
                          disabled={payingSettlementId === s._id}
                        >
                          Force settle
                        </button>
                      </div>
                    ) : null}
                  </div>
                );
              })
            )}
          </div>
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

/* ── Helper: summary stat card ── */
function SumCard({ label, value, icon, suffix = "৳", total }) {
  return (
    <div className="rounded-xl border border-slate-200/60 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <span className="text-base">{icon}</span> {label}
      </div>
      <div className="mt-1.5 text-xl font-bold text-slate-900">
        {value ?? "—"}{suffix}
        {total != null ? (
          <span className="ml-1.5 text-sm font-normal text-slate-400">/ {total}৳</span>
        ) : null}
      </div>
    </div>
  );
}

/* ── Helper: detail row ── */
function DetailRow({ label, value, bold, highlight, suffix = "৳" }) {
  const color = highlight === "success" ? "text-success-600" : highlight === "warn" ? "text-warn-600" : "text-slate-700";
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-sm text-slate-500">{label}</span>
      <span className={`text-sm ${bold ? "font-bold" : "font-semibold"} ${color}`}>
        {value ?? "—"}{suffix}
      </span>
    </div>
  );
}

/* ── Quick settings sub-component ── */
function ManagerQuickSettings({ messId, monthKey, onSaved }) {
  const [unitPrice, setUnitPrice] = useState("");
  const [electricity, setElectricity] = useState("");
  const [gas, setGas] = useState("");
  const [water, setWater] = useState("");
  const [internet, setInternet] = useState("");
  const [otherLabel, setOtherLabel] = useState("");
  const [otherAmount, setOtherAmount] = useState("");
  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setMsg("");
    setSaving(true);
    try {
      if (unitPrice !== "") {
        await MessAPI.setMealPrice(messId, { monthKey, unitPrice: Number(unitPrice) });
      }

      const items = [];
      if (electricity !== "") items.push({ type: "ELECTRICITY", amount: Number(electricity) });
      if (gas !== "") items.push({ type: "GAS", amount: Number(gas) });
      if (water !== "") items.push({ type: "WATER", amount: Number(water) });
      if (internet !== "") items.push({ type: "INTERNET", amount: Number(internet) });
      if (otherAmount !== "") items.push({ type: "OTHER", label: otherLabel || "Other", amount: Number(otherAmount) });

      if (items.length > 0) {
        await MessAPI.setBills(messId, { monthKey, items });
      }

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
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-500">Meal unit price (৳)</label>
        <input className={inputCls} placeholder="e.g. 60" value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Electricity</label>
          <input className={inputCls} placeholder="৳" value={electricity} onChange={(e) => setElectricity(e.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Gas</label>
          <input className={inputCls} placeholder="৳" value={gas} onChange={(e) => setGas(e.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Water</label>
          <input className={inputCls} placeholder="৳" value={water} onChange={(e) => setWater(e.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Internet</label>
          <input className={inputCls} placeholder="৳" value={internet} onChange={(e) => setInternet(e.target.value)} />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Other label</label>
          <input className={inputCls} placeholder="e.g. Cleaning" value={otherLabel} onChange={(e) => setOtherLabel(e.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Other amount</label>
          <input className={inputCls} placeholder="৳" value={otherAmount} onChange={(e) => setOtherAmount(e.target.value)} />
        </div>
      </div>

      <button
        onClick={save}
        disabled={saving}
        className="w-full rounded-xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-brand-700 disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save Settings"}
      </button>

      {msg ? <div className="text-center text-sm text-slate-500">{msg}</div> : null}
    </div>
  );
}
