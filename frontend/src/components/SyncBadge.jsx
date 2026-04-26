import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export default function SyncBadge() {
  const [stale, setStale] = useState(false);
  const [busy, setBusy] = useState(false);

  const check = async () => {
    try { const r = await api.get("/me/sync-status"); setStale(!!r.data.stale); }
    catch {}
  };

  useEffect(() => {
    check();
    const onFocus = () => check();
    window.addEventListener("focus", onFocus);
    const t = setInterval(check, 60000);
    return () => { window.removeEventListener("focus", onFocus); clearInterval(t); };
  }, []);

  const refresh = async () => {
    setBusy(true);
    const tid = toast.loading("Refreshing your demo data…");
    try {
      await api.post("/me/refresh-data");
      toast.success("Data refreshed — reloading", { id: tid });
      setTimeout(() => window.location.reload(), 600);
    } catch {
      toast.error("Refresh failed — please try again", { id: tid });
      setBusy(false);
    }
  };

  if (!stale) return null;

  return (
    <button
      onClick={refresh}
      disabled={busy}
      className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-warning/15 text-warning border border-warning/30 hover:bg-warning/25 transition text-xs font-bold"
      data-testid="sync-badge"
      title="Your demo data is from an older seed version. Click to refresh."
    >
      {busy ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <AlertCircle className="w-3.5 h-3.5" />}
      Sync issue? Refresh data
    </button>
  );
}
