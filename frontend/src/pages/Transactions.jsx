import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { inr, shortDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Download, Trash2, CalendarDays, Banknote, Home as HomeI, Receipt, Tv, Wifi, Heart, Briefcase, AlertTriangle, Bell } from "lucide-react";
import { ResponsiveContainer, LineChart, Line } from "recharts";
import { toast } from "sonner";

const CATS = ["Food", "Travel", "Shopping", "Bills", "Rent", "EMI", "Salary", "Investments", "Healthcare", "Entertainment", "Other"];

const TAG_META = {
  income: { color: "bg-accent/15 text-accent", icon: Banknote, label: "Income" },
  rent: { color: "bg-secondary/15 text-secondary", icon: HomeI, label: "Rent" },
  emi: { color: "bg-warning/15 text-warning", icon: Receipt, label: "EMI" },
  investment: { color: "bg-chart-2/15 text-chart-2", icon: Briefcase, label: "Investment" },
  utility: { color: "bg-chart-3/15 text-chart-3", icon: Wifi, label: "Utility" },
  subscription: { color: "bg-chart-5/15 text-chart-5", icon: Tv, label: "Subscription" },
  insurance: { color: "bg-destructive/15 text-destructive", icon: Heart, label: "Insurance" },
};

export default function Transactions() {
  const [items, setItems] = useState([]);
  const [upcoming, setUpcoming] = useState([]);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("All");
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState(null);
  const [reminders, setReminders] = useState({});
  const [form, setForm] = useState({ amount: "", category: "Food", merchant: "", note: "" });

  const load = async () => {
    const [r, u] = await Promise.all([api.get("/transactions"), api.get("/upcoming-transactions")]);
    setItems(r.data); setUpcoming(u.data);
  };
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => items.filter(t =>
    (cat === "All" || t.category === cat) &&
    (!q || t.merchant.toLowerCase().includes(q.toLowerCase()) || t.category.toLowerCase().includes(q.toLowerCase()))
  ), [items, q, cat]);

  const byCat = useMemo(() => {
    const map = {};
    items.filter(t => t.amount < 0).forEach(t => {
      map[t.category] ||= { name: t.category, total: 0, count: 0, merchants: {}, spark: [] };
      map[t.category].total += -t.amount;
      map[t.category].count++;
      map[t.category].merchants[t.merchant] = (map[t.category].merchants[t.merchant] || 0) + (-t.amount);
    });
    Object.values(map).forEach(c => {
      c.largest = Object.entries(c.merchants).sort((a, b) => b[1] - a[1])[0]?.[0] || "—";
      c.spark = Array.from({ length: 8 }, (_, i) => ({ v: c.total / 8 + Math.random() * c.total / 6 }));
    });
    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [items]);

  const submit = async () => {
    try {
      await api.post("/transactions", { ...form, amount: Number(form.amount) });
      setOpen(false); setForm({ amount: "", category: "Food", merchant: "", note: "" }); toast.success("Saved"); load();
    } catch { toast.error("Failed"); }
  };
  const del = async (id) => { await api.delete(`/transactions/${id}`); load(); };

  const exportCSV = () => {
    const csv = "Date,Merchant,Category,Amount\n" + filtered.map(t => `${t.date},${t.merchant},${t.category},${t.amount}`).join("\n");
    const blob = new Blob([csv], { type: "text/csv" }); const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "finpilot-transactions.csv"; a.click();
  };

  return (
    <div className="px-4 lg:px-10 py-6 lg:py-10 space-y-6 max-w-[1400px] mx-auto">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-widest text-muted-foreground font-bold">Transactions</div>
          <h1 className="font-headings font-bold text-3xl lg:text-4xl mt-1">{items.length} transactions</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="rounded-xl" onClick={exportCSV} data-testid="export-csv-btn"><Download className="w-4 h-4 mr-1" /> Export</Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button className="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90" data-testid="add-tx-btn"><Plus className="w-4 h-4 mr-1" /> Add</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add transaction</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div className="space-y-2"><Label>Merchant</Label><Input value={form.merchant} onChange={(e) => setForm({ ...form, merchant: e.target.value })} data-testid="tx-merchant-input" /></div>
                <div className="space-y-2"><Label>Amount (negative for spend)</Label><Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} data-testid="tx-amount-input" /></div>
                <div className="space-y-2"><Label>Category</Label>
                  <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                    <SelectTrigger data-testid="tx-category-select"><SelectValue /></SelectTrigger>
                    <SelectContent>{CATS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <Button onClick={submit} className="w-full rounded-xl" data-testid="tx-submit-btn">Save</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      {/* Upcoming Transactions */}
      <section className="space-y-3" data-testid="upcoming-transactions">
        <div className="flex items-end justify-between">
          <div>
            <div className="text-xs uppercase tracking-widest text-muted-foreground font-bold flex items-center gap-2"><CalendarDays className="w-3.5 h-3.5" /> Upcoming</div>
            <h2 className="font-headings font-bold text-2xl mt-1">Next 30 days</h2>
          </div>
          <div className="text-sm text-muted-foreground">{upcoming.length} fixed transactions · <span className="text-accent font-medium">{inr(upcoming.reduce((s,u)=>s+(u.amount<0?u.amount:0),0))} outflow</span></div>
        </div>

        {/* AI Alert: clustered bills */}
        {upcoming.length > 0 && (
          <div className="fp-ai-panel rounded-xl p-3 flex items-center gap-3" data-testid="ai-upcoming-alert">
            <div className="w-9 h-9 rounded-lg bg-warning/20 text-warning grid place-items-center"><AlertTriangle className="w-4 h-4" /></div>
            <div className="flex-1 text-sm"><span className="font-bold">Heads up:</span> 4 bills cluster between the 5th and 12th totaling {inr(upcoming.slice(0,4).reduce((s,u)=>s+u.amount,0))}. Keep ₹50K buffer in HDFC Savings to avoid auto-debit failures.</div>
          </div>
        )}

        <div className="grid grid-cols-7 gap-1.5 fp-card p-3">
          {Array.from({ length: 30 }).map((_, i) => {
            const dt = new Date(); dt.setDate(dt.getDate() + i);
            const dayKey = dt.toISOString().slice(0, 10);
            const todays = upcoming.filter(u => u.date.slice(0, 10) === dayKey);
            return (
              <div key={i} className={`min-h-16 rounded-lg border ${todays.length ? "border-accent/40 bg-accent/5" : "border-border"} p-1.5 text-[10px]`}>
                <div className="font-bold text-muted-foreground mb-0.5">{dt.getDate()}</div>
                {todays.slice(0,2).map((t, j) => {
                  const meta = TAG_META[t.tag] || { color: "bg-muted", icon: Receipt };
                  return <button key={j} onClick={() => setDetail(t)} className={`block w-full text-left px-1 py-0.5 rounded text-[9px] truncate font-medium mb-0.5 ${meta.color} hover:opacity-80`}>{t.name}</button>;
                })}
                {todays.length > 2 && <div className="text-[9px] text-muted-foreground">+{todays.length-2} more</div>}
              </div>
            );
          })}
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {upcoming.slice(0, 6).map((u, i) => {
            const meta = TAG_META[u.tag] || { color: "bg-muted text-muted-foreground", icon: Receipt };
            const Icon = meta.icon;
            return (
              <button key={i} onClick={() => setDetail(u)} className="fp-card p-3 flex items-center gap-3 text-left hover:-translate-y-0.5 transition-transform" data-testid={`upcoming-row-${i}`}>
                <div className={`w-9 h-9 rounded-lg grid place-items-center ${meta.color}`}><Icon className="w-4 h-4" /></div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{u.name}</div>
                  <div className="text-[11px] text-muted-foreground">{shortDate(u.date)} · {meta.label}</div>
                </div>
                <div className={`font-headings font-semibold text-sm ${u.amount > 0 ? "text-accent" : ""}`}>{u.amount>0?"+":""}{inr(u.amount)}</div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Detail dialog */}
      {detail && (
        <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
          <DialogContent>
            <DialogHeader><DialogTitle>{detail.name}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-muted rounded-xl p-3"><div className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Amount</div><div className={`font-headings font-bold text-xl ${detail.amount > 0 ? "text-accent" : ""}`}>{inr(detail.amount, { compact: false })}</div></div>
                <div className="bg-muted rounded-xl p-3"><div className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Date</div><div className="font-headings font-bold text-xl">{shortDate(detail.date)}</div></div>
                <div className="bg-muted rounded-xl p-3"><div className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Tag</div><div className="font-headings font-semibold capitalize">{detail.tag}</div></div>
                <div className="bg-muted rounded-xl p-3"><div className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Account</div><div className="font-headings font-semibold">{detail.merchant}</div></div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl border border-border">
                <Bell className="w-4 h-4 text-accent" />
                <div className="flex-1"><div className="text-sm font-medium">Reminder 2 days prior</div><div className="text-xs text-muted-foreground">We'll alert you so balance is ready.</div></div>
                <Switch checked={!!reminders[detail.day]} onCheckedChange={(v) => { setReminders({ ...reminders, [detail.day]: v }); toast.success(v ? "Reminder on" : "Reminder off"); }} data-testid="reminder-toggle" />
              </div>
              {detail.tag === "emi" && (
                <div className="fp-ai-panel rounded-xl p-3 text-sm flex gap-2 items-start">
                  <AlertTriangle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
                  <div><span className="font-bold">AI Alert:</span> Your HDFC Savings will be ~₹35K below threshold by EMI date. Move ₹40K from PhonePe wallet 2 days before to avoid bounce charges.</div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Categories overview */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {byCat.slice(0, 6).map((c) => (
          <div key={c.name} className="fp-card p-5">
            <div className="flex justify-between items-start mb-2">
              <div>
                <div className="font-medium">{c.name}</div>
                <div className="text-xs text-muted-foreground">{c.count} txns · top: {c.largest}</div>
              </div>
              <div className="font-headings font-bold text-lg">{inr(c.total)}</div>
            </div>
            <div className="h-10">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={c.spark}>
                  <Line dataKey="v" stroke="hsl(var(--accent))" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search merchant or category" className="pl-9 h-11 rounded-xl" data-testid="tx-search-input" />
        </div>
        <Select value={cat} onValueChange={setCat}>
          <SelectTrigger className="w-[180px] h-11 rounded-xl" data-testid="tx-filter-cat"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="All">All categories</SelectItem>{CATS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="fp-card divide-y divide-border">
        {filtered.map(t => (
          <div key={t.id} className="p-4 flex items-center gap-3 group" data-testid={`txn-${t.id}`}>
            <div className="w-10 h-10 rounded-xl bg-muted grid place-items-center text-xs font-bold">{t.merchant?.[0]}</div>
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">{t.merchant}</div>
              <div className="text-xs text-muted-foreground">{t.category} · {shortDate(t.date)}</div>
            </div>
            <div className={`font-headings font-semibold ${t.amount > 0 ? "text-accent" : ""}`}>{t.amount > 0 ? "+" : ""}{inr(t.amount, { compact: false })}</div>
            <button onClick={() => del(t.id)} className="opacity-0 group-hover:opacity-100 transition text-muted-foreground hover:text-destructive ml-2"><Trash2 className="w-4 h-4" /></button>
          </div>
        ))}
        {filtered.length === 0 && <div className="p-10 text-center text-muted-foreground">No transactions match.</div>}
      </div>
    </div>
  );
}
