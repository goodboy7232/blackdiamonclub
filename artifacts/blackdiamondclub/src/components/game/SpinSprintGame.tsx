import { useEffect, useRef, useState } from "react";

const SEGMENTS = [
  { label: "2x",   mult: 2,    color: "#0e2a5c", glow: "#3b82f6" },
  { label: "LOSE", mult: 0,    color: "#120808", glow: null },
  { label: "5x",   mult: 5,    color: "#0a2a3c", glow: "#06b6d4" },
  { label: "LOSE", mult: 0,    color: "#120808", glow: null },
  { label: "1.5x", mult: 1.5,  color: "#0a2a18", glow: "#22c55e" },
  { label: "LOSE", mult: 0,    color: "#120808", glow: null },
  { label: "3x",   mult: 3,    color: "#1a0a50", glow: "#a855f7" },
  { label: "LOSE", mult: 0,    color: "#120808", glow: null },
  { label: "1.5x", mult: 1.5,  color: "#0a2a18", glow: "#22c55e" },
  { label: "LOSE", mult: 0,    color: "#120808", glow: null },
  { label: "10x",  mult: 10,   color: "#3a0808", glow: "#ef4444" },
  { label: "LOSE", mult: 0,    color: "#120808", glow: null },
];

const N = SEGMENTS.length;
const CX = 200, CY = 200, R = 162;
const SLICE = (2 * Math.PI) / N;

function polarToCart(r: number, angle: number) {
  return { x: CX + r * Math.cos(angle), y: CY + r * Math.sin(angle) };
}

interface Props {
  phase: "idle" | "spinning" | "won" | "lost";
  result?: { won: boolean; multiplier?: number; data?: { sectorIndex?: number } };
}

