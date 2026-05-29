import { useEffect, useRef, useState, useMemo, useCallback } from "react";

// Weighted probability system — 30% total win rate
// Small wins frequent, big wins rare (real casino distribution)
const SECTORS = [
  { mult: 0,    label: "",      weight: 10, color: "#1a0a0a", glow: "none",    icon: "❌", isJackpot: false },
  { mult: 0,    label: "",      weight: 9,  color: "#1a0a0a", glow: "none",    icon: "❌", isJackpot: false },
  { mult: 1.5,  label: "1.5x",  weight: 10, color: "#0d2a0d", glow: "#00e676", icon: "💎", isJackpot: false },
  { mult: 0,    label: "",      weight: 9,  color: "#1a0a0a", glow: "none",    icon: "❌", isJackpot: false },
  { mult: 0,    label: "",      weight: 9,  color: "#1a0a0a", glow: "none",    icon: "❌", isJackpot: false },
  { mult: 2,    label: "2x",    weight: 9,  color: "#1a4d1a", glow: "#00e676", icon: "⭐", isJackpot: false },
  { mult: 0,    label: "",      weight: 8,  color: "#1a0a0a", glow: "none",    icon: "❌", isJackpot: false },
  { mult: 0,    label: "",      weight: 8,  color: "#1a0a0a", glow: "none",    icon: "❌", isJackpot: false },
  { mult: 5,    label: "5x",    weight: 5,  color: "#3d2f00", glow: "#ffd600", icon: "🔥", isJackpot: false },
  { mult: 0,    label: "",      weight: 8,  color: "#1a0a0a", glow: "none",    icon: "❌", isJackpot: false },
  { mult: 0,    label: "",      weight: 8,  color: "#1a0a0a", glow: "none",    icon: "❌", isJackpot: false },
  { mult: 10,   label: "JACKPOT", weight: 3, color: "#2a0d3d", glow: "#e040fb", icon: "🏆", isJackpot: true },
];

const TOTAL_WEIGHT = SECTORS.reduce((s, sec) => s + sec.weight, 0);
const WIN_WEIGHT = SECTORS.filter(s => s.mult > 0).reduce((s, sec) => s + sec.weight, 0);

const N = SECTORS.length;
const CX = 200, CY = 200, R = 170;
const SLICE = (2 * Math.PI) / N;

function polarToCart(r: number, angle: number) {
  return { x: CX + r * Math.cos(angle), y: CY + r * Math.sin(angle) };
}

interface Props {
  phase: "idle" | "spinning" | "won" | "lost";
  result?: { sectorIndex?: number; won: boolean; multiplier?: number };
  history?: number[];
}

// Weighted random pick — casino-style probability
export function pickSector(): number {
  let r = Math.random() * TOTAL_WEIGHT;
  for (let i = 0; i < SECTORS.length; i++) {
    r -= SECTORS[i].weight;
    if (r <= 0) return i;
  }
  return SECTORS.length - 1;
}

export function pickSectorWon(): { idx: number; mult: number } {
  const idx = pickSector();
  return { idx, mult: SECTORS[idx].mult };
}

