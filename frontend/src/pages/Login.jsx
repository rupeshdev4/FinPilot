import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const { login } = useAuth();
  const nav = useNavigate();

  const submit = async (e) => {
    e.preventDefault(); setBusy(true);
    try { const u = await login(email, password); nav(u.onboarded ? "/app" : "/onboarding"); }
    catch (err) { toast.error(err?.response?.data?.detail || "Login failed"); }
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
          <div className="text-xs uppercase tracking-widest text-accent">India's Money OS</div>
          <div className="font-headings font-bold text-4xl leading-tight">Your finances, finally clear, calm, and on autopilot.</div>
          <div className="text-primary-foreground/70">Track ₹ across banks, wallets, and investments. Get AI actions that move the needle.</div>
        </div>
        <div className="text-xs text-primary-foreground/50">© 2026 FinPilot</div>
      </div>
      <div className="flex flex-col justify-center px-6 lg:px-16 py-12">
        <div className="max-w-sm w-full mx-auto space-y-7">
          <div>
            <h1 className="font-headings font-bold text-3xl">Welcome back</h1>
            <p className="text-muted-foreground mt-1">Login to your FinPilot</p>
          </div>
          <Button variant="outline" className="w-full h-12 rounded-xl" onClick={google} data-testid="google-login-btn">
            <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24"><path fill="#EA4335" d="M5.3 9.7L2.2 7.4a12 12 0 0 1 19.7 0l-3 2.4A7.4 7.4 0 0 0 5.3 9.7Z"/><path fill="#4285F4" d="M21.7 12.4c0-.7-.1-1.4-.2-2H12v3.9h5.5a4.7 4.7 0 0 1-2 3.1l3 2.3a9.6 9.6 0 0 0 3.2-7.3Z"/><path fill="#FBBC05" d="M5.3 14.3a7.3 7.3 0 0 1 0-4.6L2.2 7.4a12 12 0 0 0 0 9.2l3.1-2.3Z"/><path fill="#34A853" d="M12 22a11.4 11.4 0 0 0 7.5-2.6l-3-2.3a7 7 0 0 1-11.2-3.7l-3 2.3A12 12 0 0 0 12 22Z"/></svg>
            Continue with Google
          </Button>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-border"></div>
            <span className="text-xs uppercase text-muted-foreground tracking-widest">or</span>
            <div className="flex-1 h-px bg-border"></div>
          </div>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="h-12 rounded-xl" placeholder="you@email.com" data-testid="login-email-input" />
            </div>
            <div className="space-y-2">
              <Label>Password</Label>
              <Input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="h-12 rounded-xl" placeholder="••••••••" data-testid="login-password-input" />
            </div>
            <Button type="submit" disabled={busy} className="w-full h-12 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90" data-testid="login-submit-btn">
              {busy ? "Signing in…" : "Sign in"}
            </Button>
          </form>
          <div className="text-sm text-muted-foreground text-center">
            New here? <Link to="/signup" className="text-accent font-medium" data-testid="login-to-signup-link">Create an account</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
