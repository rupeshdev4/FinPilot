import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Banknote, TrendingUp, CreditCard, Target, Zap, Scissors, Utensils, Home } from "lucide-react";
import { toast } from "sonner";

const ICONS = { Banknote, TrendingUp, Home, Scissors, Utensils, Zap };
const SECTIONS = ["Save More", "Invest Better", "Reduce Debt", "Reach Goals Faster", "Optimize Cash", "Fix Budget Leaks"];

export default function ActionCenter() {
  const [recs, setRecs] = useState([]);
  useEffect(() => { (async () => { const r = await api.get("/recommendations"); setRecs(r.data); })(); }, []);

  return (
    <div className="px-4 lg:px-10 py-6 lg:py-10 space-y-6 max-w-[1400px] mx-auto">
      <header>
        <div className="text-xs uppercase tracking-widest text-muted-foreground font-bold">Action Center</div>
        <h1 className="font-headings font-bold text-3xl lg:text-4xl mt-1">Your next-best moves</h1>
        <p className="text-muted-foreground mt-2">Decisions, ranked by impact. Apply what you like in one tap.</p>
      </header>

      <Tabs defaultValue="all">
        <TabsList className="rounded-xl flex-wrap h-auto">
          <TabsTrigger value="all" data-testid="action-tab-all">All</TabsTrigger>
          {SECTIONS.map(s => <TabsTrigger key={s} value={s} data-testid={`action-tab-${s.replace(/\s/g,"-")}`}>{s}</TabsTrigger>)}
        </TabsList>
        <TabsContent value="all" className="mt-5"><Grid items={recs} /></TabsContent>
        {SECTIONS.map(s => <TabsContent key={s} value={s} className="mt-5"><Grid items={recs.filter(r => r.category === s)} /></TabsContent>)}
      </Tabs>
    </div>
  );
}

function Grid({ items }) {
  if (!items.length) return <div className="fp-card p-10 text-center text-muted-foreground">Nothing here yet — keep going!</div>;
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map(r => {
        const Icon = ICONS[r.icon] || Zap;
        return (
          <div key={r.id} className="fp-card p-5 space-y-3 hover:-translate-y-0.5 transition-transform" data-testid={`ac-card-${r.id}`}>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-accent/15 text-accent grid place-items-center"><Icon className="w-5 h-5" /></div>
              <div className="flex-1">
                <div className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">{r.category}</div>
                <div className="text-xs">{r.confidence}% confidence · {r.priority} priority</div>
              </div>
            </div>
            <div className="font-medium leading-snug">{r.title}</div>
            <div className="text-sm text-accent">{r.impact}</div>
            <div className="flex gap-2">
              <Button size="sm" className="rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 flex-1" onClick={() => toast.success("Action applied")} data-testid={`ac-apply-${r.id}`}>Apply</Button>
              <Button size="sm" variant="ghost" onClick={() => toast(r.title, { description: r.impact })}>Why</Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
