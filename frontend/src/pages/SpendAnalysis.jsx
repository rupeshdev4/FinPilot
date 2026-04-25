import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { inr } from "@/lib/format";
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { Sparkles, TrendingDown, TrendingUp } from "lucide-react";

const COLORS = ["#00D084", "#4F46E5", "#38BDF8", "#818CF8", "#F472B6", "#F59E0B", "#EF4444", "#94A3B8", "#10B981", "#A855F7"];

function heatLevel(amt, max) {
  if (!amt) return 0;
  const pct = amt / Math.max(1, max);
  if (pct < 0.2) return 1;
  if (pct < 0.45) return 2;
  if (pct < 0.7) return 3;
  return 4;
}

export default function SpendAnalysis() {
  const [d, setD] = useState(null);
  useEffect(() => { (async () => { const r = await api.get("/spend-analysis"); setD(r.data); })(); }, []);
  if (!d) return <div className="p-8 text-muted-foreground">Loading…</div>;

  const variance = d.total_spend - d.last_month_spend;
  const variancePct = d.last_month_spend ? Math.round((variance / d.last_month_spend) * 100) : 0;
  const maxHeat = Math.max(1, ...d.heatmap.map(h => h.spend));

  // Daily heatmap grid (last 30 days)
  const today = new Date();
  const heatMap = {}; d.heatmap.forEach(h => heatMap[h.date] = h.spend);
  const days = Array.from({ length: 30 }, (_, i) => {
    const dt = new Date(today); dt.setDate(today.getDate() - (29 - i));
    const key = dt.toISOString().slice(0, 10);
    return { d: dt, key, spend: heatMap[key] || 0 };
  });

  return (
    <div className="px-4 lg:px-10 py-6 lg:py-10 space-y-6 max-w-[1400px] mx-auto">
      <header>
        <div className="text-xs uppercase tracking-widest text-muted-foreground font-bold">Spend Analysis</div>
        <h1 className="font-headings font-bold text-3xl lg:text-4xl mt-1">{d.month}</h1>
      </header>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="fp-card p-5"><div className="text-[11px] uppercase tracking-widest text-muted-foreground font-bold">Total Spend</div><div className="font-headings font-bold text-2xl mt-1">{inr(d.total_spend)}</div></div>
        <div className="fp-card p-5"><div className="text-[11px] uppercase tracking-widest text-muted-foreground font-bold">Savings Rate</div><div className="font-headings font-bold text-2xl mt-1 text-accent">{d.savings_rate}%</div></div>
        <div className="fp-card p-5"><div className="text-[11px] uppercase tracking-widest text-muted-foreground font-bold">Essentials</div><div className="font-headings font-bold text-2xl mt-1">{d.essential_pct}%</div></div>
        <div className="fp-card p-5"><div className="text-[11px] uppercase tracking-widest text-muted-foreground font-bold">Lifestyle</div><div className="font-headings font-bold text-2xl mt-1">{d.lifestyle_pct}%</div></div>
        <div className="fp-card p-5"><div className="text-[11px] uppercase tracking-widest text-muted-foreground font-bold">vs Last Month</div><div className={`font-headings font-bold text-2xl mt-1 flex items-center gap-1 ${variance>0?"text-destructive":"text-accent"}`}>{variance>0?<TrendingUp className="w-5 h-5"/>:<TrendingDown className="w-5 h-5"/>}{variancePct}%</div></div>
        <div className="fp-card p-5"><div className="text-[11px] uppercase tracking-widest text-muted-foreground font-bold">Cash Left</div><div className="font-headings font-bold text-2xl mt-1">{inr(Math.max(0, d.income - d.total_spend))}</div></div>
      </div>

      {/* Trend + Donut */}
      <div className="grid lg:grid-cols-3 gap-5">
        <div className="fp-card p-6 lg:col-span-2">
          <div className="text-xs uppercase tracking-widest text-muted-foreground font-bold mb-1">12-month spend trend</div>
          <h2 className="font-headings font-semibold text-xl mb-4">Where it's going</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={d.trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickFormatter={(v) => inr(v)} width={60} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12 }} formatter={(v) => inr(v)} />
                <Line type="monotone" dataKey="spend" stroke="hsl(var(--accent))" strokeWidth={3} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="fp-card p-6">
          <div className="text-xs uppercase tracking-widest text-muted-foreground font-bold mb-1">Categories</div>
          <h2 className="font-headings font-semibold text-xl mb-2">Breakdown</h2>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={d.category_breakdown} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2}>
                  {d.category_breakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => inr(v)} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-1.5 mt-2">
            {d.category_breakdown.slice(0, 5).map((c, i) => (
              <div key={c.name} className="flex justify-between items-center text-sm">
                <div className="flex gap-2 items-center"><span className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }}></span>{c.name}</div>
                <span className="font-headings font-medium">{inr(c.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Weekly + Heatmap */}
      <div className="grid lg:grid-cols-2 gap-5">
        <div className="fp-card p-6">
          <div className="text-xs uppercase tracking-widest text-muted-foreground font-bold mb-1">Weekly pattern</div>
          <h2 className="font-headings font-semibold text-xl mb-4">When you spend</h2>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={d.weekly}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="week" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickFormatter={(v) => inr(v)} width={60} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12 }} formatter={(v) => inr(v)} />
                <Bar dataKey="spend" fill="hsl(var(--accent))" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="fp-card p-6">
          <div className="text-xs uppercase tracking-widest text-muted-foreground font-bold mb-1">Daily heatmap (30d)</div>
          <h2 className="font-headings font-semibold text-xl mb-4">High-spend days</h2>
          <div className="grid grid-cols-7 gap-1.5">
            {days.map((dy) => (
              <div key={dy.key} className={`aspect-square rounded-md heat-${heatLevel(dy.spend, maxHeat)} flex items-center justify-center text-[10px] font-medium`} title={`${dy.key}: ${inr(dy.spend)}`}>
                {dy.d.getDate()}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
            <span>Less</span>
            {[0,1,2,3,4].map(l => <div key={l} className={`w-4 h-4 rounded-sm heat-${l}`}></div>)}
            <span>More</span>
          </div>
        </div>
      </div>

      {/* Top merchants + AI panel */}
      <div className="grid lg:grid-cols-3 gap-5">
        <div className="fp-card p-6 lg:col-span-2">
          <div className="text-xs uppercase tracking-widest text-muted-foreground font-bold mb-1">Top merchants</div>
          <h2 className="font-headings font-semibold text-xl mb-3">Where it goes</h2>
          <div className="divide-y divide-border">
            {d.top_merchants.map((m, i) => (
              <div key={m.merchant} className="py-3 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-muted grid place-items-center text-xs font-bold">{i + 1}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{m.merchant}</div>
                  <div className="text-xs text-muted-foreground">{m.category} · {m.count} txns</div>
                </div>
                <div className="font-headings font-semibold">{inr(m.amount)}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="fp-card p-6 fp-ai-panel space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-accent" />
            <div className="text-xs uppercase tracking-widest text-muted-foreground font-bold">AI Analysis</div>
          </div>
          <h2 className="font-headings font-semibold text-xl">This month at a glance</h2>
          <ul className="space-y-2.5 text-sm">
            <li>• Shopping is up <strong className="text-destructive">+34%</strong> vs last month — mostly weekend impulses.</li>
            <li>• Dining out causing budget slippage on Fri-Sat.</li>
            <li>• Bills stable at {inr(d.category_breakdown.find(c=>c.name==="Bills")?.value || 0)}.</li>
            <li>• Rent at {d.essential_pct}% of income — healthy.</li>
            <li>• You can save <strong className="text-accent">~₹6K</strong> by trimming low-value spend.</li>
          </ul>
          <div className="pt-3 border-t border-border space-y-2">
            {[
              "Cut dining ₹3K → add to SIP",
              "Cancel unused subscriptions ₹499",
              "Move saved ₹6K to emergency fund",
            ].map((a, i) => (
              <div key={i} className="text-sm p-3 rounded-xl bg-card border border-border flex justify-between items-center"><span>{a}</span><span className="text-accent text-xs font-bold">Apply</span></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
