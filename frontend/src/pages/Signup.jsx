import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const { signup } = useAuth();
  const nav = useNavigate();

  const submit = async (e) => {
    e.preventDefault(); setBusy(true);
    try { await signup(email, password, name); nav("/onboarding"); }
    catch (err) { toast.error(err?.response?.data?.detail || "Signup failed"); }
    setBusy(false);
  };

  const google = () => {
    const redirect = encodeURIComponent(window.location.origin + "/auth/callback");
    window.location.href = `https://auth.emergentagent.com/?redirect=${redirect}`;
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="hidden lg:flex flex-col justify-between p-12 bg-primary text-primary-foreground">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-accent text-accent-foreground grid place-items-center font-bold font-headings">F</div>
          <span className="font-headings font-bold text-lg">FinPilot</span>
        </Link>
        <div className="space-y-4 max-w-md">
          <div className="text-xs uppercase tracking-widest text-accent">Start in 60 seconds</div>
          <div className="font-headings font-bold text-4xl leading-tight">Get a personal CFO. In your pocket. For ₹0.</div>
        </div>
        <div className="text-xs text-primary-foreground/50">© 2026 FinPilot</div>
      </div>
      <div className="flex flex-col justify-center px-6 lg:px-16 py-12">
        <div className="max-w-sm w-full mx-auto space-y-7">
          <div>
            <h1 className="font-headings font-bold text-3xl">Create your account</h1>
            <p className="text-muted-foreground mt-1">We seed it with realistic demo data so you can explore right away.</p>
          </div>
          <Button variant="outline" className="w-full h-12 rounded-xl" onClick={google} data-testid="google-signup-btn">
            Continue with Google
          </Button>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-border"></div>
            <span className="text-xs uppercase text-muted-foreground tracking-widest">or</span>
            <div className="flex-1 h-px bg-border"></div>
          </div>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <Label>Full name</Label>
              <Input required value={name} onChange={(e) => setName(e.target.value)} className="h-12 rounded-xl" placeholder="Aarav Sharma" data-testid="signup-name-input" />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="h-12 rounded-xl" placeholder="you@email.com" data-testid="signup-email-input" />
            </div>
            <div className="space-y-2">
              <Label>Password</Label>
              <Input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="h-12 rounded-xl" placeholder="6+ characters" data-testid="signup-password-input" />
            </div>
            <Button type="submit" disabled={busy} className="w-full h-12 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90" data-testid="signup-submit-btn">
              {busy ? "Creating…" : "Create account"}
            </Button>
          </form>
          <div className="text-sm text-muted-foreground text-center">
            Already have an account? <Link to="/login" className="text-accent font-medium">Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
