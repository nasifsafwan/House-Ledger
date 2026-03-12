import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import Card from "../components/Card";
import { MessAPI } from "../api/mess";

export default function CreateOrJoin() {
  const nav = useNavigate();
  const [createForm, setCreateForm] = useState({ name: "", address: "" });
  const [joinCode, setJoinCode] = useState("");
  const [err, setErr] = useState("");



  const createMess = async (e) => {
    e.preventDefault();
    setErr("");
    try {
      const res = await MessAPI.create(createForm);
      nav(`/dashboard?new=${res.data.mess._id}`);
    } catch (e2) {
      setErr(e2?.response?.data?.message || "Create mess failed");
    }
  };

  const joinMess = async (e) => {
    e.preventDefault();
    setErr("");
    try {
      await MessAPI.join({ inviteCode: joinCode });
      nav("/dashboard");
    } catch (e2) {
      setErr(e2?.response?.data?.message || "Join failed");
    }
  };

  return (
    <Layout>
      <div className="grid gap-6 md:grid-cols-2">
        <Card title="Create a mess">
          <form onSubmit={createMess} className="space-y-3">
            <input
              className="w-full rounded-xl border p-3"
              placeholder="Mess name"
              value={createForm.name}
              onChange={(e) => setCreateForm((p) => ({ ...p, name: e.target.value }))}
            />
            <input
              className="w-full rounded-xl border p-3"
              placeholder="Address (optional)"
              value={createForm.address}
              onChange={(e) => setCreateForm((p) => ({ ...p, address: e.target.value }))}
            />
            <button className="w-full rounded-xl bg-slate-900 p-3 text-white">
              Create
            </button>
          </form>
        </Card>

        <Card title="Join via invite code">
          <form onSubmit={joinMess} className="space-y-3">
            <input
              className="w-full rounded-xl border p-3 uppercase"
              placeholder="Invite code"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
            />
            <button className="w-full rounded-xl bg-slate-900 p-3 text-white">
              Join
            </button>
          </form>
        </Card>
      </div>

      {err ? (
        <div className="mt-6 rounded-xl bg-red-50 p-3 text-sm text-red-700">{err}</div>
      ) : null}
    </Layout>
  );
}