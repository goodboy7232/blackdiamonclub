import { useEffect, useState } from "react";
import { useRoute, useLocation } from "wouter";
import { adminApi, AdminUserDetail } from "@/lib/admin-api";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

export default function AdminUserDetailPage() {
  const [, params] = useRoute("/admin/users/:id");
  const [, navigate] = useLocation();
  const userId = parseInt(params?.id ?? "0");

  const [user, setUser] = useState<AdminUserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [depBal, setDepBal] = useState("");
  const [withBal, setWithBal] = useState("");
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    adminApi.user(userId)
      .then(u => {
        setUser(u);
        setDepBal(String(u.depositBalance));
        setWithBal(String(u.withdrawalBalance));
      })
      .catch(e => toast.error(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { if (userId) load(); }, [userId]);

  const handleSaveBalances = async () => {
    setSaving(true);
    try {
      await adminApi.updateUser(userId, {
        depositBalance: parseFloat(depBal),
        withdrawalBalance: parseFloat(withBal),
      });
      toast.success("Balances updated");
      load();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleBan = async () => {
    if (!user) return;
    try {
      await adminApi.updateUser(userId, { isBanned: !user.isBanned });
      toast.success(user.isBanned ? "User unbanned" : "User banned");
      load();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  if (loading) return <div className="text-white/40 text-sm animate-pulse">Loading…</div>;
  if (!user) return <div className="text-red-400 text-sm">User not found</div>;

  return (
    <div>
      <button onClick={() => navigate("/admin/users")} className="flex items-center gap-2 text-white/40 hover:text-white text-sm mb-6 transition-colors">
        <ArrowLeft size={16} /> Back to Users
      </button>

      <div className="flex items-start gap-4 mb-8">
        <div className="w-14 h-14 rounded-2xl bg-yellow-400/10 flex items-center justify-center text-yellow-400 text-2xl font-bold">
          {user.username.charAt(0).toUpperCase()}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white">{user.username}</h1>
            {user.isAdmin && <span className="text-xs bg-yellow-400/20 text-yellow-400 px-2 py-1 rounded">Admin</span>}
            {user.isBanned && <span className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded">Banned</span>}
          </div>
          <p className="text-white/40 text-sm">ID #{user.id} · Joined {new Date(user.createdAt).toLocaleDateString()}</p>
        </div>
        {!user.isAdmin && (
          <button
            onClick={handleToggleBan}
            className={`ml-auto px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              user.isBanned
                ? "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20"
                : "bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20"
            }`}
          >
            {user.isBanned ? "Unban User" : "Ban User"}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Info */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
          <h2 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-4">Profile</h2>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-white/40">Email</dt>
              <dd className="text-white">{user.email ?? "—"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-white/40">Phone</dt>
              <dd className="text-white">{user.phone ?? "—"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-white/40">Games Played</dt>
              <dd className="text-white">{user.totalBets}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-white/40">Wins</dt>
              <dd className="text-white">{user.totalWins}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-white/40">Win Rate</dt>
              <dd className="text-white">{user.totalBets > 0 ? ((user.totalWins / user.totalBets) * 100).toFixed(1) : 0}%</dd>
            </div>
          </dl>
        </div>

        {/* Balance adjust */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
          <h2 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-4">Adjust Balances</h2>
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-white/40 mb-1">Deposit Balance (USDT)</label>
              <input
                type="number"
                step="0.01"
                value={depBal}
                onChange={e => setDepBal(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-yellow-400/40 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs text-white/40 mb-1">Withdrawal Balance (USDT)</label>
              <input
                type="number"
                step="0.01"
                value={withBal}
                onChange={e => setWithBal(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-yellow-400/40 transition-colors"
              />
            </div>
            <button
              onClick={handleSaveBalances}
              disabled={saving}
              className="w-full bg-yellow-400 hover:bg-yellow-300 disabled:opacity-50 text-black font-bold py-2.5 rounded-xl text-sm transition-all"
            >
              {saving ? "Saving…" : "Save Balances"}
            </button>
          </div>
        </div>
      </div>

      {/* Recent transactions */}
      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/5">
          <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider">Recent Transactions</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 text-white/30 text-xs uppercase tracking-wider">
                <th className="px-4 py-3 text-left">Type</th>
                <th className="px-4 py-3 text-right">Amount</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Date</th>
              </tr>
            </thead>
            <tbody>
              {user.recentTransactions.length === 0 ? (
                <tr><td colSpan={4} className="px-4 py-6 text-center text-white/20">No transactions</td></tr>
              ) : user.recentTransactions.map(tx => (
                <tr key={tx.id} className="border-b border-white/5">
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                      tx.type === "deposit" ? "bg-emerald-500/10 text-emerald-400"
                      : tx.type === "withdrawal" ? "bg-purple-500/10 text-purple-400"
                      : tx.type === "game_win" ? "bg-yellow-400/10 text-yellow-400"
                      : "bg-red-500/10 text-red-400"
                    }`}>
                      {tx.type.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-white font-mono">${tx.amount.toFixed(2)}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      tx.status === "approved" ? "bg-emerald-500/10 text-emerald-400"
                      : tx.status === "rejected" ? "bg-red-500/10 text-red-400"
                      : "bg-orange-500/10 text-orange-400"
                    }`}>{tx.status}</span>
                  </td>
                  <td className="px-4 py-3 text-right text-white/40">{new Date(tx.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
