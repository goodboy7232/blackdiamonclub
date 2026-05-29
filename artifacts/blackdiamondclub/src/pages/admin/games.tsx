import { useEffect, useState } from "react";
import { adminApi, AdminGameSession, GameProfit } from "@/lib/admin-api";
import { toast } from "sonner";

const GAME_TYPES = [
  "", "aviator", "slots777", "rocketrush", "coinflip", "spinsprint",
  "dicedash", "towerclimb", "luckywheel", "numberblast", "gemdrop",
];

export default function AdminGamesPage() {
  const [sessions, setSessions] = useState<AdminGameSession[]>([]);
  const [profits, setProfits] = useState<GameProfit[]>([]);
  const [loading, setLoading] = useState(true);
  const [gameFilter, setGameFilter] = useState("");

  useEffect(() => {
    setLoading(true);
    adminApi.games({ gameType: gameFilter || undefined, limit: 100 })
      .then(d => { setSessions(d.sessions); setProfits(d.gameProfits); })
      .catch(e => toast.error(e.message))
      .finally(() => setLoading(false));
  }, [gameFilter]);

  const totalProfit = profits.reduce((s, g) => s + g.profit, 0);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Games</h1>
        <p className="text-white/40 text-sm mt-1">Game sessions and profit overview</p>
      </div>

      {/* Profit summary */}
      {profits.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold text-white/40 uppercase tracking-wider">Profit by Game</h2>
            <span className={`text-sm font-bold ${totalProfit >= 0 ? "text-emerald-400" : "text-red-400"}`}>
              Total: ${totalProfit.toFixed(2)}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {profits.map(g => (
              <div key={g.gameType} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-white capitalize">{g.gameType}</p>
                    <p className="text-xs text-white/30 mt-0.5">{g.totalBets} bets · {g.totalWins} wins</p>
                  </div>
                  <span className={`text-sm font-bold font-mono ${g.profit >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    ${g.profit.toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="mb-4">
        <select
          value={gameFilter}
          onChange={e => setGameFilter(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-yellow-400/40"
        >
          {GAME_TYPES.map(t => (
            <option key={t} value={t}>{t ? t.charAt(0).toUpperCase() + t.slice(1) : "All Games"}</option>
          ))}
        </select>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 text-white/30 text-xs uppercase tracking-wider">
                <th className="px-4 py-3 text-left">ID</th>
                <th className="px-4 py-3 text-left">Player</th>
                <th className="px-4 py-3 text-left">Game</th>
                <th className="px-4 py-3 text-right">Bet</th>
                <th className="px-4 py-3 text-right">Win</th>
                <th className="px-4 py-3 text-right">Multiplier</th>
                <th className="px-4 py-3 text-center">Result</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Date</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} className="px-4 py-8 text-center text-white/30">Loading…</td></tr>
              ) : sessions.length === 0 ? (
                <tr><td colSpan={9} className="px-4 py-8 text-center text-white/30">No game sessions found</td></tr>
              ) : sessions.map(s => (
                <tr key={s.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3 text-white/40 font-mono text-xs">#{s.id}</td>
                  <td className="px-4 py-3 text-white">{s.username}</td>
                  <td className="px-4 py-3 text-white/70 capitalize">{s.gameType}</td>
                  <td className="px-4 py-3 text-right text-white font-mono">${s.betAmount.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right font-mono">
                    {s.winAmount > 0 ? (
                      <span className="text-emerald-400">${s.winAmount.toFixed(2)}</span>
                    ) : (
                      <span className="text-white/20">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right text-white/60 font-mono">{s.multiplier.toFixed(2)}x</td>
                  <td className="px-4 py-3 text-center">
                    {s.isActive ? (
                      <span className="text-xs bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full">Active</span>
                    ) : s.won ? (
                      <span className="text-xs bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full">Win</span>
                    ) : (
                      <span className="text-xs bg-red-500/10 text-red-400 px-2 py-0.5 rounded-full">Loss</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {s.isActive ? (
                      <span className="inline-block w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                    ) : (
                      <span className="text-white/20 text-xs">Settled</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right text-white/30 text-xs">{new Date(s.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
