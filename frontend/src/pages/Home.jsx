import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { inr, pct, shortDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ResponsiveContainer, AreaChart, Area, LineChart, Line, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import { TrendingUp, Wallet, Target, Calendar, Banknote, Zap, Sparkles, ArrowRight, Plus, MessageCircle, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

const ICONS = { Utensils: Zap, Banknote, TrendingUp, Home: Wallet, Scissors: Zap, Zap };

function KPI({ label, value, sub, icon: Icon, accent }) {
  return (
    <div className="fp-card p-5 lg:p-6 hover:-translate-y-0.5 transition-transform" data-testid={`kpi-${label.toLowerCase().replace(/\s/g, "-")}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="text-[11px] uppercase tracking-widest text-muted-foreground font-bold">{label}</div>
        <div className={`w-8 h-8 rounded-lg grid place-items-center ${accent ? "bg-accent/15 text-accent" : "bg-muted text-foreground"}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div className="font-headings font-bold text-2xl lg:text-3xl">{value}</div>
      {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
    </div>
  );
}

export default function Home() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [data, setData] = useState(null);
  const [recs, setRecs] = useState([]);
  const [txns, setTxns] = useState([]);
  const [budget, setBudget] = useState(null);
  const [goals, setGoals] = useState([]);
  const [cibil, setCibil] = useState(null);

  useEffect(() => {
    (async () => {
      const [nw, rc, tx, bg, gl, cb] = await Promise.all([
        api.get("/networth"), api.get("/recommendations"), api.get("/transactions?limit=10"), api.get("/budget"), api.get("/goals"), api.get("/cibil"),
      ]);
      setData(nw.data); setRecs(rc.data); setTxns(tx.data); setBudget(bg.data); setGoals(gl.data); setCibil(cb.data);
    })();
  }, []);

  const greet = (() => {
    const h = new Date().getHours();
    return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
  })();

  if (!data) return <div className="p-8 text-muted-foreground">Loading…</div>;

  const cashAvail = data?.history?.[data.history.length - 1]?.value || 0;
  const monthSpend = txns.filter(t => t.amount < 0).reduce((s, t) => s + (-t.amount), 0);

  return (
    <div className="px-4 lg:px-10 py-6 lg:py-10 space-y-8 max-w-[1400px] mx-auto">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-widest text-muted-foreground font-bold">Today</div>
          <h1 className="font-headings font-bold text-2xl lg:text-4xl mt-1">{greet}, {user?.name?.split(" ")[0]} 👋</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="rounded-xl" onClick={() => nav("/app/transactions")} data-testid="quick-add-expense"><Plus className="w-4 h-4 mr-1" /> Expense</Button>
          <Button className="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => nav("/app/coach")} data-testid="quick-ask-ai"><Sparkles className="w-4 h-4 mr-1" /> Ask AI</Button>
        </div>
      </header>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 lg:gap-4">
        <KPI label="Net Worth" value={inr(data.total)} sub={`+${inr(data.assets * 0.018)} this month`} icon={TrendingUp} accent />
        <KPI label="Cash" value={inr(data.assets * 0.18)} sub="Across 3 banks" icon={Wallet} />
        <KPI label="Monthly Save" value={inr(budget ? budget.savings + budget.sip : 0)} sub="On track" icon={Banknote} />
        <KPI label="Goals" value={`${goals.length}`} sub="2 on track · 1 lagging" icon={Target} />
        <KPI label="Upcoming EMI" value={inr(27000)} sub="Due in 8 days" icon={Calendar} />
        <KPI label="Idle Cash" value={inr(data.idle_cash)} sub={`Lose ₹${Math.round(data.annual_loss/1000)}K/yr`} icon={Zap} />
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Net Worth + CIBIL combined */}
        <div className="lg:col-span-2 space-y-4">
          <div className="fp-card p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="text-xs uppercase tracking-widest text-muted-foreground font-bold">Net Worth</div>
                <div className="font-headings font-bold text-3xl mt-1">{inr(data.total)}</div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => nav("/app/networth")} data-testid="home-networth-link">View milestones <ArrowRight className="w-4 h-4 ml-1" /></Button>
            </div>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.history}>
                  <defs>
                    <linearGradient id="gNw" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickFormatter={(v) => inr(v)} width={60} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12 }} formatter={(v) => inr(v)} />
                  <Area type="monotone" dataKey="value" stroke="hsl(var(--accent))" strokeWidth={2.5} fill="url(#gNw)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {cibil && (
            <div className="fp-card p-5 flex flex-col sm:flex-row gap-5 items-stretch" data-testid="cibil-card">
              <div className="flex items-center gap-4 sm:border-r sm:border-border sm:pr-5">
                <div className="relative w-20 h-20 shrink-0">
                  <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
                    <circle cx="40" cy="40" r="34" fill="none" stroke="hsl(var(--muted))" strokeWidth="6" />
                    <circle cx="40" cy="40" r="34" fill="none" stroke="hsl(var(--accent))" strokeWidth="6" strokeLinecap="round" strokeDasharray={`${(cibil.score/900)*214} 214`} />
                  </svg>
                  <div className="absolute inset-0 grid place-items-center">
                    <div className="text-center">
                      <div className="font-headings font-bold text-xl leading-none">{cibil.score}</div>
                      <div className="text-[9px] text-muted-foreground uppercase">CIBIL</div>
                    </div>
                  </div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-widest text-muted-foreground font-bold">Credit Score</div>
                  <div className="font-headings font-semibold text-lg">{cibil.band}</div>
                  <div className="text-xs text-muted-foreground">Refresh {cibil.next_update}</div>
                </div>
              </div>
              <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-2">
                {cibil.factors.slice(0,3).map(f => (
                  <div key={f.label} className="bg-muted rounded-xl p-2.5">
                    <div className="text-[10px] uppercase text-muted-foreground font-bold tracking-widest">{f.label}</div>
                    <div className="font-headings font-semibold text-sm mt-1">{f.pct}%</div>
                    <div className="h-1 bg-card rounded mt-1.5"><div className="h-full bg-accent rounded" style={{width:`${f.pct}%`}}></div></div>
                  </div>
                ))}
              </div>
              <div className="w-full sm:w-32 h-12 sm:h-auto">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={cibil.history}>
                    <Line type="monotone" dataKey="score" stroke="hsl(var(--accent))" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>

        {/* Budget Health */}
        <div className="fp-card p-6 space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <div className="text-xs uppercase tracking-widest text-muted-foreground font-bold">AI Budget Health</div>
              <div className="font-headings font-semibold mt-1">This month</div>
            </div>
            <div className="px-2 py-1 rounded-full text-xs font-bold bg-accent/15 text-accent">On Track</div>
          </div>
          {budget && [
            { l: "Essentials", v: 68, color: "bg-secondary" },
            { l: "Lifestyle", v: 82, color: "bg-warning" },
            { l: "Savings Goal", v: 100, color: "bg-accent" },
            { l: "SIP", v: 100, color: "bg-chart-2" },
          ].map((r) => (
            <div key={r.l} className="space-y-1.5">
              <div className="flex justify-between text-sm"><span>{r.l}</span><span className="text-muted-foreground">{r.v}%</span></div>
              <div className="h-2 bg-muted rounded-full overflow-hidden"><div className={`h-full ${r.color} rounded-full`} style={{ width: `${Math.min(100, r.v)}%` }}></div></div>
            </div>
          ))}
        </div>
      </div>

      {/* Action Layer Feed */}
      <section className="space-y-3">
        <div className="flex items-end justify-between">
          <div>
            <div className="text-xs uppercase tracking-widest text-muted-foreground font-bold">Action Layer</div>
            <h2 className="font-headings font-bold text-2xl mt-1">Next best moves</h2>
          </div>
          <Button variant="ghost" size="sm" onClick={() => nav("/app/actions")} data-testid="home-action-center-link">All actions <ArrowRight className="w-4 h-4 ml-1" /></Button>
        </div>
        <div className="grid md:grid-cols-2 gap-3">
          {recs.slice(0, 4).map((r) => {
            const Icon = ICONS[r.icon] || Zap;
            return (
              <div key={r.id} className="fp-card p-5 flex gap-4 hover:-translate-y-0.5 transition-transform" data-testid={`action-card-${r.id}`}>
                <div className="w-11 h-11 rounded-xl bg-accent/15 text-accent grid place-items-center shrink-0"><Icon className="w-5 h-5" /></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded ${r.priority==="high"?"bg-warning/20 text-warning":"bg-muted text-muted-foreground"}`}>{r.priority}</span>
                    <span className="text-xs text-muted-foreground">{r.confidence}% confidence</span>
                  </div>
                  <div className="font-medium leading-snug">{r.title}</div>
                  <div className="text-sm text-accent mt-1">{r.impact}</div>
                  <div className="flex gap-2 mt-3">
                    <Button size="sm" className="rounded-lg bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => toast.success("Action queued. We'll execute on next sync.")} data-testid={`apply-${r.id}`}>Apply</Button>
                    <Button size="sm" variant="ghost" onClick={() => toast(r.title, { description: `Why: ${r.impact}` })}>Learn why</Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Recent transactions */}
      <section className="space-y-3">
        <div className="flex items-end justify-between">
          <h2 className="font-headings font-bold text-2xl">Recent transactions</h2>
          <Button variant="ghost" size="sm" onClick={() => nav("/app/transactions")} data-testid="home-tx-link">View all <ArrowRight className="w-4 h-4 ml-1" /></Button>
        </div>
        <div className="fp-card divide-y divide-border">
          {txns.slice(0, 8).map((t) => (
            <div key={t.id} className="p-4 flex items-center gap-3" data-testid={`tx-row-${t.id}`}>
              <div className="w-10 h-10 rounded-xl bg-muted grid place-items-center text-xs font-bold">{t.merchant?.[0]}</div>
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{t.merchant}</div>
                <div className="text-xs text-muted-foreground">{t.category} · {shortDate(t.date)}</div>
              </div>
              <div className={`font-headings font-semibold ${t.amount > 0 ? "text-accent" : ""}`}>{t.amount>0?"+":""}{inr(t.amount, {compact:false})}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
