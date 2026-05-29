import { useEffect, useState, useMemo } from "react";

interface Props {
  phase: "idle" | "rolling" | "won" | "lost";
  result?: { d1?: number; d2?: number; total?: number; won: boolean; multiplier?: number };
  prediction?: string;
  history?: number[];
}

// Real two-dice probability distribution
const DICE_PROB: Record<number, number> = {
  2: 1/36, 3: 2/36, 4: 3/36, 5: 4/36, 6: 5/36,
  7: 6/36, 8: 5/36, 9: 4/36, 10: 3/36, 11: 2/36, 12: 1/36,
};

const DICE_PAYTABLE: Record<number, number> = {
  2: 30, 3: 15, 4: 10, 5: 8, 6: 6, 7: 5, 8: 6, 9: 8, 10: 10, 11: 15, 12: 30,
};

function Die({ value, rolling, highlight }: { value: number; rolling: boolean; highlight?: boolean }) {
  const dots: Record<number, [number, number][]> = {
    1: [[50,50]],
    2: [[25,25],[75,75]],
    3: [[25,25],[50,50],[75,75]],
    4: [[25,25],[75,25],[25,75],[75,75]],
    5: [[25,25],[75,25],[50,50],[25,75],[75,75]],
    6: [[25,25],[75,25],[25,50],[75,50],[25,75],[75,75]],
  };
  const v = Math.max(1, Math.min(6, value));
  const positions = dots[v] ?? dots[1];

  return (
    <div className={`relative transition-all duration-150 ${rolling ? "animate-bounce" : ""} ${highlight ? "drop-shadow-[0_0_20px_rgba(255,214,0,0.6)]" : ""}`}>
      <svg width={100} height={100} viewBox="0 0 100 100" className={rolling ? "blur-[2px]" : ""}>
        <defs>
          <linearGradient id={`dieGrad-${v}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={highlight ? "#2a3a1a" : "#1e2a4a"} />
            <stop offset="100%" stopColor={highlight ? "#1a2a0a" : "#0d1117"} />
          </linearGradient>
          <filter id={`glow-${v}`}>
            <feGaussianBlur stdDeviation={highlight ? 3 : 0} result="blur" />
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>
        <rect x={3} y={3} width={94} height={94} rx={18} ry={18}
          fill={`url(#dieGrad-${v})`}
          stroke={highlight ? "#ffd600" : "#ffd60060"}
          strokeWidth={highlight ? 3 : 2}
          filter={highlight ? `url(#glow-${v})` : "none"}
        />
        {positions.map(([cx, cy], i) => (
          <circle key={i} cx={cx} cy={cy} r={rolling ? 6 : 8}
            fill={rolling ? "#ffd60040" : "#ffd600"}
            className={rolling ? "" : "transition-all duration-200"}
          />
        ))}
      </svg>
      {/* 3D edge shadow */}
      <div className="absolute -bottom-1 left-2 right-2 h-3 rounded-full bg-black/40 blur-md -z-10" />
    </div>
  );
}

export default function DiceGame({ phase, result, prediction, history = [] }: Props) {
  const [displayD1, setDisplayD1] = useState(1);
  const [displayD2, setDisplayD2] = useState(1);
  const [showPopup, setShowPopup] = useState(false);
  const [shake, setShake] = useState(false);
  const isRolling = phase === "rolling";
  const isWon = phase === "won";
  const isLost = phase === "lost";

  // Rolling animation
  useEffect(() => {
    if (isRolling) {
      setShowPopup(false);
      setShake(true);
      const interval = setInterval(() => {
        setDisplayD1(Math.ceil(Math.random() * 6));
        setDisplayD2(Math.ceil(Math.random() * 6));
      }, 70);
      const stop = setTimeout(() => {
        clearInterval(interval);
        setDisplayD1(result?.d1 ?? 3);
        setDisplayD2(result?.d2 ?? 4);
        setShake(false);
      }, 1400);
      return () => { clearInterval(interval); clearTimeout(stop); };
    }
    if (isWon || isLost) {
      setDisplayD1(result?.d1 ?? 3);
      setDisplayD2(result?.d2 ?? 4);
      const t = setTimeout(() => setShowPopup(true), 400);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [phase, result, isRolling, isWon, isLost]);

  const total = displayD1 + displayD2;
  const predNum = prediction ? parseInt(prediction) : 7;
  const payMult = DICE_PAYTABLE[total] || 5;

  // Hot/cold numbers from history
  const hotNumbers = useMemo(() => {
    const counts: Record<number, number> = {};
    history.forEach(h => { counts[h] = (counts[h] || 0) + 1; });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([n]) => parseInt(n));
  }, [history]);

  return (
    <div className={`relative flex flex-col items-center justify-center h-full gap-5 select-none ${shake ? "animate-crash-shake" : ""}`}>
      {/* Result popup */}
      {showPopup && (isWon || isLost) && (
        <div className="absolute inset-0 z-40 flex items-center justify-center pointer-events-none">
          <div
            className="pointer-events-auto px-10 py-6 rounded-2xl border-2 text-center shadow-2xl"
            style={{
              background: isWon ? "#1a2a0dee" : "#1a0a0aee",
              borderColor: isWon ? "#ffd600" : "#ff1744",
              boxShadow: isWon ? "0 0 40px #ffd60044" : "0 0 30px #ff174433",
              animation: "bounce 0.5s ease-out",
            }}
          >
            <div className={`text-4xl font-black ${isWon ? "text-yellow-400" : "text-red-400"}`}
              style={{ textShadow: isWon ? "0 0 20px #ffd60066" : "none" }}
            >
              {isWon ? `${payMult}x WIN! 🎉` : "TRY AGAIN 🍒"}
            </div>
            <div className="text-white/50 text-sm mt-2">
              You predicted {predNum} • Rolled {total}
            </div>
            {isWon && (
              <div className="text-emerald-400 text-sm font-bold mt-1">
                Exact match! 💰 Prize awarded
              </div>
            )}
          </div>
        </div>
      )}

      {/* Top bar — stats */}
      <div className="flex items-center gap-4 text-xs text-white/30">
        <div className="flex items-center gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
          <span>Hot: {hotNumbers.length > 0 ? hotNumbers.join(", ") : "—"}</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>Rolls: {history.length}</span>
        </div>
      </div>

      {/* Main dice area */}
      <div className="flex items-center gap-8">
        <Die value={displayD1} rolling={isRolling} highlight={isWon} />
        <div className="flex flex-col items-center gap-1">
          <div className="text-3xl font-black text-white/20">+</div>
          {(!isRolling && phase !== "idle") && (
            <div className={`text-3xl font-mono font-black ${isWon ? "text-yellow-400" : "text-white"}`}
              style={{ textShadow: isWon ? "0 0 15px #ffd600" : "none" }}
            >
              {total}
            </div>
          )}
        </div>
        <Die value={displayD2} rolling={isRolling} highlight={isWon} />
      </div>

      {/* Prediction indicator */}
      {phase !== "idle" && (
        <div className="flex items-center gap-3 bg-white/5 rounded-xl px-4 py-2 border border-white/10">
          <span className="text-white/40 text-xs">You picked</span>
          <span className="text-yellow-400 font-bold text-lg">{predNum}</span>
          <span className="text-white/40 text-xs">Rolled</span>
          <span className={`font-bold text-lg ${isWon ? "text-emerald-400" : "text-red-400"}`}>{total}</span>
        </div>
      )}

      {phase === "idle" && (
        <div className="text-center">
          <div className="text-white/20 text-sm font-medium tracking-widest uppercase mb-1">Pick a sum</div>
          <div className="text-4xl font-mono font-black text-white/10">2 – 12</div>
        </div>
      )}

      {/* Paytable */}
      <div className="w-full max-w-sm">
        <div className="text-white/30 text-xs font-bold uppercase tracking-wider mb-2 text-center">Paytable</div>
        <div className="grid grid-cols-11 gap-0.5">
          {[2,3,4,5,6,7,8,9,10,11,12].map(n => {
            const isHot = hotNumbers.includes(n);
            const prob = DICE_PROB[n];
            return (
              <div key={n}
                className={`text-center rounded-lg py-1.5 px-0.5 border ${
                  isHot
                    ? "bg-red-500/15 border-red-500/30"
                    : "bg-white/5 border-white/5 hover:border-white/20"
                }`}
              >
                <div className={`text-xs font-bold ${isHot ? "text-red-300" : "text-white/60"}`}>{n}</div>
                <div className="text-[9px] text-yellow-400/70">{DICE_PAYTABLE[n]}x</div>
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-3 mt-2 justify-center">
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
            <span className="text-[10px] text-white/20">Hot</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-yellow-400/40" />
            <span className="text-[10px] text-white/20">Payout</span>
          </div>
        </div>
      </div>

      {/* History chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar max-w-xs px-2">
        {history.slice(-10).map((h, i) => (
          <span key={i} className={`text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 border ${
            h === predNum
              ? "bg-yellow-400/20 border-yellow-400/40 text-yellow-300"
              : "bg-white/5 border-white/10 text-white/40"
          }`}>
            {h}
          </span>
        ))}
        {history.length === 0 && <span className="text-white/20 text-xs">No rolls yet</span>}
      </div>

      {/* Bottom status */}
      {isRolling && (
        <div className="flex items-center gap-2 text-white/40 text-sm animate-pulse">
          <div className="w-2 h-2 rounded-full bg-yellow-400 animate-ping" />
          Rolling dice...
        </div>
      )}
    </div>
  );
}

export { DICE_PAYTABLE };
