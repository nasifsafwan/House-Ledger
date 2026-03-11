import { useEffect, useState, useCallback } from "react";
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
} from "chart.js";
import { Doughnut, Bar } from "react-chartjs-2";
import { AnalyticsAPI } from "../api/analytics";

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

const CATEGORY_COLORS = {
    Food: "#f97316",
    Rent: "#6366f1",
    Utilities: "#06b6d4",
    Transport: "#eab308",
    Shopping: "#ec4899",
    Entertainment: "#8b5cf6",
    Others: "#64748b",
};

const FILTER_OPTIONS = [
    { label: "This Month", value: "this" },
    { label: "Last Month", value: "last" },
    { label: "Last 6 Months", value: "6months" },
    { label: "Custom", value: "custom" },
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

export default function ExpenseAnalytics({ type = "personal", messId = null, refreshKey = 0 }) {
    const [filter, setFilter] = useState("this");
    const [customStart, setCustomStart] = useState("");
    const [customEnd, setCustomEnd] = useState("");
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);

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

    useEffect(() => {
        fetchData();
    }, [fetchData, refreshKey]);

    const categories = data?.categories || [];
    const monthly = data?.monthly || [];

    const doughnutData = {
        labels: categories.map((c) => c.category),
        datasets: [
            {
                data: categories.map((c) => c.total),
                backgroundColor: categories.map((c) => CATEGORY_COLORS[c.category] || "#94a3b8"),
                borderWidth: 2,
                borderColor: "#fff",
                hoverOffset: 6,
            },
        ],
    };

    const barData = {
        labels: monthly.map((m) => m.month),
        datasets: [
            {
                label: "Spending",
                data: monthly.map((m) => m.total),
                backgroundColor: "rgba(99, 102, 241, 0.7)", // Indigo 500
                borderColor: "#4f46e5", // Indigo 600
                borderWidth: 1,
                borderRadius: 6,
            },
        ],
    };

    const barOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            title: { display: false },
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: { font: { size: 11 } },
                grid: { color: "#f1f5f9" },
            },
            x: {
                ticks: { font: { size: 11 } },
                grid: { display: false },
            },
        },
    };

    const doughnutOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: "bottom",
                labels: { padding: 16, usePointStyle: true, pointStyleWidth: 10, font: { size: 12 } },
            },
        },
        cutout: "60%",
    };

    return (
        <div className="space-y-5">
            {/* Filter bar */}
            <div className="flex flex-wrap items-center gap-2">
                {FILTER_OPTIONS.map((opt) => (
                    <button
                        key={opt.value}
                        onClick={() => setFilter(opt.value)}
                        className={`rounded-lg px-3.5 py-2 text-xs font-semibold transition-all ${filter === opt.value
                            ? "bg-brand-600 text-white shadow-sm"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                            }`}
                    >
                        {opt.label}
                    </button>
                ))}
            </div>

            {filter === "custom" && (
                <div className="flex flex-wrap items-center gap-3">
                    <input
                        type="date"
                        value={customStart}
                        onChange={(e) => setCustomStart(e.target.value)}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                    />
                    <span className="text-sm text-slate-400">to</span>
                    <input
                        type="date"
                        value={customEnd}
                        onChange={(e) => setCustomEnd(e.target.value)}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                    />
                </div>
            )}

            {loading ? (
                <div className="py-8 text-center text-sm text-slate-400">Loading analytics…</div>
            ) : !data || (categories.length === 0 && monthly.length === 0) ? (
                <div className="rounded-xl border border-dashed border-slate-200 py-10 text-center text-sm text-slate-400">
                    No expense data found for this period.
                </div>
            ) : (
                <>
                    {/* Grand total */}
                    <div className="flex items-center justify-between rounded-xl bg-gradient-to-r from-brand-50 to-slate-50 p-4">
                        <span className="text-sm font-medium text-slate-600">Total Spending</span>
                        <span className="text-xl font-bold text-slate-900">{data.grandTotal}৳</span>
                    </div>

                    {/* Charts grid */}
                    <div className="grid gap-6 lg:grid-cols-2">
                        {/* Doughnut */}
                        <div className="rounded-xl border border-slate-200/60 bg-white p-5">
                            <h3 className="mb-4 text-sm font-semibold text-slate-700">Category Breakdown</h3>
                            <div className="mx-auto" style={{ height: 260, maxWidth: 300 }}>
                                <Doughnut data={doughnutData} options={doughnutOptions} />
                            </div>
                        </div>

                        {/* Bar */}
                        <div className="rounded-xl border border-slate-200/60 bg-white p-5">
                            <h3 className="mb-4 text-sm font-semibold text-slate-700">Monthly Trend</h3>
                            <div style={{ height: 260 }}>
                                <Bar data={barData} options={barOptions} />
                            </div>
                        </div>
                    </div>

                    {/* Category list */}
                    <div className="space-y-2">
                        {categories.map((c) => (
                            <div
                                key={c.category}
                                className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-2.5"
                            >
                                <div className="flex items-center gap-2.5">
                                    <span
                                        className="inline-block h-3 w-3 rounded-full"
                                        style={{ backgroundColor: CATEGORY_COLORS[c.category] || "#94a3b8" }}
                                    />
                                    <span className="text-sm font-medium text-slate-700">{c.category}</span>
                                </div>
                                <span className="text-sm font-semibold text-slate-900">{c.total}৳</span>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
