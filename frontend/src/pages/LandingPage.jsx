import { useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authStore } from "../store/authStore";

/* ── Inline SVG icons for features ── */
const icons = {
    expense: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7">
            <path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
    ),
    meal: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7">
            <path d="M18 8h1a4 4 0 0 1 0 8h-1M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8zM6 1v3M10 1v3M14 1v3" />
        </svg>
    ),
    analytics: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7">
            <path d="M18 20V10M12 20V4M6 20v-6" />
        </svg>
    ),
    group: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
    ),
    split: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7">
            <rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><path d="M1 10h22" />
        </svg>
    ),
    secure: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
    ),
};

const features = [
    { icon: icons.expense, title: "Smart Expense Tracking", desc: "Log every expense in seconds. Categorize, tag, and keep a crystal-clear record of where your money goes." },
    { icon: icons.meal, title: "Meal Management", desc: "Track daily meals for every member. Automatically calculate per-head costs so billing is always fair." },
    { icon: icons.analytics, title: "Analytics & Reports", desc: "Beautiful charts and breakdowns. Understand spending patterns and make smarter financial decisions." },
    { icon: icons.group, title: "Multi-Mess Support", desc: "Manage multiple households or groups from a single account. Switch between them effortlessly." },
    { icon: icons.split, title: "Bill Splitting", desc: "Auto-calculate each member's share based on meals eaten. No more spreadsheets or guesswork." },
    { icon: icons.secure, title: "Secure & Reliable", desc: "Your data is encrypted and backed up. Access your accounts anytime, anywhere with confidence." },
];

const steps = [
    { num: "01", title: "Create an Account", desc: "Sign up in under a minute. It's completely free — no credit card required." },
    { num: "02", title: "Create or Join a Mess", desc: "Set up your household group, or join an existing one with a simple code." },
    { num: "03", title: "Start Tracking", desc: "Add expenses, mark meals, and let House Ledger handle the calculations." },
];

/* ── Scroll-reveal hook ── */
function useReveal() {
    const ref = useRef(null);
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const obs = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    el.classList.add("revealed");
                    obs.unobserve(el);
                }
            },
            { threshold: 0.15 }
        );
        obs.observe(el);
        return () => obs.disconnect();
    }, []);
    return ref;
}

function RevealSection({ children, className = "", delay = 0 }) {
    const ref = useReveal();
    return (
        <div
            ref={ref}
            className={`reveal-on-scroll ${className}`}
            style={{ transitionDelay: `${delay}ms` }}
        >
            {children}
        </div>
    );
}

/* ════════════════════════════════════════
   Landing Page
   ════════════════════════════════════════ */
