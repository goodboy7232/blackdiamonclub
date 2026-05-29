import { useEffect, useState } from "react";
import { adminApi, AdminTransaction } from "@/lib/admin-api";
import { toast } from "sonner";
import { Check, X, Image, ZoomIn, Bot, AlertTriangle, ShieldCheck, RefreshCw } from "lucide-react";

type FilterType = "" | "deposit" | "withdrawal" | "game_win" | "game_loss";
type FilterStatus = "" | "pending" | "approved" | "rejected";

function AiBadge({ tx }: { tx: AdminTransaction }) {
  if (tx.type !== "deposit") return null;

  // Not yet scanned
  if (tx.aiVerified === null || tx.aiVerified === undefined) {
    if (!tx.hasScreenshot) return null;
    return (
      <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-gray-500/10 border border-gray-500/20 text-gray-400">
        <Bot size={9} /> Scanning…
      </span>
    );
  }

  if (tx.aiVerified) {
    return (
      <span
        title={`Auto-approved at ${(tx.aiConfidence! * 100).toFixed(0)}% confidence`}
        className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 cursor-help"
      >
        <ShieldCheck size={9} /> Verified ✓
      </span>
    );
  }

  return (
    <span
      title={tx.aiFailReason ?? "Needs review"}
      className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 cursor-help"
    >
      <AlertTriangle size={9} /> Needs Review ⚠
    </span>
  );
}

function CheckBadge({ pass, label }: { pass: boolean | null; label: string }) {
  if (pass === null) return (
    <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded border border-gray-600/40 text-gray-500 bg-gray-800/40">
      — {label}
    </span>
  );
  return pass ? (
    <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded border border-emerald-500/30 text-emerald-400 bg-emerald-500/10">
      <Check size={9} /> {label}
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded border border-red-500/30 text-red-400 bg-red-500/10">
      <X size={9} /> {label}
    </span>
  );
}

