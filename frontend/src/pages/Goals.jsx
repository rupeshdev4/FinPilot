import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { inr } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Home, Shield, Sunset, Plane, GraduationCap, Car, Heart, Trash2 } from "lucide-react";
import { toast } from "sonner";

const ICONS = { Home, Shield, Sunset, Plane, GraduationCap, Car, Heart, Target: Home };
const TIER_META = { short: { l: "Short", c: "bg-chart-3" }, mid: { l: "Mid", c: "bg-secondary" }, long: { l: "Long", c: "bg-accent" }, critical: { l: "Critical", c: "bg-destructive" } };

export default function Goals() {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [sim, setSim] = useState(null);
  const [tier, setTier] = useState("all");
  const [form, setForm] = useState({ name: "", target: "", current: 0, monthly_contrib: "", deadline: "", icon: "Home", instrument: "Mutual Fund SIP", tier: "mid" });

  const load = async () => { const r = await api.get("/goals"); setItems(r.data); };
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => tier === "all" ? items : items.filter(i => (i.tier || "mid") === tier), [items, tier]);

  const submit = async () => {
    try {
      await api.post("/goals", { ...form, target: Number(form.target), current: Number(form.current), monthly_contrib: Number(form.monthly_contrib), deadline: new Date(form.deadline).toISOString() });
      setOpen(false); load(); toast.success("Goal added");
    } catch { toast.error("Failed"); }
  };
  const del = async (id) => { await api.delete(`/goals/${id}`); load(); };

  const monthsTo = (g) => { const need = g.target - g.current; if (need <= 0) return 0; return Math.ceil(need / Math.max(1, g.monthly_contrib)); };
  const probability = (g) => {
    const months = monthsTo(g);
    const target_months = Math.max(1, Math.round((new Date(g.deadline) - Date.now()) / (1000*60*60*24*30)));
    return Math.min(100, Math.max(20, Math.round(target_months / Math.max(1, months) * 80)));
  };

  return (
    <div className="px-4 lg:px-10 py-6 lg:py-10 space-y-6 max-w-[1400px] mx-auto">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-widest text-muted-foreground font-bold">Goals</div>
          <h1 className="font-headings font-bold text-3xl lg:text-4xl mt-1">Your milestones</h1>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90" data-testid="add-goal-btn"><Plus className="w-4 h-4 mr-1" /> Add goal</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New goal</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="space-y-2"><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} data-testid="goal-name-input" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2"><Label>Target ₹</Label><Input type="number" value={form.target} onChange={(e) => setForm({ ...form, target: e.target.value })} data-testid="goal-target-input" /></div>
                <div className="space-y-2"><Label>Already saved ₹</Label><Input type="number" value={form.current} onChange={(e) => setForm({ ...form, current: e.target.value })} /></div>
                <div className="space-y-2"><Label>Monthly ₹</Label><Input type="number" value={form.monthly_contrib} onChange={(e) => setForm({ ...form, monthly_contrib: e.target.value })} /></div>
                <div className="space-y-2"><Label>Deadline</Label><Input type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} /></div>
                <div className="space-y-2 col-span-2"><Label>Tier</Label>
                  <Select value={form.tier} onValueChange={(v) => setForm({ ...form, tier: v })}>
                    <SelectTrigger data-testid="goal-tier-select"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="short">Short term</SelectItem>
                      <SelectItem value="mid">Mid term</SelectItem>
                      <SelectItem value="long">Long term</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={submit} className="w-full rounded-xl" data-testid="goal-submit-btn">Save</Button>
            </div>
          </DialogContent>
        </Dialog>
      </header>

      {/* Tier filter */}
      <div className="flex gap-2 flex-wrap">
        {["all", "short", "mid", "long", "critical"].map(t => (
          <button key={t} onClick={() => setTier(t)} data-testid={`goal-tier-filter-${t}`}
            className={`text-xs px-3 py-1.5 rounded-full font-bold border capitalize ${tier === t ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted"}`}>
            {t === "all" ? "All goals" : (TIER_META[t]?.l + " term")}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {filtered.map((g) => {
          const pct = Math.min(100, (g.current / g.target) * 100);
          const Icon = ICONS[g.icon] || Home;
          const months = monthsTo(g);
          const prob = probability(g);
          const tmeta = TIER_META[g.tier || "mid"];
          return (
            <div key={g.id} className="fp-card p-6 space-y-4 group" data-testid={`goal-card-${g.id}`}>
              <div className="flex justify-between items-start">
                <div className="flex gap-3 items-start">
                  <div className="w-11 h-11 rounded-xl bg-accent/15 text-accent grid place-items-center"><Icon className="w-5 h-5" /></div>
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="font-headings font-semibold text-lg">{g.name}</div>
                      {tmeta && <span className={`text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded ${tmeta.c} text-white`}>{tmeta.l}</span>}
                    </div>
                    <div className="text-xs text-muted-foreground">{g.instrument} · ETA {months} months</div>
                  </div>
                </div>
                <button onClick={() => del(g.id)} className="opacity-0 group-hover:opacity-100 transition text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></button>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-sm"><span>{inr(g.current)}</span><span className="text-muted-foreground">of {inr(g.target)}</span></div>
                <div className="h-2.5 bg-muted rounded-full overflow-hidden"><div className="h-full bg-accent rounded-full" style={{ width: `${pct}%` }}></div></div>
                <div className="flex justify-between text-xs"><span className="text-accent font-bold">{prob}% on track</span><span className="text-muted-foreground">₹{Math.round(g.monthly_contrib).toLocaleString()}/mo</span></div>
              </div>
              <Button variant="outline" size="sm" className="rounded-xl" onClick={() => setSim(g)} data-testid={`simulate-${g.id}`}>Open simulator</Button>
            </div>
          );
        })}
      </div>

      {sim && (
        <Dialog open={!!sim} onOpenChange={(o) => !o && setSim(null)}>
          <DialogContent>
            <DialogHeader><DialogTitle>{sim.name} — Simulator</DialogTitle></DialogHeader>
            <SimContent goal={sim} />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function SimContent({ goal }) {
  const [contrib, setContrib] = useState(goal.monthly_contrib);
  const [lump, setLump] = useState(0);
  const need = Math.max(0, goal.target - goal.current - lump);
  const months = Math.ceil(need / Math.max(1, contrib));
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-muted rounded-xl p-3"><div className="text-xs uppercase text-muted-foreground">Months to goal</div><div className="font-headings font-bold text-2xl mt-1">{months}</div></div>
        <div className="bg-muted rounded-xl p-3"><div className="text-xs uppercase text-muted-foreground">Total contribution</div><div className="font-headings font-bold text-2xl mt-1">{inr(contrib * months + Number(lump))}</div></div>
      </div>
      <div className="space-y-2"><Label>Monthly contribution: ₹{Number(contrib).toLocaleString()}</Label><Slider min={1000} max={200000} step={1000} value={[contrib]} onValueChange={(v) => setContrib(v[0])} /></div>
      <div className="space-y-2"><Label>Lump sum (bonus / windfall): ₹{Number(lump).toLocaleString()}</Label><Slider min={0} max={2000000} step={10000} value={[lump]} onValueChange={(v) => setLump(v[0])} /></div>
    </div>
  );
}
