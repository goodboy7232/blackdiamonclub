import { useState, useEffect, useRef } from "react";

const COLS = 5;
const ROWS = 5;

type GemType = "diamond" | "ruby" | "emerald" | "sapphire" | "gold" | "amethyst";

const GEM_CFG: Record<GemType, {
  label: string; bg: string; border: string; glow: string; activeBg: string;
}> = {
  diamond:  { label: "◆", bg: "bg-cyan-900/50",    border: "border-cyan-700/40",   glow: "shadow-[0_0_14px_rgba(34,211,238,0.55)]  border-cyan-400/80",  activeBg: "bg-cyan-500/30" },
  ruby:     { label: "♦", bg: "bg-red-900/50",     border: "border-red-700/40",    glow: "shadow-[0_0_14px_rgba(248,113,113,0.55)] border-red-400/80",   activeBg: "bg-red-500/30" },
  emerald:  { label: "●", bg: "bg-green-900/50",   border: "border-green-700/40",  glow: "shadow-[0_0_14px_rgba(74,222,128,0.55)]  border-green-400/80", activeBg: "bg-green-500/30" },
  sapphire: { label: "◉", bg: "bg-blue-900/50",    border: "border-blue-700/40",   glow: "shadow-[0_0_14px_rgba(96,165,250,0.55)]  border-blue-400/80", activeBg: "bg-blue-500/30" },
  gold:     { label: "★", bg: "bg-yellow-900/50",  border: "border-yellow-700/40", glow: "shadow-[0_0_14px_rgba(250,204,21,0.55)]  border-yellow-400/80",activeBg: "bg-yellow-500/30" },
  amethyst: { label: "✦", bg: "bg-purple-900/50",  border: "border-purple-700/40", glow: "shadow-[0_0_14px_rgba(192,132,252,0.55)] border-purple-400/80", activeBg: "bg-purple-500/30" },
};

const GEM_TYPES = Object.keys(GEM_CFG) as GemType[];

function makeRow(): GemType[] {
  return Array.from({ length: COLS }, () => GEM_TYPES[Math.floor(Math.random() * GEM_TYPES.length)]);
}

function makeGrid(): GemType[][] {
  return Array.from({ length: ROWS }, () => makeRow());
}

/** Scan all rows to find the one with the most matching gems.
 *  Returns { rowIdx, gemType, count } for the best match. */
function scanBestRow(grid: GemType[][]): { rowIdx: number; gemType: GemType; count: number } {
  let best = { rowIdx: 0, gemType: GEM_TYPES[0], count: 0 };
  for (let r = 0; r < ROWS; r++) {
    const row = grid[r];
    const freq: Record<GemType, number> = { diamond:0, ruby:0, emerald:0, sapphire:0, gold:0, amethyst:0 };
    row.forEach(g => freq[g]++);
    for (const gem of GEM_TYPES) {
      if (freq[gem] > best.count) {
        best = { rowIdx: r, gemType: gem, count: freq[gem] };
      }
    }
  }
  return best;
}

interface Props {
  phase: "idle" | "dropping" | "won" | "lost";
  result?: { won: boolean; multiplier?: number };
}

