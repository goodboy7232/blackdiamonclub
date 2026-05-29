import { Link } from "wouter";
import { Play, FlaskConical, Users, TrendingUp, Zap } from "lucide-react";
import { useDemo } from "@/hooks/useDemo";
import { ProvablyFairBadge } from "@/components/shared/TrustBadges";

const GAMES = [
  {
    id: "aviator", name: "Aviator Crash", desc: "Cash out before it crashes", rtp: "97%",
    hot: true, tag: "🔥 Most Popular",
    gradient: "from-[#0b1120] via-[#0d1a30] to-[#0a0f1e]",
    accent: "#3b82f6",
    emoji: "✈️",
    players: 247,
  },
  {
    id: "slots777", name: "777 Strike", desc: "Classic slot machine jackpot", rtp: "96%",
    hot: false, tag: "⭐ Classic",
    gradient: "from-[#1a0d00] via-[#2a1800] to-[#1a0d00]",
    accent: "#f59e0b",
    emoji: "🎰",
    players: 183,
  },
  {
    id: "luckywheel", name: "Lucky Wheel", desc: "Spin your way to riches", rtp: "95%",
    hot: false, tag: "🎡 Fan Favourite",
    gradient: "from-[#0d001a] via-[#1a0030] to-[#0d001a]",
    accent: "#a855f7",
    emoji: "🎡",
    players: 129,
  },
  {
    id: "coinflip", name: "Coin Flip Quest", desc: "Heads or tails — 1.9x", rtp: "95%",
    hot: false, tag: "⚡ Fast Play",
    gradient: "from-[#001a10] via-[#002a18] to-[#001a10]",
    accent: "#10b981",
    emoji: "🪙",
    players: 94,
  },
  {
    id: "rocketrush", name: "Rocket Rush", desc: "Set your target, watch it fly", rtp: "96%",
    hot: true, tag: "🚀 New",
    gradient: "from-[#1a0010] via-[#2a0020] to-[#1a0010]",
    accent: "#f43f5e",
    emoji: "🚀",
    players: 112,
  },
  {
    id: "dicedash", name: "Dice Dash", desc: "Roll and win up to 30x", rtp: "94%",
    hot: false, tag: "🎲 Strategy",
    gradient: "from-[#001020] via-[#001830] to-[#001020]",
    accent: "#06b6d4",
    emoji: "🎲",
    players: 78,
  },
  {
    id: "towerclimb", name: "Tower Climb", desc: "Climb floors, beat the bombs", rtp: "96%",
    hot: false, tag: "🏰 Adventure",
    gradient: "from-[#100a00] via-[#201400] to-[#100a00]",
    accent: "#eab308",
    emoji: "🏰",
    players: 66,
  },
  {
    id: "numberblast", name: "Number Blast", desc: "Guess close to win 9x", rtp: "95%",
    hot: false, tag: "🎯 Skill",
    gradient: "from-[#0a1a00] via-[#102200] to-[#0a1a00]",
    accent: "#84cc16",
    emoji: "🎯",
    players: 55,
  },
  {
    id: "spinsprint", name: "Spin Sprint", desc: "Speed wheel — up to 10x", rtp: "94%",
    hot: false, tag: "⚡ Speed",
    gradient: "from-[#1a001a] via-[#2a002a] to-[#1a001a]",
    accent: "#ec4899",
    emoji: "💫",
    players: 48,
  },
  {
    id: "gemdrop", name: "Gem Drop", desc: "Match gems for big prizes", rtp: "94%",
    hot: false, tag: "💎 Match",
    gradient: "from-[#001a1a] via-[#002a2a] to-[#001a1a]",
    accent: "#22d3ee",
    emoji: "💎",
    players: 41,
  },
];

