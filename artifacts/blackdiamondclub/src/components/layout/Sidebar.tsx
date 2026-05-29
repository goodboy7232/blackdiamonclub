import { Link, useLocation } from "wouter";
import { Home, Gamepad2, Wallet, Trophy, User } from "lucide-react";

export function Sidebar() {
  const [location] = useLocation();

  const navItems = [
    { href: "/", label: "Home", icon: Home },
    { href: "/games", label: "Games", icon: Gamepad2 },
    { href: "/wallet", label: "Wallet", icon: Wallet },
    { href: "/leaderboard", label: "Leaders", icon: Trophy },
    { href: "/profile", label: "Profile", icon: User },
  ];

  return (
    <div className="hidden md:flex flex-col w-64 h-[100dvh] fixed left-0 top-16 border-r border-white/5 bg-card/40 backdrop-blur-xl z-40">
      <div className="p-6">
        <Link href="/">
          <div className="cursor-pointer group flex items-center gap-3">
            <img
              src="/assets/logo.png"
              alt="BlackDiamondClub"
              className="h-12 w-12 object-contain rounded-lg group-hover:scale-105 transition-transform"
            />
            <span className="text-xl font-heading font-bold tracking-wider text-white group-hover:text-primary transition-colors">
              BLACK<span className="text-primary">DIAMOND</span>
            </span>
          </div>
        </Link>
      </div>
      
      <div className="flex-1 px-4 py-6 space-y-1">
        {navItems.map((item) => {
          const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
          const Icon = item.icon;
          
          return (
            <Link key={item.href} href={item.href}>
              <div 
                className={`flex items-center space-x-4 px-4 py-3.5 rounded-xl transition-all duration-300 cursor-pointer ${
                  isActive 
                    ? "bg-primary/10 text-primary neon-border" 
                    : "text-muted-foreground hover:bg-white/5 hover:text-white"
                }`}
                data-testid={`sidebar-${item.label.toLowerCase()}`}
              >
                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} className={isActive ? "drop-shadow-[0_0_8px_rgba(212,175,55,0.8)]" : ""} />
                <span className="font-medium tracking-wide">{item.label}</span>
              </div>
            </Link>
          );
        })}
      </div>
      
      <div className="p-6 text-center text-xs text-muted-foreground">
        <p>&copy; 2025 BlackDiamondClub.</p>
        <p>All Rights Reserved.</p>
      </div>
    </div>
  );
}
