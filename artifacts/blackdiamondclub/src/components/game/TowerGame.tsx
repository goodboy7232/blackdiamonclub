import { useState, useEffect, useRef } from "react";

interface Props {
  phase: "idle" | "playing" | "won" | "lost";
  result?: { won: boolean; multiplier?: number; data?: { floors?: number } };
  betAmount?: number;
  onGameEnd?: (won: boolean, multiplier: number, winAmount: number) => void;
  isDemo?: boolean;
}

const TOTAL_FLOORS = 8;
const MULTIPLIERS = [0, 1.5, 2, 2.5, 3, 4, 5, 7, 10];

const FLOOR_META = [
  { bg: "from-sky-900/40 to-sky-900/20",     border: "border-sky-600/30",    accent: "text-sky-400" },
  { bg: "from-cyan-900/40 to-cyan-900/20",   border: "border-cyan-600/30",   accent: "text-cyan-400" },
  { bg: "from-teal-900/40 to-teal-900/20",   border: "border-teal-600/30",   accent: "text-teal-400" },
  { bg: "from-emerald-900/40 to-emerald-900/20", border: "border-emerald-600/30", accent: "text-emerald-400" },
  { bg: "from-yellow-900/40 to-yellow-900/20", border: "border-yellow-600/30", accent: "text-yellow-400" },
  { bg: "from-orange-900/40 to-orange-900/20", border: "border-orange-600/30", accent: "text-orange-400" },
  { bg: "from-rose-900/40 to-rose-900/20",   border: "border-rose-600/30",   accent: "text-rose-400" },
  { bg: "from-purple-900/40 to-purple-900/20", border: "border-purple-600/30", accent: "text-purple-400" },
];

type FloorState = "future" | "current" | "safe" | "trap";

