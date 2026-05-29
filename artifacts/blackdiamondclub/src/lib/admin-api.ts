const BASE = "/api";

function getToken() {
  return localStorage.getItem("bdc_token");
}

async function req<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error ?? `HTTP ${res.status}`);
  return data as T;
}

export const adminApi = {
  login: (username: string, password: string) =>
    req<{ token: string; username: string }>("/admin/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),

  dashboard: () => req<AdminDashboard>("/admin/dashboard"),

  users: (params?: { limit?: number; offset?: number; search?: string }) => {
    const q = new URLSearchParams();
    if (params?.limit) q.set("limit", String(params.limit));
    if (params?.offset) q.set("offset", String(params.offset));
    if (params?.search) q.set("search", params.search);
    return req<{ users: AdminUser[]; total: number }>(`/admin/users?${q}`);
  },

  user: (id: number) => req<AdminUserDetail>(`/admin/users/${id}`),

  updateUser: (id: number, data: { isBanned?: boolean; depositBalance?: number; withdrawalBalance?: number }) =>
    req<{ message: string }>(`/admin/users/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  transactions: (params?: { limit?: number; offset?: number; type?: string; status?: string }) => {
    const q = new URLSearchParams();
    if (params?.limit) q.set("limit", String(params.limit));
    if (params?.offset) q.set("offset", String(params.offset));
    if (params?.type) q.set("type", params.type);
    if (params?.status) q.set("status", params.status);
    return req<{ transactions: AdminTransaction[]; total: number }>(`/admin/transactions?${q}`);
  },

  updateTransaction: (id: number, data: { status: string; notes?: string }) =>
    req<{ message: string }>(`/admin/transactions/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  transactionScreenshot: (id: number) =>
    req<{ screenshot: string }>(`/admin/transactions/${id}/screenshot`),

  rescanTransaction: (id: number) =>
    req<{ message: string; aiVerified?: boolean; aiFailReason?: string | null }>(`/admin/transactions/${id}/rescan`, {
      method: "POST",
    }),

  games: (params?: { limit?: number; offset?: number; gameType?: string }) => {
    const q = new URLSearchParams();
    if (params?.limit) q.set("limit", String(params.limit));
    if (params?.offset) q.set("offset", String(params.offset));
    if (params?.gameType) q.set("gameType", params.gameType);
    return req<{ sessions: AdminGameSession[]; gameProfits: GameProfit[]; total: number }>(`/admin/games?${q}`);
  },

  settings: () => req<AdminSettings>("/admin/settings"),

  updateSettings: (data: Partial<AdminSettings>) =>
    req<{ message: string }>("/admin/settings", {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
};

export interface AdminDashboard {
  totalUsers: number;
  activeGameSessions: number;
  totalDeposited: number;
  totalWithdrawn: number;
  platformRevenue: number;
  pendingDeposits: number;
  pendingWithdrawals: number;
}

export interface AdminUser {
  id: number;
  username: string;
  email: string | null;
  phone: string | null;
  isAdmin: boolean;
  isBanned: boolean;
  createdAt: string;
  depositBalance: number;
  withdrawalBalance: number;
}

export interface AdminUserDetail extends AdminUser {
  totalBets: number;
  totalWins: number;
  recentTransactions: {
    id: number;
    type: string;
    amount: number;
    status: string;
    createdAt: string;
    gameType: string | null;
    walletAddress: string | null;
    screenshotUrl: string | null;
    txHash: string | null;
  }[];
}

export interface AdminTransaction {
  id: number;
  userId: number;
  username: string;
  type: string;
  amount: number;
  status: string;
  txHash: string | null;
  hasScreenshot: boolean;
  walletAddress: string | null;
  notes: string | null;
  gameType: string | null;
  createdAt: string;
  // AI verification
  aiVerified: boolean | null;
  aiConfidence: number | null;
  aiExtractedAmount: number | null;
  aiExtractedAddress: string | null;
  aiExtractedTxHash: string | null;
  aiExtractedAt: string | null;
  aiFailReason: string | null;
  // Per-check breakdown
  aiCheckConfidence: boolean | null;
  aiCheckAmount: boolean | null;
  aiCheckAddress: boolean | null;
  aiCheckTimestamp: boolean | null;
  aiCheckDuplicate: boolean | null;
}

export interface AdminGameSession {
  id: number;
  userId: number;
  username: string;
  gameType: string;
  betAmount: number;
  multiplier: number;
  winAmount: number;
  won: boolean;
  isActive: boolean;
  crashPoint: number | null;
  createdAt: string;
  settledAt: string | null;
}

export interface GameProfit {
  gameType: string;
  totalBets: number;
  totalWins: number;
  totalBetAmount: number;
  totalWinAmount: number;
  profit: number;
}

export interface AdminSettings {
  minDeposit: number;
  minWithdrawal: number;
  gamesEnabled: boolean;
  maintenanceMode: boolean;
  depositAddress: string;
  depositQrCode: string;
}
