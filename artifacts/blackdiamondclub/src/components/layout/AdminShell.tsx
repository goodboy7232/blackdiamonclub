import { ReactNode, useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard, Users, ArrowLeftRight, Gamepad2,
  Settings, LogOut, ChevronRight,
} from "lucide-react";

const NAV = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/transactions", label: "Transactions", icon: ArrowLeftRight },
  { href: "/admin/games", label: "Games", icon: Gamepad2 },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export function AdminShell({ children }: { children: ReactNode }) {
  const [location, navigate] = useLocation();
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("bdc_token");
    navigate("/admin/login");
  };

  return (
    <div className="min-h-[100dvh] bg-[#080808] text-white flex">
      {/* Sidebar — desktop */}
      <aside className="hidden md:flex flex-col w-60 min-h-[100dvh] fixed left-0 top-0 bg-[#111]/80 backdrop-blur-xl border-r border-white/5 z-40">
        <div className="px-6 py-7 border-b border-white/5">
          <div className="flex items-center gap-2">
            <span className="text-yellow-400 text-lg">◆</span>
            <span className="text-sm font-bold tracking-widest text-white uppercase">
              Admin Panel
            </span>
          </div>
          <p className="text-[10px] text-white/30 mt-1 ml-6">BlackDiamondClub</p>
        </div>

        <nav className="flex-1 px-3 py-5 space-y-1">
          {NAV.map((item) => {
            const active = location.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href}>
                <div className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all text-sm font-medium ${
                  active
                    ? "bg-yellow-400/10 text-yellow-400 border border-yellow-400/20"
                    : "text-white/50 hover:text-white hover:bg-white/5"
                }`}>
                  <Icon size={16} />
                  {item.label}
                  {active && <ChevronRight size={14} className="ml-auto" />}
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="px-3 py-5 border-t border-white/5">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-sm font-medium text-white/50 hover:text-red-400 hover:bg-red-400/5 transition-all"
          >
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-[#111]/90 backdrop-blur-xl border-b border-white/5 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-yellow-400">◆</span>
          <span className="text-xs font-bold tracking-widest uppercase">Admin</span>
        </div>
        <button onClick={() => setOpen(o => !o)} className="text-white/60 hover:text-white p-1">
          <div className="space-y-1">
            <div className="w-5 h-0.5 bg-current" />
            <div className="w-5 h-0.5 bg-current" />
            <div className="w-5 h-0.5 bg-current" />
          </div>
        </button>
      </div>

      {/* Mobile dropdown nav */}
      {open && (
        <div className="md:hidden fixed top-12 left-0 right-0 z-40 bg-[#111] border-b border-white/5 py-2 px-3">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = location.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href}>
                <div onClick={() => setOpen(false)} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium cursor-pointer ${active ? "text-yellow-400" : "text-white/50"}`}>
                  <Icon size={16} />
                  {item.label}
                </div>
              </Link>
            );
          })}
          <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 w-full text-sm font-medium text-red-400">
            <LogOut size={16} /> Sign out
          </button>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 md:ml-60 pt-14 md:pt-0 min-h-[100dvh] overflow-auto">
        <div className="max-w-7xl mx-auto p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}

export function AdminGuard({ children }: { children: ReactNode }) {
  const [, navigate] = useLocation();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("bdc_token");
    if (!token) {
      navigate("/admin/login");
      return;
    }
    fetch("/api/auth/me", { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => {
        if (!data?.id) { navigate("/admin/login"); return; }
        fetch(`/api/admin/dashboard`, { headers: { Authorization: `Bearer ${token}` } })
          .then(r => {
            if (r.status === 403 || r.status === 401) navigate("/admin/login");
            else setChecked(true);
          })
          .catch(() => navigate("/admin/login"));
      })
      .catch(() => navigate("/admin/login"));
  }, [navigate]);

  if (!checked) {
    return (
      <div className="min-h-[100dvh] bg-[#080808] flex items-center justify-center">
        <div className="text-yellow-400 text-sm animate-pulse">Verifying admin access…</div>
      </div>
    );
  }
  return <>{children}</>;
}
