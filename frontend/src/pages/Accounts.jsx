import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { inr, pct } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Upload, RefreshCw, Building, Wallet as W, TrendingUp, CreditCard, Trash2 } from "lucide-react";
import { toast } from "sonner";

const TYPE_META = {
  bank: { label: "Banks", icon: Building },
  wallet: { label: "Wallets", icon: W },
  investment: { label: "Investments", icon: TrendingUp },
  loan: { label: "Loans", icon: CreditCard },
};

export default function Accounts() {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", type: "bank", institution: "", balance: 0 });

  const load = async () => { const r = await api.get("/accounts"); setItems(r.data); };
  useEffect(() => { load(); }, []);

  const submit = async () => {
    try { await api.post("/accounts", { ...form, balance: Number(form.balance) }); setOpen(false); setForm({ name: "", type: "bank", institution: "", balance: 0 }); toast.success("Account added"); load(); }
    catch { toast.error("Could not add account"); }
  };

  const del = async (id) => { await api.delete(`/accounts/${id}`); toast.success("Removed"); load(); };

  const sync = () => toast.success("Synced 11 accounts · 3s");

  const grouped = items.reduce((acc, a) => { (acc[a.type] ||= []).push(a); return acc; }, {});

  return (
    <div className="px-4 lg:px-10 py-6 lg:py-10 space-y-7 max-w-[1400px] mx-auto">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-widest text-muted-foreground font-bold">Accounts</div>
          <h1 className="font-headings font-bold text-3xl lg:text-4xl mt-1">{items.length} connected accounts</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="rounded-xl" onClick={sync} data-testid="sync-accounts-btn"><RefreshCw className="w-4 h-4 mr-1" /> Sync</Button>
          <Button variant="outline" className="rounded-xl" onClick={() => toast("CSV import (demo) — drop your statement here", { description: "Coming soon" })} data-testid="upload-csv-btn"><Upload className="w-4 h-4 mr-1" /> Upload CSV</Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90" data-testid="add-account-btn"><Plus className="w-4 h-4 mr-1" /> Add account</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add an account</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2"><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="HDFC Savings" data-testid="acc-name-input" /></div>
                <div className="space-y-2"><Label>Institution</Label><Input value={form.institution} onChange={(e) => setForm({ ...form, institution: e.target.value })} placeholder="HDFC Bank" data-testid="acc-institution-input" /></div>
                <div className="space-y-2"><Label>Type</Label>
                  <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                    <SelectTrigger data-testid="acc-type-select"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bank">Bank</SelectItem><SelectItem value="wallet">Wallet</SelectItem>
                      <SelectItem value="investment">Investment</SelectItem><SelectItem value="loan">Loan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>Balance (₹)</Label><Input type="number" value={form.balance} onChange={(e) => setForm({ ...form, balance: e.target.value })} data-testid="acc-balance-input" /></div>
                <Button onClick={submit} className="w-full rounded-xl" data-testid="acc-submit-btn">Add account</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      {Object.entries(TYPE_META).map(([type, meta]) => {
        const list = grouped[type] || [];
        if (!list.length) return null;
        const total = list.reduce((s, a) => s + a.balance, 0);
        const Icon = meta.icon;
        return (
          <section key={type}>
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-accent/15 text-accent grid place-items-center"><Icon className="w-4 h-4" /></div>
                <h2 className="font-headings font-bold text-xl">{meta.label}</h2>
              </div>
              <div className="font-headings font-semibold">{inr(total)}</div>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {list.map((a) => (
                <div key={a.id} className="fp-card p-5 group" data-testid={`account-card-${a.id}`}>
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="font-medium">{a.name}</div>
                      <div className="text-xs text-muted-foreground">{a.institution}</div>
                    </div>
                    <button onClick={() => del(a.id)} className="opacity-0 group-hover:opacity-100 transition text-muted-foreground hover:text-destructive" data-testid={`delete-acc-${a.id}`}><Trash2 className="w-4 h-4" /></button>
                  </div>
                  <div className={`font-headings font-bold text-2xl ${a.balance < 0 ? "text-destructive" : ""}`}>{inr(a.balance)}</div>
                  <div className="flex justify-between items-center text-xs text-muted-foreground mt-2">
                    <span className={a.change_pct >= 0 ? "text-accent" : "text-destructive"}>{pct(a.change_pct)}</span>
                    <span>Synced just now</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
