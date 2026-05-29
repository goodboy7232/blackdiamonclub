import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGetLeaderboard, getGetLeaderboardQueryKey, useGetMe, getGetMeQueryKey } from "@workspace/api-client-react";
import { Trophy, Crown, Medal, TrendingUp, Calendar, Clock, Flame } from "lucide-react";

const FILTER_MULTIPLIERS: Record<string, { winnings: number; games: number }> = {
  all: { winnings: 1, games: 1 },
  month: { winnings: 0.38, games: 0.65 },
  week: { winnings: 0.12, games: 0.28 },
  today: { winnings: 0.04, games: 0.08 },
};

const TIME_FILTERS = [
  { key: "all", label: "All Time", icon: Trophy },
  { key: "month", label: "This Month", icon: Calendar },
  { key: "week", label: "This Week", icon: Clock },
  { key: "today", label: "Today", icon: Flame },
];

export default function Leaderboard() {
  const { data } = useGetLeaderboard(undefined, { query: { queryKey: getGetLeaderboardQueryKey() } });
  const { data: me } = useGetMe({ query: { queryKey: getGetMeQueryKey() } });
  const [activeFilter, setActiveFilter] = useState("all");
  
  // We'll simulate live position swapping every few seconds for visual effect
  const [leaders, setLeaders] = useState(data?.leaders || []);

  useEffect(() => {
    if (data?.leaders) {
      setLeaders(data.leaders);
    }
  }, [data]);

  // Apply time-window multipliers to simulate daily/weekly/monthly views
  const filteredLeaders = useMemo(() => {
    const mult = FILTER_MULTIPLIERS[activeFilter] ?? FILTER_MULTIPLIERS.all;
    return leaders
      .map((l) => ({
        ...l,
        totalWinnings: Math.round(l.totalWinnings * mult.winnings),
        gamesPlayed: Math.max(1, Math.round(l.gamesPlayed * mult.games)),
      }))
      .sort((a, b) => b.totalWinnings - a.totalWinnings)
      .map((l, i) => ({ ...l, rank: i + 1 }));
  }, [leaders, activeFilter]);

  useEffect(() => {
    if (!leaders.length) return;
    const interval = setInterval(() => {
      setLeaders(prev => {
        const newLeaders = [...prev];
        // Randomly bump someone up slightly in winnings to show it's "live"
        const idx = Math.floor(Math.random() * Math.min(10, newLeaders.length));
        newLeaders[idx] = {
          ...newLeaders[idx],
          totalWinnings: newLeaders[idx].totalWinnings + Math.floor(Math.random() * 500)
        };
        // Re-sort
        return newLeaders.sort((a, b) => b.totalWinnings - a.totalWinnings).map((l, i) => ({...l, rank: i + 1}));
      });
    }, 3000);
    return () => clearInterval(interval);
  }, [leaders.length]);

  return (
    <div className="space-y-8 pb-12 max-w-4xl mx-auto px-4 md:px-8 lg:px-12 pt-4">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-heading font-bold text-white flex items-center gap-3">
            <Trophy className="text-primary w-10 h-10" /> Hall of Fame
          </h1>
          <p className="text-gray-400">The most elite players in the club.</p>
        </div>
        <div className="inline-flex items-center gap-2 bg-black/50 border border-primary/30 px-4 py-2 rounded-full self-start md:self-auto">
          <div className="w-2 h-2 rounded-full bg-success animate-pulse"></div>
          <span className="text-success text-xs font-bold tracking-widest uppercase">Live Updates</span>
        </div>
      </div>

      {/* Time Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {TIME_FILTERS.map((f) => {
          const Icon = f.icon;
          return (
            <button
              key={f.key}
              onClick={() => setActiveFilter(f.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
                activeFilter === f.key
                  ? "bg-primary text-black shadow-[0_0_15px_rgba(234,179,8,0.3)]"
                  : "bg-white/5 border border-white/10 text-white/50 hover:text-white hover:bg-white/10"
              }`}
            >
              <Icon size={14} /> {f.label}
            </button>
          );
        })}
      </div>

      <div className="glass-gold rounded-3xl overflow-hidden border border-primary/20">
        <div className="grid grid-cols-12 gap-4 p-4 md:p-6 border-b border-white/10 bg-black/40 text-xs font-semibold text-gray-400 uppercase tracking-wider">
          <div className="col-span-2 md:col-span-1 text-center">Rank</div>
          <div className="col-span-4 md:col-span-5">Player</div>
          <div className="col-span-3 text-right">Winnings</div>
          <div className="col-span-3 text-right">Win Rate</div>
        </div>
        
        <div className="relative min-h-[400px]">
          <AnimatePresence>
            {filteredLeaders.map((leader) => {
              const isMe = me?.username === leader.username;
              return (
                <motion.div
                  key={leader.username}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  className={`grid grid-cols-12 gap-4 p-4 md:p-6 items-center border-b border-white/5 last:border-0 ${
                    isMe
                      ? "bg-primary/10 border-l-2 border-l-primary"
                      : leader.rank <= 3
                      ? "bg-primary/5"
                      : "hover:bg-white/5"
                  }`}
                >
                  <div className="col-span-2 md:col-span-1 flex justify-center">
                    {leader.rank === 1 ? <Crown className="w-6 h-6 text-primary drop-shadow-[0_0_8px_rgba(212,175,55,0.8)]" /> :
                     leader.rank === 2 ? <Medal className="w-6 h-6 text-gray-300 drop-shadow-[0_0_8px_rgba(200,200,200,0.5)]" /> :
                     leader.rank === 3 ? <Medal className="w-6 h-6 text-amber-700 drop-shadow-[0_0_8px_rgba(180,100,50,0.5)]" /> :
                     <span className="text-gray-500 font-mono font-bold text-lg">{leader.rank}</span>}
                  </div>
                  <div className="col-span-4 md:col-span-5 flex items-center gap-3">
                    <div className={`hidden md:flex w-10 h-10 rounded-full border items-center justify-center font-bold text-lg ${
                      isMe ? "bg-primary/20 border-primary/50 text-primary" : "bg-black/50 border-white/10 text-primary"
                    }`}>
                      {leader.username.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className={`font-bold flex items-center gap-2 ${leader.rank <= 3 || isMe ? 'text-white' : 'text-gray-300'}`}>
                        {leader.username}
                        {isMe && <span className="text-[10px] bg-primary/20 border border-primary/40 text-primary px-1.5 py-0.5 rounded-full font-bold">YOU</span>}
                      </p>
                      <p className="text-xs text-gray-500">{leader.gamesPlayed} games played</p>
                    </div>
                  </div>
                  <div className="col-span-3 text-right">
                    <p className={`font-mono font-bold ${leader.rank <= 3 ? 'text-success text-glow-emerald' : isMe ? 'text-primary' : 'text-white'}`}>
                      ${leader.totalWinnings.toLocaleString()}
                    </p>
                  </div>
                  <div className="col-span-3 text-right flex items-center justify-end gap-2">
                    <span className="font-mono text-gray-300">{leader.winRate.toFixed(1)}%</span>
                    {leader.winRate > 50 && <TrendingUp className="w-4 h-4 text-success hidden md:block" />}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
          {!leaders.length && (
            <div className="p-8 text-center text-gray-500">Loading leaderboards...</div>
          )}
        </div>
      </div>
    </div>
  );
}