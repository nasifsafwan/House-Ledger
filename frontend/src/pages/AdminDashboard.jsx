import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";
import Layout from "../components/Layout";
import Card from "../components/Card";
import { AdminAPI } from "../api/admin";
import { authStore } from "../store/authStore";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

export default function AdminDashboard() {
  const user = authStore.getUser();
  const [overview, setOverview] = useState(null);
  const [users, setUsers] = useState([]);
  const [messes, setMesses] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [userDrafts, setUserDrafts] = useState({});
  const [messDrafts, setMessDrafts] = useState({});
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  const load = async () => {
    setErr("");
    setLoading(true);
    try {
      const [overviewRes, usersRes, messesRes, adminsRes] = await Promise.all([
        AdminAPI.overview(),
        AdminAPI.users(),
        AdminAPI.messes(),
        AdminAPI.admins(),
      ]);
      setOverview(overviewRes.data);
      setUsers(usersRes.data.users || []);
      setMesses(messesRes.data.messes || []);
      setAdmins(adminsRes.data.admins || []);

      const nextUserDrafts = {};
      for (const item of usersRes.data.users || []) {
        nextUserDrafts[item._id] = {
          name: item.name || "",
          username: item.username || "",
          email: item.email || "",
          role: item.role || "user",
        };
      }
      setUserDrafts(nextUserDrafts);

      const nextMessDrafts = {};
      for (const item of messesRes.data.messes || []) {
        nextMessDrafts[item._id] = {
          name: item.name || "",
          address: item.address || "",
        };
      }
      setMessDrafts(nextMessDrafts);
    } catch (e) {
      setErr(e?.response?.data?.message || "Failed to load admin dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (user?.role !== 'admin') {
    return (
      <Layout>
        <Card icon="🔒" title="Admin only" subtitle="This dashboard is only available to system admins.">
          <Link to="/dashboard" className="inline-flex rounded-xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white">
            Back to dashboard
          </Link>
        </Card>
      </Layout>
    );
  }

  const saveUser = async (userId) => {
    setErr("");
    setMsg("");
    try {
      const payload = userDrafts[userId];
      await AdminAPI.updateUser(userId, payload);
      setMsg("User updated");
      await load();
    } catch (e) {
      setErr(e?.response?.data?.message || "Failed to update user");
    }
  };

  const saveMess = async (messId) => {
    setErr("");
    setMsg("");
    try {
      const payload = messDrafts[messId];
      await AdminAPI.updateMess(messId, payload);
      setMsg("Mess updated");
      await load();
    } catch (e) {
      setErr(e?.response?.data?.message || "Failed to update mess");
    }
  };

  const updateMessMember = async (messId, userId, role) => {
    setErr("");
    setMsg("");
    try {
      await AdminAPI.updateMessMember(messId, userId, { role });
      setMsg("Member role updated");
      await load();
    } catch (e) {
      setErr(e?.response?.data?.message || "Failed to update member role");
    }
  };

  const removeMessMember = async (messId, userId) => {
    if (!window.confirm("Are you sure you want to remove this member from the mess?")) return;
    setErr("");
    setMsg("");
    try {
      await AdminAPI.removeMessMember(messId, userId);
      setMsg("Member removed");
      await load();
    } catch (e) {
      setErr(e?.response?.data?.message || "Failed to remove member");
    }
  };

  const deleteAdmin = async (adminId) => {
    if (!window.confirm("Are you sure you want to delete this admin account?")) return;
    setErr("");
    setMsg("");
    try {
      await AdminAPI.deleteAdmin(adminId);
      setMsg("Admin deleted");
      await load();
    } catch (e) {
      setErr(e?.response?.data?.message || "Failed to delete admin");
    }
  };

  const chartData = {
    labels: overview?.timeline?.map((item) => item.label) || [],
    datasets: [
      {
        label: "New users",
        data: overview?.timeline?.map((item) => item.users) || [],
        backgroundColor: "rgba(15, 118, 110, 0.7)",
        borderRadius: 8,
      },
      {
        label: "New messes",
        data: overview?.timeline?.map((item) => item.messes) || [],
        backgroundColor: "rgba(79, 70, 229, 0.7)",
        borderRadius: 8,
      },
    ],
  };

  return (
    <Layout>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">System Admin Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">Platform overview, growth, and safe edits for core records.</p>
        </div>
        <button
          onClick={load}
          className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-600 transition-all hover:bg-slate-200"
        >
          ↻ Refresh
        </button>
      </div>

      {err ? (
        <div className="mb-5 flex items-center gap-2 rounded-xl bg-danger-50 px-4 py-3 text-sm font-medium text-danger-600">
          <span>⚠️</span> {err}
        </div>
      ) : null}

      {msg ? <div className="mb-5 rounded-xl bg-success-50 px-4 py-3 text-sm font-medium text-success-600">{msg}</div> : null}

      {loading ? (
        <div className="py-12 text-center text-slate-400">Loading admin data…</div>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <StatCard label="Users" value={overview?.counts?.users} />
            <StatCard label="Admins" value={overview?.counts?.admins} />
            <StatCard label="Messes" value={overview?.counts?.messes} />
            <StatCard label="Active memberships" value={overview?.counts?.activeMemberships} />
            <StatCard label="Payments" value={overview?.counts?.payments} />
            <StatCard label="Notices" value={overview?.counts?.notices} />
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
            <Card icon="📈" title="Growth" subtitle="Last 6 months">
              <Bar
                data={chartData}
                options={{
                  responsive: true,
                  plugins: { legend: { position: "top" } },
                  scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
                }}
              />
            </Card>

            <Card icon="🕒" title="Recent Activity" subtitle="Latest users and messes">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-slate-800">Users</h3>
                  <div className="mt-2 space-y-2">
                    {(overview?.recentUsers || []).map((item) => (
                      <div key={item._id} className="rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-600">
                        <div className="font-medium text-slate-800">{item.name}</div>
                        <div>@{item.username}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-800">Messes</h3>
                  <div className="mt-2 space-y-2">
                    {(overview?.recentMesses || []).map((item) => (
                      <div key={item._id} className="rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-600">
                        <div className="font-medium text-slate-800">{item.name}</div>
                        <div>By {item.createdBy?.name || item.createdBy?.username || "Unknown"}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </div>

          <Card icon="🛡️" title="Admins" subtitle="Manage system administrators">
            <div className="space-y-4">
              {admins.map((admin) => (
                <div key={admin._id} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 border border-slate-200/50">
                  <div>
                    <div className="font-semibold text-slate-800">{admin.username}</div>
                    <div className="text-xs text-slate-500">Created: {new Date(admin.createdAt).toLocaleDateString()}</div>
                  </div>
                  <button
                    onClick={() => deleteAdmin(admin._id)}
                    className="text-sm font-medium text-danger-600 hover:text-danger-700 hover:underline"
                  >
                    Delete Admin
                  </button>
                </div>
              ))}
            </div>
          </Card>

          <Card icon="👤" title="Users" subtitle="Edit profile data and admin access">
            <div className="space-y-4">
              {users.map((item) => (
                <div key={item._id} className="rounded-2xl border border-slate-200/70 p-4">
                  <div className="grid gap-3 lg:grid-cols-[1fr_1fr_1.2fr_auto_auto]">
                    <input
                      className="rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2 text-sm"
                      value={userDrafts[item._id]?.name || ""}
                      onChange={(e) =>
                        setUserDrafts((prev) => ({
                          ...prev,
                          [item._id]: { ...prev[item._id], name: e.target.value },
                        }))
                      }
                    />
                    <input
                      className="rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2 text-sm"
                      value={userDrafts[item._id]?.username || ""}
                      onChange={(e) =>
                        setUserDrafts((prev) => ({
                          ...prev,
                          [item._id]: { ...prev[item._id], username: e.target.value },
                        }))
                      }
                    />
                    <input
                      className="rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2 text-sm"
                      value={userDrafts[item._id]?.email || ""}
                      onChange={(e) =>
                        setUserDrafts((prev) => ({
                          ...prev,
                          [item._id]: { ...prev[item._id], email: e.target.value },
                        }))
                      }
                    />
                    <label className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-600">
                      <input
                        type="checkbox"
                        checked={userDrafts[item._id]?.role === 'admin'}
                        onChange={(e) =>
                          setUserDrafts((prev) => ({
                            ...prev,
                            [item._id]: { ...prev[item._id], role: e.target.checked ? 'admin' : 'user' },
                          }))
                        }
                      />
                      Admin
                    </label>
                    <button
                      onClick={() => saveUser(item._id)}
                      className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-brand-700"
                    >
                      Save
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card icon="🏘️" title="Messes" subtitle="Edit core mess details">
            <div className="space-y-4">
              {messes.map((item) => (
                <div key={item._id} className="rounded-2xl border border-slate-200/70 p-4">
                  <div className="mb-3 text-sm text-slate-500">
                    Invite code: <span className="font-mono text-slate-700">{item.inviteCode}</span>
                    {" • "}Active members: <span className="font-semibold text-slate-700">{item.activeMembers}</span>
                  </div>
                  <div className="grid gap-3 lg:grid-cols-[1fr_1.2fr_auto]">
                    <input
                      className="rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2 text-sm"
                      value={messDrafts[item._id]?.name || ""}
                      onChange={(e) =>
                        setMessDrafts((prev) => ({
                          ...prev,
                          [item._id]: { ...prev[item._id], name: e.target.value },
                        }))
                      }
                    />
                    <input
                      className="rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2 text-sm"
                      value={messDrafts[item._id]?.address || ""}
                      onChange={(e) =>
                        setMessDrafts((prev) => ({
                          ...prev,
                          [item._id]: { ...prev[item._id], address: e.target.value },
                        }))
                      }
                    />
                    <button
                      onClick={() => saveMess(item._id)}
                      className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-brand-700"
                    >
                      Save
                    </button>
                  </div>
                  
                  {/* Members List */}
                  {item.members && item.members.length > 0 && (
                    <div className="mt-4 border-t border-slate-100 pt-4">
                      <h4 className="mb-2 text-sm font-semibold text-slate-800">Members</h4>
                      <div className="space-y-2">
                        {item.members.map(member => (
                          <div key={member._id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2 border border-slate-100/80">
                            <div>
                              <div className="text-sm font-medium text-slate-800">{member.name || 'Unknown'} <span className="text-xs font-normal text-slate-500">(@{member.username})</span></div>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className={`text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded flex w-fit ${member.role === 'MANAGER' ? 'bg-brand-100 text-brand-700' : 'bg-slate-200 text-slate-600'}`}>
                                  {member.role}
                                </span>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {member.role === 'MEMBER' && (
                                <button 
                                  onClick={() => updateMessMember(item._id, member._id, 'MANAGER')}
                                  className="text-xs font-medium text-brand-600 hover:text-brand-700 hover:underline"
                                >
                                  Make Manager
                                </button>
                              )}
                              {member.role === 'MANAGER' && (
                                <button 
                                  onClick={() => updateMessMember(item._id, member._id, 'MEMBER')}
                                  className="text-xs font-medium text-slate-600 hover:text-slate-700 hover:underline"
                                >
                                  Make Member
                                </button>
                              )}
                              <button 
                                onClick={() => removeMessMember(item._id, member._id)}
                                className="text-xs font-medium text-danger-600 hover:text-danger-700 hover:underline"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </Layout>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200/70 bg-white p-4 shadow-sm">
      <div className="text-sm text-slate-500">{label}</div>
      <div className="mt-1 text-2xl font-bold text-slate-900">{value ?? "—"}</div>
    </div>
  );
}