export default function SpinSprintGame({ phase, result }: Props) {
  const [deg, setDeg] = useState(0);
  const [winIdx, setWinIdx] = useState<number | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [pointerBounce, setPointerBounce] = useState(false);
  const confettiTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (phase === "spinning") {
      setWinIdx(null);
      setShowConfetti(false);
      const idx = result?.data?.sectorIndex ?? 0;
      const sectorDeg = (idx * 360) / N;
      const spins = 5 + Math.floor(Math.random() * 4);
      const targetOffset = (360 - sectorDeg - (360 / N) / 2 + 360) % 360;
      setDeg(prev => prev + spins * 360 + targetOffset);
    }

    if (phase === "won" || phase === "lost") {
      const idx = result?.data?.sectorIndex ?? 0;
      setWinIdx(idx);
      setPointerBounce(true);
      setTimeout(() => setPointerBounce(false), 900);
      if (result?.won) {
        confettiTimerRef.current = setTimeout(() => {
          setShowConfetti(true);
          confettiTimerRef.current = setTimeout(() => setShowConfetti(false), 2200);
        }, 300);
      }
    }

    if (phase === "idle") {
      setWinIdx(null);
      setShowConfetti(false);
    }

    return () => { if (confettiTimerRef.current) clearTimeout(confettiTimerRef.current); };
  }, [phase, result]);

  // SVG segment paths
  const paths = SEGMENTS.map((s, i) => {
    const a0 = i * SLICE - Math.PI / 2;
    const a1 = (i + 1) * SLICE - Math.PI / 2;
    const p1 = polarToCart(R, a0);
    const p2 = polarToCart(R, a1);
    const tm = polarToCart(R * 0.67, a0 + SLICE / 2);
    const d = `M ${CX},${CY} L ${p1.x},${p1.y} A ${R},${R} 0 0,1 ${p2.x},${p2.y} Z`;
    return { d, tx: tm.x, ty: tm.y, ...s, idx: i };
  });

  const confettiColors = ["#ffd600","#ff6b6b","#4ecdc4","#a855f7","#22c55e","#f97316"];
  const confettiItems = showConfetti
    ? Array.from({ length: 18 }, (_, i) => ({
        id: i,
        x: 80 + Math.random() * 240,
        y: 40 + Math.random() * 60,
        color: confettiColors[i % confettiColors.length],
        delay: Math.random() * 0.4,
        dur: 0.9 + Math.random() * 0.5,
        rot: Math.random() * 360,
      }))
    : [];

  return (
    <div className="flex flex-col items-center justify-center h-full gap-2 select-none relative overflow-hidden">
      {/* Confetti */}
      {confettiItems.map(p => (
        <div
          key={p.id}
          className="absolute w-2 h-2 rounded-sm pointer-events-none z-20"
          style={{
            left: p.x,
            top: p.y,
            backgroundColor: p.color,
            animation: `confettiFall ${p.dur}s ${p.delay}s ease-in forwards`,
            transform: `rotate(${p.rot}deg)`,
          }}
        />
      ))}

      {/* Pointer */}
      <div
        className={`relative z-20 transition-transform duration-300 ${pointerBounce ? "scale-125" : "scale-100"}`}
        style={{ marginBottom: -6 }}
      >
        <div
          className="w-0 h-0"
          style={{
            borderLeft: "11px solid transparent",
            borderRight: "11px solid transparent",
            borderTop: "24px solid #ffd600",
            filter: "drop-shadow(0 0 8px rgba(255,214,0,0.8))",
          }}
        />
      </div>

      {/* Wheel SVG */}
      <div className="relative">
        {/* Win glow ring behind wheel */}
        {winIdx !== null && result?.won && SEGMENTS[winIdx].glow && (
          <div
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{
              background: `radial-gradient(circle, ${SEGMENTS[winIdx].glow}30 0%, transparent 70%)`,
              animation: "pulse 1s ease-in-out infinite",
            }}
          />
        )}

        <svg
          width={400}
          height={400}
          viewBox="0 0 400 400"
          style={{
            transform: `rotate(${deg}deg)`,
            transformOrigin: `${CX}px ${CY}px`,
            transition: phase === "spinning" ? "transform 4.2s cubic-bezier(0.08,0.42,0.08,1)" : "none",
          }}
        >
          <defs>
            <radialGradient id="rimGrad" cx="50%" cy="50%" r="50%">
              <stop offset="82%" stopColor="#1a1a2e" />
              <stop offset="90%" stopColor="#2a2a3e" />
              <stop offset="96%" stopColor="#444466" />
              <stop offset="100%" stopColor="#222240" />
            </radialGradient>
          </defs>

          {/* Outer metallic rim */}
          <circle cx={CX} cy={CY} r={R + 22} fill="url(#rimGrad)" />

          {/* Tick marks on rim */}
          {Array.from({ length: 36 }, (_, i) => {
            const angle = (i * 10 * Math.PI) / 180 - Math.PI / 2;
            const isMajor = i % 3 === 0;
            const r1 = R + 5;
            const r2 = R + (isMajor ? 18 : 10);
            const p1 = polarToCart(r1, angle);
            const p2 = polarToCart(r2, angle);
            return (
              <line
                key={i}
                x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
                stroke={isMajor ? "#ffd600" : "#ffd60055"}
                strokeWidth={isMajor ? 2.5 : 1.5}
                strokeLinecap="round"
              />
            );
          })}

          {/* Segment paths */}
          {paths.map(p => {
            const isWin = winIdx === p.idx && result?.won;
            const isResult = winIdx === p.idx;
            return (
              <g key={p.idx}>
                <path
                  d={p.d}
                  fill={isWin && p.glow ? p.glow : p.color}
                  stroke="#000"
                  strokeWidth={1.5}
                  opacity={winIdx !== null && !isResult ? 0.55 : 1}
                />
                {isWin && p.glow && (
                  <path d={p.d} fill={p.glow} opacity={0.35} />
                )}
                <text
                  x={p.tx} y={p.ty}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={p.mult >= 10 ? 13 : 11}
                  fontWeight="bold"
                  fill={p.mult > 0 ? "#ffd600" : "#444"}
                  style={{ userSelect: "none" }}
                >
                  {p.label}
                </text>
              </g>
            );
          })}

          {/* Outer ring border */}
          <circle cx={CX} cy={CY} r={R + 3} fill="none" stroke="#ffd600" strokeWidth={2} opacity={0.35} />

          {/* Center hub */}
          <circle cx={CX} cy={CY} r={22} fill="#0a0a14" stroke="#ffd600" strokeWidth={3} />
          <circle cx={CX} cy={CY} r={9}  fill="#ffd600" />
          <circle cx={CX} cy={CY} r={4}  fill="#000" />
        </svg>
      </div>

      {/* Status */}
      <div className="text-center min-h-[36px]">
        {phase === "idle" && (
          <div>
            <p className="text-white/30 text-sm">Spin the wheel — 6 win segments!</p>
            <p className="text-white/15 text-xs mt-0.5">Up to 10x multiplier</p>
          </div>
        )}
        {phase === "spinning" && (
          <p className="text-yellow-400 animate-pulse text-sm font-bold tracking-widest">⚡ SPINNING…</p>
        )}
        {(phase === "won" || phase === "lost") && (
          <p className={`text-2xl font-black ${phase === "won" ? "text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]" : "text-red-400"}`}>
            {phase === "won" ? `${result?.multiplier}x WIN! 🎰` : "No win this round"}
          </p>
        )}
      </div>

      <style>{`
        @keyframes confettiFall {
          0%   { transform: translateY(0)    rotate(0deg);   opacity: 1; }
          100% { transform: translateY(220px) rotate(720deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
