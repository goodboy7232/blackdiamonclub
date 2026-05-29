import { useState, useEffect, useRef, useCallback } from "react";

interface Props {
  phase: "idle" | "blasting" | "won" | "lost";
  result?: { won: boolean; multiplier?: number; data?: { answer?: number; guess?: number } };
  onPrediction?: (val: string) => void;
  prediction?: string;
}

const RANGE = 10;
const HOT_COUNT = 5;
const COLD_COUNT = 5;
const HISTORY_LEN = 8;

// Payout tiers: 1-10 range, 9x exact, 3x close (±1), 1.5x near (±2)
const TIERS = [
  { maxDiff: 0,  mult: 9,  label: "EXACT",  color: "text-yellow-400",  glow: "shadow-[0_0_30px_rgba(250,204,21,0.6)]" },
  { maxDiff: 1,  mult: 3,  label: "CLOSE",  color: "text-cyan-400",    glow: "shadow-[0_0_20px_rgba(34,211,238,0.5)]" },
  { maxDiff: 2,  mult: 1.5, label: "NEAR",  color: "text-purple-400",  glow: "shadow-[0_0_14px_rgba(168,85,247,0.4)]" },
];

function generateHistory(): number[] {
  return Array.from({ length: HISTORY_LEN }, () => Math.floor(Math.random() * RANGE) + 1);
}

function getHotCold(history: number[]) {
  const freq: Record<number, number> = {};
  history.forEach(n => { freq[n] = (freq[n] || 0) + 1; });
  const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]);
  const hot = sorted.slice(0, HOT_COUNT).map(([n]) => parseInt(n));
  const cold = sorted.slice(-COLD_COUNT).map(([n]) => parseInt(n));
  return { hot, cold };
}

