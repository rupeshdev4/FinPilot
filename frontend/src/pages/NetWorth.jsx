import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { inr } from "@/lib/format";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceDot } from "recharts";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Sparkles, TrendingUp, Globe, PieChart, Bitcoin, Lock, Receipt, Shield, Building2, Sunset, Coins, Award, Briefcase, Car, Home, MoreHorizontal, Plus, GraduationCap, Plane, Heart, Target, Sliders, ArrowRight, Trash2, Link2 } from "lucide-react";
import { toast } from "sonner";

const HICONS = { TrendingUp, Globe, PieChart, Bitcoin, Lock, Receipt, Shield, Building2, Sunset, Coins, Award, Briefcase, Car, Home, MoreHorizontal, Sliders };
const MICONS = { Car, Home, GraduationCap, Plane, Heart, Sunset, Target };

export default function NetWorth() {
  const [d, setD] = useState(null);
  const [holdings, setHoldings] = useState(null);
  const [advice, setAdvice] = useState(null);
  const [milestones, setMilestones] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", icon: "Car", tier: "mid", target_amount: "", target_age: 35 });

  useEffect(() => {
    (async () => {
      const [nw, h, a, m] = await Promise.all([
        api.get("/networth"), api.get("/holdings"), api.get("/holdings/recommendations"), api.get("/milestones"),
      ]);
      setD(nw.data); setHoldings(h.data); setAdvice(a.data); setMilestones(m.data);
    })();
  }, []);

  if (!d || !holdings || !advice) return <div className="p-8 text-muted-foreground">Loading…</div>;

  // Build a smooth life-long timeline (age 30 → 60) using compound projection
  const startAge = 30;
  const endAge = 60;
  const monthlyAdd = 62000; // optimized contribution
  const annualReturn = 0.12;
  const userTimeline = [];
  let bal = d.total > 0 ? d.total : 500000;
  for (let yr = 0; yr <= endAge - startAge; yr++) {
    userTimeline.push({ age: startAge + yr, value: Math.round(bal) });
    bal = bal * (1 + annualReturn) + monthlyAdd * 12;
  }

  // Project milestones onto timeline by target_age
  const projected = milestones.map((m) => {
    const point = userTimeline.find((p) => p.age === m.target_age) || userTimeline.find((p) => p.age >= m.target_age) || userTimeline[userTimeline.length - 1];
    return { ...m, age: m.target_age, value: point?.value || 0 };
  });

  const submitMilestone = async () => {
    try { await api.post("/milestones", { ...form, target_amount: Number(form.target_amount), target_age: Number(form.target_age) });
      const m = await api.get("/milestones"); setMilestones(m.data); setOpen(false); toast.success("Milestone added");
    } catch { toast.error("Failed"); }
  };
  const delMilestone = async (id) => { await api.delete(`/milestones/${id}`); const m = await api.get("/milestones"); setMilestones(m.data); };

  const tierColor = { short: "bg-chart-3 text-white", mid: "bg-secondary text-secondary-foreground", long: "bg-accent text-accent-foreground", critical: "bg-destructive text-destructive-foreground" };

  return (
    <div className="px-4 lg:px-10 py-6 lg:py-10 space-y-6 max-w-[1400px] mx-auto">
      <header>
        <div className="text-xs uppercase tracking-widest text-muted-foreground font-bold">Net Worth</div>
        <div className="flex flex-wrap items-end gap-6 mt-1">
          <h1 className="font-headings font-bold text-4xl lg:text-5xl">{inr(d.total)}</h1>
          <div className="text-sm text-accent font-medium">Assets {inr(d.assets)} · Debt {inr(d.liabilities)}</div>
        </div>
      </header>

      {/* INTERACTIVE LIFE TIMELINE CHART */}
      <div className="fp-card p-6 lg:p-8 space-y-5 relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-secondary/5 dark:from-primary/20" data-testid="life-timeline-chart">
        <div className="flex flex-wrap justify-between items-start gap-3">
          <div>
            <div className="text-xs uppercase tracking-widest text-accent font-bold">Forecast your future</div>
            <h2 className="font-headings font-bold text-2xl lg:text-3xl mt-1">Your money, mapped to your life</h2>
            <p className="text-sm text-muted-foreground mt-1 max-w-md">Drop life milestones onto your wealth curve. We'll show you exactly when each becomes possible.</p>
          </div>
          <div className="flex gap-3 lg:flex-row flex-col text-right">
            <div>
              <div className="text-[11px] uppercase tracking-widest text-muted-foreground font-bold">Today</div>
              <div className="font-headings font-bold text-2xl">{inr(d.total)}</div>
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-widest text-muted-foreground font-bold">At age 60</div>
              <div className="font-headings font-bold text-2xl text-accent">{inr(userTimeline[userTimeline.length-1].value)}</div>
            </div>
          </div>
        </div>

        <div className="h-[360px] relative">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={userTimeline} margin={{ top: 60, right: 30, left: 10, bottom: 20 }}>
              <defs>
                <linearGradient id="lineG" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity={0.9}/>
                  <stop offset="100%" stopColor="hsl(var(--secondary))" stopOpacity={0.9}/>
                </linearGradient>
                <linearGradient id="lineFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity={0.3}/>
                  <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 6" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="age" type="number" domain={[startAge, endAge]} ticks={[30, 35, 40, 45, 50, 55, 60]} tickFormatter={(v) => `Age ${v}`} stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <YAxis tickFormatter={(v) => inr(v)} stroke="hsl(var(--muted-foreground))" fontSize={11} width={70} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12 }} formatter={(v) => inr(v)} labelFormatter={(v) => `Age ${v}`} />
              <Line type="monotone" dataKey="value" stroke="url(#lineG)" strokeWidth={3} dot={false} />
              {projected.map((m) => (
                <ReferenceDot key={m.id} x={m.age} y={m.value} r={8} fill="hsl(var(--background))" stroke="hsl(var(--accent))" strokeWidth={3} />
              ))}
            </LineChart>
          </ResponsiveContainer>
          {/* Milestone pins overlay */}
          <div className="absolute inset-0 pointer-events-none">
            {projected.map((m) => {
              const Icon = MICONS[m.icon] || Target;
              const xPct = ((m.age - startAge) / 30) * 100;
              return (
                <div key={m.id} className="absolute -translate-x-1/2 pointer-events-auto" style={{ left: `${Math.max(4, Math.min(96, xPct))}%`, top: 8 }}>
                  <div className="flex flex-col items-center group">
                    <div className={`w-9 h-9 rounded-full grid place-items-center shadow-lg ${tierColor[m.tier] || tierColor.mid} fp-pulse-ring`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="mt-1 text-[10px] font-semibold whitespace-nowrap bg-card/90 backdrop-blur px-1.5 py-0.5 rounded border border-border">{m.name}</div>
                    <div className="text-[9px] text-muted-foreground">Age {m.target_age} · {inr(m.target_amount)}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-border">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="w-2.5 h-2.5 rounded-full bg-chart-3"></span>Short
            <span className="w-2.5 h-2.5 rounded-full bg-secondary ml-2"></span>Mid
            <span className="w-2.5 h-2.5 rounded-full bg-accent ml-2"></span>Long
            <span className="w-2.5 h-2.5 rounded-full bg-destructive ml-2"></span>Critical
          </div>
          <div className="flex-1"></div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90" data-testid="add-milestone-btn"><Plus className="w-4 h-4 mr-1" />Add milestone</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>New life milestone</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div className="space-y-2"><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Buy House, Child College, FIRE…" data-testid="ms-name-input" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2"><Label>Icon</Label>
                    <Select value={form.icon} onValueChange={(v) => setForm({ ...form, icon: v })}>
                      <SelectTrigger data-testid="ms-icon-select"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.keys(MICONS).map(k => <SelectItem key={k} value={k}>{k}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2"><Label>Tier</Label>
                    <Select value={form.tier} onValueChange={(v) => setForm({ ...form, tier: v })}>
                      <SelectTrigger data-testid="ms-tier-select"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="short">Short term</SelectItem>
                        <SelectItem value="mid">Mid term</SelectItem>
                        <SelectItem value="long">Long term</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2"><Label>Target ₹</Label><Input type="number" value={form.target_amount} onChange={(e) => setForm({ ...form, target_amount: e.target.value })} data-testid="ms-amount-input" /></div>
                  <div className="space-y-2"><Label>By age</Label><Input type="number" value={form.target_age} onChange={(e) => setForm({ ...form, target_age: e.target.value })} data-testid="ms-age-input" /></div>
                </div>
                <Button onClick={submitMilestone} className="w-full rounded-xl" data-testid="ms-submit-btn">Plot on timeline</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Milestones list */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2 pt-2">
          {milestones.map((m) => {
            const Icon = MICONS[m.icon] || Target;
            const yearsAway = m.target_age - startAge;
            return (
              <div key={m.id} className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border group" data-testid={`ms-row-${m.id}`}>
                <div className={`w-9 h-9 rounded-xl grid place-items-center ${tierColor[m.tier] || tierColor.mid}`}><Icon className="w-4 h-4" /></div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{m.name}</div>
                  <div className="text-[11px] text-muted-foreground">{inr(m.target_amount)} · in ~{yearsAway}y</div>
                </div>
                <button onClick={() => delMilestone(m.id)} className="opacity-0 group-hover:opacity-100 transition text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></button>
              </div>
            );
          })}
        </div>
      </div>

      {/* HOLDINGS */}
      <div className="space-y-3">
        <div className="flex justify-between items-end">
          <div>
            <div className="text-xs uppercase tracking-widest text-muted-foreground font-bold">Holdings</div>
            <h2 className="font-headings font-bold text-2xl lg:text-3xl mt-1">{inr(holdings.total)} across 16 buckets</h2>
          </div>
          <Button variant="outline" size="sm" className="rounded-xl" onClick={() => toast("Broker connect (Zerodha/Groww/Vested) — coming soon", { description: "We'll auto-pull XIRR & live values once connected." })} data-testid="connect-broker-btn">
            <Link2 className="w-4 h-4 mr-1" /> Connect broker for live XIRR
          </Button>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3" data-testid="holdings-grid">
          {holdings.items.map((h) => {
            const Icon = HICONS[h.icon] || MoreHorizontal;
            const beats = h.benchmark > 0 && h.xirr >= h.benchmark;
            return (
              <div key={h.cat} className={`fp-card p-4 space-y-2 hover:-translate-y-0.5 transition-transform ${h.value === 0 ? "opacity-60" : ""}`} data-testid={`holding-${h.cat.replace(/[^a-zA-Z]/g,"")}`}>
                <div className="flex justify-between items-start">
                  <div className="w-9 h-9 rounded-lg bg-accent/15 text-accent grid place-items-center"><Icon className="w-4 h-4" /></div>
                  {h.value > 0 && <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{h.pct}%</span>}
                </div>
                <div className="font-medium text-sm">{h.cat}</div>
                <div className="font-headings font-bold text-xl">{h.value > 0 ? inr(h.value) : "—"}</div>
                {h.value > 0 && h.xirr !== 0 && (
                  <div className="flex items-center justify-between text-[11px]">
                    <span className={`font-bold ${h.xirr >= 0 ? "text-accent" : "text-destructive"}`}>XIRR {h.xirr > 0 ? "+" : ""}{h.xirr}%</span>
                    {h.benchmark > 0 && <span className={`text-muted-foreground ${beats ? "" : "text-warning"}`}>vs {h.benchmark}%</span>}
                  </div>
                )}
                {h.live_price && (
                  <div className="text-[11px] pt-1 border-t border-border">
                    <span className="text-muted-foreground">Live: </span><span className="font-semibold">₹{h.live_price.toLocaleString("en-IN")}</span>
                    <span className={`ml-2 ${h.change_30d < 0 ? "text-destructive" : "text-accent"}`}>{h.change_30d > 0 ? "+" : ""}{h.change_30d}% 30d</span>
                  </div>
                )}
                {h.value === 0 && (
                  <button onClick={() => toast("Add this holding via broker connect or manual entry")} className="text-[11px] text-accent font-medium hover:underline flex items-center gap-1">
                    <Plus className="w-3 h-3" /> Add holding
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* AI HOLDINGS ADVISOR */}
      <div className="fp-card p-6 fp-ai-panel space-y-4" data-testid="holdings-advisor">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl bg-accent text-accent-foreground grid place-items-center shrink-0"><Sparkles className="w-5 h-5" /></div>
          <div className="flex-1">
            <div className="text-xs uppercase tracking-widest text-muted-foreground font-bold">AI Holdings Advisor</div>
            <h2 className="font-headings font-semibold text-xl mt-0.5">Personalized for your <span className="text-accent capitalize">{advice.risk_profile}</span> profile</h2>
            <div className="text-sm text-muted-foreground">Buy alerts, fund switches, bond picks & rebalancing — all based on your live holdings.</div>
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-3">
          {advice.recommendations.map((r) => {
            const Icon = HICONS[r.icon] || Sparkles;
            return (
              <div key={r.id} className="fp-card p-5 space-y-2" data-testid={`advisor-${r.id}`}>
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-lg bg-accent/15 text-accent grid place-items-center"><Icon className="w-4 h-4" /></div>
                  <div className="flex-1">
                    <div className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">{r.asset}</div>
                    <div className="text-xs">{r.confidence}% confidence</div>
                  </div>
                  <span className={`text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded ${r.type === "buy" ? "bg-accent/15 text-accent" : r.type === "switch" ? "bg-warning/15 text-warning" : "bg-secondary/15 text-secondary"}`}>{r.type}</span>
                </div>
                <div className="font-medium leading-snug">{r.title}</div>
                <div className="text-sm text-accent">{r.action}</div>
                <div className="text-xs text-muted-foreground">{r.rationale}</div>
                <div className="flex gap-2 pt-1">
                  <Button size="sm" className="rounded-lg bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => toast.success("Action queued for next sync")} data-testid={`adv-apply-${r.id}`}>Apply</Button>
                  <Button size="sm" variant="ghost" onClick={() => toast(r.title, { description: r.rationale })}>Why</Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* IDLE CASH */}
      <div className="fp-card p-6 fp-ai-panel space-y-5" data-testid="idle-cash-optimizer">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-accent text-accent-foreground grid place-items-center"><Sparkles className="w-5 h-5" /></div>
          <div>
            <div className="text-xs uppercase tracking-widest text-muted-foreground font-bold">Idle Cash Optimizer</div>
            <h2 className="font-headings font-semibold text-xl mt-0.5">{inr(d.idle_cash)} earning &lt;3.5%</h2>
            <div className="text-sm text-muted-foreground">Losing ~{inr(d.annual_loss)}/year by not deploying.</div>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {d.idle_options.map((o) => (
            <div key={o.name} className="fp-card p-5 space-y-2" data-testid={`idle-option-${o.name.replace(/\s/g,"-")}`}>
              <div className="font-medium">{o.name}</div>
              <div className="font-headings font-bold text-2xl text-accent">{o.return_pct}%</div>
              <div className="text-xs text-muted-foreground space-y-0.5">
                <div>Liquidity: <span className="text-foreground font-medium">{o.liquidity}</span></div>
                <div>Risk: <span className="text-foreground font-medium">{o.risk}</span></div>
                <div>Horizon: {o.horizon}</div>
              </div>
              <div className="pt-2 border-t border-border flex justify-between items-center">
                <div>
                  <div className="text-[11px] uppercase tracking-widest text-muted-foreground">Suggested</div>
                  <div className="font-headings font-semibold">{inr(o.recommended_amt)}</div>
                </div>
                <Button size="sm" className="rounded-lg bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => toast.success(`Deploying ${inr(o.recommended_amt)} to ${o.name}`)} data-testid={`deploy-${o.name.replace(/\s/g,"-")}`}>Deploy</Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Contributions */}
      <div className="fp-card p-6">
        <div className="text-xs uppercase tracking-widest text-muted-foreground font-bold">Contribution tracker</div>
        <h2 className="font-headings font-semibold text-xl mt-1 mb-4">YTD inflows</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {[{l:"SIP",v:300000,t:600000},{l:"EPF",v:84000,t:120000},{l:"Adhoc / Bonus",v:150000,t:300000}].map(r => (
            <div key={r.l} className="space-y-1.5">
              <div className="flex justify-between text-sm"><span>{r.l}</span><span className="text-muted-foreground">{inr(r.v)} / {inr(r.t)}</span></div>
              <div className="h-2 bg-muted rounded-full overflow-hidden"><div className="h-full bg-accent" style={{width:`${r.v/r.t*100}%`}}></div></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
