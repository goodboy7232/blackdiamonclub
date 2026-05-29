import { useState, useCallback } from "react";

const MODE_KEY = "bdc_demo";
const BAL_KEY = "bdc_demo_bal";
const DEFAULT_BAL = 10000;

export function useDemo() {
  const [isDemo, setIsDemo] = useState(() => localStorage.getItem(MODE_KEY) === "true");
  const [demoBalance, setDemoBalance] = useState(() => {
    const v = localStorage.getItem(BAL_KEY);
    return v ? parseFloat(v) : DEFAULT_BAL;
  });

  const toggleDemo = useCallback(() => {
    setIsDemo(prev => {
      const next = !prev;
      localStorage.setItem(MODE_KEY, String(next));
      return next;
    });
  }, []);

  const deductDemo = useCallback((amount: number) => {
    setDemoBalance(prev => {
      const next = Math.max(0, prev - amount);
      localStorage.setItem(BAL_KEY, String(next));
      return next;
    });
  }, []);

  const addDemo = useCallback((amount: number) => {
    setDemoBalance(prev => {
      const next = prev + amount;
      localStorage.setItem(BAL_KEY, String(next));
      return next;
    });
  }, []);

  const resetDemo = useCallback(() => {
    setDemoBalance(DEFAULT_BAL);
    localStorage.setItem(BAL_KEY, String(DEFAULT_BAL));
  }, []);

  return { isDemo, demoBalance, toggleDemo, deductDemo, addDemo, resetDemo };
}

export function simAviatorCrash(won: boolean): number {
  if (!won) {
    return parseFloat((1.0 + Math.random() * 0.2).toFixed(2));
  }
  const r = Math.random();
  if (r < 0.60) return parseFloat((1.5 + Math.random() * 1.5).toFixed(2));
  if (r < 0.90) return parseFloat((3.0 + Math.random() * 2.0).toFixed(2));
  return parseFloat((5.0 + Math.random() * 95.0).toFixed(2));
}