export default function NumberBlastGame({ phase, result, onPrediction, prediction }: Props) {
  const [selected, setSelected] = useState<number | null>(prediction ? parseInt(prediction) : null);
  const [displayNum, setDisplayNum] = useState<number | null>(null);
  const [rollState, setRollState] = useState<"idle" | "rolling" | "countdown" | "revealed">("idle");
  const [countdown, setCountdown] = useState(3);
  const [history, setHistory] = useState<number[]>(generateHistory);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { hot, cold } = getHotCold(history);

  const getTier = useCallback((diff: number) => {
    for (const t of TIERS) {
      if (diff <= t.maxDiff) return t;
    }
    return null;
  }, []);

  useEffect(() => {
    if (phase === "blasting") {
      setRollState("countdown");
      setCountdown(3);
      setDisplayNum(null);

      let cd = 3;
      countRef.current = setInterval(() => {
        cd--;
        setCountdown(cd);
        if (cd <= 0) {
          if (countRef.current) clearInterval(countRef.current);
          setRollState("rolling");
          intervalRef.current = setInterval(() => {
            setDisplayNum(Math.floor(Math.random() * RANGE) + 1);
          }, 80);
        }
      }, 300);

      return () => {
        if (countRef.current) clearInterval(countRef.current);
        if (intervalRef.current) clearInterval(intervalRef.current);
      };
    }

    if (phase === "idle") {
      setDisplayNum(null);
      setRollState("idle");
      setCountdown(3);
    }

    if (phase === "won" || phase === "lost") {
      const ans = result?.data?.answer ?? null;
      setDisplayNum(ans);
      setRollState("revealed");
      if (ans != null) {
        setHistory(prev => [ans, ...prev].slice(0, HISTORY_LEN));
      }
      if (phase === "won") {
        setStreak(s => {
          const ns = s + 1;
          setBestStreak(b => Math.max(b, ns));
          return ns;
        });
      } else {
        setStreak(0);
      }
    }

    return undefined;
  }, [phase, result]);

  const diff = displayNum != null && selected != null ? Math.abs(displayNum - selected) : null;
  const tier = diff != null ? getTier(diff) : null;

  const isHot = (n: number) => hot.includes(n);
  const isCold = (n: number) => cold.includes(n);

  return (
    <div className="flex flex-col items-center justify-center h-full gap-3 px-3 select-none">
      {/* HUD */}
      <div className="flex items-center gap-3 w-full max-w-sm justify-center">
        <div className="px-3 py-1.5 rounded-xl bg-black/40 border border-white/10 text-center">
          <div className="text-white/40 text-[10px] font-bold tracking-wider">STREAK</div>
          <div className={`text-lg font-black ${streak >= 3 ? "text-yellow-400" : "text-white"}`}>
            {streak}x{streak >= 3 && " ✨"}
          </div>
        </div>
        <div className="px-3 py-1.5 rounded-xl bg-black/40 border border-cyan-400/20 text-center">
          <div className="text-white/40 text-[10px] font-bold tracking-wider">BEST</div>
          <div className="text-cyan-400 text-lg font-black">{bestStreak}x</div>
        </div>
        <div className="px-3 py-1.5 rounded-xl bg-black/40 border border-purple-400/20 text-center">
          <div className="text-white/40 text-[10px] font-bold tracking-wider">RANGE</div>
          <div className="text-purple-400 text-lg font-black">1-{RANGE}</div>
        </div>
      </div>

      {/* Number Display */}
      <div className="relative flex flex-col items-center gap-2" style={{ minHeight: 140 }}>
        {/* Countdown */}
        {rollState === "countdown" && (
          <div className="flex flex-col items-center gap-2">
            <div className="text-white/40 text-xs font-bold tracking-widest animate-pulse">GET READY</div>
            <div className="w-20 h-20 rounded-full border-4 border-cyan-400/30 flex items-center justify-center bg-black/60">
              <span className="text-4xl font-black text-cyan-400 animate-pulse">{countdown}</span>
            </div>
          </div>
        )}

        {/* Rolling / Revealed */}
        {(rollState === "rolling" || rollState === "revealed") && displayNum != null && (
          <div className="flex flex-col items-center gap-2">
            {rollState === "rolling" && (
              <div className="text-white/40 text-xs font-bold tracking-widest animate-pulse">DRAWING...</div>
            )}
            {rollState === "revealed" && tier && (
              <div className={`text-xs font-bold tracking-widest ${tier.color} animate-pulse`}>
                {tier.label} MATCH! {tier.mult}x
              </div>
            )}
            {rollState === "revealed" && !tier && (
              <div className="text-red-400 text-xs font-bold tracking-widest">TOO FAR!</div>
            )}
            <div
              className={`w-24 h-24 rounded-2xl flex items-center justify-center font-black text-4xl border-4 transition-all duration-300 ${
                rollState === "rolling"
                  ? "bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border-cyan-400/40 text-cyan-300 shadow-[0_0_20px_rgba(34,211,238,0.3)] animate-pulse"
                  : tier
                  ? `bg-gradient-to-br from-white/10 to-white/5 border-white/30 text-white ${tier.glow}`
                  : "bg-gradient-to-br from-red-500/20 to-red-900/20 border-red-500/40 text-red-300 shadow-[0_0_16px_rgba(239,68,68,0.3)]"
              }`}
            >
              {displayNum}
            </div>
          </div>
        )}

        {/* Idle placeholder */}
        {rollState === "idle" && (
          <div className="flex flex-col items-center gap-2">
            <div className="text-white/30 text-xs font-bold tracking-widest">PICK A NUMBER</div>
            <div className="w-24 h-24 rounded-2xl border-4 border-dashed border-white/10 flex items-center justify-center bg-white/[0.02]">
              <span className="text-white/20 text-3xl font-black">?</span>
            </div>
          </div>
        )}
      </div>

      {/* Hot / Cold indicators */}
      <div className="flex gap-3 w-full max-w-sm">
        <div className="flex-1 flex items-center gap-1.5 px-2 py-1 rounded-lg bg-orange-500/10 border border-orange-500/20 overflow-hidden">
          <span className="text-orange-400 text-[10px] font-bold shrink-0">🔥 HOT</span>
          {hot.slice(0, 4).map(n => (
            <span key={n} className="text-orange-300 text-[10px] font-black">{n}</span>
          ))}
        </div>
        <div className="flex-1 flex items-center gap-1.5 px-2 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20 overflow-hidden">
          <span className="text-blue-400 text-[10px] font-bold shrink-0">❄️ COLD</span>
          {cold.slice(0, 4).map(n => (
            <span key={n} className="text-blue-300 text-[10px] font-black">{n}</span>
          ))}
        </div>
      </div>

      {/* Number Grid 1-10 */}
      <div className="grid grid-cols-5 gap-2 w-full max-w-[280px]">
        {Array.from({ length: RANGE }, (_, i) => {
          const n = i + 1;
          const isSelected = selected === n;
          const isHotNum = isHot(n);
          const isColdNum = isCold(n);
          const isAnswer = displayNum === n && rollState === "revealed";
          const isClose = diff != null && diff <= 2 && !isAnswer && selected != null && Math.abs(n - (displayNum ?? 0)) <= 2;

          return (
            <button
              key={n}
              onClick={() => {
                if (phase === "idle") {
                  setSelected(n);
                  onPrediction?.(String(n));
                }
              }}
              disabled={phase !== "idle"}
              className={`h-10 rounded-lg text-sm font-bold border transition-all duration-150 ${
                isAnswer
                  ? "scale-125 bg-yellow-400 border-yellow-200 text-black shadow-[0_0_16px_rgba(250,204,21,0.7)] z-10"
                  : isClose && rollState === "revealed"
                  ? "scale-110 bg-cyan-500/30 border-cyan-400 text-cyan-200"
                  : isSelected
                  ? "bg-yellow-400/20 border-yellow-400 text-yellow-300 scale-105 shadow-[0_0_8px_rgba(250,204,21,0.2)]"
                  : isHotNum
                  ? "bg-orange-500/15 border-orange-500/30 text-orange-300"
                  : isColdNum
                  ? "bg-blue-500/10 border-blue-500/20 text-blue-300/60"
                  : "bg-white/[0.03] border-white/[0.06] text-white/40 hover:bg-white/10 hover:text-white/60"
              }`}
            >
              {n}
            </button>
          );
        })}
      </div>

      {/* Payout tiers */}
      <div className="flex gap-2">
        {TIERS.map(t => (
          <div key={t.label} className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-[10px] bg-white/[0.03] ${t.color.replace("text-", "border-").replace("400", "400/30")}`}>
            <span className={`font-bold ${t.color}`}>{t.mult}x</span>
            <span className="text-white/30">{t.label}</span>
          </div>
        ))}
      </div>

      {/* History strip */}
      <div className="flex items-center gap-2 w-full max-w-sm">
        <span className="text-white/30 text-[10px] font-bold shrink-0">HISTORY</span>
        <div className="flex gap-1 overflow-hidden">
          {history.slice(0, 8).map((n, i) => (
            <div
              key={i}
              className={`w-6 h-6 rounded-md flex items-center justify-center text-[9px] font-black border ${
                i === 0 && rollState === "revealed"
                  ? "bg-yellow-400/20 border-yellow-400/50 text-yellow-300"
                  : "bg-white/[0.03] border-white/10 text-white/40"
              }`}
            >
              {n}
            </div>
          ))}
        </div>
      </div>

      {/* Status */}
      <div className="text-center min-h-[24px]">
        {phase === "idle" && !selected && (
          <p className="text-white/30 text-sm">Pick a number 1–10, then place your bet!</p>
        )}
        {phase === "idle" && selected && (
          <p className="text-yellow-400 text-sm font-bold">Selected: {selected} — place your bet!</p>
        )}
        {(phase === "won" || phase === "lost") && displayNum != null && (
          <div className="flex flex-col items-center gap-1">
            <p className={`text-2xl font-black ${phase === "won" ? "text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]" : "text-red-400"}`}>
              {phase === "won" ? `🎯 ${result?.multiplier}x WIN!` : `💸 Lost! Answer: ${displayNum}`}
            </p>
            {diff != null && (
              <p className="text-white/40 text-xs">Your pick: {selected} | Difference: {diff}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
