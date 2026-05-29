import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const usernames = ["VIP_Hunter", "CryptoKing", "DiamondHands", "Whale_99", "LuckyStrike", "HighRoller", "GoldenBoy", "EliteGambler", "BetMaster", "RoyalFlush"];
const actions = ["joined", "won", "lost"];

export function FakeActivityFeed() {
  const [activities, setActivities] = useState<{id: number, user: string, action: string, amount: number}[]>([]);

  useEffect(() => {
    let id = 0;
    const interval = setInterval(() => {
      const user = usernames[Math.floor(Math.random() * usernames.length)];
      const action = actions[Math.floor(Math.random() * actions.length)];
      const amount = Math.floor(Math.random() * 1000) + 50;
      
      setActivities(prev => [{id: id++, user, action, amount}, ...prev].slice(0, 5));
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-24 overflow-hidden relative w-full bg-black/20 rounded-lg p-2 mt-4">
      <AnimatePresence>
        {activities.map((act) => (
          <motion.div
            key={act.id}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="text-xs py-1.5 flex items-center justify-between border-b border-white/5 last:border-0"
          >
            <span className="text-gray-400 font-medium">{act.user}</span>
            <span className={`font-semibold ${
              act.action === "won" ? "text-success" :
              act.action === "lost" ? "text-destructive" : "text-primary"
            }`}>
              {act.action === "joined" ? "Joined" : `${act.action.toUpperCase()} $${act.amount}`}
            </span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}