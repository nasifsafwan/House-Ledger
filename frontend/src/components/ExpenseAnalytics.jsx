import { useEffect, useState, useCallback, useRef } from "react";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  PointElement,
  LineElement,
  Filler,
} from "chart.js";
import { Doughnut, Bar } from "react-chartjs-2";
import { AnalyticsAPI } from "../api/analytics";

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title, PointElement, LineElement, Filler);

const CATEGORY_COLORS = {
  Food: { solid: "#f97316", light: "rgba(249,115,22,0.15)" },
  Rent: { solid: "#6366f1", light: "rgba(99,102,241,0.15)" },
  Utilities: { solid: "#06b6d4", light: "rgba(6,182,212,0.15)" },
  Transport: { solid: "#eab308", light: "rgba(234,179,8,0.15)" },
  Shopping: { solid: "#ec4899", light: "rgba(236,72,153,0.15)" },
  Entertainment: { solid: "#8b5cf6", light: "rgba(139,92,246,0.15)" },
  Others: { solid: "#64748b", light: "rgba(100,116,139,0.15)" },
};

const CATEGORY_EMOJI = {
  Food: "🍔", Rent: "🏠", Utilities: "⚡", Transport: "🚗",
  Shopping: "🛍️", Entertainment: "🎬", Others: "📦",
};

const FILTER_OPTIONS = [
  { label: "This Month", value: "this", icon: "📅" },
  { label: "Last Month", value: "last", icon: "⏮️" },
  { label: "6 Months", value: "6months", icon: "📊" },
  { label: "Custom", value: "custom", icon: "🔧" },
];

function getDateRange(filter) {
  const now = new Date();
  if (filter === "this") {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return { startDate: fmt(start), endDate: fmt(end) };
  }
  if (filter === "last") {
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const end = new Date(now.getFullYear(), now.getMonth(), 0);
    return { startDate: fmt(start), endDate: fmt(end) };
  }
  if (filter === "6months") {
    const start = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return { startDate: fmt(start), endDate: fmt(end) };
  }
  return {};
}

function fmt(d) {
  return d.toISOString().slice(0, 10);
}

/* ── Center text plugin for doughnut ── */
const centerTextPlugin = {
  id: "centerText",
  beforeDraw(chart) {
    if (chart.config.type !== "doughnut") return;
    const { ctx, width, height } = chart;
    const total = chart.config.data.datasets[0].data.reduce((a, b) => a + b, 0);
    if (!total) return;
    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const cx = width / 2;
    const cy = height / 2 - 4;
    ctx.font = "bold 22px Inter, system-ui, sans-serif";
    ctx.fillStyle = "#0f172a";
    ctx.fillText(`${Math.round(total)}৳`, cx, cy);
    ctx.font = "600 11px Inter, system-ui, sans-serif";
    ctx.fillStyle = "#94a3b8";
    ctx.fillText("TOTAL", cx, cy + 20);
    ctx.restore();
  },
};

ChartJS.register(centerTextPlugin);

