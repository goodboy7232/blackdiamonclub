import { useEffect, useState, useRef, useMemo } from "react";

interface Props {
  phase: "idle" | "launching" | "won" | "lost";
  result?: { won: boolean; multiplier?: number; data?: { peak?: number; distance?: number; score?: number } };
  prediction?: string;
  history?: number[];
}

const W = 360, H = 420;

interface Star { x: number; y: number; speed: number; size: number; opacity: number }
interface Obstacle { x: number; y: number; size: number; speed: number; type: "asteroid" | "mine" | "debris" }

function generateStars(): Star[] {
  return Array.from({ length: 40 }, (_, i) => ({
    x: (i * 137.5) % W,
    y: (i * 73.1) % H,
    speed: 0.5 + (i % 5) * 0.8,
    size: i % 3 === 0 ? 1.5 : 0.8,
    opacity: 0.2 + (i % 7) * 0.1,
  }));
}

export default function RocketGame({ phase, result, prediction, history = [] }: Props) {
  const [rocketY, setRocketY] = useState(H - 80);
  const [health, setHealth] = useState(3);
  const [distance, setDistance] = useState(0);
  const [score, setScore] = useState(0);
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [showExplosion, setShowExplosion] = useState(false);
  const [showWin, setShowWin] = useState(false);
  const [flameScale, setFlameScale] = useState(1);
  const animRef = useRef<number | null>(null);
  const stars = useMemo(generateStars, []);
  const isLaunching = phase === "launching";
  const isWon = phase === "won";
  const isLost = phase === "lost";
  const target = prediction ? parseFloat(prediction) : 3;

  // Launch animation
  useEffect(() => {
    if (isLaunching) {
      setRocketY(H - 80);
      setHealth(3);
      setDistance(0);
      setScore(0);
      setObstacles([]);
      setShowExplosion(false);
      setShowWin(false);

      let frame = 0;
      let currentY = H - 80;
      let currentDist = 0;
      let currentScore = 0;
      let currentHealth = 3;
      let obs: Obstacle[] = [];
      let lastObsFrame = 0;

      const animate = () => {
        frame++;
        // Rocket ascends
        currentY = Math.max(60, currentY - 1.2);
        setRocketY(currentY);

        // Distance increases
        currentDist += 0.05;
        setDistance(currentDist);

        // Flame flicker
        setFlameScale(0.8 + Math.random() * 0.4);

        // Spawn obstacles
        if (frame - lastObsFrame > 30 + Math.random() * 40) {
          const types: Obstacle["type"][] = ["asteroid", "asteroid", "debris", "mine"];
          obs.push({
            x: 30 + Math.random() * (W - 60),
            y: -30,
            size: 12 + Math.random() * 18,
            speed: 1.5 + Math.random() * 2 + (frame / 500),
            type: types[Math.floor(Math.random() * types.length)],
          });
          lastObsFrame = frame;
        }

        // Move obstacles
        obs = obs.filter(o => {
          o.y += o.speed;
          // Collision check with rocket
          const rx = W / 2;
          const ry = currentY;
          const dist = Math.sqrt((o.x - rx) ** 2 + (o.y - ry) ** 2);
          if (dist < o.size + 20 && currentHealth > 0) {
            currentHealth--;
            currentScore -= 50;
            return false; // remove obstacle
          }
          return o.y < H + 30;
        });
        setObstacles([...obs]);
        setHealth(currentHealth);

        // Score from survival
        currentScore += 0.5;
        setScore(Math.max(0, currentScore));

        animRef.current = requestAnimationFrame(animate);
      };
      animRef.current = requestAnimationFrame(animate);
      return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
    }

    if (isWon) {
      setShowWin(true);
      setFlameScale(1.2);
      if (animRef.current) cancelAnimationFrame(animRef.current);
    }
    if (isLost) {
      setShowExplosion(true);
      if (animRef.current) cancelAnimationFrame(animRef.current);
    }
    return undefined;
  }, [phase, isLaunching, isWon, isLost]);

  const peak = result?.data?.peak ?? distance;
  const mult = result?.multiplier ?? 0;

  return (
    <div className="relative flex flex-col items-center justify-center h-full gap-3 select-none">
      {/* Win celebration overlay */}
      {showWin && (
        <div className="absolute inset-0 z-30 pointer-events-none flex items-center justify-center">
          <div className="text-center animate-bounce">
            <div className="text-4xl font-black text-emerald-400" style={{ textShadow: "0 0 30px #00e67666" }}>
              SURVIVED! {mult.toFixed(1)}x
            </div>
            <div className="text-yellow-400 text-sm mt-1">Score: {Math.floor(score)}</div>
          </div>
          {/* Confetti */}
          {Array.from({ length: 25 }, (_, i) => (
            <div key={i} className="absolute w-2 h-2 rounded-full"
              style={{
                left: `${5 + (i * 137) % 90}%`, top: `${10 + (i * 73) % 50}%`,
                background: ["#ffd600", "#00e676", "#448aff", "#ff1744"][i % 4],
                animation: `confetti-fall ${700 + (i % 6) * 200}ms ease-out ${i * 50}ms forwards`,
                opacity: 0,
              }}
            />
          ))}
        </div>
      )}

      {/* Explosion overlay */}
      {showExplosion && (
        <div className="absolute inset-0 z-30 pointer-events-none flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-2">💥</div>
            <div className="text-3xl font-black text-red-400" style={{ textShadow: "0 0 20px #ff174466" }}>
              CRASHED! {peak.toFixed(1)}x
            </div>
            <div className="text-white/40 text-sm mt-1">Score: {Math.floor(score)}</div>
          </div>
          {/* Explosion particles */}
          {Array.from({ length: 20 }, (_, i) => (
            <div key={i} className="absolute w-3 h-3 rounded-full bg-orange-500"
              style={{
                left: "50%", top: `${rocketY}px`,
                animation: `explode ${500 + (i % 5) * 200}ms ease-out ${i * 30}ms forwards`,
                opacity: 0,
              }}
            />
          ))}
        </div>
      )}

      {/* Top HUD */}
      <div className="flex items-center justify-between w-full max-w-sm px-2">
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-white/30 uppercase tracking-wider">Score</span>
          <span className="text-sm font-mono font-bold text-yellow-400">{Math.floor(score)}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-white/30 uppercase tracking-wider">Dist</span>
          <span className="text-sm font-mono font-bold text-emerald-400">{distance.toFixed(1)}km</span>
        </div>
        <div className="flex items-center gap-0.5">
          {Array.from({ length: 3 }, (_, i) => (
            <span key={i} className={`text-sm ${i < health ? "text-red-400" : "text-white/10"}`}>❤</span>
          ))}
        </div>
      </div>

      {/* Game canvas */}
      <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-[#0a0a14]" style={{ width: W, height: H }}>
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="absolute inset-0">
          {/* Stars (parallax) */}
          {stars.map((s, i) => (
            <circle key={i} cx={s.x} cy={(s.y + (isLaunching ? distance * s.speed * 10 : 0)) % H} r={s.size}
              fill="white" opacity={s.opacity}
            />
          ))}

          {/* Ground line (only when idle) */}
          {phase === "idle" && (
            <line x1={0} y1={H - 20} x2={W} y2={H - 20} stroke="#333" strokeWidth={2} />
          )}

          {/* Launch pad */}
          {(phase === "idle" || isLaunching) && (
            <g>
              <rect x={W/2 - 30} y={H - 35} width={60} height={15} rx={3} fill="#333" />
              <rect x={W/2 - 20} y={H - 20} width={40} height={5} rx={1} fill="#444" />
            </g>
          )}

          {/* Rocket */}
          {!showExplosion && (
            <g transform={`translate(${W/2}, ${rocketY})`} style={{ transition: isLaunching ? "none" : "transform 0.5s" }}>
              {/* Flame trail */}
              {(isLaunching || isWon) && (
                <ellipse cx={0} cy={28} rx={6 * flameScale} ry={14 * flameScale}
                  fill="url(#flameGrad)" opacity={0.9}
                />
              )}
              {/* Body */}
              <rect x={-10} y={-28} width={20} height={36} rx={5}
                fill="url(#rocketGrad)" stroke="#ffd60040" strokeWidth={1}
              />
              {/* Nose cone */}
              <polygon points="0,-48 -10,-28 10,-28" fill="#e74c3c" />
              {/* Fins */}
              <polygon points="-10,8 -22,28 -10,28" fill="#c0392b" />
              <polygon points="10,8 22,28 10,28" fill="#c0392b" />
              {/* Window */}
              <circle cx={0} cy={-10} r={7} fill="#74b9ff" stroke="#0984e3" strokeWidth={2} />
              {/* Glow on win */}
              {isWon && (
                <circle cx={0} cy={-5} r={35} fill="none" stroke="#00e676" strokeWidth={2} opacity={0.4}>
                  <animate attributeName="r" values="30;40;30" dur="1.5s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.4;0.1;0.4" dur="1.5s" repeatCount="indefinite" />
                </circle>
              )}
            </g>
          )}

          {/* Obstacles */}
          {obstacles.map((o, i) => (
            <g key={i} transform={`translate(${o.x}, ${o.y})`}>
              {o.type === "asteroid" && (
                <>
                  <circle r={o.size} fill="#5d4037" stroke="#8d6e63" strokeWidth={2} />
                  <circle r={o.size * 0.4} cx={-o.size * 0.2} cy={-o.size * 0.2} fill="#4e342e" />
                </>
              )}
              {o.type === "mine" && (
                <>
                  <circle r={o.size} fill="#b71c1c" stroke="#ff1744" strokeWidth={2} />
                  <text y={4} textAnchor="middle" fontSize={o.size} fill="#fff">💣</text>
                </>
              )}
              {o.type === "debris" && (
                <>
                  <rect x={-o.size} y={-o.size * 0.4} width={o.size * 2} height={o.size * 0.8} rx={2}
                    fill="#616161" stroke="#9e9e9e" strokeWidth={1}
                  />
                </>
              )}
            </g>
          ))}

          {/* Target altitude line */}
          {(isLaunching || isWon || isLost) && (
            <line x1={0} y1={60} x2={W} y2={60} stroke="#ffd600" strokeWidth={1} strokeDasharray="8,4" opacity={0.3} />
          )}

          <defs>
            <linearGradient id="rocketGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#636e72" />
              <stop offset="50%" stopColor="#dfe6e9" />
              <stop offset="100%" stopColor="#636e72" />
            </linearGradient>
            <radialGradient id="flameGrad" cx="50%" cy="0%">
              <stop offset="0%" stopColor="#ffd700" />
              <stop offset="50%" stopColor="#ff6b00" />
              <stop offset="100%" stopColor="#ff6b0000" />
            </radialGradient>
          </defs>
        </svg>

        {/* Speed lines overlay when launching */}
        {isLaunching && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {Array.from({ length: 8 }, (_, i) => (
              <div key={i} className="absolute h-px bg-white/10"
                style={{
                  left: `${10 + i * 12}%`, width: `${30 + (i % 4) * 20}%`,
                  top: `${(i * 47 + distance * 20) % 100}%`,
                  animation: `speed-line ${300 + (i % 4) * 100}ms linear infinite`,
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Target indicator */}
      {phase !== "idle" && (
        <div className="flex items-center gap-3 bg-white/5 rounded-xl px-4 py-2 border border-white/10">
          <span className="text-white/40 text-xs">Target</span>
          <span className="text-yellow-400 font-bold">{target}x</span>
          <span className="text-white/40 text-xs">Reached</span>
          <span className={`font-bold ${isWon ? "text-emerald-400" : "text-red-400"}`}>{peak.toFixed(1)}x</span>
        </div>
      )}

      {phase === "idle" && (
        <div className="text-center">
          <div className="text-white/20 text-sm font-medium tracking-widest uppercase mb-1">Target Altitude</div>
          <div className="text-3xl font-mono font-black text-white/10">3.0x+</div>
        </div>
      )}

      {/* History chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar max-w-xs px-2">
        {history.slice(-8).map((m, i) => (
          <span key={i} className={`text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 border ${
            m > 0 ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300" : "bg-red-500/20 border-red-500/30 text-red-400"
          }`}>
            {m > 0 ? `${m}x` : "0x"}
          </span>
        ))}
        {history.length === 0 && <span className="text-white/20 text-xs">No launches yet</span>}
      </div>

      {/* Bottom status */}
      {isLaunching && (
        <div className="flex items-center gap-2 text-white/40 text-sm animate-pulse">
          <div className="w-2 h-2 rounded-full bg-orange-400 animate-ping" />
          Rocket ascending...
        </div>
      )}

      <style>{`
        @keyframes confetti-fall {
          0% { opacity: 1; transform: translateY(0) scale(1); }
          100% { opacity: 0; transform: translateY(60px) scale(0.3); }
        }
        @keyframes explode {
          0% { opacity: 1; transform: translate(0,0) scale(1); }
          100% { opacity: 0; transform: translate(${(Math.random()-0.5)*100}px, ${-50-Math.random()*100}px) scale(0.2); }
        }
        @keyframes speed-line {
          0% { transform: translateX(-100%); opacity: 0; }
          50% { opacity: 0.3; }
          100% { transform: translateX(100%); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
