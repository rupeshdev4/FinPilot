import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { inr } from "@/lib/format";
import { ResponsiveContainer, LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ReferenceDot, PieChart, Pie, Cell, Legend } from "recharts";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Sparkles, TrendingUp, Globe, PieChart as PieI, Bitcoin, Lock, Receipt, Shield, Building2, Sunset, Coins, Award, Briefcase, Car, Home, MoreHorizontal, Plus, GraduationCap, Plane, Heart, Target, Sliders, ArrowRight, Trash2, Link2, Trophy, Zap } from "lucide-react";
import { toast } from "sonner";

const HICONS = { TrendingUp, Globe, PieChart: PieI, Bitcoin, Lock, Receipt, Shield, Building2, Sunset, Coins, Award, Briefcase, Car, Home, MoreHorizontal, Sliders };
const MICONS = { Car, Home, GraduationCap, Plane, Heart, Sunset, Target, Trophy };
const tierColor = { short: "bg-chart-3 text-white", mid: "bg-secondary text-secondary-foreground", long: "bg-accent text-accent-foreground", critical: "bg-destructive text-destructive-foreground" };
const COLORS = ["#00D084", "#4F46E5", "#38BDF8", "#F59E0B", "#F472B6"];

export default function NetWorth() {
  const [d, setD] = useState(null);
  const [holdings, setHoldings] = useState(null);
  const [advice, setAdvice] = useState(null);
  const [milestones, setMilestones] = useState([]);
  const [superData, setSuperData] = useState(null);
  const [allocation, setAllocation] = useState(null);
  const [bonds, setBonds] = useState([]);
  const [funds, setFunds] = useState(null);
  const [metals, setMetals] = useState(null);
  const [xirr, setXirr] = useState([]);

  // Super chart controls
  const [chartRange, setChartRange] = useState("lifetime");
  const [inflationOn, setInflationOn] = useState(false);

  // Simulator state
  const [sipBoost, setSipBoost] = useState(0);
  const [stepUp, setStepUp] = useState(0);
  const [bonus, setBonus] = useState(0);
  const [salaryGrowth, setSalaryGrowth] = useState(8);
  const [returnPct, setReturnPct] = useState(13);

  const [openMs, setOpenMs] = useState(false);
  const [form, setForm] = useState({ name: "", icon: "Car", tier: "mid", target_amount: "", target_age: 35 });

  useEffect(() => { loadAll(); }, []);
  useEffect(() => { reloadSuper(); }, [chartRange, inflationOn]);

  const loadAll = async () => {
    const [nw, h, a, m, ac, b, f, mt, xi] = await Promise.all([
      api.get("/networth"), api.get("/holdings"), api.get("/holdings/recommendations"),
      api.get("/milestones"), api.get("/allocation"), api.get("/bonds"),
      api.get("/mutual-funds/top"), api.get("/precious-metals"), api.get("/xirr-analytics"),
    ]);
    setD(nw.data); setHoldings(h.data); setAdvice(a.data); setMilestones(m.data);
    setAllocation(ac.data); setBonds(b.data); setFunds(f.data); setMetals(mt.data); setXirr(xi.data);
  };
  const reloadSuper = async () => {
    const r = await api.get(`/networth/super-chart?range=${chartRange}&inflation=${inflationOn}`);
    setSuperData(r.data);
  };

  const submitMs = async () => {
    try { await api.post("/milestones", { ...form, target_amount: Number(form.target_amount), target_age: Number(form.target_age) });
      const m = await api.get("/milestones"); setMilestones(m.data); reloadSuper(); setOpenMs(false); toast.success("Milestone added");
    } catch { toast.error("Failed"); }
  };
  const delMs = async (id) => { await api.delete(`/milestones/${id}`); const m = await api.get("/milestones"); setMilestones(m.data); reloadSuper(); };

  // Apply simulator to super chart points (recalc optimized)
  const simulatedPoints = useMemo(() => {
    if (!superData) return [];
    const startVal = superData.today_value > 0 ? superData.today_value : 200000;
    const ret = (returnPct + (inflationOn ? -6 : 0)) / 100;
    let cur = startVal, opt = startVal;
    const baseMonthly = 45000, optMonthly = 62000 + Number(sipBoost);
    const stepRate = Number(stepUp) / 100;
    const bonusYearly = Number(bonus) * 12000 / 12; // simple
    return superData.points.map((p, i) => ({
      age: p.age,
      current: i === 0 ? cur : (cur = cur * (1 + 0.10 - (inflationOn ? 0.06 : 0)) + baseMonthly * 12),
      optimized: i === 0 ? opt : (opt = opt * (1 + ret) + (optMonthly * (1 + stepRate * i) * 12) + Number(bonus)),
    }));
  }, [superData, sipBoost, stepUp, bonus, returnPct, inflationOn]);

  if (!d || !holdings || !advice || !superData || !allocation || !funds || !metals) return <div className="p-8 text-muted-foreground">Loading…</div>;

  return (
    <div className="px-4 lg:px-10 py-6 lg:py-10 space-y-6 max-w-[1400px] mx-auto">
      <header>
        <div className="text-xs uppercase tracking-widest text-muted-foreground font-bold">Net Worth</div>
        <div className="flex flex-wrap items-end gap-6 mt-1">
          <h1 className="font-headings font-bold text-4xl lg:text-5xl">{inr(d.total)}</h1>
          <div className="text-sm text-accent font-medium">Assets {inr(d.assets)} · Debt {inr(d.liabilities)}</div>
        </div>
      </header>

      {/* SUPER CHART */}
      <SuperChart
        data={simulatedPoints}
        amountMs={superData.amount_milestones}
        lifeMs={superData.life_milestones}
        startAge={superData.start_age}
        endAge={superData.end_age}
        chartRange={chartRange}
        setChartRange={setChartRange}
        inflationOn={inflationOn}
        setInflationOn={setInflationOn}
        today={superData.today_value}
        future={simulatedPoints[simulatedPoints.length - 1]?.optimized || 0}
        milestones={milestones}
        delMs={delMs}
        openMs={openMs}
        setOpenMs={setOpenMs}
        form={form}
        setForm={setForm}
        submitMs={submitMs}
      />

      {/* SCENARIO SIMULATOR */}
      <div className="fp-card p-6 space-y-5" data-testid="scenario-simulator">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-secondary text-secondary-foreground grid place-items-center"><Sliders className="w-5 h-5" /></div>
          <div>
            <div className="text-xs uppercase tracking-widest text-muted-foreground font-bold">Scenario Simulator</div>
            <h2 className="font-headings font-semibold text-xl mt-0.5">What if you...</h2>
            <div className="text-sm text-muted-foreground">Drag the sliders — your super chart updates instantly.</div>
          </div>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          <SimRow label="Boost SIP by" v={sipBoost} setV={setSipBoost} min={0} max={50000} step={1000} fmt={(v) => `+₹${v.toLocaleString("en-IN")}/mo`} testid="sim-sip" />
          <SimRow label="Annual SIP step-up" v={stepUp} setV={setStepUp} min={0} max={20} step={1} fmt={(v) => `${v}%`} testid="sim-stepup" />
          <SimRow label="Add bonus invest" v={bonus} setV={setBonus} min={0} max={500000} step={10000} fmt={(v) => `₹${(v/1000).toFixed(0)}K/yr`} testid="sim-bonus" />
          <SimRow label="Salary growth" v={salaryGrowth} setV={setSalaryGrowth} min={0} max={20} step={1} fmt={(v) => `${v}%`} testid="sim-salary" />
          <SimRow label="Expected return" v={returnPct} setV={setReturnPct} min={6} max={18} step={0.5} fmt={(v) => `${v}%`} testid="sim-return" />
        </div>
      </div>

      {/* HOLDINGS */}
      <Holdings holdings={holdings} />

      {/* XIRR ANALYTICS */}
      <XIRRAnalytics items={xirr} />

      {/* PRECIOUS METALS LIVE */}
      <PreciousMetals metals={metals} />

      {/* ALLOCATION ANALYTICS */}
      <AllocationAnalytics data={allocation} setData={setAllocation} />

      {/* MUTUAL FUND ANALYST */}
      <MFAnalyst funds={funds} />

      {/* BOND RECOMMENDATIONS */}
      <BondsTable items={bonds} />

      {/* AI HOLDINGS ADVISOR */}
      <div className="fp-card p-6 fp-ai-panel space-y-4" data-testid="holdings-advisor">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl bg-accent text-accent-foreground grid place-items-center shrink-0"><Sparkles className="w-5 h-5" /></div>
          <div className="flex-1">
            <div className="text-xs uppercase tracking-widest text-muted-foreground font-bold">AI Holdings Advisor</div>
            <h2 className="font-headings font-semibold text-xl mt-0.5">Personalized for your <span className="text-accent capitalize">{advice.risk_profile}</span> profile</h2>
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
                  <Button size="sm" className="rounded-lg bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => toast.success("Action queued")} data-testid={`adv-apply-${r.id}`}>Apply</Button>
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
          </div>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {d.idle_options.map((o) => (
            <div key={o.name} className="fp-card p-5 space-y-2">
              <div className="font-medium">{o.name}</div>
              <div className="font-headings font-bold text-2xl text-accent">{o.return_pct}%</div>
              <div className="text-xs text-muted-foreground space-y-0.5">
                <div>Liquidity: <span className="text-foreground font-medium">{o.liquidity}</span></div>
                <div>Risk: <span className="text-foreground font-medium">{o.risk}</span></div>
              </div>
              <div className="pt-2 border-t border-border flex justify-between items-center">
                <div>
                  <div className="text-[11px] uppercase tracking-widest text-muted-foreground">Suggested</div>
                  <div className="font-headings font-semibold">{inr(o.recommended_amt)}</div>
                </div>
                <Button size="sm" className="rounded-lg bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => toast.success(`Deploying ${inr(o.recommended_amt)} to ${o.name}`)}>Deploy</Button>
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
          {[{l:"SIP",v:300000,t:600000},{l:"EPF (you+employer)",v:84000,t:120000},{l:"Adhoc / Bonus",v:150000,t:300000}].map(r => (
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

// ---- SUPER CHART ----
function SuperChart({ data, amountMs, lifeMs, startAge, endAge, chartRange, setChartRange, inflationOn, setInflationOn, today, future, milestones, delMs, openMs, setOpenMs, form, setForm, submitMs }) {
  return (
    <div className="fp-card p-6 lg:p-8 space-y-5 relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-secondary/5 dark:from-primary/30 dark:via-background dark:to-secondary/10" data-testid="super-chart">
      <div className="flex flex-wrap justify-between items-start gap-3">
        <div>
          <div className="text-xs uppercase tracking-widest text-accent font-bold">Forecast your future</div>
          <h2 className="font-headings font-bold text-2xl lg:text-3xl mt-1">Super Chart</h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-md">Life events + amount milestones + current vs optimized — all on one timeline.</p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <Tabs value={chartRange} onValueChange={setChartRange}>
            <TabsList className="rounded-xl">
              <TabsTrigger value="1Y" data-testid="range-1Y">1Y</TabsTrigger>
              <TabsTrigger value="5Y" data-testid="range-5Y">5Y</TabsTrigger>
              <TabsTrigger value="10Y" data-testid="range-10Y">10Y</TabsTrigger>
              <TabsTrigger value="lifetime" data-testid="range-lifetime">Lifetime</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="flex items-center gap-2 text-xs">
            <Switch checked={inflationOn} onCheckedChange={setInflationOn} data-testid="inflation-toggle" />
            <span>Inflation-adjusted</span>
          </div>
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-3">
        <div className="bg-card border border-border rounded-xl p-3"><div className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Today</div><div className="font-headings font-bold text-2xl mt-1">{inr(today)}</div></div>
        <div className="bg-card border border-border rounded-xl p-3"><div className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Future @ {endAge}</div><div className="font-headings font-bold text-2xl text-accent mt-1">{inr(future)}</div></div>
        <div className="bg-card border border-border rounded-xl p-3"><div className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Mode</div><div className="font-headings font-bold text-base mt-1 capitalize">{inflationOn ? "Real ₹ (inflation-adj)" : "Nominal ₹"}</div></div>
      </div>

      <div className="h-[420px] relative">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 70, right: 30, left: 10, bottom: 20 }}>
            <defs>
              <linearGradient id="gOpt" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity={0.35}/>
                <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="gCur" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--secondary))" stopOpacity={0.2}/>
                <stop offset="100%" stopColor="hsl(var(--secondary))" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 6" stroke="hsl(var(--border))" vertical={false} />
            <XAxis dataKey="age" type="number" domain={[startAge, endAge]} tickFormatter={(v) => `Age ${v}`} stroke="hsl(var(--muted-foreground))" fontSize={11} />
            <YAxis tickFormatter={(v) => inr(v)} stroke="hsl(var(--muted-foreground))" fontSize={11} width={70} />
            <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12 }} formatter={(v) => inr(v)} labelFormatter={(v) => `Age ${v}`} />
            <Legend wrapperStyle={{ paddingTop: 10 }} />
            <Area type="monotone" dataKey="current" name="Current path" stroke="hsl(var(--secondary))" strokeWidth={2.5} strokeDasharray="6 4" fill="url(#gCur)" />
            <Area type="monotone" dataKey="optimized" name="Optimized path" stroke="hsl(var(--accent))" strokeWidth={3} fill="url(#gOpt)" />
            {amountMs.map((m) => (
              <ReferenceLine key={m.label} y={m.amount} stroke={m.achieved ? "hsl(var(--accent))" : "hsl(var(--border))"} strokeDasharray="3 3" opacity={m.achieved ? 0.6 : 0.4}
                label={{ value: m.label, position: "right", fill: m.achieved ? "hsl(var(--accent))" : "hsl(var(--muted-foreground))", fontSize: 10, fontWeight: 700 }} />
            ))}
            {lifeMs.map((m) => (
              <ReferenceDot key={m.id} x={m.target_age} y={m.value_at_age} r={9} fill="hsl(var(--background))" stroke="hsl(var(--accent))" strokeWidth={3} />
            ))}
          </AreaChart>
        </ResponsiveContainer>

        {/* Life milestone pins overlay */}
        <div className="absolute inset-0 pointer-events-none" style={{ paddingTop: 14, paddingLeft: 70, paddingRight: 30 }}>
          {lifeMs.map((m) => {
            const Icon = MICONS[m.icon] || Target;
            const xPct = ((m.target_age - startAge) / (endAge - startAge)) * 100;
            const yearsAway = m.target_age - startAge;
            return (
              <div key={m.id} className="absolute -translate-x-1/2 pointer-events-auto" style={{ left: `${Math.max(2, Math.min(98, xPct))}%`, top: 0 }}>
                <div className="flex flex-col items-center group cursor-pointer" title={`${m.name} · ${inr(m.target_amount)} · ${yearsAway}y · ${m.achievable ? "On track" : "Funding gap " + inr(m.funding_gap)}`}>
                  <div className={`w-10 h-10 rounded-full grid place-items-center shadow-lg ring-2 ring-background ${tierColor[m.tier] || tierColor.mid} ${m.achievable ? "fp-pulse-ring" : "opacity-60"}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="mt-1 text-[10px] font-semibold whitespace-nowrap bg-card/90 backdrop-blur px-1.5 py-0.5 rounded border border-border">{m.name}</div>
                  <div className="text-[9px] text-muted-foreground">@{m.target_age} · {inr(m.target_amount)}</div>
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
        <Dialog open={openMs} onOpenChange={setOpenMs}>
          <DialogTrigger asChild>
            <Button size="sm" className="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90" data-testid="add-milestone-btn"><Plus className="w-4 h-4 mr-1" />Add milestone</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New life milestone</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="space-y-2"><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Buy House, FIRE…" data-testid="ms-name-input" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2"><Label>Icon</Label>
                  <Select value={form.icon} onValueChange={(v) => setForm({ ...form, icon: v })}>
                    <SelectTrigger data-testid="ms-icon-select"><SelectValue /></SelectTrigger>
                    <SelectContent>{Object.keys(MICONS).map(k => <SelectItem key={k} value={k}>{k}</SelectItem>)}</SelectContent>
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
              <Button onClick={submitMs} className="w-full rounded-xl" data-testid="ms-submit-btn">Plot on timeline</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Milestone list with funding gap */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2 pt-2">
        {lifeMs.map((m) => {
          const Icon = MICONS[m.icon] || Target;
          return (
            <div key={m.id} className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border group">
              <div className={`w-9 h-9 rounded-xl grid place-items-center ${tierColor[m.tier] || tierColor.mid}`}><Icon className="w-4 h-4" /></div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate">{m.name}</div>
                <div className="text-[11px] text-muted-foreground">{inr(m.target_amount)} @ age {m.target_age}</div>
                <div className={`text-[10px] font-bold ${m.achievable ? "text-accent" : "text-warning"}`}>
                  {m.achievable ? "✓ On track" : `Gap ${inr(m.funding_gap)}`}
                </div>
              </div>
              <button onClick={() => delMs(m.id)} className="opacity-0 group-hover:opacity-100 transition text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></button>
            </div>
          );
        })}
      </div>

      {/* Amount milestones row */}
      <div className="grid grid-cols-5 gap-2 pt-2">
        {amountMs.map((m) => (
          <div key={m.label} className={`p-3 rounded-xl text-center transition-all ${m.achieved ? "bg-accent/15 ring-2 ring-accent" : "bg-muted opacity-70"}`} data-testid={`amt-ms-${m.label}`}>
            <div className="font-headings font-bold text-lg">{m.label}</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">{m.achieved ? "✓ Achieved" : `~${m.years_away}y away`}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SimRow({ label, v, setV, min, max, step, fmt, testid }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between"><Label className="text-xs">{label}</Label><span className="text-xs font-semibold text-accent">{fmt(v)}</span></div>
      <Slider min={min} max={max} step={step} value={[v]} onValueChange={(x) => setV(x[0])} data-testid={testid} />
    </div>
  );
}

// ---- HOLDINGS GRID ----
function Holdings({ holdings }) {
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-end">
        <div>
          <div className="text-xs uppercase tracking-widest text-muted-foreground font-bold">Holdings</div>
          <h2 className="font-headings font-bold text-2xl lg:text-3xl mt-1">{inr(holdings.total)} across 16 buckets</h2>
        </div>
        <Button variant="outline" size="sm" className="rounded-xl" onClick={() => toast("Broker connect (Zerodha/Groww/Vested) — coming soon")} data-testid="connect-broker-btn">
          <Link2 className="w-4 h-4 mr-1" /> Connect for live XIRR
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
              {h.value === 0 && <button onClick={() => toast("Add via broker connect or manual entry")} className="text-[11px] text-accent font-medium flex items-center gap-1"><Plus className="w-3 h-3" /> Add</button>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---- XIRR ANALYTICS ----
function XIRRAnalytics({ items }) {
  return (
    <div className="fp-card p-6" data-testid="xirr-analytics">
      <div className="flex justify-between items-end mb-4">
        <div>
          <div className="text-xs uppercase tracking-widest text-muted-foreground font-bold">XIRR Analytics</div>
          <h2 className="font-headings font-bold text-2xl mt-1">How each bucket is performing</h2>
        </div>
      </div>
      <div className="space-y-2">
        {items.map((it) => {
          const Icon = HICONS[it.icon] || TrendingUp;
          return (
            <div key={it.asset} className="grid grid-cols-12 gap-3 items-center p-3 rounded-xl bg-muted/40 hover:bg-muted transition" data-testid={`xirr-row-${it.asset.replace(/\s/g,"")}`}>
              <div className="col-span-12 sm:col-span-3 flex items-center gap-2">
                <div className="w-9 h-9 rounded-lg bg-accent/15 text-accent grid place-items-center"><Icon className="w-4 h-4" /></div>
                <div>
                  <div className="font-medium text-sm">{it.asset}</div>
                  <div className="text-xs text-muted-foreground">{inr(it.value)}</div>
                </div>
              </div>
              <div className="col-span-4 sm:col-span-2"><div className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">XIRR</div><div className={`font-headings font-bold text-lg ${it.xirr >= 0 ? "text-accent" : "text-destructive"}`}>{it.xirr}%</div></div>
              <div className="col-span-4 sm:col-span-2"><div className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Benchmark</div><div className="font-headings font-semibold text-base">{it.benchmark}%</div></div>
              <div className="col-span-4 sm:col-span-2"><div className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Alpha</div><div className={`font-headings font-bold text-base ${it.alpha >= 0 ? "text-accent" : "text-warning"}`}>{it.alpha > 0 ? "+" : ""}{it.alpha}%</div></div>
              <div className="col-span-12 sm:col-span-3 flex items-center gap-2">
                <div className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Quality</div>
                <div className="flex-1 h-2 bg-card rounded-full overflow-hidden"><div className={`h-full ${it.quality_score >= 75 ? "bg-accent" : it.quality_score >= 60 ? "bg-warning" : "bg-destructive"}`} style={{ width: `${it.quality_score}%` }}></div></div>
                <div className="text-sm font-bold">{it.quality_score}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---- PRECIOUS METALS LIVE ----
function PreciousMetals({ metals }) {
  return (
    <div className="grid lg:grid-cols-2 gap-5">
      {[{ k: "gold", title: "Gold (24K)", color: "text-warning" }, { k: "silver", title: "Silver", color: "text-muted-foreground" }].map(({ k, title, color }) => {
        const m = metals[k];
        return (
          <div key={k} className="fp-card p-6 space-y-4" data-testid={`metal-${k}`}>
            <div className="flex justify-between items-start">
              <div className="flex gap-3 items-center">
                <div className={`w-11 h-11 rounded-xl bg-warning/15 grid place-items-center`}><Coins className={`w-5 h-5 ${color}`} /></div>
                <div>
                  <div className="text-xs uppercase tracking-widest text-muted-foreground font-bold">{title}</div>
                  <div className="font-headings font-bold text-2xl">₹{m.spot.toLocaleString("en-IN")}</div>
                  <div className="text-xs text-muted-foreground">{m.unit}</div>
                </div>
              </div>
              <div className="px-2.5 py-1 rounded-full bg-accent/15 text-accent text-xs font-bold">{m.ai_signal}</div>
            </div>
            <div className="grid grid-cols-4 gap-2 text-center">
              {[{l:"1M", v:m.change_1m},{l:"3M", v:m.change_3m},{l:"1Y", v:m.change_1y},{l:"From peak", v:m.change_from_peak}].map(c => (
                <div key={c.l} className="bg-muted rounded-lg p-2">
                  <div className="text-[10px] uppercase font-bold text-muted-foreground">{c.l}</div>
                  <div className={`font-bold text-sm ${c.v < 0 ? "text-destructive" : "text-accent"}`}>{c.v > 0 ? "+" : ""}{c.v}%</div>
                </div>
              ))}
            </div>
            <div className="h-32">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={m.trend_1y}>
                  <Line dataKey="v" stroke="hsl(var(--accent))" strokeWidth={2.5} dot={false} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12 }} formatter={(v) => `₹${v.toLocaleString("en-IN")}`} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="text-xs text-muted-foreground">{m.reason}</div>
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border">
              <div><div className="text-[10px] uppercase tracking-widest text-muted-foreground">Holdings</div><div className="font-semibold">{inr(m.user_holding_value)}</div></div>
              <div><div className="text-[10px] uppercase tracking-widest text-muted-foreground">Current %</div><div className="font-semibold">{m.user_current_pct}%</div></div>
              <div><div className="text-[10px] uppercase tracking-widest text-muted-foreground">Target %</div><div className="font-semibold text-accent">{m.user_target_pct}%</div></div>
            </div>
            <Button className="w-full rounded-xl bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => toast.success(`Buy plan queued for ${title}`)} data-testid={`buy-${k}-btn`}>Start staggered buy</Button>
          </div>
        );
      })}
    </div>
  );
}

// ---- ALLOCATION ANALYTICS ----
function AllocationAnalytics({ data, setData }) {
  const change = async (profile) => { const r = await api.get(`/allocation?profile=${profile}`); setData(r.data); };
  const cur = Object.entries(data.current).map(([name, value]) => ({ name, value }));
  const rec = Object.entries(data.recommended).map(([name, value]) => ({ name, value }));
  return (
    <div className="fp-card p-6 space-y-5" data-testid="allocation-analytics">
      <div className="flex flex-wrap justify-between items-end gap-3">
        <div>
          <div className="text-xs uppercase tracking-widest text-muted-foreground font-bold">Allocation Analytics</div>
          <h2 className="font-headings font-bold text-2xl mt-1">Current vs Recommended</h2>
        </div>
        <Tabs value={data.risk_profile} onValueChange={change}>
          <TabsList className="rounded-xl">
            <TabsTrigger value="conservative" data-testid="risk-conservative">Conservative</TabsTrigger>
            <TabsTrigger value="moderate" data-testid="risk-moderate">Moderate</TabsTrigger>
            <TabsTrigger value="aggressive" data-testid="risk-aggressive">Aggressive</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      <div className="grid md:grid-cols-3 gap-5">
        <div className="space-y-2">
          <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest text-center">Current</div>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={cur} dataKey="value" innerRadius={45} outerRadius={70} paddingAngle={2}>
                  {cur.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => `${v}%`} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="space-y-2">
          <div className="text-xs font-bold text-accent uppercase tracking-widest text-center">Recommended</div>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={rec} dataKey="value" innerRadius={45} outerRadius={70} paddingAngle={2}>
                  {rec.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => `${v}%`} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="space-y-2">
          {Object.entries(data.drift).map(([k, v], i) => (
            <div key={k} className="flex justify-between items-center p-2 rounded-lg bg-muted">
              <div className="flex gap-2 items-center"><span className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }}></span><span className="text-sm">{k}</span></div>
              <div className="text-xs"><span className="text-muted-foreground">{data.current[k]}% → </span><span className="font-bold text-accent">{data.recommended[k]}%</span></div>
              <span className={`text-xs font-bold ${v > 0 ? "text-accent" : v < 0 ? "text-warning" : "text-muted-foreground"}`}>{v > 0 ? "+" : ""}{v}%</span>
            </div>
          ))}
        </div>
      </div>
      <div className="fp-ai-panel rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent text-accent-foreground grid place-items-center"><Trophy className="w-5 h-5" /></div>
          <div>
            <div className="text-xs uppercase tracking-widest text-muted-foreground font-bold">Rebalance impact</div>
            <div className="font-headings font-bold text-2xl text-accent">+{inr(data.rebalance_impact_15y)} in 15 years</div>
            <div className="text-xs text-muted-foreground">By matching the {data.risk_profile} target allocation.</div>
          </div>
        </div>
        <Button className="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => toast.success("Rebalance plan queued")} data-testid="rebalance-btn">Auto-rebalance</Button>
      </div>
    </div>
  );
}

// ---- MUTUAL FUND ANALYST ----
function MFAnalyst({ funds }) {
  const cats = Object.keys(funds.categories);
  const [tab, setTab] = useState(cats[0]);
  return (
    <div className="fp-card p-6 space-y-4" data-testid="mf-analyst">
      <div className="flex flex-wrap justify-between items-end gap-3">
        <div>
          <div className="text-xs uppercase tracking-widest text-muted-foreground font-bold">Mutual Fund Analyst</div>
          <h2 className="font-headings font-bold text-2xl mt-1">Top performers by category</h2>
          {funds.underperforming && (
            <div className="text-sm mt-2 px-3 py-1.5 rounded-lg bg-warning/15 text-warning inline-flex items-center gap-2">
              <Zap className="w-4 h-4" /> Your MF XIRR {funds.user_mf_xirr}% is below benchmark {funds.benchmark_xirr}%. Consider switching.
            </div>
          )}
        </div>
      </div>
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex-wrap h-auto rounded-xl">
          {cats.map(c => <TabsTrigger key={c} value={c} className="text-xs" data-testid={`mf-cat-${c.replace(/\s/g,"")}`}>{c}</TabsTrigger>)}
        </TabsList>
        {cats.map(c => (
          <TabsContent key={c} value={c} className="mt-4 space-y-2">
            {funds.categories[c].map((f, i) => (
              <div key={f.name} className="grid grid-cols-12 gap-3 items-center p-3 rounded-xl bg-muted/40 hover:bg-muted transition" data-testid={`fund-${f.name.replace(/\s/g,"")}`}>
                <div className="col-span-12 sm:col-span-4">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-accent text-accent-foreground grid place-items-center text-xs font-bold">#{f.rank}</div>
                    <div className="min-w-0">
                      <div className="font-medium text-sm truncate">{f.name}</div>
                      <div className="text-[11px] text-muted-foreground">Risk: {f.risk}</div>
                    </div>
                  </div>
                </div>
                <div className="col-span-4 sm:col-span-1"><div className="text-[10px] uppercase font-bold text-muted-foreground">1Y</div><div className="font-bold text-sm text-accent">{f.ret_1y}%</div></div>
                <div className="col-span-4 sm:col-span-1"><div className="text-[10px] uppercase font-bold text-muted-foreground">3Y</div><div className="font-bold text-sm text-accent">{f.ret_3y}%</div></div>
                <div className="col-span-4 sm:col-span-1"><div className="text-[10px] uppercase font-bold text-muted-foreground">5Y</div><div className="font-bold text-sm text-accent">{f.ret_5y}%</div></div>
                <div className="col-span-6 sm:col-span-1"><div className="text-[10px] uppercase font-bold text-muted-foreground">Expense</div><div className="font-bold text-sm">{f.expense}%</div></div>
                <div className="col-span-12 sm:col-span-3 text-xs text-muted-foreground italic">{f.why}</div>
                <div className="col-span-12 sm:col-span-1"><Button size="sm" className="rounded-lg w-full bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => toast.success(`Switch plan to ${f.name} queued`)}>Switch</Button></div>
              </div>
            ))}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

// ---- BONDS TABLE ----
function BondsTable({ items }) {
  const [filter, setFilter] = useState("All");
  const ratings = ["All", "AAA", "AA", "A", "A-", "BBB", "BB"];
  const ratingBg = { AAA: "bg-accent/15 text-accent", AA: "bg-secondary/15 text-secondary", A: "bg-chart-3/15 text-chart-3", "A-": "bg-warning/15 text-warning", BBB: "bg-warning/15 text-warning", BB: "bg-destructive/15 text-destructive" };
  const filtered = filter === "All" ? items : items.filter(b => b.rating === filter);
  return (
    <div className="fp-card p-6 space-y-4" data-testid="bonds-table">
      <div className="flex flex-wrap justify-between items-end gap-3">
        <div>
          <div className="text-xs uppercase tracking-widest text-muted-foreground font-bold">Bond Recommendations</div>
          <h2 className="font-headings font-bold text-2xl mt-1">Indian corporate & PSU bonds</h2>
          <div className="text-sm text-muted-foreground">Curated by rating and goal horizon. Lock yields before next rate cut.</div>
        </div>
        <div className="flex gap-1 flex-wrap">
          {ratings.map(r => (
            <button key={r} onClick={() => setFilter(r)} data-testid={`bond-filter-${r}`}
              className={`text-xs px-3 py-1.5 rounded-full font-bold border ${filter === r ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted"}`}>
              {r}
            </button>
          ))}
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold border-b border-border">
            <th className="text-left py-2 px-2">Bond</th><th className="text-left py-2">Rating</th><th className="text-right py-2">Yield</th>
            <th className="text-right py-2">Duration</th><th className="text-left py-2 px-2">Risk</th>
            <th className="text-left py-2">Horizon</th><th className="text-right py-2 px-2">Action</th>
          </tr></thead>
          <tbody>
            {filtered.map((b) => (
              <tr key={b.name} className="border-b border-border last:border-0" data-testid={`bond-${b.rating}`}>
                <td className="py-3 px-2"><div className="font-medium">{b.name}</div><div className="text-xs text-muted-foreground">{b.issuer}</div></td>
                <td className="py-3"><span className={`text-[11px] font-bold px-2 py-0.5 rounded ${ratingBg[b.rating] || "bg-muted"}`}>{b.rating}</span></td>
                <td className="py-3 text-right font-headings font-bold text-accent">{b.yield_pct}%</td>
                <td className="py-3 text-right">{b.duration_years}y</td>
                <td className="py-3 px-2">{b.risk}</td>
                <td className="py-3">{b.horizon}</td>
                <td className="py-3 px-2 text-right"><Button size="sm" variant="outline" className="rounded-lg" onClick={() => toast.success(`${b.name} added to watchlist`)}>Watch</Button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