function AiDetailsPanel({ tx }: { tx: AdminTransaction }) {
  if (tx.type !== "deposit" || tx.aiVerified === null || tx.aiVerified === undefined) return null;

  return (
    <div className={`px-4 py-3 text-xs border-t ${tx.aiVerified ? "border-emerald-500/10 bg-emerald-500/5" : "border-orange-500/10 bg-orange-500/5"}`}>
      <p className="font-semibold text-white/60 mb-2 flex items-center gap-1.5">
        <Bot size={11} /> Verification Analysis
        {tx.aiConfidence !== null && (
          <span className="ml-auto text-white/30">Confidence: {(tx.aiConfidence * 100).toFixed(0)}%</span>
        )}
      </p>

      {/* Per-check breakdown */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        <CheckBadge pass={tx.aiCheckConfidence} label="Confidence" />
        <CheckBadge pass={tx.aiCheckAmount} label="Amount match" />
        <CheckBadge pass={tx.aiCheckAddress} label="Address match" />
        <CheckBadge pass={tx.aiCheckTimestamp} label="Timestamp" />
        <CheckBadge pass={tx.aiCheckDuplicate} label="Not duplicate" />
      </div>

      {/* Extracted values */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <div>
          <span className="text-white/30 block">Detected Amount</span>
          <span className={tx.aiExtractedAmount !== null ? "text-white" : "text-white/20"}>
            {tx.aiExtractedAmount !== null ? `$${tx.aiExtractedAmount.toFixed(2)}` : "—"}
          </span>
        </div>
        <div>
          <span className="text-white/30 block">Detected Address</span>
          <span className={tx.aiExtractedAddress ? "text-white font-mono" : "text-white/20"}>
            {tx.aiExtractedAddress ? `${tx.aiExtractedAddress.slice(0, 8)}…` : "—"}
          </span>
        </div>
        <div>
          <span className="text-white/30 block">Detected TxHash</span>
          <span className={tx.aiExtractedTxHash ? "text-white font-mono" : "text-white/20"}>
            {tx.aiExtractedTxHash ? `${tx.aiExtractedTxHash.slice(0, 10)}…` : "—"}
          </span>
        </div>
        <div>
          <span className="text-white/30 block">Scanned At</span>
          <span className={tx.aiExtractedAt ? "text-white" : "text-white/20"}>
            {tx.aiExtractedAt ? new Date(tx.aiExtractedAt).toLocaleTimeString() : "—"}
          </span>
        </div>
      </div>
      {!tx.aiVerified && tx.aiFailReason && (
        <p className="mt-2 text-orange-400/80 text-[11px]">
          ⚠ {tx.aiFailReason}
        </p>
      )}
    </div>
  );
}

function ScreenshotModal({ txId, onClose }: { txId: number; onClose: () => void }) {
  const [src, setSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    adminApi.transactionScreenshot(txId)
      .then(d => setSrc(d.screenshot))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [txId]);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-[#111] border border-white/10 rounded-2xl p-4 max-w-lg w-full"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-white">Deposit Screenshot Proof</h3>
          <button onClick={onClose} className="text-white/40 hover:text-white p-1">
            <X size={16} />
          </button>
        </div>
        {loading && <div className="text-white/40 text-sm text-center py-8 animate-pulse">Loading proof…</div>}
        {error && <div className="text-red-400 text-sm text-center py-8">{error}</div>}
        {src && (
          <img
            src={src}
            alt="Deposit proof screenshot"
            className="w-full rounded-xl object-contain max-h-[60vh]"
          />
        )}
        <p className="text-xs text-white/20 text-center mt-3">Provided by user as payment proof</p>
      </div>
    </div>
  );
}

export default function AdminTransactionsPage() {
  const [txs, setTxs] = useState<AdminTransaction[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<FilterType>("");
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("pending");
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [screenshotTxId, setScreenshotTxId] = useState<number | null>(null);
  const [expandedAi, setExpandedAi] = useState<Set<number>>(new Set());

  const load = () => {
    setLoading(true);
    adminApi.transactions({ type: typeFilter || undefined, status: statusFilter || undefined, limit: 100 })
      .then(d => { setTxs(d.transactions); setTotal(d.total); })
      .catch(e => toast.error(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [typeFilter, statusFilter]);

  // Auto-refresh every 8s to pick up AI scan completions
  useEffect(() => {
    const interval = setInterval(load, 8000);
    return () => clearInterval(interval);
  }, [typeFilter, statusFilter]);

  const settle = async (id: number, status: "approved" | "rejected") => {
    setActionLoading(id);
    try {
      await adminApi.updateTransaction(id, { status });
      toast.success(`Transaction ${status}`);
      load();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setActionLoading(null);
    }
  };

  const rescan = async (id: number) => {
    setActionLoading(id);
    try {
      const result = await adminApi.rescanTransaction(id);
      toast.success(`Rescan: ${result.aiVerified ? "Auto-approved" : "Needs review"}`);
      load();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setActionLoading(null);
    }
  };

  const typeColor = (t: string) => {
    if (t === "deposit") return "bg-emerald-500/10 text-emerald-400";
    if (t === "withdrawal") return "bg-purple-500/10 text-purple-400";
    if (t === "game_win") return "bg-yellow-400/10 text-yellow-400";
    return "bg-red-500/10 text-red-400";
  };

  const statusColor = (s: string) => {
    if (s === "approved") return "bg-emerald-500/10 text-emerald-400";
    if (s === "rejected") return "bg-red-500/10 text-red-400";
    return "bg-orange-500/10 text-orange-400";
  };

  const toggleAiDetails = (id: number) => {
    setExpandedAi(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div>
      {screenshotTxId !== null && (
        <ScreenshotModal txId={screenshotTxId} onClose={() => setScreenshotTxId(null)} />
      )}

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Transactions</h1>
        <p className="text-white/40 text-sm mt-1">{total} total · Review and manage all transactions · Auto-refreshes every 8s</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div>
          <label className="block text-xs text-white/30 mb-1">Type</label>
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value as FilterType)}
            className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-yellow-400/40"
          >
            <option value="">All Types</option>
            <option value="deposit">Deposit</option>
            <option value="withdrawal">Withdrawal</option>
            <option value="game_win">Game Win</option>
            <option value="game_loss">Game Loss</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-white/30 mb-1">Status</label>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as FilterStatus)}
            className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-yellow-400/40"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 text-white/30 text-xs uppercase tracking-wider">
                <th className="px-4 py-3 text-left">ID</th>
                <th className="px-4 py-3 text-left">User</th>
                <th className="px-4 py-3 text-center">Type</th>
                <th className="px-4 py-3 text-right">Amount</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-center">AI</th>
                <th className="px-4 py-3 text-center">Proof</th>
                <th className="px-4 py-3 text-left">Details</th>
                <th className="px-4 py-3 text-right">Date</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={10} className="px-4 py-8 text-center text-white/30">Loading…</td></tr>
              ) : txs.length === 0 ? (
                <tr><td colSpan={10} className="px-4 py-8 text-center text-white/30">No transactions found</td></tr>
              ) : txs.map(tx => (
                <>
                  <tr key={tx.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3 text-white/40 font-mono text-xs">#{tx.id}</td>
                    <td className="px-4 py-3 text-white font-medium">{tx.username}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${typeColor(tx.type)}`}>
                        {tx.type.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-white font-mono font-medium">${tx.amount.toFixed(2)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${statusColor(tx.status)}`}>
                        {tx.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => tx.aiVerified !== null && tx.aiVerified !== undefined ? toggleAiDetails(tx.id) : undefined}
                        className="flex items-center justify-center mx-auto"
                      >
                        <AiBadge tx={tx} />
                      </button>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {tx.hasScreenshot ? (
                        <button
                          onClick={() => setScreenshotTxId(tx.id)}
                          className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 mx-auto transition-colors"
                          title="View screenshot proof"
                        >
                          <Image size={14} />
                          <ZoomIn size={12} />
                        </button>
                      ) : (
                        <span className="text-white/20 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-white/40 text-xs max-w-[140px] truncate">
                      {tx.txHash && <span className="font-mono">{tx.txHash.slice(0, 12)}…</span>}
                      {tx.walletAddress && <span className="font-mono">{tx.walletAddress.slice(0, 12)}…</span>}
                      {tx.gameType && <span>{tx.gameType}</span>}
                      {tx.notes && <span className="text-white/30">{tx.notes}</span>}
                    </td>
                    <td className="px-4 py-3 text-right text-white/30 text-xs">{new Date(tx.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      {/* Show actions for pending, or for AI-reviewed deposits (allow manual override) */}
                      {(tx.status === "pending" || (tx.type === "deposit" && tx.aiVerified !== null && tx.aiVerified !== undefined)) ? (
                        <div className="flex flex-col items-center gap-1">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              disabled={actionLoading === tx.id || tx.status === "approved"}
                              onClick={() => settle(tx.id, "approved")}
                              className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                              title={tx.status === "approved" ? "Already approved" : "Approve"}
                            >
                              <Check size={14} />
                            </button>
                            <button
                              disabled={actionLoading === tx.id || tx.status === "rejected"}
                              onClick={() => settle(tx.id, "rejected")}
                              className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                              title={tx.status === "rejected" ? "Already rejected" : "Reject"}
                            >
                              <X size={14} />
                            </button>
                            {tx.status === "pending" && tx.type === "deposit" && (
                              <button
                                disabled={actionLoading === tx.id}
                                onClick={() => rescan(tx.id)}
                                className="p-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 transition-all disabled:opacity-40"
                                title="Re-run AI verification"
                              >
                                <RefreshCw size={14} />
                              </button>
                            )}
                          </div>
                          {tx.status !== "pending" && (
                            <span className="text-[9px] text-white/20">override</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-white/20 text-xs text-center block">—</span>
                      )}
                    </td>
                  </tr>
                  {expandedAi.has(tx.id) && (
                    <tr key={`${tx.id}-ai`} className="border-b border-white/5">
                      <td colSpan={10} className="p-0">
                        <AiDetailsPanel tx={tx} />
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
