import { useState, useEffect, useLayoutEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  useGetWallet, getGetWalletQueryKey,
  useGetDepositAddress,
  useCreateDeposit,
  useCreateWithdrawal,
  useListTransactions, getListTransactionsQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowDownToLine, ArrowUpFromLine, Clock, Copy, Upload,
  Wallet2, TrendingUp, TrendingDown, Download, QrCode, Link as LinkIcon,
  AlertCircle, ChevronRight, Sparkles
} from "lucide-react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

function SkeletonBox({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-white/5 rounded-xl ${className}`} />;
}

function WalletSkeleton() {
  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto px-4 md:px-8 lg:px-12 pt-4">
      <SkeletonBox className="h-8 w-48" />
      <SkeletonBox className="h-36 w-full rounded-3xl" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <SkeletonBox className="h-24 rounded-2xl" />
        <SkeletonBox className="h-24 rounded-2xl" />
        <SkeletonBox className="h-24 rounded-2xl" />
      </div>
      <SkeletonBox className="h-12 w-full rounded-xl" />
      <SkeletonBox className="h-64 w-full rounded-3xl" />
    </div>
  );
}

const withdrawSchema = z.object({
  amount: z.coerce.number().min(10, "Minimum withdrawal is $10"),
  walletAddress: z.string().min(10, "Invalid wallet address"),
});

const depositSchema = z.object({
  amount: z.coerce.number().min(10, "Minimum deposit is $10"),
});

export default function Wallet() {
  const queryClient = useQueryClient();

  const { data: wallet, isLoading: walletLoading } = useGetWallet({ query: { queryKey: getGetWalletQueryKey() } });
  const { data: addressData } = useGetDepositAddress({
    query: { refetchInterval: 30000, staleTime: 10000 }
  });
  const { data: txData, isLoading: txLoading } = useListTransactions({}, { query: { queryKey: getListTransactionsQueryKey({}) } });

  const depositMutation = useCreateDeposit();
  const withdrawMutation = useCreateWithdrawal();

  const [screenshotBase64, setScreenshotBase64] = useState<string | null>(null);
  const [showDepositDetails, setShowDepositDetails] = useState(false);
  const depositRef = useRef<HTMLDivElement>(null);
  const withdrawRef = useRef<HTMLDivElement>(null);
  const shouldScrollToDeposit = useRef(false);
  const shouldScrollToWithdraw = useRef(false);

  // Read hash from URL and scroll to section
  useEffect(() => {
    const hash = window.location.hash.replace("#", "");
    if (hash === "deposit") {
      setShowDepositDetails(true);
      shouldScrollToDeposit.current = true;
    } else if (hash === "withdraw") {
      setShowDepositDetails(false);
      shouldScrollToWithdraw.current = true;
    }
  }, []);

  // Scroll to deposit section when it becomes active
  useEffect(() => {
    if (showDepositDetails && shouldScrollToDeposit.current) {
      shouldScrollToDeposit.current = false;
      setTimeout(() => {
        depositRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 100);
    }
  }, [showDepositDetails]);

  // Scroll to withdraw section when it becomes active
  useEffect(() => {
    if (!showDepositDetails && shouldScrollToWithdraw.current) {
      shouldScrollToWithdraw.current = false;
      setTimeout(() => {
        withdrawRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 100);
    }
  }, [showDepositDetails]);

  const withdrawForm = useForm<z.infer<typeof withdrawSchema>>({
    resolver: zodResolver(withdrawSchema),
    defaultValues: { amount: 10, walletAddress: "" },
  });

  const depositForm = useForm<z.infer<typeof depositSchema>>({
    resolver: zodResolver(depositSchema),
    defaultValues: { amount: 10 },
  });

  if (walletLoading) return <WalletSkeleton />;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setScreenshotBase64(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const onDeposit = (values: z.infer<typeof depositSchema>) => {
    if (!screenshotBase64) {
      toast.error("Please upload payment screenshot");
      return;
    }
    depositMutation.mutate(
      { data: { amount: values.amount, screenshotBase64 } },
      {
        onSuccess: () => {
          toast.success("Deposit submitted — confirming on blockchain (usually instant)");
          setScreenshotBase64(null);
          depositForm.reset();
          setShowDepositDetails(false);
          queryClient.invalidateQueries({ queryKey: getGetWalletQueryKey() });
          queryClient.invalidateQueries({ queryKey: getListTransactionsQueryKey({}) });
          // Poll for AI result update over next 30s
          let polls = 0;
          const poll = setInterval(() => {
            polls++;
            queryClient.invalidateQueries({ queryKey: getListTransactionsQueryKey({}) });
            queryClient.invalidateQueries({ queryKey: getGetWalletQueryKey() });
            if (polls >= 6) clearInterval(poll);
          }, 5000);
        },
        onError: (err) => toast.error((err as any)?.data?.error || "Deposit failed")
      }
    );
  };

  const onWithdraw = (values: z.infer<typeof withdrawSchema>) => {
    withdrawMutation.mutate(
      { data: values },
      {
        onSuccess: () => {
          toast.success("Withdrawal requested");
          withdrawForm.reset();
          queryClient.invalidateQueries({ queryKey: getGetWalletQueryKey() });
          queryClient.invalidateQueries({ queryKey: getListTransactionsQueryKey({}) });
        },
        onError: (err) => toast.error(err.data?.error || "Withdrawal failed")
      }
    );
  };

  const dep = wallet?.depositBalance ?? 0;
  const withd = wallet?.withdrawalBalance ?? 0;
  const total = wallet?.totalBalance ?? (dep + withd);

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto px-4 md:px-8 lg:px-12 pt-4">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl md:text-4xl font-heading font-bold text-white">Wallet</h1>
        <p className="text-gray-400 text-sm">Manage your funds and transactions.</p>
      </div>

      {/* Total Balance Hero */}
      <div className="relative rounded-3xl overflow-hidden border border-yellow-500/20 bg-gradient-to-br from-[#1a0f00] to-[#0a0a0a] p-6 md:p-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/10 blur-[80px] rounded-full" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Wallet2 className="w-5 h-5 text-yellow-400" />
              <span className="text-yellow-400 text-sm font-bold uppercase tracking-wider">Total Balance</span>
            </div>
            <p className="text-4xl md:text-5xl font-mono font-black text-white drop-shadow-[0_0_20px_rgba(234,179,8,0.3)]">
              ${total.toFixed(2)}
            </p>
            <p className="text-gray-500 text-xs mt-1">USDT (BEP20)</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => setShowDepositDetails(true)}
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-yellow-500 to-yellow-400 text-black font-bold text-sm hover:from-yellow-400 hover:to-yellow-300 transition-all active:scale-95 shadow-[0_0_20px_rgba(234,179,8,0.3)]"
            >
              <Download className="w-4 h-4" /> Deposit
            </button>
            <button
              onClick={() => setShowDepositDetails(false)}
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-bold text-sm hover:bg-white/10 transition-all active:scale-95"
            >
              <ArrowUpFromLine className="w-4 h-4" /> Withdraw
            </button>
          </div>
        </div>
      </div>

      {/* Breakdown Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass p-5 rounded-2xl border border-white/5 hover:border-yellow-500/20 transition-all">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-yellow-500/10 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-yellow-400" />
            </div>
            <span className="text-gray-400 text-xs font-bold uppercase tracking-wider">Deposit</span>
          </div>
          <p className="text-2xl font-mono font-bold text-white">${dep.toFixed(2)}</p>
          <p className="text-[10px] text-gray-500 mt-1">Available for games + betting</p>
        </div>
        <div className="glass p-5 rounded-2xl border border-white/5 hover:border-purple-500/20 transition-all">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <TrendingDown className="w-4 h-4 text-purple-400" />
            </div>
            <span className="text-gray-400 text-xs font-bold uppercase tracking-wider">Withdrawable</span>
          </div>
          <p className="text-2xl font-mono font-bold text-white">${withd.toFixed(2)}</p>
          <p className="text-[10px] text-gray-500 mt-1">Winnings + approved deposits</p>
        </div>
        <div className="glass p-5 rounded-2xl border border-white/5 hover:border-green-500/20 transition-all">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-green-400" />
            </div>
            <span className="text-gray-400 text-xs font-bold uppercase tracking-wider">Combined</span>
          </div>
          <p className="text-2xl font-mono font-bold text-white">${total.toFixed(2)}</p>
          <p className="text-[10px] text-gray-500 mt-1">Total usable balance</p>
        </div>
      </div>

      {/* Deposit / Withdraw Tabs with URL hash support */}
      <Tabs
        value={showDepositDetails ? "deposit" : "withdraw"}
        onValueChange={(val) => {
          setShowDepositDetails(val === "deposit");
          window.location.hash = val === "deposit" ? "deposit" : "withdraw";
        }}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-2 bg-black/50 p-1 rounded-xl">
          <TabsTrigger value="deposit"
            className="data-[state=active]:bg-yellow-500 data-[state=active]:text-black rounded-lg font-bold text-sm transition-all">
            <ArrowDownToLine className="w-4 h-4 mr-1.5" /> Deposit
          </TabsTrigger>
          <TabsTrigger value="withdraw"
            className="data-[state=active]:bg-purple-500 data-[state=active]:text-white rounded-lg font-bold text-sm transition-all">
            <ArrowUpFromLine className="w-4 h-4 mr-1.5" /> Withdraw
          </TabsTrigger>
        </TabsList>

        {/* Deposit Content */}
        <TabsContent value="deposit" className="mt-6">
          <div ref={depositRef} id="deposit-section" className="glass-gold rounded-3xl p-6 md:p-8 border border-yellow-500/10">
            <h2 className="text-xl md:text-2xl font-heading font-bold mb-4 flex items-center text-white">
              <QrCode className="w-6 h-6 mr-2 text-yellow-400" /> Deposit USDT
            </h2>

            {/* Security assurance strip */}
            <div className="flex flex-wrap gap-3 mb-6">
              {[
                { icon: "🔒", label: "256-bit SSL Encrypted" },
                { icon: "⚡", label: "Instant Processing" },
                { icon: "✅", label: "Provably Fair" },
                { icon: "🛡️", label: "Funds Protected" },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-semibold">
                  <span>{item.icon}</span> {item.label}
                </div>
              ))}
            </div>

            {addressData && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mb-8">
                {/* QR Code */}
                <div className="flex flex-col items-center gap-3">
                  <div className="bg-white p-3 rounded-2xl shadow-lg">
                    <img src={addressData.qrCode} alt="QR Code" className="w-40 h-40 md:w-48 md:h-48" />
                  </div>
                  <span className="text-xs text-gray-500 font-medium">Scan with your wallet app</span>
                </div>

                {/* Address Info */}
                <div className="space-y-4">
                  <div className="bg-black/40 rounded-xl p-4 border border-white/5">
                    <label className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-2 block">Deposit Address</label>
                    <div className="flex items-center gap-2">
                      <Input readOnly value={addressData.address} className="bg-black/50 font-mono text-xs border-white/10" />
                      <Button variant="outline" size="icon" className="border-yellow-500/30 hover:bg-yellow-500/10 hover:text-yellow-400"
                        onClick={() => {
                          navigator.clipboard.writeText(addressData.address);
                          toast.success("Address copied to clipboard");
                        }}>
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="bg-black/40 rounded-xl p-4 border border-white/5">
                    <label className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-2 block">Network</label>
                    <div className="flex items-center gap-2 text-white text-sm font-medium">
                      <LinkIcon className="w-4 h-4 text-yellow-400" />
                      {addressData.network || "BEP20 (BSC)"}
                    </div>
                  </div>

                  <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                      <div className="text-xs text-gray-400 space-y-1">
                        <p className="text-yellow-400 font-bold">Important</p>
                        <p>Send only USDT on the BEP20 network.</p>
                        <p>Minimum deposit: <span className="text-white font-bold">${addressData.minDeposit}</span></p>
                        <p>Upload your transfer screenshot below after sending.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <Form {...depositForm}>
              <form onSubmit={depositForm.handleSubmit(onDeposit)} className="space-y-4 border-t border-white/10 pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={depositForm.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-300">Amount Sent ($)</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} className="bg-black/50 border-white/10 text-white" data-testid="input-dep-amount" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="space-y-2">
                    <label className="text-sm font-medium leading-none text-gray-300">Payment Screenshot</label>
                    <div className="relative">
                      <Input type="file" accept="image/*" onChange={handleFileUpload}
                        className="bg-black/50 border-white/10 cursor-pointer text-white file:text-yellow-400 file:bg-transparent file:border-0 file:font-bold" data-testid="input-dep-file" />
                    </div>
                    {screenshotBase64 && (
                      <p className="text-xs text-green-400 flex items-center gap-1"><Upload className="w-3 h-3" /> Screenshot ready for upload</p>
                    )}
                  </div>
                </div>
                <Button type="submit" className="w-full bg-gradient-to-r from-yellow-500 to-yellow-400 text-black font-bold hover:from-yellow-400 hover:to-yellow-300 h-12 rounded-xl text-base"
                  disabled={depositMutation.isPending} data-testid="btn-submit-dep">
                  {depositMutation.isPending ? (
                    <span className="flex items-center gap-2"><span className="animate-spin w-4 h-4 border-2 border-black/30 border-t-black rounded-full" /> Submitting...</span>
                  ) : (
                    <span className="flex items-center gap-2"><Download className="w-4 h-4" /> Submit Deposit for Review</span>
                  )}
                </Button>
              </form>
            </Form>
          </div>
        </TabsContent>

        {/* Withdraw Content */}
        <TabsContent value="withdraw" className="mt-6">
          <div ref={withdrawRef} id="withdraw-section" className="glass rounded-3xl p-6 md:p-8 border border-white/10">
            <h2 className="text-xl md:text-2xl font-heading font-bold mb-6 flex items-center text-white">
              <ArrowUpFromLine className="w-6 h-6 mr-2 text-purple-400" /> Withdraw Funds
            </h2>

            <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4 mb-6">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-gray-400 space-y-1">
                  <p className="text-purple-300 font-bold">Withdrawal Info</p>
                  <p>Minimum withdrawal: <span className="text-white font-bold">$10</span></p>
                  <p>Available: <span className="text-white font-bold">${withd.toFixed(2)}</span> (withdrawable balance)</p>
                  <p>Withdrawals are processed within 24 hours.</p>
                </div>
              </div>
            </div>

            <Form {...withdrawForm}>
              <form onSubmit={withdrawForm.handleSubmit(onWithdraw)} className="space-y-5">
                <FormField
                  control={withdrawForm.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300">Amount ($)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} className="bg-black/50 border-white/10 text-white" data-testid="input-with-amount" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={withdrawForm.control}
                  name="walletAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300">USDT (BEP20) Wallet Address</FormLabel>
                      <FormControl>
                        <Input {...field} className="bg-black/50 border-white/10 font-mono text-white" placeholder="0x..." data-testid="input-with-address" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full bg-gradient-to-r from-purple-600 to-purple-500 text-white font-bold hover:from-purple-500 hover:to-purple-400 h-12 rounded-xl text-base border border-purple-500/30"
                  disabled={withdrawMutation.isPending} data-testid="btn-submit-with">
                  {withdrawMutation.isPending ? (
                    <span className="flex items-center gap-2"><span className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full" /> Processing...</span>
                  ) : (
                    <span className="flex items-center gap-2"><ArrowUpFromLine className="w-4 h-4" /> Request Withdrawal</span>
                  )}
                </Button>
              </form>
            </Form>
          </div>
        </TabsContent>
      </Tabs>

      {/* Transaction History */}
      <div className="glass rounded-3xl p-6 border border-white/5">
        <h3 className="text-lg md:text-xl font-heading font-bold mb-4 flex items-center text-white">
          <Clock className="w-5 h-5 mr-2 text-gray-400" /> Transaction History
        </h3>

        {txLoading ? (
          <div className="space-y-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-4 bg-black/40 rounded-xl border border-white/5">
                <div className="w-8 h-8 rounded-lg bg-white/5 animate-pulse flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-white/5 animate-pulse rounded w-24" />
                  <div className="h-2 bg-white/5 animate-pulse rounded w-36" />
                </div>
                <div className="space-y-2">
                  <div className="h-3 bg-white/5 animate-pulse rounded w-16" />
                  <div className="h-4 bg-white/5 animate-pulse rounded w-12 ml-auto" />
                </div>
              </div>
            ))}
          </div>
        ) : txData?.transactions && txData.transactions.length > 0 ? (
          <div className="space-y-2">
            {txData.transactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between p-3 md:p-4 bg-black/40 rounded-xl border border-white/5 hover:border-white/10 transition-all">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    tx.type === 'deposit' ? 'bg-yellow-500/10 text-yellow-400' :
                    tx.type === 'withdrawal' ? 'bg-purple-500/10 text-purple-400' :
                    tx.type === 'game_win' ? 'bg-green-500/10 text-green-400' :
                    'bg-red-500/10 text-red-400'
                  }`}>
                    {tx.type === 'deposit' ? <Download className="w-4 h-4" /> :
                     tx.type === 'withdrawal' ? <ArrowUpFromLine className="w-4 h-4" /> :
                     tx.type === 'game_win' ? <TrendingUp className="w-4 h-4" /> :
                     <TrendingDown className="w-4 h-4" />}
                  </div>
                  <div>
                    <p className="text-sm font-bold capitalize text-white">{tx.type.replace('_', ' ')}</p>
                    <p className="text-xs text-gray-500">{new Date(tx.createdAt).toLocaleDateString()} · {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>
                <div className="text-right flex flex-col items-end gap-1">
                  <p className={`font-mono font-bold text-sm md:text-base ${
                    tx.type === 'deposit' || tx.type === 'game_win' ? 'text-green-400' : 'text-white'
                  }`}>
                    {tx.type === 'deposit' || tx.type === 'game_win' ? '+' : '-'}${tx.amount.toFixed(2)}
                  </p>
                  <div className="flex items-center gap-1.5 flex-wrap justify-end">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      tx.status === 'approved' ? 'bg-green-500/10 border-green-500/20 text-green-400' :
                      tx.status === 'rejected' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
                      'bg-yellow-500/10 border-yellow-500/20 text-yellow-400'
                    }`}>
                      {tx.status}
                    </span>
                    {tx.type === 'deposit' && tx.status === 'approved' && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-emerald-500/10 border-emerald-500/20 text-emerald-400">
                        Confirmed
                      </span>
                    )}
                    {tx.type === 'deposit' && tx.status === 'pending' && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-yellow-500/10 border-yellow-500/20 text-yellow-400">
                        Confirming…
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Clock className="w-10 h-10 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No transactions yet</p>
            <p className="text-gray-600 text-xs mt-1">Your deposit and game history will appear here</p>
          </div>
        )}
      </div>
    </div>
  );
}