export default function TowerGame({ phase, result, betAmount, onGameEnd, isDemo }: Props) {
  const [currentFloor, setCurrentFloor] = useState(0);
  const [floorStates, setFloorStates] = useState<FloorState[]>(Array.from({ length: TOTAL_FLOORS }, () => "future"));
  const [gamePhase, setGamePhase] = useState<"idle" | "playing" | "revealing" | "won" | "lost">("idle");
  const [showCashout, setShowCashout] = useState(false);
  const [shake, setShake] = useState(false);
  const [finalMult, setFinalMult] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (phase === "idle") {
      setCurrentFloor(0);
      setFloorStates(Array.from({ length: TOTAL_FLOORS }, () => "future"));
      setGamePhase("idle");
      setShowCashout(false);
      setShake(false);
      setFinalMult(0);
      if (timerRef.current) clearTimeout(timerRef.current);
      return undefined;
    }

    if (phase === "playing" && result) {
      setCurrentFloor(1);
      setFloorStates(Array.from({ length: TOTAL_FLOORS }, () => "future"));
      setGamePhase("playing");
      setShowCashout(true);
      setShake(false);
    }

    if (phase === "won" || phase === "lost") {
      setGamePhase(phase === "won" ? "won" : "lost");
      setShowCashout(false);
      setShake(false);
    }

    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [phase, result]);

  const handleClimb = () => {
    if (gamePhase !== "playing" || currentFloor <= 0 || currentFloor > TOTAL_FLOORS) return;

    const trapFloor = result?.won ? -1 : (result?.data?.floors ?? 3);
    const isTrapFloor = currentFloor === trapFloor;
    const maxFloor = result?.won ? (result?.data?.floors ?? 8) : 8;

    setGamePhase("revealing");

    timerRef.current = setTimeout(() => {
      setFloorStates(prev => {
        const next = [...prev];
        next[currentFloor - 1] = isTrapFloor ? "trap" : "safe";
        return next;
      });

      if (isTrapFloor) {
        setShake(true);
        setGamePhase("lost");
        setShowCashout(false);
        timerRef.current = setTimeout(() => {
          setShake(false);
          onGameEnd?.(false, 0, 0);
        }, 600);
      } else if (currentFloor >= maxFloor) {
        setGamePhase("won");
        setShowCashout(false);
        const mult = result?.multiplier ?? 0;
        setFinalMult(mult);
        const winAmount = (betAmount ?? 0) * mult;
        onGameEnd?.(true, mult, winAmount);
      } else {
        setCurrentFloor(prev => prev + 1);
        setGamePhase("playing");
      }
    }, 400);
  };

  const handleCashout = () => {
    if (gamePhase !== "playing" || currentFloor <= 0) return;
    // Demo mode: cash-out always wins at current floor multiplier
    if (isDemo) {
      const mult = MULTIPLIERS[currentFloor];
      const winAmount = (betAmount ?? 0) * mult;
      setFinalMult(mult);
      setGamePhase("won");
      setShowCashout(false);
      onGameEnd?.(true, mult, winAmount);
      return;
    }
    // Real mode: respect server-settled outcome; interactive UI is just a reveal
    if (result?.won) {
      const mult = result?.multiplier ?? MULTIPLIERS[currentFloor];
      const winAmount = (betAmount ?? 0) * mult;
      setFinalMult(mult);
      setGamePhase("won");
      setShowCashout(false);
      onGameEnd?.(true, mult, winAmount);
    } else {
      setGamePhase("lost");
      setShowCashout(false);
      onGameEnd?.(false, 0, 0);
    }
  };

  return (
    <div className={`flex flex-col items-center justify-center h-full gap-3 px-4 select-none ${shake ? "translate-x-1" : ""} transition-transform duration-200`}>
      {/* HUD */}
      <div className="flex items-center gap-4 text-center">
        <div className="px-3 py-1.5 rounded-xl bg-black/40 border border-white/10">
          <div className="text-white/40 text-[10px] font-bold tracking-wider">FLOOR</div>
          <div className="text-white text-lg font-black">{currentFloor}/{TOTAL_FLOORS}</div>
        </div>
        <div className="px-3 py-1.5 rounded-xl bg-black/40 border border-yellow-400/20">
          <div className="text-white/40 text-[10px] font-bold tracking-wider">MULTIPLIER</div>
          <div className="text-yellow-400 text-lg font-black">{MULTIPLIERS[currentFloor]}x</div>
        </div>
        <div className="px-3 py-1.5 rounded-xl bg-black/40 border border-emerald-400/20">
          <div className="text-white/40 text-[10px] font-bold tracking-wider">WIN</div>
          <div className="text-emerald-400 text-lg font-black">${((betAmount ?? 0) * MULTIPLIERS[currentFloor]).toFixed(0)}</div>
        </div>
      </div>

      {/* Character */}
      <div className="text-3xl h-8">
        {gamePhase === "playing" && currentFloor > 0 && (
          <span className="inline-block animate-bounce">🥽</span>
        )}
        {gamePhase === "lost" && (
          <span className="inline-block animate-pulse">💀</span>
        )}
        {gamePhase === "won" && (
          <span className="inline-block animate-bounce">🎉</span>
        )}
      </div>

      {/* Tower */}
      <div className="flex flex-col-reverse gap-1 w-full max-w-xs">
        {Array.from({ length: TOTAL_FLOORS }, (_, i) => {
          const floorNum = i + 1;
          const floorIndex = i;
          const meta = FLOOR_META[i];
          const state = floorStates[floorIndex];
          const isActive = floorNum === currentFloor && gamePhase === "playing";
          const isSafe = state === "safe";
          const isTrap = state === "trap";

          return (
            <div
              key={floorNum}
              className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border transition-all duration-300 ${
                isActive
                  ? `bg-gradient-to-r ${meta.bg} ${meta.border} scale-105 shadow-[0_0_20px_rgba(255,255,255,0.06)]`
                  : isSafe
                  ? `bg-emerald-500/10 border-emerald-500/30`
                  : isTrap
                  ? `bg-red-500/20 border-red-500 shadow-[0_0_16px_rgba(239,68,68,0.25)] scale-105`
                  : `bg-white/[0.03] border-white/10`
              }`}
            >
              <div className={`flex items-center gap-2 text-xs font-bold ${
                isActive ? meta.accent : isSafe ? "text-emerald-400" : isTrap ? "text-red-400" : "text-white/30"
              }`}>
                <span>Floor {floorNum}</span>
                <span className="text-white/20">|</span>
                <span>{MULTIPLIERS[floorNum]}x</span>
              </div>
              <div className="flex gap-2">
                {[0, 1, 2].map(j => (
                  <div
                    key={j}
                    className={`w-14 h-14 rounded-xl border-2 font-bold text-2xl flex items-center justify-center transition-all duration-300 ${
                      isTrap
                        ? "bg-red-500/30 border-red-500 text-red-400"
                        : isSafe
                        ? "bg-emerald-500/30 border-emerald-500 text-emerald-400"
                        : isActive
                        ? "bg-white/10 border-white/30 text-white/60 shadow-[0_0_8px_rgba(255,255,255,0.04)]"
                        : "bg-white/[0.03] border-white/10 text-white/20"
                    }`}
                  >
                    {isTrap ? "💣" : isSafe ? "✓" : "?"}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Action Buttons */}
      {showCashout && gamePhase === "playing" && (
        <div className="flex gap-2 w-full max-w-xs">
          <button
            onClick={handleClimb}
            className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-sky-500/30 to-cyan-400/20 border-2 border-cyan-500/50 text-cyan-400 font-bold text-sm hover:from-sky-500/40 hover:to-cyan-400/30 transition-all active:scale-95 shadow-[0_0_16px_rgba(34,211,238,0.15)]"
          >
            🥽 CLIMB
          </button>
          <button
            onClick={handleCashout}
            className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-500/30 to-emerald-400/20 border-2 border-emerald-500/50 text-emerald-400 font-bold text-sm hover:from-emerald-500/40 hover:to-emerald-400/30 transition-all active:scale-95 shadow-[0_0_16px_rgba(34,197,94,0.15)]"
          >
            💰 CASH OUT {MULTIPLIERS[currentFloor]}x
          </button>
        </div>
      )}

      {/* Status */}
      <div className="text-center min-h-[32px]">
        {gamePhase === "revealing" && (
          <p className="text-white/40 animate-pulse text-sm font-bold">Climbing...</p>
        )}
        {gamePhase === "won" && (
          <p className="text-emerald-400 text-2xl font-black drop-shadow-[0_0_10px_rgba(34,197,94,0.5)]">
            🏆 {finalMult}x WIN!
          </p>
        )}
        {gamePhase === "lost" && (
          <p className="text-red-400 text-2xl font-black drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]">
            💣 BOOM! Trap on Floor {currentFloor}!
          </p>
        )}
      </div>
    </div>
  );
}
