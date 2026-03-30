import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { authStore } from "../store/authStore";

export default function Layout({ children }) {
  const nav = useNavigate();
  const location = useLocation();
  const user = authStore.getUser();
  const [showHelp, setShowHelp] = useState(false);

  const logout = () => {
    authStore.clear();
    nav("/");
  };

  const navLinks = [
    { to: "/dashboard", label: "Dashboard", icon: "🏠" },
    { to: "/notices", label: "Notice Board", icon: "📢" },
  ];
  const adminLinks = user?.role === 'admin' ? [{ to: "/admin", label: "Admin", icon: "🛠️" }] : [];
  const allNavLinks = user?.role === 'admin' ? adminLinks : [...navLinks, ...adminLinks];

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* ─── Navbar ─── */}
      <header className="sticky top-0 z-50 border-b border-slate-200/60 bg-white/85 backdrop-blur-lg">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5">
          <div className="flex items-center gap-8">
            <Link to="/dashboard" className="flex items-center gap-2.5 text-lg font-bold tracking-tight text-slate-900">
              <img src="/logo.png" alt="House Ledger logo" className="h-9 w-9 rounded-xl object-cover shadow-sm" />
              <span className="hidden sm:inline">House Ledger</span>
            </Link>

            {user ? (
              <nav className="hidden items-center gap-1 md:flex">
                {allNavLinks.map((l) => (
                  <Link
                    key={l.to}
                    to={l.to}
                    className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium transition-all ${location.pathname === l.to
                      ? "bg-brand-600 text-white shadow-sm"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                      }`}
                  >
                    <span className="text-base">{l.icon}</span>
                    {l.label}
                  </Link>
                ))}
              </nav>
            ) : null}
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <>
                <div className="hidden items-center gap-2 md:flex">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">
                    {user.name?.charAt(0)?.toUpperCase()}
                  </span>
                  <span className="text-sm font-medium text-slate-700">{user.name}</span>
                </div>
                <button
                  onClick={logout}
                  className="rounded-lg border border-slate-200 px-3.5 py-2 text-sm font-medium text-slate-600 transition-all hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                >
                  Logout
                </button>
              </>
            ) : (
              <div className="flex gap-2">
                <Link
                  to="/login"
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition-all hover:bg-slate-50"
                >
                  Log in
                </Link>
                <Link
                  to="/register"
                  className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-brand-700"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobile nav links */}
        {user ? (
          <div className="flex gap-1 border-t border-slate-100 px-5 py-2.5 md:hidden">
            {allNavLinks.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${location.pathname === l.to
                  ? "bg-brand-600 text-white"
                  : "text-slate-600 hover:bg-slate-100"
                  }`}
              >
                <span className="text-base">{l.icon}</span>
                {l.label}
              </Link>
            ))}
          </div>
        ) : null}
      </header>

      {/* ─── Main content ─── */}
      <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-8">
        {children}
      </main>

      {/* ─── Footer ─── */}
      <footer className="mt-auto border-t border-slate-200/60 bg-white/60 backdrop-blur-sm">
        <div className="mx-auto max-w-6xl px-5 py-4">
          <p className="text-sm text-slate-500">
            HouseLedger — developed by <span className="font-semibold text-slate-600">Nasif Safwan</span>
          </p>
        </div>
      </footer>

      {/* Floating Help Button */}
      {user && (
        <button
          onClick={() => setShowHelp(true)}
          className="group fixed bottom-6 right-6 z-40 flex items-center gap-2.5 rounded-full border border-slate-200/60 bg-white/90 px-4 py-2.5 shadow-xl backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-brand-300 hover:bg-white hover:shadow-2xl focus:outline-none focus:ring-4 focus:ring-brand-500/20 active:scale-95"
          title="How to use the app"
        >
          <div className="flex items-center justify-center rounded-full bg-brand-50 p-1.5 text-brand-600 transition-colors duration-300 group-hover:bg-brand-100 group-hover:text-brand-700">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
              <path d="M12 17h.01" />
            </svg>
          </div>
          <span className="pr-1 text-sm font-bold tracking-wide text-slate-700 transition-colors duration-300 group-hover:text-brand-700">User Guide</span>
        </button>
      )}

      {/* Help Modal */}
      {showHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 pt-16 backdrop-blur-md sm:pt-4">
          <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl md:p-8">
            <button
              onClick={() => setShowHelp(false)}
              className="absolute right-5 top-5 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-colors hover:bg-red-50 hover:text-red-500 focus:outline-none"
            >
              ✕
            </button>
            <div className="mb-6 flex items-center gap-3 border-b border-slate-100 pb-4">
              <span className="text-3xl">📖</span>
              <div>
                <h2 className="text-2xl font-bold text-slate-800">House Ledger Guide</h2>
                <p className="text-sm text-slate-500">Everything you need to know to use the app</p>
              </div>
            </div>

            <div className="space-y-4 text-sm text-slate-600">
              <section className="rounded-xl bg-slate-50 p-5 ring-1 ring-inset ring-slate-100">
                <h3 className="mb-2 flex items-center gap-2 text-lg font-semibold text-brand-700">
                  <span>🚀</span> Getting Started
                </h3>
                <p className="leading-relaxed">Welcome! After signing up, you can either <strong>Create a New Mess</strong> and become its Manager, or <strong>Join an Existing Mess</strong> if your friends gave you an invitation ID.</p>
              </section>

              <section className="rounded-xl bg-slate-50 p-5 ring-1 ring-inset ring-slate-100">
                <h3 className="mb-2 flex items-center gap-2 text-lg font-semibold text-brand-700">
                  <span>📊</span> Dashboard Overview
                </h3>
                <ul className="ml-5 list-disc space-y-2 leading-relaxed text-slate-600 marker:text-brand-300">
                  <li><strong>Manager Dashboard:</strong> Available only to the mess creator. As a manager, you define monthly budgets, specify fixed expenses (like rent and Wi-Fi), manage join requests, and handle overall analytics.</li>
                  <li><strong>Member Dashboard:</strong> Your personal summary. Shows your share of rent, bills, meal costs, and total dues for the month. You can also log your daily meals here.</li>
                </ul>
              </section>

              <section className="rounded-xl bg-slate-50 p-5 ring-1 ring-inset ring-slate-100">
                <h3 className="mb-2 flex items-center gap-2 text-lg font-semibold text-brand-700">
                  <span>🍽️</span> Meals & Tracking
                </h3>
                <ul className="ml-5 list-disc space-y-2 leading-relaxed text-slate-600 marker:text-brand-300">
                  <li>Log your daily meals in the <em>Quick Meal Log</em> section.</li>
                  <li>In the <em>Notice Board</em>, the manager can post important updates for the house.</li>
                  <li>Use the <em>Raise an Issue</em> section in your dashboard if your room has a maintenance problem or if you need to complain.</li>
                </ul>
              </section>

              <section className="rounded-xl bg-slate-50 p-5 ring-1 ring-inset ring-slate-100">
                <h3 className="mb-2 flex items-center gap-2 text-lg font-semibold text-brand-700">
                  <span>🤝</span> Settlements & Repayments
                </h3>
                <p className="leading-relaxed">Sometimes mess members owe each other money. If you owe someone, it will show up under <strong>Settlement Repayments</strong>. Once you physically pay them or send money, log the payment so the system instantly marks it as cleared.</p>
              </section>
            </div>

            <div className="mt-8 flex justify-end">
              <button
                onClick={() => setShowHelp(false)}
                className="rounded-xl bg-brand-600 px-6 py-2.5 font-semibold text-white shadow-sm transition-all hover:bg-brand-700 hover:shadow-md active:scale-95"
              >
                Let's go!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