export default function GemDropGame({ phase, result }: Props) {
  const [grid, setGrid] = useState<GemType[][]>(makeGrid);
  const [revealedRows, setRevealedRows] = useState(ROWS);
  const [winRow, setWinRow] = useState<number | null>(null);
  const [matchCount, setMatchCount] = useState(0);
  const [winGem, setWinGem] = useState<GemType | null>(null);
  const [matchedPositions, setMatchedPositions] = useState<number[]>([]);
  const [pulse, setPulse] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (phase === "idle") {
      setGrid(makeGrid());
      setRevealedRows(ROWS);
      setWinRow(null);
      setMatchCount(0);
      setWinGem(null);
      setMatchedPositions([]);
      setPulse(false);
      if (timerRef.current) clearTimeout(timerRef.current);
      return undefined;
    }

    if (phase === "dropping") {
      const won = result?.won ?? false;
      const mult = result?.multiplier ?? 0;
      const matches = mult >= 7 ? 5 : mult >= 3 ? 4 : mult >= 1.5 ? 3 : 0;

      const newGrid = makeGrid();
      let winRowIdx: number | null = null;
      let winGemType: GemType | null = null;
      let matchCnt = 0;
      let matchedPositions: number[] = [];

      if (won && matches > 0) {
        // Find the best row
        const best = scanBestRow(newGrid);
        winRowIdx = best.rowIdx;
        winGemType = best.gemType;
        matchCnt = best.count;

        // If the natural best row doesn't have enough matches, override
        if (winRowIdx != null && winGemType != null && matchCnt < matches) {
          const positions = [0, 1, 2, 3, 4];
          for (let i = positions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [positions[i], positions[j]] = [positions[j], positions[i]];
          }
          const toChange = positions.slice(0, matches);
          const targetRow = winRowIdx;
          const targetGem = winGemType;
          toChange.forEach(col => {
            newGrid[targetRow][col] = targetGem;
          });
          matchCnt = matches;
        }

        // Recompute exact matched positions after override
        if (winRowIdx != null && winGemType != null) {
          matchedPositions = [];
          newGrid[winRowIdx].forEach((g, ci) => {
            if (g === winGemType) matchedPositions.push(ci);
          });
          matchCnt = matchedPositions.length;
        }
      }

      setGrid(newGrid);
      setRevealedRows(0);
      setWinRow(null);
      setMatchCount(matchCnt);
      setWinGem(winGemType);
      setMatchedPositions(matchedPositions);
      setPulse(false);

      let shown = 0;
      const showNext = () => {
        shown++;
        setRevealedRows(shown);
        if (shown < ROWS) {
          timerRef.current = setTimeout(showNext, 230);
        } else if (won && winRowIdx !== null) {
          timerRef.current = setTimeout(() => {
            setWinRow(winRowIdx);
            setPulse(true);
          }, 350);
        }
      };
      timerRef.current = setTimeout(showNext, 180);

      return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    }

    if (phase === "won" || phase === "lost") {
      setRevealedRows(ROWS);
    }

    return undefined;
  }, [phase, result]);

  const getMultTier = (mult: number) => {
    if (mult >= 7) return { label: "5 MATCH", color: "text-yellow-400", glow: "shadow-[0_0_20px_rgba(250,204,21,0.5)]" };
    if (mult >= 3) return { label: "4 MATCH", color: "text-purple-400", glow: "shadow-[0_0_16px_rgba(192,132,252,0.4)]" };
    return { label: "3 MATCH", color: "text-cyan-400", glow: "shadow-[0_0_12px_rgba(34,211,238,0.4)]" };
  };

  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 px-4 select-none">
      {/* Grid */}
      <div className="p-3 rounded-2xl bg-black/70 border border-white/10 shadow-2xl">
        <div className="flex flex-col gap-1.5">
          {Array.from({ length: ROWS }, (_, rowIdx) => {
            const isRevealed = rowIdx >= ROWS - revealedRows;
            const isWinRow = winRow !== null && rowIdx === winRow;

            return (
              <div
                key={rowIdx}
                className={`flex gap-1.5 transition-all duration-280 ${
                  isRevealed ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"
                } ${isWinRow && pulse ? "scale-105" : ""}`}
              >
                {grid[rowIdx].map((gem, ci) => {
                  const cfg = GEM_CFG[gem];
                  const isMatch = isWinRow && gem === winGem && matchedPositions.includes(ci);
                  const isDim  = isWinRow && !matchedPositions.includes(ci);

                  return (
                    <div
                      key={ci}
                      className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl font-black border-2 transition-all duration-300 ${cfg.bg} ${
                        isMatch
                          ? `${cfg.activeBg} ${cfg.glow} scale-110`
                          : isDim
                          ? `${cfg.border} opacity-35`
                          : cfg.border
                      }`}
                    >
                      <span className={isMatch ? "drop-shadow-md" : "opacity-70"}>
                        {cfg.label}
                      </span>
                    </div>
                  );
                })}

                {/* Match badge */}
                {isWinRow && matchCount > 0 && (
                  <div className="ml-1 flex items-center">
                    <div className={`px-2 py-0.5 rounded-lg text-xs font-black ${getMultTier(result?.multiplier ?? 0).color} bg-black/60 border border-white/10 whitespace-nowrap ${pulse ? getMultTier(result?.multiplier ?? 0).glow : ""}`}>
                      {matchCount}×
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Win tiers */}
      <div className="flex gap-2">
        {[
          { n: 3, mult: "1.5x", color: "text-cyan-400",   bg: "bg-cyan-400/10 border-cyan-400/25" },
          { n: 4, mult: "3x",   color: "text-purple-400", bg: "bg-purple-400/10 border-purple-400/25" },
          { n: 5, mult: "7x",   color: "text-yellow-400", bg: "bg-yellow-400/10 border-yellow-400/25" },
        ].map(t => (
          <div key={t.n} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs ${t.bg}`}>
            <span className={`font-black ${t.color}`}>{t.mult}</span>
            <span className="text-white/25">{t.n} match</span>
          </div>
        ))}
      </div>

      {/* Status */}
      <div className="text-center min-h-[28px]">
        {phase === "idle" && (
          <p className="text-white/30 text-sm">Match gems in a row for prizes!</p>
        )}
        {phase === "dropping" && winRow === null && revealedRows < ROWS && (
          <p className="text-white/40 text-sm animate-pulse">Dropping gems…</p>
        )}
        {phase === "dropping" && winRow !== null && (
          <p className={`text-sm font-bold animate-pulse ${getMultTier(result?.multiplier ?? 0).color}`}>
            {matchCount} gem match!
          </p>
        )}
        {(phase === "won" || phase === "lost") && (
          <p className={`text-2xl font-black ${phase === "won" ? "text-cyan-400" : "text-red-400"}`}>
            {phase === "won" ? `${result?.multiplier}x WIN! 💎` : "No match this round!"}
          </p>
        )}
      </div>
    </div>
  );
}
