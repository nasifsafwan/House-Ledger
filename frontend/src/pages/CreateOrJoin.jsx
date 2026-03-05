import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import Card from "../components/Card";
import { MessAPI } from "../api/mess";

export default function CreateOrJoin() {
    const nav = useNavigate();

    /* ── Create ── */
    const [name, setName] = useState("");
    const [address, setAddress] = useState("");
    const [createErr, setCreateErr] = useState("");
    const [createMsg, setCreateMsg] = useState("");
    const [creating, setCreating] = useState(false);

    const create = async (e) => {
        e.preventDefault();
        setCreateErr("");
        setCreateMsg("");
        setCreating(true);
        try {
            const res = await MessAPI.create({ name, address });
            setCreateMsg(`Created! Invite code: ${res.data.mess.inviteCode}`);
            setName("");
            setAddress("");
            setTimeout(() => nav("/"), 1500);
        } catch (e) {
            setCreateErr(e?.response?.data?.message || "Failed to create mess");
        } finally {
            setCreating(false);
        }
    };

    /* ── Join ── */
    const [inviteCode, setInviteCode] = useState("");
    const [joinErr, setJoinErr] = useState("");
    const [joinMsg, setJoinMsg] = useState("");
    const [joining, setJoining] = useState(false);

    const join = async (e) => {
        e.preventDefault();
        setJoinErr("");
        setJoinMsg("");
        setJoining(true);
        try {
            await MessAPI.join({ inviteCode });
            setJoinMsg("Joined successfully!");
            setInviteCode("");
            setTimeout(() => nav("/"), 1500);
        } catch (e) {
            setJoinErr(e?.response?.data?.message || "Failed to join");
        } finally {
            setJoining(false);
        }
    };

    return (
        <Layout>
            <div className="mb-6">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">Create or Join</h1>
                <p className="mt-1 text-sm text-slate-500">Start managing a new mess or join an existing one</p>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                {/* Create */}
                <Card icon="🏠" title="Create a new mess" subtitle="Set up as the manager">
                    {createErr ? (
                        <div className="mb-4 flex items-center gap-2 rounded-xl bg-danger-50 px-4 py-3 text-sm font-medium text-danger-600">
                            <span>⚠️</span> {createErr}
                        </div>
                    ) : null}
                    {createMsg ? (
                        <div className="mb-4 flex items-center gap-2 rounded-xl bg-success-50 px-4 py-3 text-sm font-medium text-success-600">
                            <span>✅</span> {createMsg}
                        </div>
                    ) : null}

                    <form onSubmit={create} className="space-y-4">
                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-slate-700">Mess name</label>
                            <input
                                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm transition-all placeholder:text-slate-400 focus:bg-white"
                                type="text"
                                placeholder="e.g. Green Valley Mess"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                        </div>
                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-slate-700">Address <span className="text-slate-400">(optional)</span></label>
                            <input
                                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm transition-all placeholder:text-slate-400 focus:bg-white"
                                type="text"
                                placeholder="e.g. 12/A, Dhanmondi, Dhaka"
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={creating}
                            className="w-full rounded-xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-brand-700 disabled:opacity-50"
                        >
                            {creating ? "Creating…" : "Create Mess"}
                        </button>
                    </form>
                </Card>

                {/* Join */}
                <Card icon="🔗" title="Join existing mess" subtitle="Enter the invite code shared by the manager">
                    {joinErr ? (
                        <div className="mb-4 flex items-center gap-2 rounded-xl bg-danger-50 px-4 py-3 text-sm font-medium text-danger-600">
                            <span>⚠️</span> {joinErr}
                        </div>
                    ) : null}
                    {joinMsg ? (
                        <div className="mb-4 flex items-center gap-2 rounded-xl bg-success-50 px-4 py-3 text-sm font-medium text-success-600">
                            <span>✅</span> {joinMsg}
                        </div>
                    ) : null}

                    <form onSubmit={join} className="space-y-4">
                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-slate-700">Invite code</label>
                            <input
                                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-center font-mono text-sm uppercase tracking-widest transition-all placeholder:text-slate-400 placeholder:tracking-normal focus:bg-white"
                                type="text"
                                placeholder="e.g. XK7N2M4P"
                                value={inviteCode}
                                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={joining}
                            className="w-full rounded-xl border-2 border-brand-600 bg-white px-4 py-3 text-sm font-semibold text-brand-600 transition-all hover:bg-brand-50 disabled:opacity-50"
                        >
                            {joining ? "Joining…" : "Join Mess"}
                        </button>
                    </form>
                </Card>
            </div>
        </Layout>
    );
}
