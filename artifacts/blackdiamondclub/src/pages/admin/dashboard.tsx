import { useEffect, useState } from "react";
import { adminApi, AdminDashboard } from "@/lib/admin-api";
import { Users, TrendingUp, TrendingDown, Gamepad2, Clock, DollarSign } from "lucide-react";

function StatCard({ label, value, sub, icon: Icon, accent }: {
  label: string; value: string | number; sub?: string;
  icon: React.ElementType; accent?: string;
}) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex items-start gap-4">
      <div className={`p-3 rounded-xl ${accent ?? "bg-yellow-400/10"}`}>
        <Icon size={20} className={accent ? "text-current" : "text-yellow-400"} />
      </div>
      <div>
        <p className="text-xs text-white/40 uppercase tracking-wider mb-1">{label}</p>
        <p className="text-2xl font-bold text-white">{value}</p>
        {sub && <p className="text-xs text-white/30 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<AdminDashboard | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    adminApi.dashboard()
      .then(setData)
      .catch(e => setError(e.message));
  }, []);

  if (error) return <div className="text-red-400 text-sm">{error}</div>;
  if (!data) return <div className="text-white/40 text-sm animate-pulse">Loading…</div>;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-white/40 text-sm mt-1">Platform overview</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Users" value={data.totalUsers} icon={Users} />
        <StatCard label="Total Deposited" value={`$${data.totalDeposited.toFixed(2)}`} icon={TrendingUp} accent="bg-emerald-500/10 text-emerald-400" />
        <StatCard label="Total Withdrawn" value={`$${data.totalWithdrawn.toFixed(2)}`} icon={TrendingDown} accent="bg-purple-500/10 text-purple-400" />
        <StatCard
          label="Platform Revenue"
          value={`$${data.platformRevenue.toFixed(2)}`}
          icon={DollarSign}
          accent={data.platformRevenue >= 0 ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}
        />
        <StatCard label="Active Games" value={data.activeGameSessions} icon={Gamepad2} accent="bg-blue-500/10 text-blue-400" />
        <StatCard
          label="Pending Deposits"
          value={data.pendingDeposits}
          sub="Awaiting review"
          icon={Clock}
          accent={data.pendingDeposits > 0 ? "bg-orange-500/10 text-orange-400" : "bg-white/5 text-white/40"}
        />
        <StatCard
          label="Pending Withdrawals"
          value={data.pendingWithdrawals}
          sub="Awaiting processing"
          icon={Clock}
          accent={data.pendingWithdrawals > 0 ? "bg-orange-500/10 text-orange-400" : "bg-white/5 text-white/40"}
        />
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
        <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-4">Quick Links</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Review Deposits", href: "/admin/transactions?type=deposit&status=pending", badge: data.pendingDeposits },
            { label: "Review Withdrawals", href: "/admin/transactions?type=withdrawal&status=pending", badge: data.pendingWithdrawals },
            { label: "Manage Users", href: "/admin/users", badge: 0 },
            { label: "Platform Settings", href: "/admin/settings", badge: 0 },
          ].map(link => (
            <a
              key={link.href}
              href={link.href}
              className="bg-white/5 hover:bg-white/10 border border-white/10 hover:border-yellow-400/30 rounded-xl px-4 py-3 text-sm text-white/70 hover:text-white transition-all flex items-center justify-between"
            >
              {link.label}
              {link.badge > 0 && (
                <span className="bg-orange-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center ml-2">
                  {link.badge}
                </span>
              )}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
