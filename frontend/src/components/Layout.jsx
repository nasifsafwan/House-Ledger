import { Link, useNavigate, useLocation } from "react-router-dom";
import { authStore } from "../store/authStore";

export default function Layout({ children }) {
  const nav = useNavigate();
  const location = useLocation();
  const user = authStore.getUser();

  const logout = () => {
    authStore.clear();
    nav("/");
  };

  const navLinks = [
    { to: "/dashboard", label: "Dashboard", icon: "🏠" },
    { to: "/personal", label: "Personal", icon: "💰" },
  ];

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
                {navLinks.map((l) => (
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
            {navLinks.map((l) => (
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
      <footer className="border-t border-slate-200/60 bg-white/60 backdrop-blur-sm">
        <div className="mx-auto max-w-6xl px-5 py-3">
          <p className="text-[11px] text-slate-400">
            HouseLedger — developed by <span className="font-medium text-slate-500">Nasif Safwan</span>
          </p>
        </div>
      </footer>
    </div>
  );
}
