import { useEffect, useState } from "react";

interface Props {
  phase: "idle" | "flipping" | "won" | "lost";
  result?: { coin?: string };
  prediction?: string;
}

export default function CoinFlipGame({ phase, result, prediction }: Props) {
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    if (phase === "flipping") {
      setShowResult(false);
      const t = setTimeout(() => setShowResult(true), 1200);
      return () => clearTimeout(t);
    }
    if (phase === "won" || phase === "lost") {
      setShowResult(true);
    }
    return undefined;
  }, [phase]);

  const coin = result?.coin ?? "heads";
  const isFlipping = phase === "flipping" && !showResult;

  return (
    <div className="flex flex-col items-center justify-center h-full gap-8">
      {/* Coin */}
      <div className={`relative transition-all duration-300 ${phase === "won" ? "drop-shadow-[0_0_30px_rgba(250,204,21,0.6)]" : ""}`}>
        <div
          className={`w-40 h-40 rounded-full flex items-center justify-center text-6xl font-black border-8 transition-all ${
            isFlipping ? "animate-coin-flip" :
            coin === "heads"
              ? "bg-gradient-to-br from-yellow-300 to-yellow-600 border-yellow-700 text-yellow-900"
              : "bg-gradient-to-br from-gray-300 to-gray-500 border-gray-600 text-gray-800"
          }`}
          style={{ perspective: 1000 }}
        >
          {isFlipping ? "🪙" : coin === "heads" ? "👑" : "⚡"}
        </div>

        {/* Label */}
        {!isFlipping && (
          <div className={`absolute -bottom-6 left-1/2 -translate-x-1/2 text-sm font-bold uppercase tracking-widest ${
            coin === "heads" ? "text-yellow-400" : "text-gray-300"
          }`}>
            {coin}
          </div>
        )}
      </div>

      {/* Choose side buttons (idle only) */}
      {phase === "idle" && (
        <div className="flex gap-8 text-center">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-300 to-yellow-600 border-4 border-yellow-700 flex items-center justify-center text-3xl mx-auto mb-2">👑</div>
            <p className="text-yellow-400 text-sm font-bold">HEADS</p>
            <p className="text-white/30 text-xs">1.9x</p>
          </div>
          <div className="text-2xl font-black text-white/20 self-center">VS</div>
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-300 to-gray-500 border-4 border-gray-600 flex items-center justify-center text-3xl mx-auto mb-2">⚡</div>
            <p className="text-gray-300 text-sm font-bold">TAILS</p>
            <p className="text-white/30 text-xs">1.9x</p>
          </div>
        </div>
      )}

      {/* Result */}
      {(phase === "won" || phase === "lost") && (
        <div className={`text-2xl font-bold ${phase === "won" ? "text-yellow-400" : "text-red-400"}`}>
          {phase === "won" ? "Correct! 1.9x 🎉" : `It was ${coin}! Better luck next time.`}
        </div>
      )}

      {phase === "flipping" && !showResult && (
        <div className="text-white/40 text-sm animate-pulse">Flipping coin…</div>
      )}
    </div>
  );
}