export default function ExpenseAnalytics({ type = "personal", messId = null, refreshKey = 0, hideDetails = false }) {
  const [filter, setFilter] = useState("this");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const doughnutRef = useRef(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      let params = {};
      if (filter === "custom") {
        if (customStart) params.startDate = customStart;
        if (customEnd) params.endDate = customEnd;
      } else {
        params = getDateRange(filter);
      }
      const res =
        type === "personal"
          ? await AnalyticsAPI.personal(params)
          : await AnalyticsAPI.mess(messId, params);
      setData(res.data);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [type, messId, filter, customStart, customEnd]);

  useEffect(() => { fetchData(); }, [fetchData, refreshKey]);

  const handleRefresh = () => {
    setSpinning(true);
    fetchData().finally(() => setTimeout(() => setSpinning(false), 600));
  };

  const categories = data?.categories || [];
  const monthly = data?.monthly || [];

  const getColor = (cat) => CATEGORY_COLORS[cat] || { solid: "#94a3b8", light: "rgba(148,163,184,0.15)" };

  const doughnutData = {
    labels: categories.map((c) => c.category),
    datasets: [
      {
        data: categories.map((c) => c.total),
        backgroundColor: categories.map((c) => getColor(c.category).solid),
        hoverBackgroundColor: categories.map((c) => getColor(c.category).solid),
        borderWidth: 3,
        borderColor: "#ffffff",
        hoverOffset: 8,
        hoverBorderWidth: 0,
      },
    ],
  };

  const barData = {
    labels: monthly.map((m) => m.month),
    datasets: [
      {
        label: "Spending",
        data: monthly.map((m) => m.total),
        backgroundColor: (ctx) => {
          const chart = ctx.chart;
          const { ctx: canvasCtx, chartArea } = chart;
          if (!chartArea) return "rgba(99,102,241,0.7)";
          const gradient = canvasCtx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
          gradient.addColorStop(0, "rgba(99,102,241,0.4)");
          gradient.addColorStop(1, "rgba(139,92,246,0.9)");
          return gradient;
        },
        hoverBackgroundColor: "rgba(99,102,241,0.95)",
        borderColor: "transparent",
        borderWidth: 0,
        borderRadius: 8,
        borderSkipped: false,
      },
    ],
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 800,
      easing: "easeOutQuart",
    },
    plugins: {
      legend: { display: false },
      title: { display: false },
      tooltip: {
        backgroundColor: "rgba(15,23,42,0.9)",
        titleFont: { size: 13, weight: "bold", family: "Inter" },
        bodyFont: { size: 12, family: "Inter" },
        padding: 12,
        cornerRadius: 10,
        displayColors: false,
        callbacks: {
          title: (items) => `📅 ${items[0].label}`,
          label: (item) => `Spent: ${item.formattedValue}৳`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { font: { size: 11, family: "Inter", weight: "600" }, color: "#94a3b8" },
        grid: { color: "rgba(241,245,249,0.8)", drawBorder: false },
        border: { display: false },
      },
      x: {
        ticks: { font: { size: 11, family: "Inter", weight: "600" }, color: "#94a3b8" },
        grid: { display: false },
        border: { display: false },
      },
    },
    onHover: (event, elements) => {
      event.native.target.style.cursor = elements.length > 0 ? "pointer" : "default";
    },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      animateRotate: true,
      animateScale: true,
      duration: 1000,
      easing: "easeOutQuart",
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "rgba(15,23,42,0.9)",
        titleFont: { size: 13, weight: "bold", family: "Inter" },
        bodyFont: { size: 12, family: "Inter" },
        padding: 12,
        cornerRadius: 10,
        displayColors: true,
        boxWidth: 12,
        boxHeight: 12,
        boxPadding: 6,
        callbacks: {
          title: (items) => {
            const cat = items[0].label;
            return `${CATEGORY_EMOJI[cat] || "📦"} ${cat}`;
          },
          label: (item) => {
            const total = item.dataset.data.reduce((a, b) => a + b, 0);
            const pct = total > 0 ? Math.round((item.raw / total) * 100) : 0;
            return `${item.formattedValue}৳ (${pct}%)`;
          },
        },
      },
    },
    cutout: "68%",
    onHover: (event, elements) => {
      event.native.target.style.cursor = elements.length > 0 ? "pointer" : "default";
    },
  };

  return (
    <div className="space-y-5">
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2">
        {FILTER_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setFilter(opt.value)}
            className={`flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-bold tracking-wide transition-all duration-200 ${
              filter === opt.value
                ? "filter-chip-active"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <span className="text-sm">{opt.icon}</span>
            {opt.label}
          </button>
        ))}
        <button
          onClick={handleRefresh}
          className="ml-auto flex items-center gap-1.5 rounded-xl bg-slate-100 px-3.5 py-2.5 text-xs font-bold text-slate-600 transition-all hover:bg-slate-200"
          title="Refresh data"
        >
          <svg
            className={`transition-transform duration-500 ${spinning ? "animate-spin" : ""}`}
            xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182" />
          </svg>
          Refresh
        </button>
      </div>

      {filter === "custom" && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200/60 bg-slate-50/50 p-4">
          <input
            type="date"
            value={customStart}
            onChange={(e) => setCustomStart(e.target.value)}
            className="search-glow rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium shadow-sm focus:border-brand-300"
          />
          <span className="text-sm font-semibold text-slate-400">to</span>
          <input
            type="date"
            value={customEnd}
            onChange={(e) => setCustomEnd(e.target.value)}
            className="search-glow rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium shadow-sm focus:border-brand-300"
          />
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-12 text-slate-400">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-brand-600" />
          <p className="text-sm font-semibold">Loading analytics…</p>
        </div>
      ) : !data || (categories.length === 0 && monthly.length === 0) ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 py-14 text-center">
          <div className="mb-3 text-4xl">📭</div>
          <p className="text-sm font-semibold text-slate-500">No expense data found</p>
          <p className="mt-1 text-xs text-slate-400">Try a different time period</p>
        </div>
      ) : (
        <>
          {/* Grand total */}
          <div className="flex items-center justify-between rounded-2xl bg-gradient-to-r from-brand-50 via-slate-50 to-brand-50 p-5 ring-1 ring-inset ring-brand-100/50">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-lg shadow-sm ring-1 ring-slate-200/60">💰</span>
              <span className="text-sm font-bold text-slate-600">Total Spending</span>
            </div>
            <span className="text-2xl font-extrabold text-slate-900">{data.grandTotal}৳</span>
          </div>

          {/* Charts grid */}
          <div className="grid gap-5 lg:grid-cols-2">
            {/* Doughnut */}
            <div className="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
              <h3 className="mb-5 flex items-center gap-2 text-sm font-bold text-slate-700">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-sm">🍩</span>
                Category Breakdown
              </h3>
              <div className="mx-auto" style={{ height: 280, maxWidth: 280 }}>
                <Doughnut ref={doughnutRef} data={doughnutData} options={doughnutOptions} />
              </div>

              {/* Custom legend */}
              <div className="mt-5 flex flex-wrap justify-center gap-2">
                {categories.map((c) => {
                  const total = categories.reduce((s, x) => s + x.total, 0);
                  const pct = total > 0 ? Math.round((c.total / total) * 100) : 0;
                  return (
                    <div
                      key={c.category}
                      className="group flex items-center gap-2 rounded-lg px-3 py-1.5 transition-all hover:bg-slate-50 cursor-default"
                    >
                      <span
                        className="inline-block h-2.5 w-2.5 rounded-full shadow-sm ring-2 ring-white transition-transform group-hover:scale-125"
                        style={{ backgroundColor: getColor(c.category).solid }}
                      />
                      <span className="text-xs font-semibold text-slate-600">{CATEGORY_EMOJI[c.category] || "📦"} {c.category}</span>
                      <span className="text-[10px] font-bold text-slate-400">{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bar */}
            <div className="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
              <h3 className="mb-5 flex items-center gap-2 text-sm font-bold text-slate-700">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-50 text-sm">📊</span>
                Monthly Trend
              </h3>
              <div style={{ height: 280 }}>
                <Bar data={barData} options={barOptions} />
              </div>
            </div>
          </div>

          {/* Category breakdown list */}
          {!hideDetails && (
            <div className="space-y-2">
              {categories.map((c) => {
                const total = categories.reduce((s, x) => s + x.total, 0);
                const pct = total > 0 ? Math.round((c.total / total) * 100) : 0;
                return (
                  <div
                    key={c.category}
                    className="group flex items-center justify-between rounded-xl bg-slate-50/80 px-4 py-3 transition-all hover:bg-slate-100/80"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-sm shadow-sm ring-1 ring-inset ring-slate-100"
                        style={{ backgroundColor: getColor(c.category).light }}
                      >
                        {CATEGORY_EMOJI[c.category] || "📦"}
                      </span>
                      <span className="text-sm font-bold text-slate-700">{c.category}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="rounded-md bg-white px-2 py-0.5 text-[11px] font-bold text-slate-500 shadow-sm ring-1 ring-slate-100">{pct}%</span>
                      <span className="text-sm font-extrabold text-slate-900">{c.total}৳</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
