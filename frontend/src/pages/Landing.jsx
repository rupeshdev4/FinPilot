import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sparkles, TrendingUp, Zap, Wallet, Target, ArrowRight, Check } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="fp-glass sticky top-0 z-30 px-6 lg:px-12 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-accent text-accent-foreground grid place-items-center font-bold font-headings">F</div>
          <span className="font-headings font-bold text-lg">FinPilot</span>
        </div>
        <nav className="flex items-center gap-2">
          <Link to="/pricing"><Button variant="ghost" data-testid="landing-pricing-btn">Pricing</Button></Link>
          <Link to="/login"><Button variant="outline" className="rounded-xl" data-testid="landing-login-btn">Login</Button></Link>
          <Link to="/signup"><Button className="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90" data-testid="landing-signup-btn">Get Started</Button></Link>
        </nav>
      </header>

      <section className="px-6 lg:px-12 py-16 lg:py-28 max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 text-accent text-xs font-bold uppercase tracking-widest">
              <Sparkles className="w-3 h-3" /> AI-First Money OS · Built for India
            </div>
            <h1 className="font-headings font-bold text-4xl sm:text-5xl lg:text-6xl tracking-tight leading-[1.05]">
              Your money, finally on <span className="text-accent">autopilot.</span>
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed max-w-xl">
              FinPilot tracks every rupee, builds your budget, optimizes idle cash, and tells you the next best action — so your goals arrive earlier, not later.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/signup"><Button size="lg" className="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 h-12 px-7" data-testid="hero-cta-signup">
                Try free <ArrowRight className="ml-1 w-4 h-4" />
              </Button></Link>
              <Link to="/pricing"><Button size="lg" variant="outline" className="rounded-xl h-12 px-7" data-testid="hero-cta-pricing">See plans</Button></Link>
            </div>
            <div className="flex flex-wrap gap-5 pt-4 text-sm text-muted-foreground">
              {["No card required", "Bank-grade security", "Built for ₹"].map((f) => (
                <div key={f} className="flex items-center gap-1.5"><Check className="w-4 h-4 text-accent" />{f}</div>
              ))}
            </div>
          </div>
          <div className="relative">
            <div className="fp-card p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-xs uppercase tracking-widest text-muted-foreground">Net Worth</div>
                <span className="text-xs font-semibold text-accent">+₹2.4L this month</span>
              </div>
              <div className="font-headings text-4xl lg:text-5xl font-bold">₹18.45L</div>
              <div className="grid grid-cols-3 gap-3 pt-2">
                {[
                  { l: "Cash", v: "₹4.31L" }, { l: "Invested", v: "₹13.5L" }, { l: "Debt", v: "₹2.1L" },
                ].map((s) => (
                  <div key={s.l} className="bg-muted rounded-xl p-3">
                    <div className="text-[11px] uppercase text-muted-foreground tracking-wider">{s.l}</div>
                    <div className="font-headings font-semibold text-base mt-1">{s.v}</div>
                  </div>
                ))}
              </div>
              <div className="pt-2 space-y-2">
                {[
                  { i: Zap, t: "Move ₹1.4L idle cash → +₹9K/yr" },
                  { i: TrendingUp, t: "Increase SIP ₹5K → 14 mo earlier ₹1Cr" },
                  { i: Target, t: "Cut dining ₹3K → retire 8mo earlier" },
                ].map((r, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-border">
                    <div className="w-8 h-8 rounded-lg bg-accent/15 text-accent grid place-items-center"><r.i className="w-4 h-4" /></div>
                    <div className="text-sm font-medium flex-1">{r.t}</div>
                    <Button size="sm" variant="ghost" className="text-accent">Apply</Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 lg:px-12 py-16 max-w-7xl mx-auto">
        <h2 className="font-headings font-bold text-3xl lg:text-4xl mb-10 max-w-2xl">A whole financial team, in one app.</h2>
        <div className="grid md:grid-cols-3 gap-5">
          {[
            { i: Wallet, t: "All accounts in one view", d: "HDFC, ICICI, SBI, Paytm, PhonePe, Zerodha, EPF, PPF, NPS — finally together." },
            { i: Sparkles, t: "AI Budget Builder", d: "Detects your salary, EMIs, SIPs and rent — then crafts a budget you can actually keep." },
            { i: TrendingUp, t: "Idle cash optimizer", d: "Tells you exactly how much to park in liquid funds, FDs and arbitrage. Earn an extra ₹15–25K/year." },
            { i: Target, t: "Milestone net worth", d: "From ₹25L → ₹1Cr → Financial Freedom. We track the path and shorten it." },
            { i: Zap, t: "Action-first feed", d: "Not insights. Decisions. Apply with one tap." },
            { i: Sparkles, t: "AI Coach with full context", d: "Ask anything. Get answers based on your real numbers, not generic advice." },
          ].map((f) => (
            <div key={f.t} className="fp-card p-7 space-y-3 hover:-translate-y-1 transition-transform duration-300">
              <div className="w-10 h-10 rounded-xl bg-accent/15 text-accent grid place-items-center"><f.i className="w-5 h-5" /></div>
              <div className="font-headings font-semibold text-lg">{f.t}</div>
              <div className="text-sm text-muted-foreground leading-relaxed">{f.d}</div>
            </div>
          ))}
        </div>
      </section>

      <footer className="px-6 lg:px-12 py-10 border-t border-border text-sm text-muted-foreground">
        © 2026 FinPilot. Made in India.
      </footer>
    </div>
  );
}
