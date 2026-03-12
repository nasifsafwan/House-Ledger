import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthAPI } from "../api/auth";
import { authStore } from "../store/authStore";
import Layout from "../components/Layout";

export default function Register() {
    const nav = useNavigate();
    const [name, setName] = useState("");
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
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
            await AuthAPI.register({ name, username, email, password });
            nav("/login");
        } catch (e) {
            setErr(
                e?.response?.data?.message ||
                e?.message ||
                "Registration failed. Check backend status and API URL."
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
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Create your account</h1>
                        <p className="mt-1 text-sm text-slate-500">Join House Ledger and manage your expenses</p>
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
                                <label className="mb-1.5 block text-sm font-medium text-slate-700">Full name</label>
                                <input
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm transition-all placeholder:text-slate-400 focus:bg-white"
                                    type="text"
                                    placeholder="John Doe"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                />
                            </div>
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-slate-700">Username</label>
                                <input
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm transition-all placeholder:text-slate-400 focus:bg-white"
                                    type="text"
                                    placeholder="johndoe"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    required
                                />
                            </div>
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-slate-700">Email</label>
                                <input
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm transition-all placeholder:text-slate-400 focus:bg-white"
                                    type="email"
                                    placeholder="john@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-slate-700">Password</label>
                                <input
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm transition-all placeholder:text-slate-400 focus:bg-white"
                                    type="password"
                                    placeholder="Min 6 characters"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    minLength={6}
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full rounded-xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-brand-700 hover:shadow disabled:opacity-50"
                            >
                                {loading ? "Creating account…" : "Create account"}
                            </button>
                        </form>
                    </div>

                    <p className="mt-6 text-center text-sm text-slate-500">
                        Already have an account?{" "}
                        <Link to="/login" className="font-semibold text-brand-600 hover:text-brand-700">
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </Layout>
    );
}