export default function Games() {
  const { isDemo } = useDemo();

  return (
    <div className="pb-12 space-y-8 px-4 md:px-8 lg:px-12 pt-4">
      {/* Hero */}
      <div className="relative rounded-3xl overflow-hidden border border-white/10 p-8 bg-gradient-to-br from-[#0b0e1a] to-[#0d1117]">
        <div className="absolute inset-0 opacity-30" style={{ backgroundImage: "radial-gradient(circle at 20% 50%, #3b82f620 0%, transparent 60%), radial-gradient(circle at 80% 20%, #a855f720 0%, transparent 50%)" }} />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-emerald-400 text-xs font-bold uppercase tracking-widest">Live Casino</span>
          </div>
          <h1 className="text-4xl font-black text-white mb-2">Casino Floor</h1>
          <p className="text-white/40 text-sm mb-5">10 games · Real money & free demo mode available</p>
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm">
              <Users size={14} className="text-yellow-400" />
              <span className="text-white">{GAMES.reduce((a, g) => a + g.players, 0)} players online</span>
            </div>
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm">
              <TrendingUp size={14} className="text-emerald-400" />
              <span className="text-white">$42,830 won today</span>
            </div>
            {isDemo && (
              <div className="flex items-center gap-2 bg-purple-500/10 border border-purple-400/20 rounded-xl px-4 py-2 text-sm">
                <FlaskConical size={14} className="text-purple-400" />
                <span className="text-purple-300">Demo mode active</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Games grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {GAMES.map((game) => (
          <div
            key={game.id}
            className={`group relative rounded-2xl overflow-hidden border border-white/10 bg-gradient-to-br ${game.gradient} hover:border-white/20 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl`}
            style={{ boxShadow: `0 0 0 0 ${game.accent}00` }}
            data-testid={`game-card-${game.id}`}
          >
            {/* Glow on hover */}
            <div
              className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300 pointer-events-none"
              style={{ background: `radial-gradient(circle at center, ${game.accent}, transparent 70%)` }}
            />

            {/* Hot badge */}
            {game.hot && (
              <div className="absolute top-3 right-3 z-10 text-xs font-black px-2 py-0.5 rounded-full bg-red-500/20 border border-red-400/30 text-red-300">
                HOT
              </div>
            )}

            {/* Poster area */}
            <div className="relative h-36 flex items-center justify-center overflow-hidden">
              {/* Decorative circles */}
              <div className="absolute w-32 h-32 rounded-full opacity-20" style={{ background: `radial-gradient(circle, ${game.accent}, transparent)` }} />
              <div className="text-7xl group-hover:scale-110 transition-transform duration-500 select-none filter drop-shadow-2xl">
                {game.emoji}
              </div>
              {/* Live dot */}
              <div className="absolute bottom-3 left-3 flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-emerald-400 text-xs">{game.players} live</span>
              </div>
            </div>

            {/* Info */}
            <div className="p-4">
              <div className="flex items-start justify-between mb-1">
                <h3 className="text-base font-black text-white">{game.name}</h3>
                <span className="text-xs text-white/30 font-medium ml-2 mt-0.5">RTP {game.rtp}</span>
              </div>
              <p className="text-white/40 text-xs mb-1">{game.desc}</p>
              <p className="text-xs mb-4" style={{ color: game.accent + "aa" }}>{game.tag}</p>

              {/* Provably Fair Badge */}
              <div className="mb-3">
                <ProvablyFairBadge />
              </div>

              {/* Buttons */}
              <div className="flex gap-2">
                <Link href={`/game/${game.id}`} className="flex-1">
                  <button
                    className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-black text-black transition-all active:scale-95"
                    style={{ background: `linear-gradient(135deg, ${game.accent}, ${game.accent}cc)` }}
                    data-testid={`play-btn-${game.id}`}
                  >
                    <Play size={14} /> Play
                  </button>
                </Link>
                <Link href={`/game/${game.id}?demo=true`}>
                  <button
                    onClick={() => {
                      if (typeof window !== "undefined") localStorage.setItem("bdc_demo", "true");
                    }}
                    className="flex items-center justify-center gap-1 px-3 py-2.5 rounded-xl text-xs font-bold bg-white/5 border border-white/10 text-white/50 hover:text-white hover:bg-white/10 transition-all"
                    title="Free Demo"
                  >
                    <FlaskConical size={12} />
                    Demo
                  </button>
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom CTA */}
      <div className="text-center py-6 border-t border-white/5">
        <p className="text-white/20 text-sm mb-2">New to gambling? Try demo mode first — no deposit needed.</p>
        <Link href="/game/aviator">
          <button className="flex items-center gap-2 mx-auto px-6 py-3 rounded-xl bg-gradient-to-r from-yellow-500 to-yellow-400 text-black font-black text-sm hover:from-yellow-400 hover:to-yellow-300 transition-all shadow-[0_0_20px_rgba(250,204,21,0.2)]">
            <Zap size={16} /> Play Aviator Now
          </button>
        </Link>
      </div>
    </div>
  );
}