export default function LandingPage() {
    const nav = useNavigate();

    /* If already authenticated, skip to dashboard */
    useEffect(() => {
        if (authStore.getToken()) nav("/dashboard", { replace: true });
    }, [nav]);

    return (
        <div className="landing-page font-sans text-slate-800">
            {/* ─── Navbar ─── */}
            <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-slate-900/70 backdrop-blur-xl">
                <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5">
                    <Link to="/" className="flex items-center gap-2.5 text-lg font-bold tracking-tight text-white">
                        <img src="/logo.png" alt="House Ledger" className="h-9 w-9 rounded-xl object-cover shadow-sm" />
                        <span className="hidden sm:inline">House Ledger</span>
                    </Link>

                    <nav className="hidden items-center gap-8 md:flex">
                        <a href="#features" className="text-sm font-medium text-slate-300 transition-colors hover:text-white">Features</a>
                        <a href="#how-it-works" className="text-sm font-medium text-slate-300 transition-colors hover:text-white">How It Works</a>
                    </nav>

                    <div className="flex items-center gap-3">
                        <Link
                            to="/login"
                            className="rounded-lg border border-white/20 px-4 py-2 text-sm font-medium text-white transition-all hover:border-white/40 hover:bg-white/10"
                        >
                            Log in
                        </Link>
                        <Link
                            to="/register"
                            className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-brand-500/25 transition-all hover:bg-brand-600 hover:shadow-brand-500/40"
                        >
                            Get Started
                        </Link>
                    </div>
                </div>
            </header>

            {/* ─── Hero ─── */}
            <section className="relative flex min-h-[100dvh] items-center overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-brand-700">
                {/* Decorative blobs */}
                <div className="pointer-events-none absolute -left-40 -top-40 h-[600px] w-[600px] rounded-full bg-brand-500/10 blur-[120px]" />
                <div className="pointer-events-none absolute -bottom-40 -right-40 h-[500px] w-[500px] rounded-full bg-brand-600/15 blur-[100px]" />
                <div className="pointer-events-none absolute left-1/2 top-1/3 h-[300px] w-[300px] -translate-x-1/2 rounded-full bg-indigo-500/10 blur-[80px]" />

                <div className="relative z-10 mx-auto max-w-6xl px-5 py-32 text-center">
                    <div className="hero-badge mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm font-medium text-slate-300 backdrop-blur-sm">
                        <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                        Free &amp; Open for Everyone
                    </div>

                    <h1 className="mx-auto max-w-4xl text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl">
                        Manage Your Shared Expenses,{" "}
                        <span className="bg-gradient-to-r from-brand-500 via-indigo-400 to-cyan-400 bg-clip-text text-transparent">
                            Effortlessly.
                        </span>
                    </h1>

                    <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-slate-400 sm:text-lg md:text-xl">
                        House Ledger makes it simple to track meals, split bills, and manage shared household expenses — so you can focus on what matters.
                    </p>

                    <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                        <Link
                            to="/register"
                            className="group relative inline-flex items-center gap-2 rounded-xl bg-brand-500 px-8 py-4 text-base font-semibold text-white shadow-2xl shadow-brand-500/30 transition-all hover:bg-brand-600 hover:shadow-brand-500/50"
                        >
                            Get Started Free
                            <svg className="h-5 w-5 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                        </Link>
                        <a
                            href="#features"
                            className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-8 py-4 text-base font-semibold text-white transition-all hover:border-white/40 hover:bg-white/5"
                        >
                            Learn More
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                        </a>
                    </div>

                    {/* Stats bar */}
                    <div className="mx-auto mt-16 grid max-w-xl grid-cols-3 gap-8 border-t border-white/10 pt-8">
                        {[
                            ["100%", "Free to Use"],
                            ["Real-time", "Sync"],
                            ["24/7", "Availability"],
                        ].map(([value, label]) => (
                            <div key={label} className="text-center">
                                <div className="text-2xl font-bold text-white sm:text-3xl">{value}</div>
                                <div className="mt-1 text-xs font-medium text-slate-400 sm:text-sm">{label}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Bottom wave */}
                <div className="absolute inset-x-0 bottom-0">
                    <svg viewBox="0 0 1440 80" fill="none" className="w-full">
                        <path d="M0 80V30C360 80 720 0 1080 30C1260 45 1380 65 1440 80H0Z" fill="white" />
                    </svg>
                </div>
            </section>

            {/* ─── Features ─── */}
            <section id="features" className="bg-white py-24 sm:py-32">
                <div className="mx-auto max-w-6xl px-5">
                    <RevealSection className="text-center">
                        <span className="inline-block rounded-full bg-brand-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-brand-600">
                            Features
                        </span>
                        <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                            Everything you need to manage shared living
                        </h2>
                        <p className="mx-auto mt-4 max-w-2xl text-base text-slate-500">
                            From tracking daily meals to generating expense reports, House Ledger has every tool your mess or household needs.
                        </p>
                    </RevealSection>

                    <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {features.map((f, i) => (
                            <RevealSection key={f.title} delay={i * 80}>
                                <div className="feature-card group relative rounded-2xl border border-slate-200/60 bg-white p-7 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-brand-200 hover:shadow-xl hover:shadow-brand-500/5">
                                    <div className="mb-4 inline-flex rounded-xl bg-gradient-to-br from-brand-50 to-indigo-50 p-3 text-brand-600 transition-colors group-hover:from-brand-100 group-hover:to-indigo-100">
                                        {f.icon}
                                    </div>
                                    <h3 className="mb-2 text-lg font-semibold text-slate-900">{f.title}</h3>
                                    <p className="text-sm leading-relaxed text-slate-500">{f.desc}</p>
                                </div>
                            </RevealSection>
                        ))}
                    </div>
                </div>
            </section>

            {/* ─── How It Works ─── */}
            <section id="how-it-works" className="bg-gradient-to-b from-slate-50 to-white py-24 sm:py-32">
                <div className="mx-auto max-w-6xl px-5">
                    <RevealSection className="text-center">
                        <span className="inline-block rounded-full bg-indigo-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-indigo-600">
                            How It Works
                        </span>
                        <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                            Get started in three simple steps
                        </h2>
                        <p className="mx-auto mt-4 max-w-2xl text-base text-slate-500">
                            No complicated setup. No learning curve. Just sign up and start managing your shared expenses.
                        </p>
                    </RevealSection>

                    <div className="mt-16 grid gap-8 sm:grid-cols-3">
                        {steps.map((s, i) => (
                            <RevealSection key={s.num} delay={i * 120}>
                                <div className="relative rounded-2xl border border-slate-200/60 bg-white p-8 text-center shadow-sm transition-all duration-300 hover:shadow-lg">
                                    <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-indigo-600 text-xl font-bold text-white shadow-lg shadow-brand-500/25">
                                        {s.num}
                                    </div>
                                    <h3 className="mb-2 text-lg font-semibold text-slate-900">{s.title}</h3>
                                    <p className="text-sm leading-relaxed text-slate-500">{s.desc}</p>

                                    {/* Connector arrow (hidden on last) */}
                                    {i < steps.length - 1 && (
                                        <div className="absolute -right-5 top-1/2 z-10 hidden -translate-y-1/2 text-slate-300 sm:block">
                                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                                        </div>
                                    )}
                                </div>
                            </RevealSection>
                        ))}
                    </div>
                </div>
            </section>

            {/* ─── CTA Banner ─── */}
            <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-brand-700 to-indigo-800 py-24">
                <div className="pointer-events-none absolute -left-32 -top-32 h-[400px] w-[400px] rounded-full bg-brand-500/20 blur-[100px]" />
                <div className="pointer-events-none absolute -bottom-32 -right-32 h-[400px] w-[400px] rounded-full bg-indigo-500/20 blur-[100px]" />

                <RevealSection className="relative z-10 mx-auto max-w-3xl px-5 text-center">
                    <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                        Ready to simplify your expenses?
                    </h2>
                    <p className="mx-auto mt-4 max-w-xl text-base text-slate-300">
                        Join House Ledger today and take the hassle out of managing shared living costs. It's free, fast, and built for you.
                    </p>
                    <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                        <Link
                            to="/register"
                            className="group inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 text-base font-semibold text-slate-900 shadow-2xl transition-all hover:bg-slate-50 hover:shadow-white/20"
                        >
                            Create Free Account
                            <svg className="h-5 w-5 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                        </Link>
                        <Link
                            to="/login"
                            className="inline-flex items-center gap-2 rounded-xl border border-white/25 px-8 py-4 text-base font-semibold text-white transition-all hover:border-white/40 hover:bg-white/10"
                        >
                            Sign In
                        </Link>
                    </div>
                </RevealSection>
            </section>

            {/* ─── Footer ─── */}
            <footer className="border-t border-slate-200/60 bg-white">
                <div className="mx-auto max-w-6xl px-5 py-10">
                    <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
                        <div className="flex items-center gap-2.5">
                            <img src="/logo.png" alt="House Ledger" className="h-8 w-8 rounded-lg object-cover" />
                            <span className="text-base font-bold text-slate-800">House Ledger</span>
                        </div>
                        <nav className="flex items-center gap-6">
                            <a href="#features" className="text-sm text-slate-500 transition-colors hover:text-slate-800">Features</a>
                            <a href="#how-it-works" className="text-sm text-slate-500 transition-colors hover:text-slate-800">How It Works</a>
                            <Link to="/login" className="text-sm text-slate-500 transition-colors hover:text-slate-800">Log in</Link>
                            <Link to="/register" className="text-sm text-slate-500 transition-colors hover:text-slate-800">Sign up</Link>
                        </nav>
                    </div>
                    <div className="mt-8 border-t border-slate-100 pt-6">
                        <p className="text-sm text-slate-500">
                            Developed by - <span className="font-semibold text-slate-600">Nasif Safwan</span>
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
