import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider, useAuth } from "@/lib/auth";
import AppShell from "@/components/AppShell";
import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import AuthCallback from "@/pages/AuthCallback";
import Onboarding from "@/pages/Onboarding";
import Home from "@/pages/Home";
import Accounts from "@/pages/Accounts";
import Transactions from "@/pages/Transactions";
import Goals from "@/pages/Goals";
import NetWorth from "@/pages/NetWorth";
import SpendAnalysis from "@/pages/SpendAnalysis";
import AICoach from "@/pages/AICoach";
import ActionCenter from "@/pages/ActionCenter";
import Profile from "@/pages/Profile";
import Pricing from "@/pages/Pricing";
import "@/App.css";

function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (!user.onboarded) return <Navigate to="/onboarding" replace />;
  return <AppShell>{children}</AppShell>;
}

function OnboardingGate() {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.onboarded) return <Navigate to="/app" replace />;
  return <Onboarding />;
}

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/onboarding" element={<OnboardingGate />} />
            <Route path="/app" element={<Protected><Home /></Protected>} />
            <Route path="/app/accounts" element={<Protected><Accounts /></Protected>} />
            <Route path="/app/transactions" element={<Protected><Transactions /></Protected>} />
            <Route path="/app/goals" element={<Protected><Goals /></Protected>} />
            <Route path="/app/networth" element={<Protected><NetWorth /></Protected>} />
            <Route path="/app/spend" element={<Protected><SpendAnalysis /></Protected>} />
            <Route path="/app/coach" element={<Protected><AICoach /></Protected>} />
            <Route path="/app/actions" element={<Protected><ActionCenter /></Protected>} />
            <Route path="/app/profile" element={<Protected><Profile /></Protected>} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
          <Toaster richColors position="top-right" />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
