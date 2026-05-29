import { useMemo } from "react";

interface Props {
  phase: "idle" | "flying" | "crashed" | "won";
  multiplier: number;
  winAmount?: number;
  history: number[];
}

const W = 560;
const H = 370;

function getCurveInfo(mult: number) {
  const t = Math.min((mult - 1.0) / 6.0, 1.0); // reach top-right at ~6x
  const ex = 30 + t * (W - 60);
  // Power < 1 = rises fast early, slow later. Power > 1 = slow early, fast later
  const ey = H - 20 - Math.pow(t, 0.65) * (H - 50);
  const cx1 = 30 + ex * 0.30;
  const cy1 = H - 20 - Math.pow(t, 0.5) * (H - 50) * 0.25;
  const cx2 = ex * 0.70;
  const cy2 = ey + (H - 20 - ey) * 0.30;
  const d = `M 30,${H - 20} C ${cx1},${cy1} ${cx2},${cy2} ${ex},${ey}`;
  const angle = Math.atan2(ey - cy2, ex - cx2) * (180 / Math.PI);
  return { ex, ey, d, angle };
}

function multColor(m: number) {
  if (m >= 10) return "#ff1744";
  if (m >= 5) return "#ff9100";
  if (m >= 2) return "#ffd600";
  return "#00e676";
}

function historyChipColor(m: number) {
  if (m < 1.5) return "bg-red-500/80 text-white";
  if (m < 2) return "bg-orange-500/80 text-white";
  if (m < 5) return "bg-blue-500/80 text-white";
  if (m < 10) return "bg-purple-500/80 text-white";
  return "bg-yellow-400/90 text-black";
}

const STARS = Array.from({ length: 60 }, (_, i) => ({
  x: (i * 137.5) % W,
  y: (i * 73.1) % (H - 30),
  r: i % 3 === 0 ? 1.5 : 0.8,
  o: 0.3 + (i % 5) * 0.14,
}));

export default function AviatorGame({ phase, multiplier, winAmount, history }: Props) {
  const { ex, ey, d, angle } = useMemo(() => getCurveInfo(multiplier), [multiplier]);
  const color = multColor(multiplier);
  const isFlying = phase === "flying";
  const isCrashed = phase === "crashed";
  const isWon = phase === "won";

  return (
    <div className="relative w-full rounded-2xl overflow-hidden bg-[#0b0e1a]" style={{ height: H + 60 }}>
      {/* History chips */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center gap-1.5 px-3 py-2 bg-black/40 backdrop-blur-sm overflow-x-auto no-scrollbar">
        {history.slice(-12).map((h, i) => (
          <span key={i} className={`text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${historyChipColor(h)}`}>
            {h.toFixed(2)}x
          </span>
        ))}
        {history.length === 0 && <span className="text-white/20 text-xs">No recent rounds</span>}
      </div>

      {/* SVG canvas */}
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="absolute inset-0 w-full"
        style={{ top: 36 }}
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Stars */}
        {STARS.map((s, i) => (
          <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="white" opacity={s.o} />
        ))}

        {/* Grid lines */}
        {[0.25, 0.5, 0.75].map(f => (
          <line key={f}
            x1={0} y1={H * f} x2={W} y2={H * f}
            stroke="white" strokeOpacity={0.04} strokeWidth={1}
          />
        ))}

        {/* Ground line */}
        <line x1={0} y1={H - 20} x2={W} y2={H - 20} stroke="white" strokeOpacity={0.1} strokeWidth={1} />

        {/* Curve glow */}
        {phase !== "idle" && (
          <>
            <path d={d} fill="none" stroke={color} strokeWidth={8} strokeOpacity={0.15} strokeLinecap="round" />
            <path d={d} fill="none" stroke={color} strokeWidth={2.5} strokeOpacity={0.9} strokeLinecap="round" />
          </>
        )}

        {/* Plane */}
        {(isFlying || isWon) && (
          <g transform={`translate(${ex}, ${ey}) rotate(${angle})`}>
            <text
              x={-14} y={8}
              fontSize={26}
              style={{ userSelect: "none", filter: `drop-shadow(0 0 8px ${color})` }}
            >✈</text>
          </g>
        )}

        {/* Explosion when crashed */}
        {isCrashed && (
          <g>
            <circle cx={ex} cy={ey} r={30} fill="#ff1744" opacity={0.25} />
            <circle cx={ex} cy={ey} r={16} fill="#ff9100" opacity={0.5} />
            <text x={ex - 12} y={ey + 10} fontSize={24}>💥</text>
          </g>
        )}
      </svg>

      {/* Multiplier overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ top: 36 }}>
        {phase === "idle" && (
          <div className="text-center">
            <div className="text-white/20 text-sm font-medium tracking-widest uppercase mb-2">Waiting for bet</div>
            <div className="text-4xl font-mono font-black text-white/10">1.00x</div>
          </div>
        )}
        {(isFlying || isWon || isCrashed) && (
          <div className="text-center">
            {isCrashed && (
              <div className="text-red-400 font-bold text-lg mb-1 tracking-widest uppercase animate-pulse">
                FLEW AWAY!
              </div>
            )}
            <div
              className="text-6xl font-mono font-black transition-all duration-75"
              style={{ color, textShadow: `0 0 30px ${color}66` }}
            >
              {multiplier.toFixed(2)}x
            </div>
            {isWon && winAmount && (
              <div className="mt-2 text-2xl font-bold text-emerald-400">
                Won ${winAmount.toFixed(2)} 🏆
              </div>
            )}
          </div>
        )}
      </div>

      {/* Live bets indicator */}
      <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-4 py-2 bg-black/60 border-t border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-white/40 text-xs">Live</span>
          <span className="text-white text-xs font-medium">{Math.floor(Math.random() * 50) + 20} bets</span>
        </div>
        <div className="text-white/30 text-xs">Total: ${(Math.random() * 4000 + 1000).toFixed(0)}</div>
      </div>
    </div>
  );
}
