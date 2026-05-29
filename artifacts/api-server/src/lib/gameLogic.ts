// Win probability = 50%
const WIN_PROBABILITY = 0.50;

export function determineWin(): boolean {
  return Math.random() < WIN_PROBABILITY;
}

export function generateCrashPoint(won: boolean): number {
  if (!won) {
    // User is destined to lose → crash immediately (1.00x - 1.20x)
    // This gives 0 chance to cash out before crash
    return 1.0 + Math.random() * 0.2;
  }
  // User can win → give enough time to cash out
  // Min 1.50x ensures at least ~1 second reaction window
  const r = Math.random();
  if (r < 0.60) return 1.5 + Math.random() * 1.5;   // 1.5 - 3.0 (60%)
  if (r < 0.90) return 3.0 + Math.random() * 2.0;     // 3.0 - 5.0 (30%)
  return 5.0 + Math.random() * 95.0;                  // 5.0 - 100.0 (10% rare)
}

export function calculateMultiplier(gameType: string, won: boolean): number {
  if (!won) return 0;
  switch (gameType) {
    case "aviator":
      return 1.5 + Math.random() * 3;
    case "slots777":
      return [1.5, 2, 3, 5, 7, 10][Math.floor(Math.random() * 6)];
    case "rocketrush":
      return 1.3 + Math.random() * 2;
    case "coinflip":
      return 1.9; // near double
    case "spinsprint":
      return [1.5, 2, 3, 5][Math.floor(Math.random() * 4)];
    case "dicedash":
      return [1.5, 2, 5, 10][Math.floor(Math.random() * 4)];
    case "towerclimb":
      // Per-floor multipliers: floor 1=1.5x, 2=2x, ..., 8=10x
      return [1.5, 2, 2.5, 3, 4, 5, 7, 10][Math.floor(Math.random() * 8)];
    case "luckywheel":
      return [1.5, 2, 3, 5, 10][Math.floor(Math.random() * 5)];
    case "numberblast":
      // Tiered: 9x exact, 3x close (±1), 1.5x near (±2)
      return [1.5, 3, 9][Math.floor(Math.random() * 3)];
    case "gemdrop":
      return 1.3 + Math.random() * 2;
    default:
      return 2;
  }
}

const FAKE_NAMES = [
  "ShadowKing88", "LuckyAce", "GoldRush99", "NightWolf", "DiamondDave",
  "VIPPlayer", "BlackJack47", "HighRoller", "CryptoWolf", "JetSetBet",
  "EliteGambler", "StarlightBet", "PhoenixRise", "DarkKnight", "VelvetAce",
  "PlatinoMike", "GoldenEagle", "MidnightRun", "AceOfSpades", "RoyalFlush",
  "StormRider", "DiamondHand", "CrownKing", "NeonBet", "SilverBullet",
  "TitanBet", "CobraKing", "BlazingAce", "WildCard9", "OnyxBlade",
];

/** Generate tower data: floor where bomb hits (loss) or max floor reached (win).
 *  Bomb floor >= 3 so user has a real cash-out choice.
 */
export function generateTowerData(won: boolean): { floors: number } {
  if (won) {
    const floors = 5 + Math.floor(Math.random() * 4); // 5-8
    return { floors };
  } else {
    const floors = 3 + Math.floor(Math.random() * 4); // 3-6 (bomb floor)
    return { floors };
  }
}

// Floor-to-multiplier mapping: floor 1=1.5x, 2=2x, ..., 8=10x
export const TOWER_MULTIPLIERS = [0, 1.5, 2, 2.5, 3, 4, 5, 7, 10];

/** Generate Number Blast data based on player's guess and outcome.
 *  Range 1-10. 9x exact, 3x ±1, 1.5x ±2. Outside = loss.
 */
export function generateNumberBlastData(won: boolean, guess: number | null): { answer: number } {
  const RANGE = 10;
  const g = Math.max(1, Math.min(RANGE, guess ?? Math.floor(Math.random() * RANGE) + 1));
  if (won) {
    // Pick a random winning tier: 0, 1, or 2 distance
    const tier = Math.floor(Math.random() * 3); // 0=exact, 1=±1, 2=±2
    const offset = tier === 0 ? 0 : (Math.random() < 0.5 ? tier : -tier);
    let answer = g + offset;
    // Clamp to 1-10 range
    if (answer < 1) answer = g + Math.abs(offset);
    if (answer > RANGE) answer = g - Math.abs(offset);
    if (answer < 1) answer = 1;
    if (answer > RANGE) answer = RANGE;
    return { answer };
  } else {
    // Loss: pick a number >2 away from guess
    let answer: number;
    do {
      answer = Math.floor(Math.random() * RANGE) + 1;
    } while (Math.abs(answer - g) <= 2);
    return { answer };
  }
}

export function calculateNumberBlastMultiplier(answer: number, guess: number): number {
  const diff = Math.abs(answer - guess);
  if (diff === 0) return 9;
  if (diff <= 1) return 3;
  if (diff <= 2) return 1.5;
  return 0;
}

export function generateFakeActivity(count = 5) {
  return Array.from({ length: count }, () => {
    const won = Math.random() > 0.5;
    const multiplier = won ? (1.2 + Math.random() * 5).toFixed(2) : null;
    const amount = (0.5 + Math.random() * 50).toFixed(2);
    const actions: Array<"entered" | "won" | "lost"> = won ? ["won"] : ["lost", "entered"];
    const action = actions[Math.floor(Math.random() * actions.length)];
    const minutesAgo = Math.floor(Math.random() * 60);
    return {
      username: FAKE_NAMES[Math.floor(Math.random() * FAKE_NAMES.length)],
      amount: parseFloat(amount),
      multiplier: multiplier ? parseFloat(multiplier) : null,
      action,
      time: minutesAgo === 0 ? "just now" : `${minutesAgo}m ago`,
    };
  });
}

export function generateFakeLeaderboard(count = 20) {
  const shuffled = [...FAKE_NAMES].sort(() => Math.random() - 0.5).slice(0, count);
  return shuffled.map((username, i) => ({
    rank: i + 1,
    username,
    totalWinnings: parseFloat((100 + Math.random() * 50000).toFixed(2)),
    gamesPlayed: Math.floor(50 + Math.random() * 2000),
    winRate: parseFloat((25 + Math.random() * 40).toFixed(1)),
    isOnline: Math.random() > 0.4,
  })).sort((a, b) => b.totalWinnings - a.totalWinnings).map((e, i) => ({ ...e, rank: i + 1 }));
}
