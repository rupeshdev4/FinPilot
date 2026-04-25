import { NavLink, useNavigate } from "react-router-dom";
import { Home, Wallet, Target, TrendingUp, BarChart3, Sparkles, User, Sun, Moon, LogOut, Zap } from "lucide-react";
import { useTheme } from "next-themes";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";

const NAV = [
  { to: "/app", label: "Home", icon: Home, end: true },
  { to: "/app/accounts", label: "Accounts", icon: Wallet },
  { to: "/app/transactions", label: "Transactions", icon: BarChart3 },
  { to: "/app/spend", label: "Spend", icon: BarChart3 },
  { to: "/app/goals", label: "Goals", icon: Target },
  { to: "/app/networth", label: "Net Worth", icon: TrendingUp },
  { to: "/app/coach", label: "AI Coach", icon: Sparkles },
  { to: "/app/actions", label: "Actions", icon: Zap },
  { to: "/app/profile", label: "Profile", icon: User },
];

const MOBILE_NAV = [
  { to: "/app", label: "Home", icon: Home, end: true },
  { to: "/app/spend", label: "Spend", icon: BarChart3 },
  { to: "/app/coach", label: "Coach", icon: Sparkles },
  { to: "/app/networth", label: "Wealth", icon: TrendingUp },
  { to: "/app/profile", label: "Profile", icon: User },
];

export default function AppShell({ children }) {
  const { theme, setTheme } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 flex-col border-r border-border bg-card sticky top-0 h-screen" data-testid="desktop-sidebar">
        <div className="px-6 py-6 flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-accent text-accent-foreground grid place-items-center font-bold font-headings">F</div>
          <div>
            <div className="font-headings font-bold text-lg leading-none">FinPilot</div>
            <div className="text-xs text-muted-foreground">India's Money OS</div>
          </div>
        </div>
        <nav className="flex-1 px-3 space-y-1">
          {NAV.map((it) => (
            <NavLink
              key={it.to}
              to={it.to}
              end={it.end}
              data-testid={`nav-${it.label.toLowerCase().replace(/\s/g, "-")}`}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive ? "bg-accent/15 text-accent-foreground dark:text-accent" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`
              }
            >
              <it.icon className="w-4 h-4" strokeWidth={2} />
              {it.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-border space-y-2">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="w-8 h-8 rounded-full bg-secondary text-secondary-foreground grid place-items-center text-xs font-bold">
              {user?.name?.[0]?.toUpperCase() || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{user?.name}</div>
              <div className="text-xs text-muted-foreground truncate">{user?.email}</div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex-1 rounded-xl" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} data-testid="theme-toggle">
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
            <Button variant="outline" size="sm" className="flex-1 rounded-xl" onClick={() => { logout(); navigate("/login"); }} data-testid="logout-btn">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0 pb-24 lg:pb-0">
        {/* Mobile top bar */}
        <div className="lg:hidden fp-glass sticky top-0 z-30 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-accent text-accent-foreground grid place-items-center font-bold font-headings text-sm">F</div>
            <span className="font-headings font-bold">FinPilot</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} data-testid="mobile-theme-toggle">
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </Button>
        </div>
        {children}
      </main>

      {/* Mobile bottom nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 fp-glass border-t border-border" data-testid="mobile-bottom-nav">
        <div className="grid grid-cols-5 h-16">
          {MOBILE_NAV.map((it) => (
            <NavLink
              key={it.to}
              to={it.to}
              end={it.end}
              data-testid={`mnav-${it.label.toLowerCase()}`}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-1 text-[11px] ${isActive ? "text-accent" : "text-muted-foreground"}`
              }
            >
              <it.icon className="w-5 h-5" strokeWidth={2} />
              {it.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
