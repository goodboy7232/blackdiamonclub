import { Link, useLocation } from "wouter";
import { Home, Gamepad2, Wallet, Trophy, User } from "lucide-react";

export function BottomNav() {
  const [location] = useLocation();

  const navItems = [
    { href: "/", label: "Home", icon: Home },
    { href: "/games", label: "Games", icon: Gamepad2 },
    { href: "/wallet", label: "Wallet", icon: Wallet },
    { href: "/leaderboard", label: "Leaders", icon: Trophy },
    { href: "/profile", label: "Profile", icon: User },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 glass-gold border-t-0 rounded-t-2xl px-6 py-3 pb-safe">
      <div className="flex justify-between items-center">
        {navItems.map((item) => {
          const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
          const Icon = item.icon;
          
          return (
            <Link key={item.href} href={item.href}>
              <div 
                className={`flex flex-col items-center justify-center w-12 transition-all duration-300 cursor-pointer ${
                  isActive ? "text-primary scale-110" : "text-muted-foreground hover:text-white"
                }`}
                data-testid={`nav-${item.label.toLowerCase()}`}
              >
                <div className={`relative ${isActive ? "drop-shadow-[0_0_8px_rgba(212,175,55,0.8)]" : ""}`}>
                  <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                  {isActive && (
                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full"></span>
                  )}
                </div>
                <span className={`text-[10px] mt-1 font-medium ${isActive ? "opacity-100" : "opacity-0 h-0 overflow-hidden"}`}>
                  {item.label}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}