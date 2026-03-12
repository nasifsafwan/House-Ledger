import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Layout from "../components/Layout";
import { MessAPI } from "../api/mess";

export default function CreateOrJoin() {
  const nav = useNavigate();
  const [createForm, setCreateForm] = useState({ name: "", address: "" });
  const [joinCode, setJoinCode] = useState("");
  const [err, setErr] = useState("");
  const [isLoadingCreate, setIsLoadingCreate] = useState(false);
  const [isLoadingJoin, setIsLoadingJoin] = useState(false);

  const createMess = async (e) => {
    e.preventDefault();
    if (!createForm.name.trim()) {
      setErr("Mess name is required.");
      return;
    }
    setErr("");
    setIsLoadingCreate(true);
    try {
      const res = await MessAPI.create(createForm);
      nav(`/manager/${res.data.mess._id}`);
    } catch (e2) {
      setErr(e2?.response?.data?.message || "Failed to create mess. Please try again.");
    } finally {
      setIsLoadingCreate(false);
    }
  };

  const joinMess = async (e) => {
    e.preventDefault();
    if (!joinCode.trim()) {
      setErr("Invite code is required.");
      return;
    }
    setErr("");
    setIsLoadingJoin(true);
    try {
      await MessAPI.join({ inviteCode: joinCode.trim() });
      nav("/dashboard");
    } catch (e2) {
      setErr(e2?.response?.data?.message || "Invalid invite code or failed to join.");
    } finally {
      setIsLoadingJoin(false);
    }
  };

  return (
    <Layout>
      <div className="mb-8 max-w-2xl">
        <Link to="/dashboard" className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Back to Dashboard
        </Link>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
          Setup Your Household
        </h1>
        <p className="mt-3 text-lg text-slate-500">
          Create a new mess as a manager, or join an existing one using an invite code.
        </p>
      </div>

      {err ? (
        <div className="mb-8 flex items-center gap-3 rounded-2xl bg-red-50 p-4 text-sm font-medium text-red-600 border border-red-100 shadow-sm animate-in fade-in slide-in-from-top-2">
          <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          {err}
        </div>
      ) : null}

      <div className="grid gap-8 lg:grid-cols-2 items-start">
        {/* Create Card */}
        <div className="relative overflow-hidden rounded-3xl border border-slate-200/60 bg-white shadow-sm transition-all hover:border-brand-200 hover:shadow-xl hover:shadow-brand-500/5">
          <div className="absolute top-0 right-0 p-8 opacity-[0.03]">
            <svg className="h-40 w-40" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L2 22h20L12 2zm0 4.5l6.5 13.5h-13L12 6.5z" /></svg>
          </div>
          <div className="relative p-8 sm:p-10">
            <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-2xl text-brand-600 shadow-inner">
              👑
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">Create a New Mess</h2>
            <p className="mt-2 text-sm text-slate-500">
              Start a fresh group. You will become the manager, able to invite others and configure settings.
            </p>

            <form onSubmit={createMess} className="mt-8 space-y-5">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Mess Name <span className="text-red-500">*</span></label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                    <span className="text-slate-400">🏠</span>
                  </div>
                  <input
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3.5 pl-11 pr-4 text-sm font-medium transition-all placeholder:text-slate-400 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-500/10"
                    placeholder="E.g., Sunny Apartment, Block B"
                    value={createForm.name}
                    onChange={(e) => setCreateForm((p) => ({ ...p, name: e.target.value }))}
                    disabled={isLoadingCreate}
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Address <span className="text-slate-400 font-normal">(Optional)</span></label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                    <span className="text-slate-400">📍</span>
                  </div>
                  <input
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3.5 pl-11 pr-4 text-sm font-medium transition-all placeholder:text-slate-400 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-500/10"
                    placeholder="Where is your mess located?"
                    value={createForm.address}
                    onChange={(e) => setCreateForm((p) => ({ ...p, address: e.target.value }))}
                    disabled={isLoadingCreate}
                  />
                </div>
              </div>

              <button
                disabled={isLoadingCreate}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-brand-500/30 transition-all hover:bg-brand-700 hover:shadow-brand-500/40 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoadingCreate ? (
                  <svg className="h-5 w-5 animate-spin text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                ) : (
                  <>Create Mess <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg></>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* OR Divider for Mobile (visible mostly on smaller screens between stacked cards)*/}
        <div className="flex items-center justify-center py-4 lg:hidden">
          <div className="h-px w-full max-w-[100px] bg-slate-200"></div>
          <span className="px-4 text-sm font-bold uppercase tracking-widest text-slate-400">OR</span>
          <div className="h-px w-full max-w-[100px] bg-slate-200"></div>
        </div>

        {/* Join Card */}
        <div className="relative overflow-hidden rounded-3xl border border-slate-200/60 bg-white shadow-sm transition-all hover:border-slate-300 hover:shadow-xl">
          <div className="absolute top-0 right-0 p-8 opacity-[0.03]">
            <svg className="h-40 w-40" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" /></svg>
          </div>
          <div className="relative p-8 sm:p-10">
            <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-2xl text-slate-600 shadow-inner">
              🫂
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">Join Existing Mess</h2>
            <p className="mt-2 text-sm text-slate-500">
              Already have a group? Ask your manager for the invite code to link your account.
            </p>

            <form onSubmit={joinMess} className="mt-8 space-y-5">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Invite Code <span className="text-red-500">*</span></label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                    <span className="text-slate-400">🔑</span>
                  </div>
                  <input
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3.5 pl-11 pr-4 text-sm font-bold uppercase tracking-widest transition-all placeholder:text-slate-400 placeholder:font-medium placeholder:tracking-normal focus:border-slate-800 focus:bg-white focus:outline-none focus:ring-4 focus:ring-slate-800/10"
                    placeholder="e.g. A1B2C3D4"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    disabled={isLoadingJoin}
                    maxLength={10}
                  />
                </div>
              </div>

              <button
                disabled={isLoadingJoin || joinCode.length < 4}
                className="mt-[5.5rem] flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-3.5 text-sm font-bold text-white shadow-lg shadow-slate-900/20 transition-all hover:bg-black hover:shadow-slate-900/30 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoadingJoin ? (
                  <svg className="h-5 w-5 animate-spin text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                ) : (
                  <>Join Group <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg></>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
}