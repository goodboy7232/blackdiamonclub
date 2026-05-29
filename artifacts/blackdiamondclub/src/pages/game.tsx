import { useState, useEffect, useRef } from "react";
import { useParams, useLocation } from "wouter";
import { usePlaceBet, useCashout, useGetWallet, getGetWalletQueryKey, BetInputGameType } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Wallet, Trophy, ChevronLeft, Zap, FlaskConical } from "lucide-react";
import { Link } from "wouter";
import { useDemo, simAviatorCrash, simGame } from "@/hooks/useDemo";
import AviatorGame from "@/components/game/AviatorGame";
import SlotsGame from "@/components/game/SlotsGame";
import CoinFlipGame from "@/components/game/CoinFlipGame";
import LuckyWheelGame from "@/components/game/LuckyWheelGame";
import DiceGame from "@/components/game/DiceGame";
import RocketGame from "@/components/game/RocketGame";
import TowerGame from "@/components/game/TowerGame";
import NumberBlastGame from "@/components/game/NumberBlastGame";
import SpinSprintGame from "@/components/game/SpinSprintGame";
import GemDropGame from "@/components/game/GemDropGame";
import { FakeActivityFeed } from "@/components/game/FakeActivityFeed";

const GAME_META: Record<string, { name: string; desc: string; hasPrediction?: boolean; predictionPlaceholder?: string; predLabel?: string }> = {
  aviator:     { name: "Aviator Crash", desc: "Rocket rises — cash out before it crashes!" },
  slots777:    { name: "777 Strike", desc: "Spin the reels and hit the jackpot" },
  coinflip:    { name: "Coin Flip Quest", desc: "Call it — heads or tails", hasPrediction: true, predictionPlaceholder: "heads or tails", predLabel: "Your call" },
  luckywheel:  { name: "Lucky Wheel", desc: "Spin the wheel, win big" },
  dicedash:    { name: "Dice Dash", desc: "Roll the dice, pick your number", hasPrediction: true, predictionPlaceholder: "2–12", predLabel: "Target sum" },
  rocketrush:  { name: "Rocket Rush", desc: "How high will the rocket go?", hasPrediction: true, predictionPlaceholder: "e.g. 2.5", predLabel: "Target multiplier" },
  towerclimb:  { name: "Tower Climb", desc: "Climb floors, avoid the bomb" },
  numberblast: { name: "Number Blast", desc: "Pick 1-10, closest match wins", hasPrediction: true, predictionPlaceholder: "1-10", predLabel: "Your number" },
  spinsprint:  { name: "Spin Sprint", desc: "Fast wheel, big rewards" },
  gemdrop:     { name: "Gem Drop", desc: "Match gems for prizes" },
};

type AviatorPhase = "idle" | "flying" | "crashed" | "won";
type SimplePhase = "idle" | "spinning" | "rolling" | "flipping" | "blasting" | "dropping" | "launching" | "playing" | "won" | "lost";

