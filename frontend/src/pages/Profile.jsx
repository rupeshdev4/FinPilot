import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useTheme } from "next-themes";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { inr } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { LogOut, Download, Trash2, Shield, Bell, Globe, Palette, Sparkles } from "lucide-react";
import { toast } from "sonner";

export default function Profile() {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const nav = useNavigate();
  const [autoBudget, setAutoBudget] = useState(null);

  const runAutoBudget = async () => {
    try { const r = await api.post("/budget/auto"); setAutoBudget(r.data); }
    catch { toast.error("Could not generate"); }
  };

  const acceptBudget = async () => {
    try { await api.put("/budget", autoBudget.proposed); toast.success("Budget updated"); setAutoBudget(null); }
    catch { toast.error("Save failed"); }
  };

  return (
    <div className="px-4 lg:px-10 py-6 lg:py-10 space-y-6 max-w-3xl mx-auto">
      <header>
        <div className="text-xs uppercase tracking-widest text-muted-foreground font-bold">Profile</div>
        <h1 className="font-headings font-bold text-3xl lg:text-4xl mt-1">Your account</h1>
      </header>

      <div className="fp-card p-6 flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-accent text-accent-foreground grid place-items-center font-headings font-bold text-2xl">{user?.name?.[0]?.toUpperCase()}</div>
        <div className="flex-1 min-w-0">
          <div className="font-headings font-semibold text-xl truncate">{user?.name}</div>
          <div className="text-sm text-muted-foreground truncate">{user?.email}</div>
          <div className="text-xs text-muted-foreground mt-1">Risk: {user?.risk_profile} · Currency: ₹ INR</div>
        </div>
      </div>

      <div className="fp-card p-6 fp-ai-panel space-y-3" data-testid="ai-budget-builder">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent text-accent-foreground grid place-items-center"><Sparkles className="w-5 h-5" /></div>
          <div className="flex-1">
            <h2 className="font-headings font-semibold text-lg">AI Budget Builder</h2>
            <div className="text-xs text-muted-foreground">Auto-rebalances your budget every month from rolling 3-month transaction averages.</div>
          </div>
          <Button onClick={runAutoBudget} className="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90" data-testid="rerun-ai-budget-btn">Re-run</Button>
        </div>
      </div>

      {autoBudget && (
        <Dialog open={!!autoBudget} onOpenChange={(o) => !o && setAutoBudget(null)}>
          <DialogContent>
            <DialogHeader><DialogTitle>Proposed budget · review & accept</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(autoBudget.proposed).map(([k,v]) => (
                  <div key={k} className="bg-muted rounded-xl p-3">
                    <div className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">{k}</div>
                    <div className="font-headings font-bold text-lg mt-1">{inr(v)}</div>
                  </div>
                ))}
              </div>
              <ul className="text-sm space-y-1.5 text-muted-foreground list-disc pl-5">
                {autoBudget.notes.map((n,i) => <li key={i}>{n}</li>)}
              </ul>
              <div className="flex gap-2">
                <Button onClick={acceptBudget} className="flex-1 rounded-xl bg-accent text-accent-foreground hover:bg-accent/90" data-testid="accept-ai-budget-btn">Accept budget</Button>
                <Button variant="outline" onClick={() => setAutoBudget(null)} className="rounded-xl">Cancel</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      <div className="fp-card p-6 space-y-5">
        <h2 className="font-headings font-semibold text-lg">Preferences</h2>
        <Row icon={Palette} title="Dark mode" desc="Reduce eye strain at night">
          <Switch checked={theme === "dark"} onCheckedChange={(v) => setTheme(v ? "dark" : "light")} data-testid="dark-mode-switch" />
        </Row>
        <Row icon={Bell} title="Notifications" desc="Bill reminders, big charges, EMI alerts">
          <Switch defaultChecked />
        </Row>
        <Row icon={Shield} title="Family mode" desc="Share goals & dashboard with partner (Family plan)">
          <Switch />
        </Row>
        <Row icon={Globe} title="Currency" desc="₹ INR (India)">
          <span className="text-sm text-muted-foreground">INR</span>
        </Row>
      </div>

      <div className="fp-card p-6 space-y-3">
        <h2 className="font-headings font-semibold text-lg">Plan & Data</h2>
        <Button variant="outline" className="rounded-xl w-full justify-start" onClick={() => nav("/pricing")} data-testid="upgrade-btn">Upgrade plan →</Button>
        <Button variant="outline" className="rounded-xl w-full justify-start" onClick={() => toast.success("Export ready — check email")} data-testid="export-data-btn"><Download className="w-4 h-4 mr-2" />Export my data</Button>
        <Button variant="outline" className="rounded-xl w-full justify-start text-destructive hover:text-destructive" onClick={() => toast.error("Delete requires email confirmation")} data-testid="delete-acc-btn"><Trash2 className="w-4 h-4 mr-2" />Delete account</Button>
        <Button variant="outline" className="rounded-xl w-full justify-start" onClick={() => { logout(); nav("/login"); }} data-testid="profile-logout-btn"><LogOut className="w-4 h-4 mr-2" />Log out</Button>
      </div>
    </div>
  );
}

function Row({ icon: Icon, title, desc, children }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-xl bg-muted grid place-items-center"><Icon className="w-4 h-4" /></div>
      <div className="flex-1 min-w-0">
        <div className="font-medium">{title}</div>
        <div className="text-xs text-muted-foreground">{desc}</div>
      </div>
      {children}
    </div>
  );
}
