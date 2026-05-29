import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { adminApi, AdminUser } from "@/lib/admin-api";
import { Search, ExternalLink, ShieldOff, Shield } from "lucide-react";
import { toast } from "sonner";

export default function AdminUsersPage() {
  const [, navigate] = useLocation();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    adminApi.users({ search, limit: 100 })
      .then(d => setUsers(d.users))
      .catch(e => toast.error(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [search]);

  const toggleBan = async (user: AdminUser) => {
    try {
      await adminApi.updateUser(user.id, { isBanned: !user.isBanned });
      toast.success(user.isBanned ? `${user.username} unbanned` : `${user.username} banned`);
      load();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Users</h1>
        <p className="text-white/40 text-sm mt-1">{users.length} total users</p>
      </div>

      <div className="relative mb-4">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by username or email…"
          className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-yellow-400/40 transition-colors"
        />
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 text-white/40 text-xs uppercase tracking-wider">
                <th className="px-4 py-3 text-left">User</th>
                <th className="px-4 py-3 text-right">Deposit Bal.</th>
                <th className="px-4 py-3 text-right">Withdrawal Bal.</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-white/30 text-sm">Loading…</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-white/30 text-sm">No users found</td></tr>
              ) : users.map(u => (
                <tr key={u.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-yellow-400/10 flex items-center justify-center text-yellow-400 text-xs font-bold">
                        {u.username.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-white font-medium flex items-center gap-2">
                          {u.username}
                          {u.isAdmin && <span className="text-[10px] bg-yellow-400/20 text-yellow-400 px-1.5 py-0.5 rounded">Admin</span>}
                        </div>
                        <div className="text-white/30 text-xs">{u.email ?? "—"}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-right text-white font-mono">${u.depositBalance.toFixed(2)}</td>
                  <td className="px-4 py-4 text-right text-white font-mono">${u.withdrawalBalance.toFixed(2)}</td>
                  <td className="px-4 py-4 text-center">
                    {u.isBanned ? (
                      <span className="text-xs bg-red-500/20 text-red-400 px-2.5 py-1 rounded-full">Banned</span>
                    ) : (
                      <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2.5 py-1 rounded-full">Active</span>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => navigate(`/admin/users/${u.id}`)}
                        className="p-2 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-all"
                        title="View details"
                      >
                        <ExternalLink size={14} />
                      </button>
                      {!u.isAdmin && (
                        <button
                          onClick={() => toggleBan(u)}
                          className={`p-2 rounded-lg transition-all ${
                            u.isBanned
                              ? "hover:bg-emerald-500/10 text-red-400 hover:text-emerald-400"
                              : "hover:bg-red-500/10 text-white/50 hover:text-red-400"
                          }`}
                          title={u.isBanned ? "Unban user" : "Ban user"}
                        >
                          {u.isBanned ? <Shield size={14} /> : <ShieldOff size={14} />}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