export default function LuckyWheelGame({ phase, result, history = [] }: Props) {
  const [rotation, setRotation] = useState(0);
  const [blur, setBlur] = useState(0);
  const [winFlash, setWinFlash] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [popupData, setPopupData] = useState<{ mult: number; won: boolean } | null>(null);
  const [tickSound, setTickSound] = useState(false);

  // Demo pre-computation
  const targetSector = useMemo(() => {
    if (result?.sectorIndex != null) return result.sectorIndex;
    if (phase === "idle") return null;
    return pickSector();
  }, [phase, result]);

  const isWin = targetSector != null && SECTORS[targetSector].mult > 0;
  const targetMult = targetSector != null ? SECTORS[targetSector].mult : 0;
  const isJackpot = targetSector != null && SECTORS[targetSector].isJackpot;

  useEffect(() => {
    if (phase === "spinning" && targetSector != null) {
      setBlur(10);
      setWinFlash(false);
      setShowConfetti(false);
      setShowPopup(false);
      setTickSound(true);

      const sectorMidAngle = targetSector * SLICE + SLICE / 2;
      const spins = 7 + Math.floor(Math.random() * 4);
      const finalAngle = spins * 2 * Math.PI + (2 * Math.PI - sectorMidAngle - Math.PI / 2);
      const deg = finalAngle * (180 / Math.PI);
      setRotation(prev => prev + deg);

      // Slow down tick effect simulation
      const tickT1 = setTimeout(() => setTickSound(false), 2500);
      const blurT = setTimeout(() => setBlur(5), 1800);
      const blurT2 = setTimeout(() => setBlur(0), 3200);
      return () => { clearTimeout(tickT1); clearTimeout(blurT); clearTimeout(blurT2); };
    }
    if (phase === "won" || phase === "lost") {
      setBlur(0);
      setTickSound(false);
      const t = setTimeout(() => {
        setPopupData({ mult: targetMult, won: phase === "won" });
        setShowPopup(true);
      }, 400);
      if (phase === "won") {
        setWinFlash(true);
        setShowConfetti(true);
        const t2 = setTimeout(() => setWinFlash(false), 800);
        const t3 = setTimeout(() => setShowConfetti(false), 3000);
        return () => { clearTimeout(t); clearTimeout(t2); clearTimeout(t3); };
      }
      return () => { clearTimeout(t); };
    }
    return undefined;
  }, [phase, targetSector, targetMult]);

  const sectorPaths = useMemo(() =>
    SECTORS.map((s, i) => {
      const a0 = i * SLICE - Math.PI / 2;
      const a1 = (i + 1) * SLICE - Math.PI / 2;
      const p1 = polarToCart(R, a0);
      const p2 = polarToCart(R, a1);
      const mid = polarToCart(R * 0.58, a0 + SLICE / 2);
      const d = `M ${CX},${CY} L ${p1.x},${p1.y} A ${R},${R} 0 0,1 ${p2.x},${p2.y} Z`;
      return { d, mx: mid.x, my: mid.y, ...s };
    }), []);

  return (
    <div className="relative flex flex-col items-center justify-center h-full gap-3 select-none">
      {/* Win/loss radial flash overlay */}
      {winFlash && (
        <div className="absolute inset-0 z-30 pointer-events-none"
          style={{
            background: isJackpot
              ? "radial-gradient(circle, #e040fb44 0%, transparent 70%)"
              : isWin
                ? "radial-gradient(circle, #ffd60033 0%, transparent 70%)"
                : "radial-gradient(circle, #ff174433 0%, transparent 70%)",
            animation: "pulse 0.6s ease-in-out",
          }}
        />
      )}

      {/* Confetti particles on win */}
      {showConfetti && isWin && (
        <div className="absolute inset-0 z-20 pointer-events-none overflow-hidden">
          {Array.from({ length: isJackpot ? 50 : 30 }, (_, i) => (
            <div
              key={i}
              className="absolute w-2.5 h-2.5 rounded-full"
              style={{
                left: `${5 + (i * 137) % 90}%`,
                top: `${15 + (i * 73) % 55}%`,
                background: isJackpot
                  ? ["#e040fb", "#ffd600", "#ff1744", "#00e676"][i % 4]
                  : ["#ffd600", "#ff1744", "#00e676", "#448aff"][i % 4],
                animation: `confetti-fall ${600 + (i % 7) * 250}ms ease-out ${i * 40}ms forwards`,
                opacity: 0,
              }}
            />
          ))}
        </div>
      )}

      {/* Result popup */}
      {showPopup && popupData && (
        <div className="absolute inset-0 z-40 flex items-center justify-center pointer-events-none">
          <div
            className={`pointer-events-auto px-8 py-5 rounded-2xl border-2 text-center shadow-2xl animate-bounce`}
            style={{
              background: popupData.won
                ? isJackpot ? "#2a0d3dee" : "#1a2a0dee"
                : "#1a0a0aee",
              borderColor: popupData.won
                ? isJackpot ? "#e040fb" : "#ffd600"
                : "#ff1744",
              boxShadow: popupData.won
                ? `0 0 40px ${isJackpot ? "#e040fb66" : "#ffd60044"}`
                : "0 0 30px #ff174433",
            }}
          >
            <div className={`text-4xl font-black ${popupData.won ? (isJackpot ? "text-fuchsia-400" : "text-yellow-400") : "text-red-400"}`}
              style={{ textShadow: popupData.won ? `0 0 20px ${isJackpot ? "#e040fb" : "#ffd600"}66` : "none" }}
            >
              {popupData.won
                ? (isJackpot ? `🏆 JACKPOT ${popupData.mult}x!` : `${popupData.mult}x WIN!`)
                : "TRY AGAIN ❌"}
            </div>
            {popupData.won && (
              <div className="text-emerald-400 text-sm font-bold mt-2">
                {isJackpot ? "🚀 MEGA PRIZE AWARDED!" : "💰 Prize awarded!"}
              </div>
            )}
            <div className="text-white/30 text-xs mt-3">
              Win chance: {(WIN_WEIGHT / TOTAL_WEIGHT * 100).toFixed(0)}%
            </div>
          </div>
        </div>
      )}

      {/* Wheel container */}
      <div className="relative">
        {/* Outer conic glow */}
        <div className="absolute inset-[-12px] rounded-full"
          style={{
            background: `conic-gradient(from ${rotation}deg, #ffd60008, #ff174408, #00e67608, #ffd60008)`,
            filter: "blur(16px)",
          }}
        />

        {/* Tick marks around rim */}
        <div className="absolute inset-0 z-10 pointer-events-none">
          {Array.from({ length: N }, (_, i) => {
            const a = i * SLICE - Math.PI / 2;
            const p = polarToCart(R + 4, a);
            return (
              <div key={i}
                className="absolute w-1 h-3 rounded-full"
                style={{
                  left: p.x - 2,
                  top: p.y - 6,
                  background: tickSound ? "#ffd600" : "#ffd60030",
                  opacity: tickSound ? 0.8 + Math.random() * 0.2 : 0.3,
                  transform: `rotate(${a * 180 / Math.PI}deg)`,
                  transition: "opacity 0.1s",
                }}
              />
            );
          })}
        </div>

        {/* Pointer */}
        <div className="absolute top-[-8px] left-1/2 -translate-x-1/2 z-20">
          <div className="w-0 h-0 border-l-[14px] border-r-[14px] border-t-[28px] border-l-transparent border-r-transparent border-t-yellow-400 drop-shadow-[0_0_12px_rgba(250,204,21,0.9)]" />
          <div className="w-5 h-5 rounded-full bg-yellow-400 -mt-1 -ml-2.5 shadow-[0_0_20px_rgba(250,204,21,0.9)] animate-pulse" />
        </div>

        <svg
          width={400} height={400}
          viewBox="0 0 400 400"
          className="drop-shadow-[0_0_40px_rgba(0,0,0,0.9)]"
          style={{
            transition: phase === "spinning" ? "transform 3.5s cubic-bezier(0.17,0.67,0.12,0.99)" : "none",
            transform: `rotate(${rotation}deg)`,
            transformOrigin: `${CX}px ${CY}px`,
            filter: blur > 0 ? `blur(${blur}px)` : "none",
          }}
        >
          {/* Outer rings */}
          <circle cx={CX} cy={CY} r={R + 10} fill="none" stroke="#ffd600" strokeWidth={3} opacity={0.25} />
          <circle cx={CX} cy={CY} r={R + 4} fill="none" stroke="#ffd600" strokeWidth={1} opacity={0.4} />
          <circle cx={CX} cy={CY} r={R - 2} fill="none" stroke="#ffffff" strokeWidth={0.5} opacity={0.08} />

          {/* Segments */}
          {sectorPaths.map((s, i) => (
            <g key={i}>
              <path d={s.d} fill={s.color} stroke={s.glow !== "none" ? s.glow + "50" : "#ffffff08"} strokeWidth={2} />
              {s.mult > 0 && (
                <path d={s.d} fill="none" stroke={s.glow} strokeWidth={1} opacity={0.25} />
              )}
              {/* Icon */}
              <text x={s.mx} y={s.my - 10} textAnchor="middle" dominantBaseline="middle" fontSize={22}>{s.icon}</text>
              {/* Label */}
              <text
                x={s.mx} y={s.my + 14}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={s.isJackpot ? 13 : s.mult >= 5 ? 12 : 11}
                fontWeight="900"
                fill={s.mult > 0 ? s.glow : "#555"}
                style={{ textShadow: s.mult > 0 ? `0 0 8px ${s.glow}` : "none" }}
              >{s.label}</text>
            </g>
          ))}

          {/* Center hub */}
          <circle cx={CX} cy={CY} r={32} fill="#0a0a12" stroke="#ffd600" strokeWidth={3} />
          <circle cx={CX} cy={CY} r={24} fill="none" stroke="#ffd600" strokeWidth={1} opacity={0.3} />
          <circle cx={CX} cy={CY} r={12} fill="#ffd600" />
          <text x={CX} y={CY + 5} textAnchor="middle" fontSize={11} fontWeight="bold" fill="#000">SPIN</text>
        </svg>
      </div>

      {/* Probability bar */}
      <div className="w-64 flex items-center gap-1 text-[10px] text-white/30">
        <div className="flex-1 flex items-center gap-0.5">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>Win {(WIN_WEIGHT / TOTAL_WEIGHT * 100).toFixed(0)}%</span>
        </div>
        <div className="flex-1 flex items-center gap-0.5 justify-center">
          <div className="w-2 h-2 rounded-full bg-yellow-500" />
          <span>Med 5%</span>
        </div>
        <div className="flex-1 flex items-center gap-0.5 justify-end">
          <div className="w-2 h-2 rounded-full bg-fuchsia-500" />
          <span>Jackpot 3%</span>
        </div>
      </div>

      {/* History chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar max-w-xs px-2">
        {history.slice(-10).map((m, i) => (
          <span key={i} className={`text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 border ${
            m > 0
              ? m >= 5 ? "bg-fuchsia-500/20 border-fuchsia-500/40 text-fuchsia-300"
                : m >= 2 ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                : "bg-yellow-400/20 border-yellow-400/40 text-yellow-300"
              : "bg-red-500/20 border-red-500/30 text-red-400"
          }`}>
            {m > 0 ? `${m}x` : "0x"}
          </span>
        ))}
        {history.length === 0 && <span className="text-white/20 text-xs">No spins yet</span>}
      </div>

      {/* Bottom status */}
      {phase === "spinning" && (
        <div className="flex items-center gap-2 text-white/40 text-sm animate-pulse">
          <div className="w-2 h-2 rounded-full bg-yellow-400 animate-ping" />
          Wheel spinning...
        </div>
      )}

      {/* CSS animations injected */}
      <style>{`
        @keyframes confetti-fall {
          0% { opacity: 1; transform: translateY(0) scale(1); }
          100% { opacity: 0; transform: translateY(80px) scale(0.3); }
        }
      `}</style>
    </div>
  );
}

export { SECTORS, TOTAL_WEIGHT, WIN_WEIGHT };
