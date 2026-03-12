import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthAPI } from "../api/auth";
import { authStore } from "../store/authStore";
import Layout from "../components/Layout";

export default function Login() {
    const nav = useNavigate();
    const [identifier, setIdentifier] = useState("");
    const [password, setPassword] = useState("");
    const [err, setErr] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (authStore.getToken()) {
            nav("/dashboard");
        }
    }, [nav]);

    const submit = async (e) => {
        e.preventDefault();
        setErr("");
        setLoading(true);
        try {
            const res = await AuthAPI.login({ identifier, password });
            authStore.set({ token: res.data.token, user: res.data.user });
            nav("/dashboard");
        } catch (e) {
            setErr(
                e?.response?.data?.message ||
                e?.message ||
                "Login failed. Check backend status and API URL."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <Layout>
            <div className="flex items-center justify-center py-16">
                <div className="w-full max-w-md">
                    {/* Header */}
                    <div className="mb-8 text-center">
                        <img src="/logo.png" alt="House Ledger logo" className="mx-auto mb-4 h-16 w-16 rounded-2xl object-cover shadow-lg" />
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Welcome back</h1>
                        <p className="mt-1 text-sm text-slate-500">Sign in to your House Ledger account</p>
                    </div>

                    {/* Card */}
                    <div className="rounded-2xl border border-slate-200/60 bg-white p-8 shadow-sm">
                        {err ? (
                            <div className="mb-5 flex items-center gap-2 rounded-xl bg-danger-50 px-4 py-3 text-sm font-medium text-danger-600">
                                <span>⚠️</span> {err}
                            </div>
                        ) : null}

                        <form onSubmit={submit} className="space-y-5">
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-slate-700">Username or Email</label>
                                <input
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm transition-all placeholder:text-slate-400 focus:bg-white"
                                    type="text"
                                    placeholder="username or yourmail@example.com"
                                    value={identifier}
                                    onChange={(e) => setIdentifier(e.target.value)}
                                    required
                                />
                            </div>
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-slate-700">Password</label>
                                <input
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm transition-all placeholder:text-slate-400 focus:bg-white"
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full rounded-xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-brand-700 hover:shadow disabled:opacity-50"
                            >
                                {loading ? "Signing in…" : "Sign in"}
                            </button>
                        </form>
                    </div>

                    <p className="mt-6 text-center text-sm text-slate-500">
                        Don't have an account?{" "}
                        <Link to="/register" className="font-semibold text-brand-600 hover:text-brand-700">
                            Create one
                        </Link>
                    </p>
                </div>
            </div>
        </Layout>
    );
}
