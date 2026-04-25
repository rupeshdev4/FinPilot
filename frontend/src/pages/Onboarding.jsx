import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Home, TrendingUp, Wallet, Sunset, CreditCard, Users, Building, ArrowRight, Check } from "lucide-react";
import { inr } from "@/lib/format";
import { toast } from "sonner";

const GOALS = [
  { id: "wealth", label: "Build Wealth", icon: TrendingUp },
  { id: "house", label: "Buy House", icon: Home },
  { id: "save", label: "Save More", icon: Wallet },
  { id: "retire", label: "Retire Early", icon: Sunset },
  { id: "debt", label: "Reduce Debt", icon: CreditCard },
  { id: "family", label: "Family Planning", icon: Users },
];

const BANKS_TO_CONNECT = [
  { id: "hdfc", name: "HDFC Bank", t: "bank" },
  { id: "icici", name: "ICICI Bank", t: "bank" },
  { id: "sbi", name: "SBI", t: "bank" },
  { id: "phonepe", name: "PhonePe", t: "wallet" },
  { id: "zerodha", name: "Zerodha", t: "investment" },
  { id: "groww", name: "Groww", t: "investment" },
];

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const [picked, setPicked] = useState([]);
  const [connected, setConnected] = useState({});
  const [income, setIncome] = useState(120000);
  const [budget, setBudget] = useState({ essentials: 55000, lifestyle: 20000, savings: 20000, sip: 25000 });
  const [busy, setBusy] = useState(false);
  const { refresh } = useAuth();
  const nav = useNavigate();

  const togglePick = (id) => setPicked((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);
  const toggleConnect = (id) => setConnected((c) => ({ ...c, [id]: !c[id] }));

  const finish = async () => {
    setBusy(true);
    try {
      await api.post("/onboarding/complete", { goals: picked, monthly_income: income });
      await api.put("/budget", { income, ...budget });
      await refresh();
      toast.success("All set! Welcome to FinPilot");
      nav("/app");
    } catch (e) {
      toast.error("Could not finish onboarding");
    }
    setBusy(false);
  };

  const stepTitle = ["Your goals", "Connect accounts", "Detected profile", "Your AI budget"][step];
  const total = budget.essentials + budget.lifestyle + budget.savings + budget.sip;

  return (
    <div className="min-h-screen bg-background">
      <header className="px-6 lg:px-12 py-5 flex items-center justify-between border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-accent text-accent-foreground grid place-items-center font-bold font-headings">F</div>
          <span className="font-headings font-bold">FinPilot</span>
        </div>
        <div className="text-xs uppercase tracking-widest text-muted-foreground">Step {step + 1} / 4</div>
      </header>
      <div className="h-1 bg-muted">
        <div className="h-full bg-accent transition-all" style={{ width: `${(step + 1) * 25}%` }}></div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-10 lg:py-16 space-y-8">
        <div>
          <div className="text-xs uppercase tracking-widest text-accent mb-2">{`Step ${step + 1}`}</div>
          <h1 className="font-headings font-bold text-3xl lg:text-4xl">{stepTitle}</h1>
        </div>

        {step === 0 && (
          <div className="space-y-6">
            <p className="text-muted-foreground">Pick everything that matters to you. We'll build your plan around these.</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {GOALS.map((g) => {
                const active = picked.includes(g.id);
                return (
                  <button key={g.id} onClick={() => togglePick(g.id)} data-testid={`goal-pick-${g.id}`}
                    className={`fp-card p-5 text-left transition-all hover:-translate-y-0.5 ${active ? "border-accent ring-2 ring-accent/40" : ""}`}>
                    <div className={`w-10 h-10 rounded-xl grid place-items-center mb-3 ${active ? "bg-accent text-accent-foreground" : "bg-muted text-foreground"}`}>
                      <g.icon className="w-5 h-5" />
                    </div>
                    <div className="font-medium">{g.label}</div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-6">
            <p className="text-muted-foreground">Connect your bank, wallets, and investments. Demo accounts are pre-loaded — tap to "connect" or skip.</p>
            <div className="space-y-3">
              {BANKS_TO_CONNECT.map((b) => (
                <div key={b.id} className="fp-card p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-muted grid place-items-center font-headings font-bold text-sm">{b.name[0]}</div>
                    <div>
                      <div className="font-medium">{b.name}</div>
                      <div className="text-xs text-muted-foreground capitalize">{b.t}</div>
                    </div>
                  </div>
                  <Button variant={connected[b.id] ? "outline" : "default"} onClick={() => toggleConnect(b.id)} className="rounded-xl" data-testid={`connect-${b.id}-btn`}>
                    {connected[b.id] ? <><Check className="w-4 h-4 mr-1" /> Connected</> : "Connect"}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <p className="text-muted-foreground">From your transactions, we detected:</p>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { l: "Monthly Salary credit", v: "₹1,20,000", c: "Auto-detected" },
                { l: "Home Loan EMI", v: "₹18,500", c: "Recurring debit · HDFC" },
                { l: "Rent", v: "₹32,000", c: "Detected on 3rd of month" },
                { l: "SIPs", v: "₹25,000", c: "Zerodha + Groww" },
                { l: "UPI spend / month", v: "₹38,000", c: "Across food, travel, shopping" },
                { l: "Idle cash in banks", v: "₹2,40,000", c: "Earning <3.5%" },
              ].map((p, i) => (
                <div key={i} className="fp-card p-5 flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs uppercase tracking-widest text-muted-foreground">{p.l}</div>
                    <div className="font-headings font-bold text-2xl mt-1">{p.v}</div>
                    <div className="text-xs text-muted-foreground mt-1">{p.c}</div>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-accent/15 text-accent grid place-items-center"><Check className="w-4 h-4" /></div>
                </div>
              ))}
            </div>
            <div className="space-y-2 pt-2">
              <Label>Confirm monthly take-home</Label>
              <Input type="number" value={income} onChange={(e) => setIncome(Number(e.target.value || 0))} className="h-12 rounded-xl" data-testid="onboarding-income-input" />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <p className="text-muted-foreground">A budget that matches your behaviour, goals, and obligations. Drag the sliders to customize.</p>
            <div className="fp-card p-6 space-y-2">
              <div className="text-xs uppercase tracking-widest text-muted-foreground">Monthly Income</div>
              <div className="font-headings font-bold text-3xl">{inr(income, { compact: false })}</div>
            </div>

            {[
              { k: "essentials", l: "Essentials (Rent, Bills, EMI)", color: "bg-secondary", note: "Healthy at ~46%" },
              { k: "lifestyle", l: "Lifestyle (Food, Shopping, Travel)", color: "bg-warning", note: "Dining trending high vs peers" },
              { k: "savings", l: "Savings Buffer", color: "bg-accent", note: "Could increase by ₹5K" },
              { k: "sip", l: "SIP / Investments", color: "bg-chart-2", note: "Strong allocation 👍" },
            ].map((row) => (
              <div key={row.k} className="fp-card p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{row.l}</div>
                    <div className="text-xs text-muted-foreground">{row.note}</div>
                  </div>
                  <div className="font-headings font-semibold">{inr(budget[row.k], { compact: false })}</div>
                </div>
                <Slider min={0} max={income} step={500} value={[budget[row.k]]} onValueChange={(v) => setBudget((b) => ({ ...b, [row.k]: v[0] }))} data-testid={`budget-${row.k}-slider`} />
              </div>
            ))}

            <div className={`p-4 rounded-xl text-sm ${total > income ? "bg-destructive/10 text-destructive" : "bg-accent/10 text-accent-foreground dark:text-accent"}`}>
              {total > income
                ? `Over by ${inr(total - income)} — adjust sliders.`
                : `Allocated ${inr(total)} of ${inr(income)} · ${inr(income - total)} unallocated.`}
            </div>
          </div>
        )}

        <div className="flex justify-between pt-4">
          <Button variant="outline" disabled={step === 0} onClick={() => setStep((s) => s - 1)} className="rounded-xl" data-testid="onboarding-back-btn">Back</Button>
          {step < 3 ? (
            <Button onClick={() => setStep((s) => s + 1)} disabled={step === 0 && picked.length === 0} className="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90" data-testid="onboarding-next-btn">
              Next <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={finish} disabled={busy || total > income} className="rounded-xl bg-accent text-accent-foreground hover:bg-accent/90" data-testid="onboarding-finish-btn">
              {busy ? "Launching…" : "Accept & Launch"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
