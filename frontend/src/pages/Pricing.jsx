import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

const PLANS = [
  { name: "Free", price: "₹0", tag: "Try before you buy", features: ["Dashboard", "Manual tracking", "Basic budget", "1 account type"], cta: "Start free", to: "/signup", highlight: false },
  { name: "Plus", price: "₹199", tag: "Per month", features: ["Everything in Free", "AI Budget Builder", "Goals", "Reports", "Spend analysis"], cta: "Choose Plus", to: "/signup", highlight: false },
  { name: "Pro", price: "₹499", tag: "Per month · Most loved", features: ["Everything in Plus", "Unlimited AI Coach", "Net worth milestones", "Idle Cash Optimizer", "Premium actions", "Advanced planning"], cta: "Choose Pro", to: "/signup", highlight: true },
  { name: "Family", price: "₹799", tag: "Per month · 4 members", features: ["Everything in Pro", "Shared dashboard", "Couple planning", "Family goals", "Per-member budgets"], cta: "Choose Family", to: "/signup", highlight: false },
];

export default function Pricing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="px-6 lg:px-12 py-5 flex items-center justify-between border-b border-border">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-accent text-accent-foreground grid place-items-center font-bold font-headings">F</div>
          <span className="font-headings font-bold">FinPilot</span>
        </Link>
        <div className="flex gap-2"><Link to="/login"><Button variant="ghost">Login</Button></Link><Link to="/signup"><Button className="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90">Sign up</Button></Link></div>
      </header>
      <section className="px-6 lg:px-12 py-16 lg:py-24 max-w-6xl mx-auto space-y-10">
        <div className="text-center max-w-2xl mx-auto space-y-4">
          <div className="text-xs uppercase tracking-widest text-accent font-bold">Pricing</div>
          <h1 className="font-headings font-bold text-4xl lg:text-5xl">Pick your plan. Cancel anytime.</h1>
          <p className="text-muted-foreground">Simple monthly pricing. ₹ INR. GST included. No hidden fees.</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {PLANS.map(p => (
            <div key={p.name} className={`fp-card p-6 space-y-5 ${p.highlight ? "border-2 border-accent ring-2 ring-accent/20" : ""}`} data-testid={`plan-${p.name.toLowerCase()}`}>
              {p.highlight && <div className="text-[10px] uppercase tracking-widest font-bold text-accent">Most popular</div>}
              <div>
                <div className="font-headings font-semibold text-xl">{p.name}</div>
                <div className="text-xs text-muted-foreground">{p.tag}</div>
              </div>
              <div className="font-headings font-bold text-4xl">{p.price}</div>
              <ul className="space-y-2 text-sm">
                {p.features.map(f => <li key={f} className="flex gap-2 items-start"><Check className="w-4 h-4 text-accent shrink-0 mt-0.5" />{f}</li>)}
              </ul>
              <Link to={p.to}><Button className={`w-full rounded-xl ${p.highlight ? "bg-accent text-accent-foreground hover:bg-accent/90" : "bg-primary text-primary-foreground hover:bg-primary/90"}`} data-testid={`plan-${p.name.toLowerCase()}-cta`}>{p.cta}</Button></Link>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
