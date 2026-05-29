import { useEffect, useRef, useState } from "react";
import { adminApi, AdminSettings } from "@/lib/admin-api";
import { toast } from "sonner";
import { Save, RefreshCw, QrCode, Upload, Trash2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { getGetDepositAddressQueryKey } from "@workspace/api-client-react";

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<AdminSettings | null>(null);
  const [form, setForm] = useState<AdminSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [qrPreview, setQrPreview] = useState<string>("");
  const fileRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const load = () => {
    setLoading(true);
    adminApi.settings()
      .then(s => {
        setSettings(s);
        setForm({ ...s });
        setQrPreview(s.depositQrCode ?? "");
      })
      .catch(e => toast.error(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleQrUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const b64 = reader.result as string;
      setQrPreview(b64);
      setForm(f => f ? { ...f, depositQrCode: b64 } : f);
    };
    reader.readAsDataURL(file);
  };

  const handleQrRemove = () => {
    setQrPreview("");
    setForm(f => f ? { ...f, depositQrCode: "" } : f);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleSave = async () => {
    if (!form) return;
    setSaving(true);
    try {
      await adminApi.updateSettings(form);
      toast.success("Settings saved");
      // Invalidate wallet deposit address query so users see the updated QR / address immediately
      queryClient.invalidateQueries({ queryKey: getGetDepositAddressQueryKey() });
      load();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading || !form) {
    return <div className="text-white/40 text-sm animate-pulse">Loading…</div>;
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Platform Settings</h1>
        <p className="text-white/40 text-sm mt-1">Configure platform-wide options</p>
      </div>

      <div className="max-w-xl space-y-5">

        {/* Deposit/Withdrawal limits */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
          <h2 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-4">Limits</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-white/60 mb-1.5">Minimum Deposit (USDT)</label>
              <input
                type="number" step="1" min="1"
                value={form.minDeposit}
                onChange={e => setForm({ ...form, minDeposit: parseFloat(e.target.value) })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-yellow-400/40 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-1.5">Minimum Withdrawal (USDT)</label>
              <input
                type="number" step="1" min="1"
                value={form.minWithdrawal}
                onChange={e => setForm({ ...form, minWithdrawal: parseFloat(e.target.value) })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-yellow-400/40 transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Deposit address + QR */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
          <h2 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-4">Deposit Address & QR Code</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-white/60 mb-1.5">USDT BEP20 Address</label>
              <input
                type="text"
                value={form.depositAddress}
                onChange={e => setForm({ ...form, depositAddress: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white font-mono focus:outline-none focus:border-yellow-400/40 transition-colors"
                placeholder="0x…"
              />
              <p className="text-xs text-white/20 mt-1.5">Users send USDT here for deposits.</p>
            </div>

            {/* QR Code upload */}
            <div>
              <label className="block text-sm text-white/60 mb-2">
                <span className="flex items-center gap-1.5"><QrCode size={14} /> Deposit QR Code</span>
              </label>

              {qrPreview ? (
                <div className="flex items-start gap-4">
                  <div className="bg-white p-2 rounded-xl">
                    <img src={qrPreview} alt="Deposit QR" className="w-32 h-32 object-contain" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <p className="text-xs text-white/40">This QR will be shown to users on the deposit page</p>
                    <button
                      onClick={() => fileRef.current?.click()}
                      className="flex items-center gap-1.5 text-xs bg-white/5 border border-white/10 hover:bg-white/10 text-white/60 hover:text-white px-3 py-2 rounded-xl transition-colors"
                    >
                      <Upload size={12} /> Replace image
                    </button>
                    <button
                      onClick={handleQrRemove}
                      className="flex items-center gap-1.5 text-xs bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 px-3 py-2 rounded-xl transition-colors"
                    >
                      <Trash2 size={12} /> Remove QR
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => fileRef.current?.click()}
                  className="w-full flex flex-col items-center gap-2 py-6 border-2 border-dashed border-white/10 hover:border-yellow-400/30 rounded-xl text-white/30 hover:text-white/60 transition-colors"
                >
                  <Upload size={20} />
                  <span className="text-xs">Click to upload QR code image</span>
                  <span className="text-xs text-white/20">PNG, JPG or WEBP</span>
                </button>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleQrUpload}
              />
            </div>
          </div>
        </div>

        {/* Toggles */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
          <h2 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-4">Platform Controls</h2>
          <div className="space-y-4">
            {[
              { key: "gamesEnabled" as const, label: "Games Enabled", desc: "Allow users to place bets and play games" },
              { key: "maintenanceMode" as const, label: "Maintenance Mode", desc: "Disable the platform for all regular users" },
            ].map(({ key, label, desc }) => (
              <div key={key} className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-white font-medium">{label}</p>
                  <p className="text-xs text-white/30 mt-0.5">{desc}</p>
                </div>
                <button
                  onClick={() => setForm({ ...form, [key]: !form[key] })}
                  className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 ${form[key] ? "bg-yellow-400" : "bg-white/10"}`}
                >
                  <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${form[key] ? "left-7" : "left-1"}`} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Current values */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
          <h2 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Saved Values</h2>
          <dl className="space-y-2 text-sm text-white/50">
            <div className="flex justify-between"><dt>Min Deposit</dt><dd className="text-white">${settings?.minDeposit}</dd></div>
            <div className="flex justify-between"><dt>Min Withdrawal</dt><dd className="text-white">${settings?.minWithdrawal}</dd></div>
            <div className="flex justify-between"><dt>Games</dt><dd className={settings?.gamesEnabled ? "text-emerald-400" : "text-red-400"}>{settings?.gamesEnabled ? "Enabled" : "Disabled"}</dd></div>
            <div className="flex justify-between"><dt>Maintenance</dt><dd className={settings?.maintenanceMode ? "text-orange-400" : "text-emerald-400"}>{settings?.maintenanceMode ? "On" : "Off"}</dd></div>
            <div className="flex justify-between"><dt>QR Code</dt><dd className={settings?.depositQrCode ? "text-emerald-400" : "text-white/30"}>{settings?.depositQrCode ? "Uploaded ✓" : "Not set (using default)"}</dd></div>
          </dl>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-yellow-400 hover:bg-yellow-300 disabled:opacity-50 text-black font-bold px-6 py-3 rounded-xl text-sm transition-all"
          >
            <Save size={16} />
            {saving ? "Saving…" : "Save Settings"}
          </button>
          <button
            onClick={load}
            className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white px-6 py-3 rounded-xl text-sm border border-white/10 transition-all"
          >
            <RefreshCw size={16} />
            Reload
          </button>
        </div>
      </div>
    </div>
  );
}
