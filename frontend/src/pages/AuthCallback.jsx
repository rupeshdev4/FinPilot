import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

export default function AuthCallback() {
  const { googleSession } = useAuth();
  const nav = useNavigate();

  useEffect(() => {
    const hash = window.location.hash || "";
    const params = new URLSearchParams(hash.replace(/^#/, ""));
    const sid = params.get("session_id");
    if (!sid) { toast.error("Missing session"); nav("/login"); return; }
    (async () => {
      try { const u = await googleSession(sid); nav(u.onboarded ? "/app" : "/onboarding"); }
      catch (e) { toast.error("Google sign-in failed"); nav("/login"); }
    })();
    // eslint-disable-next-line
  }, []);

  return <div className="min-h-screen grid place-items-center text-muted-foreground">Signing you in…</div>;
}