export default function Game() {
  const { gameType } = useParams<{ gameType: string }>();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const meta = GAME_META[gameType ?? ""] ?? { name: gameType ?? "Game", desc: "" };

  const { data: wallet } = useGetWallet({ query: { queryKey: getGetWalletQueryKey() } });
  const placeBetMutation = usePlaceBet();
  const cashoutMutation = useCashout();
  const { isDemo, demoBalance, toggleDemo, deductDemo, addDemo, resetDemo } = useDemo();

  // Bet form state
  const [betAmount, setBetAmount] = useState(10);
  const [prediction, setPrediction] = useState("");

  // Aviator state
  const [aviatorPhase, setAviatorPhase] = useState<AviatorPhase>("idle");
  const [multiplier, setMultiplier] = useState(1.0);
  const [aviatorSession, setAviatorSession] = useState<{ sessionId: number; crashPoint: number; startTime: number; won: boolean } | null>(null);
  const [aviatorWin, setAviatorWin] = useState<number | undefined>();
  const [history, setHistory] = useState<number[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Non-aviator state
  const [simPhase, setSimPhase] = useState<SimplePhase>("idle");
  const [simResult, setSimResult] = useState<{ won: boolean; winAmount: number; multiplier: number; data?: Record<string, unknown> } | null>(null);

  const isAviator = gameType === "aviator";
  const isBusy = isAviator ? aviatorPhase === "flying" : simPhase !== "idle" && simPhase !== "won" && simPhase !== "lost";

  // Aviator interval
  useEffect(() => {
    if (aviatorPhase !== "flying" || !aviatorSession) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    const { crashPoint, startTime, sessionId } = aviatorSession;
    intervalRef.current = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000;
      const cur = parseFloat((1.0 + elapsed * 1.2).toFixed(2));
      setMultiplier(cur);
      if (cur >= crashPoint) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        if (!isDemo) {
          cashoutMutation.mutate(
            { data: { sessionId, currentMultiplier: crashPoint } },
            {
              onSuccess: () => {
                setAviatorPhase("crashed");
                setHistory(prev => [crashPoint, ...prev].slice(0, 20));
                toast.error(`Crashed at ${crashPoint.toFixed(2)}x!`);
                queryClient.invalidateQueries({ queryKey: getGetWalletQueryKey() });
              },
            }
          );
        } else {
          setAviatorPhase("crashed");
          setHistory(prev => [crashPoint, ...prev].slice(0, 20));
          toast.error(`Crashed at ${crashPoint.toFixed(2)}x!`);
        }
      }
    }, 100);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [aviatorPhase, aviatorSession, isDemo]);

  const handleCashout = () => {
    if (aviatorPhase !== "flying" || !aviatorSession) return;
    if (intervalRef.current) clearInterval(intervalRef.current);
    const cashoutMult = multiplier;
    const { sessionId, crashPoint } = aviatorSession;

    if (isDemo) {
      const won = aviatorSession.won;
      if (won) {
        const win = parseFloat((betAmount * cashoutMult).toFixed(2));
        addDemo(win);
        setAviatorPhase("won");
        setAviatorWin(win);
        setHistory(prev => [crashPoint, ...prev].slice(0, 20));
        toast.success(`Cashed out at ${cashoutMult.toFixed(2)}x for $${win.toFixed(2)}!`);
      } else {
        setAviatorPhase("crashed");
        setHistory(prev => [crashPoint, ...prev].slice(0, 20));
        toast.error("Too late — already crashed!");
      }
      return;
    }

    cashoutMutation.mutate(
      { data: { sessionId, currentMultiplier: cashoutMult } },
      {
        onSuccess: (data) => {
          if (data.won) {
            setAviatorPhase("won");
            setAviatorWin(data.winAmount);
            toast.success(`Cashed out at ${cashoutMult.toFixed(2)}x for $${data.winAmount.toFixed(2)}!`);
          } else {
            setAviatorPhase("crashed");
            toast.error(`Too late — crashed at ${data.crashPoint?.toFixed(2)}x!`);
          }
          setHistory(prev => [data.crashPoint ?? crashPoint, ...prev].slice(0, 20));
          queryClient.invalidateQueries({ queryKey: getGetWalletQueryKey() });
        },
        onError: () => {
          setAviatorPhase("crashed");
          toast.error("Session already settled.");
        }
      }
    );
  };

  const handleBet = () => {
    if (betAmount <= 0) { toast.error("Enter a valid bet amount"); return; }

    if (isDemo) {
      if (betAmount > demoBalance) { toast.error("Insufficient demo balance"); return; }
      deductDemo(betAmount);

      if (isAviator) {
        const won = Math.random() < 0.50;
        const crashPoint = simAviatorCrash(won);
        setMultiplier(1.0);
        setAviatorPhase("flying");
        setAviatorWin(undefined);
        setAviatorSession({ sessionId: -1, crashPoint, startTime: Date.now(), won });
        toast.success("Demo bet placed — cash out before it crashes!");
      } else {
        const phase = phaseForGame(gameType ?? "");
        setSimPhase(phase);
        setSimResult(null);

        // Tower Climb: result available immediately for interactive play
        if (gameType === "towerclimb") {
          const res = simGame(gameType ?? "", betAmount, prediction);
          setSimResult(res);
        } else {
          setTimeout(() => {
            const res = simGame(gameType ?? "", betAmount, prediction);
            setSimResult(res);
            setSimPhase(res.won ? "won" : "lost");
            if (res.won) {
              addDemo(res.winAmount);
              toast.success(`Won $${res.winAmount.toFixed(2)}! (Demo)`);
            } else {
              toast.error("Lost! (Demo)");
            }
          }, 1800);
        }
      }
      return;
    }

    // Real money
    const validGameType = Object.values(BetInputGameType).includes(gameType as BetInputGameType)
      ? (gameType as BetInputGameType)
      : BetInputGameType.slots777;

    if (isAviator) {
      setMultiplier(1.0);
      setAviatorPhase("idle");
      setAviatorWin(undefined);
    } else {
      setSimPhase(phaseForGame(gameType ?? ""));
      setSimResult(null);
    }

    placeBetMutation.mutate(
      { data: { gameType: validGameType, amount: betAmount, prediction } },
      {
        onSuccess: (data) => {
          queryClient.invalidateQueries({ queryKey: getGetWalletQueryKey() });
          if (isAviator) {
            if (data.sessionId && data.crashPoint != null) {
              setAviatorPhase("flying");
              setAviatorSession({ sessionId: data.sessionId, crashPoint: data.crashPoint, startTime: Date.now(), won: true });
              toast.success("Bet placed — cash out before it crashes!");
            } else {
              setAviatorPhase("crashed");
              setHistory(prev => [1.0, ...prev].slice(0, 20));
              toast.error("Crashed immediately at 1.0x!");
            }
          } else {
            const gameResult = {
              won: data.won,
              winAmount: data.winAmount,
              multiplier: data.multiplier ?? 0,
              data: { symbols: (data as any).symbols, coin: (data as any).coin, d1: (data as any).d1, d2: (data as any).d2, total: (data as any).total, peak: (data as any).peak, answer: (data as any).answer, floors: (data as any).floors, sectorIndex: (data as any).sectorIndex },
            };
            // Tower Climb: set result immediately and keep phase as "playing" for interactive play
            if (gameType === "towerclimb") {
              setSimResult(gameResult);
              toast.success("Tower loaded — climb floors or cash out!");
            } else {
              setTimeout(() => {
                setSimResult(gameResult);
                setSimPhase(data.won ? "won" : "lost");
                if (data.won) toast.success(`You won $${data.winAmount.toFixed(2)}!`);
                else toast.error("You lost. Try again!");
              }, 1500);
            }
          }
        },
        onError: (error) => {
          setSimPhase("idle");
          setAviatorPhase("idle");
          toast.error((error as any)?.data?.error || "Failed to place bet");
        }
      }
    );
  };

  const handleReset = () => {
    setSimPhase("idle");
    setSimResult(null);
    setAviatorPhase("idle");
    setMultiplier(1.0);
    setAviatorSession(null);
    setAviatorWin(undefined);
  };

  const totalBalance = (wallet?.depositBalance ?? 0) + (wallet?.withdrawalBalance ?? 0);
  const balance = isDemo ? demoBalance : totalBalance;
  const QUICK = [1, 2, 5, 10, 25, 50];

  return (
    <div className="pb-12">
      {/* Header bar */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <Link href="/games">
            <button className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors">
              <ChevronLeft size={18} className="text-white/60" />
            </button>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-white">{meta.name}</h1>
            <p className="text-white/30 text-xs">{meta.desc}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Demo toggle */}
          <button
            onClick={toggleDemo}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
              isDemo
                ? "bg-purple-500/20 border-purple-400/40 text-purple-300"
                : "bg-white/5 border-white/10 text-white/40 hover:text-white/70"
            }`}
          >
            <FlaskConical size={12} />
            {isDemo ? "DEMO" : "Demo"}
          </button>

          {/* Balance */}
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-sm font-mono font-bold ${
            isDemo ? "bg-purple-500/10 border-purple-400/20 text-purple-300" : "bg-black/50 border-yellow-400/20 text-yellow-400"
          }`}>
            <Wallet size={14} />
            ${balance.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Demo banner */}
      {isDemo && (
        <div className="mb-4 flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-purple-500/10 border border-purple-400/20">
          <div className="flex items-center gap-2">
            <FlaskConical size={14} className="text-purple-400" />
            <span className="text-purple-200 text-sm font-medium">Demo Mode — play with $10,000 free chips, no real money</span>
          </div>
          <button onClick={resetDemo} className="text-xs text-purple-400 hover:text-purple-200 underline">Reset balance</button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Game canvas */}
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-3xl overflow-hidden border border-white/10 bg-[#0b0e1a] min-h-[400px] flex items-center justify-center">
            {isAviator && (
              <div className="w-full">
                <AviatorGame phase={aviatorPhase} multiplier={multiplier} winAmount={aviatorWin} history={history} />
              </div>
            )}
            {gameType === "slots777" && <SlotsGame phase={simPhase === "spinning" ? "spinning" : simPhase === "won" ? "won" : simPhase === "lost" ? "lost" : "idle"} result={simResult ? { symbols: (simResult.data?.symbols as string[]), won: simResult.won, multiplier: simResult.multiplier } : undefined} />}
            {gameType === "coinflip" && <CoinFlipGame phase={simPhase === "spinning" ? "flipping" : simPhase === "won" ? "won" : simPhase === "lost" ? "lost" : "idle"} result={simResult?.data as any} prediction={prediction} />}
            {gameType === "luckywheel" && <LuckyWheelGame phase={simPhase === "spinning" ? "spinning" : simPhase === "won" ? "won" : simPhase === "lost" ? "lost" : "idle"} result={simResult as any} history={history.map(h => h > 0 ? h : 0)} />}
            {gameType === "dicedash" && <DiceGame phase={simPhase === "rolling" ? "rolling" : simPhase === "won" ? "won" : simPhase === "lost" ? "lost" : "idle"} result={simResult as any} prediction={prediction} history={history.map(h => typeof h === "number" ? h : 0)} />}
            {gameType === "rocketrush" && <RocketGame phase={simPhase === "launching" ? "launching" : simPhase === "won" ? "won" : simPhase === "lost" ? "lost" : "idle"} result={simResult as any} prediction={prediction} history={history.map(h => typeof h === "number" ? h : 0)} />}
            {gameType === "towerclimb" && <TowerGame phase={simPhase === "playing" ? "playing" : simPhase === "won" ? "won" : simPhase === "lost" ? "lost" : "idle"} result={simResult as any} betAmount={betAmount} isDemo={isDemo} onGameEnd={(won, mult, winAmt) => {
              setSimPhase(won ? "won" : "lost");
              if (isDemo) {
                if (won) addDemo(winAmt);
              }
            }} />}
            {gameType === "numberblast" && <NumberBlastGame phase={simPhase === "blasting" ? "blasting" : simPhase === "won" ? "won" : simPhase === "lost" ? "lost" : "idle"} result={simResult as any} onPrediction={setPrediction} prediction={prediction} />}
            {gameType === "spinsprint" && <SpinSprintGame phase={simPhase === "spinning" ? "spinning" : simPhase === "won" ? "won" : simPhase === "lost" ? "lost" : "idle"} result={simResult as any} />}
            {gameType === "gemdrop" && <GemDropGame phase={simPhase === "dropping" ? "dropping" : simPhase === "won" ? "won" : simPhase === "lost" ? "lost" : "idle"} result={simResult as any} />}
          </div>

          {/* Bet controls */}
          <div className="bg-[#0d1117] border border-white/10 rounded-2xl p-5">
            {isAviator && aviatorPhase === "flying" ? (
              <div className="space-y-3">
                <button
                  onClick={handleCashout}
                  className="w-full h-16 rounded-xl text-2xl font-black bg-emerald-500 hover:bg-emerald-400 text-black shadow-[0_0_25px_rgba(0,200,100,0.4)] transition-all active:scale-95"
                  disabled={cashoutMutation.isPending}
                >
                  CASH OUT — {multiplier.toFixed(2)}x
                </button>
                <div className="text-white/30 text-center text-xs">Click before it crashes!</div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Prediction field */}
                {meta.hasPrediction && (
                  <div>
                    <label className="text-xs text-white/40 mb-1 block">{meta.predLabel}</label>
                    {gameType === "coinflip" ? (
                      <div className="flex gap-2">
                        {["heads", "tails"].map(c => (
                          <button key={c} onClick={() => setPrediction(c)}
                            className={`flex-1 py-2 rounded-xl text-sm font-bold border transition-all capitalize ${
                              prediction === c ? "bg-yellow-400/20 border-yellow-400 text-yellow-300" : "bg-white/5 border-white/10 text-white/50 hover:border-white/30"
                            }`}
                          >{c === "heads" ? "👑 Heads" : "⚡ Tails"}</button>
                        ))}
                      </div>
                    ) : (
                      <input
                        type={gameType === "dicedash" ? "number" : "text"}
                        value={prediction}
                        onChange={e => setPrediction(e.target.value)}
                        placeholder={meta.predictionPlaceholder}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-yellow-400/40"
                      />
                    )}
                  </div>
                )}

                {/* Bet amount */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs text-white/40">Bet Amount</label>
                    <span className="text-xs text-white/20">Balance: ${balance.toFixed(2)}</span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setBetAmount(a => Math.max(1, parseFloat((a / 2).toFixed(2))))} className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:text-white text-sm font-bold">½</button>
                    <input
                      type="number"
                      min={1}
                      value={betAmount}
                      onChange={e => setBetAmount(parseFloat(e.target.value) || 0)}
                      className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-center text-xl font-mono font-bold text-white focus:outline-none focus:border-yellow-400/40"
                    />
                    <button onClick={() => setBetAmount(a => parseFloat((a * 2).toFixed(2)))} className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:text-white text-sm font-bold">2×</button>
                  </div>
                  <div className="flex gap-1.5 mt-2">
                    {QUICK.map(q => (
                      <button key={q} onClick={() => setBetAmount(q)} className={`flex-1 py-1 rounded-lg text-xs font-bold border transition-all ${betAmount === q ? "bg-yellow-400/20 border-yellow-400 text-yellow-300" : "bg-white/5 border-white/5 text-white/30 hover:text-white/60"}`}>{q}</button>
                    ))}
                  </div>
                </div>

                {/* Action button */}
                {(simPhase === "won" || simPhase === "lost") && !isAviator ? (
                  <button onClick={handleReset} className="w-full h-14 rounded-xl font-black text-lg bg-white/10 hover:bg-white/20 text-white border border-white/10 transition-all">
                    Play Again
                  </button>
                ) : (
                  <button
                    onClick={handleBet}
                    disabled={isBusy || placeBetMutation.isPending}
                    className="w-full h-14 rounded-xl font-black text-lg bg-gradient-to-r from-yellow-500 to-yellow-400 hover:from-yellow-400 hover:to-yellow-300 text-black shadow-[0_0_20px_rgba(250,204,21,0.3)] disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
                  >
                    {isBusy || placeBetMutation.isPending ? (
                      <span className="flex items-center justify-center gap-2"><span className="animate-spin w-4 h-4 border-2 border-black/30 border-t-black rounded-full inline-block" /> Playing…</span>
                    ) : (
                      <span className="flex items-center justify-center gap-2"><Zap size={18} /> BET ${betAmount}</span>
                    )}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="bg-[#0d1117] border border-white/10 rounded-2xl p-4">
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <Trophy size={14} className="text-yellow-400" /> Live Activity
            </h3>
            <FakeActivityFeed />
          </div>

          <div className="bg-[#0d1117] border border-white/10 rounded-2xl p-4">
            <h3 className="text-sm font-bold text-white mb-3">Recent Multipliers</h3>
            <div className="space-y-2">
              {history.slice(0, 6).map((h, i) => (
                <div key={i} className="flex justify-between items-center text-xs border-b border-white/5 pb-1">
                  <span className="text-white/30">Round #{history.length - i}</span>
                  <span className={`font-mono font-bold ${h >= 5 ? "text-yellow-400" : h >= 2 ? "text-emerald-400" : "text-red-400"}`}>{h.toFixed(2)}x</span>
                </div>
              ))}
              {history.length === 0 && <div className="text-white/20 text-xs">No rounds yet</div>}
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-900/20 to-indigo-900/20 border border-purple-500/20 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <FlaskConical size={14} className="text-purple-400" />
              <span className="text-purple-300 text-xs font-bold">Free Demo</span>
            </div>
            <p className="text-white/30 text-xs mb-3">Practice with $10,000 demo chips — no deposit needed</p>
            {isDemo ? (
              <button onClick={toggleDemo} className="w-full py-2 rounded-xl text-xs font-bold bg-purple-500/20 border border-purple-400/30 text-purple-300 hover:bg-purple-500/30 transition-all">
                Switch to Real Money
              </button>
            ) : (
              <button onClick={toggleDemo} className="w-full py-2 rounded-xl text-xs font-bold bg-purple-500 hover:bg-purple-400 text-white transition-all">
                Try Demo Mode
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function phaseForGame(gameType: string): SimplePhase {
  switch (gameType) {
    case "slots777": case "luckywheel": case "spinsprint": return "spinning";
    case "coinflip": return "spinning";
    case "dicedash": return "rolling";
    case "rocketrush": return "launching";
    case "towerclimb": return "playing";
    case "numberblast": return "blasting";
    case "gemdrop": return "dropping";
    default: return "spinning";
  }
}