export function simGame(gameType: string, amount: number, prediction?: string): {
  won: boolean; winAmount: number; multiplier: number; data?: Record<string, unknown>;
} {
  // 50% win probability for all games
  const WIN_PROB = 0.50;

  switch (gameType) {
    case "coinflip": {
      // Pure 50/50 — keep as natural coin toss
      const coin = Math.random() < 0.5 ? "heads" : "tails";
      const predicted = (prediction || "heads").toLowerCase().trim();
      const won = coin === predicted;
      return { won, winAmount: won ? amount * 1.9 : 0, multiplier: 1.9, data: { coin, predicted } };
    }

    case "slots777": {
      const won = Math.random() < WIN_PROB;
      const SYMS = ["7","BAR","💎","🍒","⭐","🔔","🍋","BAR"];
      let s: string[], mult: number;
      if (won) {
        const sym = ["7","💎","⭐","🔔","BAR"][Math.floor(Math.random() * 5)];
        s = [sym, sym, sym];
        mult = sym === "7" ? 20 : sym === "💎" ? 10 : sym === "⭐" ? 8 : 5;
      } else {
        let a = SYMS[Math.floor(Math.random() * SYMS.length)];
        let b = SYMS[Math.floor(Math.random() * SYMS.length)];
        let c = SYMS[Math.floor(Math.random() * SYMS.length)];
        while (a === b && b === c) { c = SYMS[Math.floor(Math.random() * SYMS.length)]; }
        s = [a, b, c];
        mult = 0;
      }
      return { won, winAmount: won ? amount * mult : 0, multiplier: mult, data: { symbols: s } };
    }

    case "luckywheel": {
      // 50% win: pick from win sectors or lose sectors
      const won = Math.random() < WIN_PROB;
      // Win sectors: indices 2(1.5x), 5(2x), 8(5x), 11(10x)
      // Lose sectors: indices 0,1,3,4,6,7,9,10
      const winSectors  = [2, 5, 8, 11];
      const loseSectors = [0, 1, 3, 4, 6, 7, 9, 10];
      const multMap = [0,0,1.5,0,0,2,0,0,5,0,0,10];
      const idx = won
        ? winSectors[Math.floor(Math.random() * winSectors.length)]
        : loseSectors[Math.floor(Math.random() * loseSectors.length)];
      const mult = multMap[idx];
      return { won, winAmount: won ? amount * mult : 0, multiplier: mult, data: { sectorIndex: idx } };
    }

    case "spinsprint": {
      const won = Math.random() < WIN_PROB;
      const sectors = [0, 2, 0, 1.5, 0, 3, 0, 1.5, 0, 5, 0, 10];
      let idx: number;
      if (won) {
        const winPositions = [1, 3, 5, 7, 9, 11];
        idx = winPositions[Math.floor(Math.random() * winPositions.length)];
      } else {
        const losePositions = [0, 2, 4, 6, 8, 10];
        idx = losePositions[Math.floor(Math.random() * losePositions.length)];
      }
      const mult = sectors[idx];
      return { won, winAmount: won ? amount * mult : 0, multiplier: mult, data: { sectorIndex: idx } };
    }

    case "dicedash": {
      // Force 50% win: if won, generate dice that match prediction; else generate mismatch
      const target = prediction ? parseInt(prediction) : 7;
      const won = Math.random() < WIN_PROB;
      let d1: number, d2: number;
      if (won) {
        // Generate two dice that sum to target
        const validPairs: [number, number][] = [];
        for (let a = 1; a <= 6; a++) {
          for (let b = 1; b <= 6; b++) {
            if (a + b === target) validPairs.push([a, b]);
          }
        }
        if (validPairs.length > 0) {
          [d1, d2] = validPairs[Math.floor(Math.random() * validPairs.length)];
        } else {
          d1 = Math.ceil(Math.random() * 6);
          d2 = Math.ceil(Math.random() * 6);
        }
      } else {
        // Generate dice that do NOT sum to target
        do {
          d1 = Math.ceil(Math.random() * 6);
          d2 = Math.ceil(Math.random() * 6);
        } while (d1 + d2 === target);
      }
      const total = d1 + d2;
      const actualWon = total === target;
      const paytable: Record<number, number> = { 2:30, 3:15, 4:10, 5:8, 6:6, 7:5, 8:6, 9:8, 10:10, 11:15, 12:30 };
      const mult = actualWon ? (paytable[target] || 5) : 0;
      return { won: actualWon, winAmount: actualWon ? amount * mult : 0, multiplier: mult, data: { d1, d2, total } };
    }

    case "rocketrush": {
      const target = prediction ? parseFloat(prediction) : 3;
      const won = Math.random() < WIN_PROB;
      const peak = won
        ? parseFloat((target + 0.2 + Math.random() * 2.0).toFixed(2))
        : parseFloat((1.0 + Math.random() * Math.max(target - 0.3, 0.5)).toFixed(2));
      return { won, winAmount: won ? amount * target : 0, multiplier: won ? target : 0, data: { peak } };
    }

    case "numberblast": {
      const guess = prediction ? parseInt(prediction) : 5;
      const clamped = Math.max(1, Math.min(10, guess));
      const won = Math.random() < WIN_PROB;
      let answer: number;
      if (won) {
        // Tiered proximity: exact (9x), close (±1 → 3x), or near (±2 → 1.5x)
        const r = Math.random();
        if (r < 0.10) {
          // 10% exact
          answer = clamped;
        } else if (r < 0.60) {
          // 50% close (±1)
          const off = 1;
          const dir = Math.random() < 0.5 ? 1 : -1;
          let a = clamped + off * dir;
          if (a < 1) a = clamped + off;
          if (a > 10) a = clamped - off;
          answer = a;
        } else {
          // 40% near (±2)
          const off = 2;
          const dir = Math.random() < 0.5 ? 1 : -1;
          let a = clamped + off * dir;
          if (a < 1) a = clamped + off;
          if (a > 10) a = clamped - off;
          answer = a;
        }
      } else {
        // Loss: >2 away from guess (since 1-10 range, any >2 diff is a loss)
        const badOptions: number[] = [];
        for (let a = 1; a <= 10; a++) {
          if (Math.abs(a - clamped) > 2) badOptions.push(a);
        }
        answer = badOptions[Math.floor(Math.random() * badOptions.length)];
      }
      const diff = Math.abs(answer - clamped);
      const mult = diff === 0 ? 9 : diff <= 1 ? 3 : diff <= 2 ? 1.5 : 0;
      return { won: mult > 0, winAmount: amount * mult, multiplier: mult, data: { answer, guess: clamped } };
    }

    case "gemdrop": {
      const won = Math.random() < WIN_PROB;
      let mult: number;
      if (won) {
        const r = Math.random();
        mult = r < 0.60 ? 1.5 : r < 0.90 ? 3 : 7;
      } else {
        mult = 0;
      }
      return { won, winAmount: amount * mult, multiplier: mult };
    }

    case "towerclimb": {
      const won = Math.random() < WIN_PROB;
      const multMap = [0, 1.5, 2, 2.5, 3, 4, 5, 7, 10];
      let floors: number, mult: number;
      if (won) {
        floors = 5 + Math.floor(Math.random() * 4); // 5-8
        mult = multMap[floors];
      } else {
        // Bomb must appear on floor 3 or higher so user has a real cash-out choice
        floors = 3 + Math.floor(Math.random() * 4); // 3-6 → bomb hits
        mult = 0;
      }
      return { won, winAmount: won ? amount * mult : 0, multiplier: mult, data: { floors } };
    }

    default:
      return { won: Math.random() < WIN_PROB, winAmount: Math.random() < WIN_PROB ? amount * 2 : 0, multiplier: 2 };
  }
}
