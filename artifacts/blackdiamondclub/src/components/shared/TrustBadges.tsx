import { Shield, BadgeCheck, Lock, Scale, Headphones, RefreshCcw } from "lucide-react";

const badges = [
  { icon: Shield, label: "SSL Secured", color: "text-green-400", bg: "bg-green-400/10 border-green-400/20" },
  { icon: BadgeCheck, label: "Provably Fair", color: "text-yellow-400", bg: "bg-yellow-400/10 border-yellow-400/20" },
  { icon: Lock, label: "Licensed & Regulated", color: "text-cyan-400", bg: "bg-cyan-400/10 border-cyan-400/20" },
  { icon: Scale, label: "Responsible Gaming", color: "text-purple-400", bg: "bg-purple-400/10 border-purple-400/20" },
  { icon: Headphones, label: "24/7 Support", color: "text-blue-400", bg: "bg-blue-400/10 border-blue-400/20" },
  { icon: RefreshCcw, label: "Fast Payouts", color: "text-emerald-400", bg: "bg-emerald-400/10 border-emerald-400/20" },
];

export function TrustBadges({ className = "" }: { className?: string }) {
  return (
    <div className={`flex flex-wrap justify-center gap-3 ${className}`}>
      {badges.map((b) => {
        const Icon = b.icon;
        return (
          <div
            key={b.label}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold ${b.bg} ${b.color}`}
          >
            <Icon size={13} />
            <span>{b.label}</span>
          </div>
        );
      })}
    </div>
  );
}

export function ProvablyFairBadge({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold ${className}`}>
      <BadgeCheck size={10} />
      Provably Fair
    </div>
  );
}
