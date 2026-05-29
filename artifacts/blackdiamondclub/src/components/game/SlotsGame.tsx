import { useEffect, useState, useRef } from "react";

const SYMBOLS = ["7", "💎", "🍒", "⭐", "🔔", "🍋", "BAR", "🃏"];
const WIN_LINES = [
  { syms: ["7","7","7"], mult: 20, label: "JACKPOT" },
  { syms: ["💎","💎","💎"], mult: 10, label: "DIAMOND" },
  { syms: ["⭐","⭐","⭐"], mult: 8, label: "STAR POWER" },
  { syms: ["🍒","🍒","🍒"], mult: 6, label: "CHERRY BOOM" },
  { syms: ["🔔","🔔","🔔"], mult: 5, label: "BELLS" },
];

interface Props {
  phase: "idle" | "spinning" | "won" | "lost";
  result?: { symbols?: string[]; won: boolean; multiplier?: number };
}

function Reel({ finalSym, spinning }: { finalSym: string; spinning: boolean }) {
  const items = [...SYMBOLS, ...SYMBOLS, ...SYMBOLS];

  return (
    <div className="relative w-24 h-24 overflow-hidden rounded-xl bg-black/60 border border-white/10 flex items-center justify-center">
      {spinning ? (
        <div className="animate-spin-reel flex flex-col items-center">
          {items.map((s, i) => (
            <div key={i} className="h-24 flex items-center justify-center text-4xl">{s}</div>
          ))}
        </div>
      ) : (
        <div className="text-4xl">{finalSym}</div>
      )}
      {/* Shine overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/5 via-transparent to-white/5 pointer-events-none rounded-xl" />
    </div>
  );
}

export default function SlotsGame({ phase, result }: Props) {
  const [displaySymbols, setDisplaySymbols] = useState(["7", "7", "7"]);
  const [reelDone, setReelDone] = useState([true, true, true]);
  const timerRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    if (phase === "spinning") {
      setReelDone([false, false, false]);
      const syms = result?.symbols ?? ["7", "💎", "🍒"];
      timerRef.current.forEach(t => clearTimeout(t));
      timerRef.current = [];
      [0, 1, 2].forEach(i => {
        const t = setTimeout(() => {
          setDisplaySymbols(prev => { const n = [...prev]; n[i] = syms[i]; return n; });
          setReelDone(prev => { const n = [...prev]; n[i] = true; return n; });
        }, 600 + i * 400);
        timerRef.current.push(t);
      });
    }
  }, [phase, result]);

  const allMatch = displaySymbols[0] === displaySymbols[1] && displaySymbols[1] === displaySymbols[2];
  const winLine = WIN_LINES.find(w => w.syms.join("") === displaySymbols.join(""));

  return (
    <div className="flex flex-col items-center justify-center h-full gap-6">
      {/* Machine frame */}
      <div className={`relative p-6 rounded-3xl border-2 transition-all duration-500 ${
        phase === "won" ? "border-yellow-400 shadow-[0_0_40px_rgba(250,204,21,0.4)]" :
        phase === "lost" ? "border-red-500/30" : "border-white/10"
      } bg-gradient-to-b from-[#1a1a2e] to-[#16213e]`}>
        
        {/* Win label */}
        {winLine && phase === "won" && (
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-yellow-400 text-black text-xs font-black px-4 py-1 rounded-full whitespace-nowrap">
            {winLine.label} {winLine.mult}x
          </div>
        )}

        {/* Reels */}
        <div className="flex gap-3">
          {[0, 1, 2].map(i => (
            <div key={i} className={`transition-all duration-300 ${phase === "won" && allMatch ? "scale-110" : ""}`}>
              <Reel finalSym={displaySymbols[i]} spinning={phase === "spinning" && !reelDone[i]} />
            </div>
          ))}
        </div>

        {/* Win line indicator */}
        <div className={`mt-3 h-0.5 rounded-full transition-all duration-500 ${
          phase === "won" ? "bg-yellow-400" : "bg-white/10"
        }`} />
      </div>

      {/* Paytable */}
      <div className="grid grid-cols-3 gap-2 text-xs text-white/40 w-full max-w-sm">
        <div className="text-center">7️⃣7️⃣7️⃣ = <span className="text-yellow-400 font-bold">20x</span></div>
        <div className="text-center">💎💎💎 = <span className="text-cyan-400 font-bold">10x</span></div>
        <div className="text-center">⭐⭐⭐ = <span className="text-yellow-300 font-bold">8x</span></div>
      </div>

      {/* Result */}
      {(phase === "won" || phase === "lost") && (
        <div className={`text-2xl font-bold ${phase === "won" ? "text-yellow-400" : "text-red-400"}`}>
          {phase === "won" ? `${result?.multiplier}x WIN! 🎉` : "Try Again! 💸"}
        </div>
      )}
    </div>
  );
}
