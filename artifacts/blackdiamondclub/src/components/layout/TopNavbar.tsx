import { Link, useLocation } from "wouter";
import { useState, useRef, useEffect } from "react";
import { useGetWallet, getGetWalletQueryKey } from "@workspace/api-client-react";
import { useGetMe, getGetMeQueryKey, useLogout } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Wallet, Zap, User, LogOut, ChevronDown } from "lucide-react";
import { toast } from "sonner";

export function TopNavbar() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { data: wallet } = useGetWallet({ query: { queryKey: getGetWalletQueryKey() } });
  const { data: user } = useGetMe({ query: { queryKey: getGetMeQueryKey() } });
  const logoutMutation = useLogout();
  const balance = wallet?.totalBalance ?? wallet?.depositBalance ?? 0;
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        localStorage.removeItem("bdc_token");
        queryClient.clear();
        toast.success("Logged out successfully");
        setLocation("/login");
      },
    });
    setDropdownOpen(false);
  };

  const initials = user?.username
    ? user.username.slice(0, 2).toUpperCase()
    : "?";

  const navItems = [
    { href: "/", label: "Home" },
    { href: "/games", label: "Games" },
    { href: "/games", label: "Live Casino" },
    { href: "/games", label: "Slots" },
    { href: "/games", label: "Crash" },
    { href: "/wallet", label: "Wallet" },
    { href: "/profile", label: "VIP" },
    { href: "/leaderboard", label: "Leaders" },
  ];

  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-16 border-b border-white/5 bg-[#0a0a0a]/90 backdrop-blur-xl flex items-center justify-between px-4 md:px-8 lg:px-12">
      {/* Logo */}
      <Link href="/">
        <div className="flex items-center gap-2 cursor-pointer group">
          <img
            src="/assets/logo.png"
            alt="BlackDiamondClub"
            className="h-10 w-10 object-contain rounded-lg group-hover:scale-105 transition-transform"
          />
          <span className="hidden md:inline text-lg font-bold tracking-wider text-white group-hover:text-primary transition-colors">
            BLACK<span className="text-primary">DIAMOND</span>
          </span>
        </div>
      </Link>

      {/* Center Nav */}
      <div className="hidden lg:flex items-center gap-6">
        {navItems.map((item) => (
          <Link key={item.label} href={item.href}>
            <span className="text-sm text-white/60 hover:text-primary transition-colors cursor-pointer font-medium tracking-wide">
              {item.label}
            </span>
          </Link>
        ))}
      </div>

      {/* Right Side */}
      <div className="flex items-center gap-3">
        {/* Balance */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
          <Wallet size={14} className="text-primary" />
          <span className="text-sm font-bold text-white">${balance.toFixed(2)}</span>
        </div>

        {/* Deposit Button */}
        <button
          onClick={() => {
            window.location.href = `${window.location.origin}${import.meta.env.BASE_URL}wallet#deposit`;
          }}
          className="h-9 px-4 rounded-lg bg-gradient-to-r from-yellow-500 to-red-500 text-white text-sm font-bold hover:from-yellow-400 hover:to-red-400 transition-all shadow-[0_0_15px_rgba(234,179,8,0.3)] active:scale-95"
        >
          <Zap size={14} className="inline mr-1" /> Deposit
        </button>

        {/* User Avatar Dropdown */}
        {user ? (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen((o) => !o)}
              className="flex items-center justify-center w-9 h-9 rounded-full bg-gradient-to-br from-primary to-yellow-600 border border-primary/40 hover:scale-105 transition-transform cursor-pointer"
              data-testid="user-avatar-btn"
            >
              <span className="text-black font-black text-xs leading-none">{initials}</span>
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 top-12 w-52 bg-[#111] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50 py-1">
                <div className="px-4 py-3 border-b border-white/10">
                  <p className="text-white font-bold text-sm truncate">{user.username}</p>
                  <p className="text-white/40 text-xs">{user.isAdmin ? "Administrator" : "Member"}</p>
                </div>
                <Link href="/profile">
                  <button
                    onClick={() => setDropdownOpen(false)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-white/70 hover:bg-white/5 hover:text-white transition-colors"
                  >
                    <User size={15} className="text-primary" /> Profile &amp; Settings
                  </button>
                </Link>
                <Link href="/wallet">
                  <button
                    onClick={() => setDropdownOpen(false)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-white/70 hover:bg-white/5 hover:text-white transition-colors"
                  >
                    <Wallet size={15} className="text-yellow-400" /> Wallet
                  </button>
                </Link>
                <div className="border-t border-white/10 mt-1" />
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                  data-testid="btn-logout"
                >
                  <LogOut size={15} /> Logout
                </button>
              </div>
            )}
          </div>
        ) : (
          <Link href="/login">
            <button className="flex items-center gap-1.5 h-9 px-4 rounded-lg bg-white/5 border border-white/10 text-white/70 text-sm font-bold hover:bg-white/10 transition-all">
              <ChevronDown size={14} /> Sign In
            </button>
          </Link>
        )}
      </div>
    </div>
  );
}
