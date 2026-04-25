import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, Send, User } from "lucide-react";

const SUGGESTIONS = [
  "How do I hit ₹1Cr faster?",
  "Can I afford a car worth ₹12L?",
  "Where should I park ₹2L idle cash?",
  "Why did my spending rise this month?",
  "Should I invest my bonus or repay loan?",
];

export default function AICoach() {
  const [msgs, setMsgs] = useState([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [model, setModel] = useState("claude");
  const endRef = useRef(null);

  useEffect(() => {
    (async () => {
      const r = await api.get("/ai/history?session_id=default");
      setMsgs(r.data.flatMap(m => [
        { role: "user", text: m.user_msg },
        { role: "assistant", text: m.assistant_msg },
      ]));
    })();
  }, []);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);

  const send = async (text) => {
    const message = text || input.trim(); if (!message) return;
    setMsgs(m => [...m, { role: "user", text: message }, { role: "assistant", text: "…", loading: true }]);
    setInput(""); setBusy(true);
    try {
      const r = await api.post("/ai/chat", { message, session_id: "default", model });
      setMsgs(m => [...m.slice(0, -1), { role: "assistant", text: r.data.reply }]);
    } catch {
      setMsgs(m => [...m.slice(0, -1), { role: "assistant", text: "AI offline. Try again in a sec." }]);
    }
    setBusy(false);
  };

  return (
    <div className="px-4 lg:px-10 py-6 lg:py-10 max-w-3xl mx-auto h-[calc(100vh-7rem)] lg:h-[calc(100vh-2rem)] flex flex-col">
      <header className="flex justify-between items-end mb-4">
        <div>
          <div className="text-xs uppercase tracking-widest text-muted-foreground font-bold">AI Coach</div>
          <h1 className="font-headings font-bold text-2xl lg:text-3xl mt-1">Your personal CFO</h1>
        </div>
        <Select value={model} onValueChange={setModel}>
          <SelectTrigger className="w-[160px] rounded-xl" data-testid="ai-model-select"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="claude">Claude Sonnet 4.5</SelectItem>
            <SelectItem value="gpt">GPT-5.2</SelectItem>
          </SelectContent>
        </Select>
      </header>

      <div className="fp-card flex-1 overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto p-5 space-y-4" data-testid="chat-history">
          {msgs.length === 0 && (
            <div className="text-center py-10 space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-accent/15 text-accent grid place-items-center mx-auto"><Sparkles className="w-6 h-6" /></div>
              <div className="font-headings font-semibold text-lg">Ask me anything about your money.</div>
              <div className="text-sm text-muted-foreground max-w-md mx-auto">I see your accounts, transactions, goals & budget — so I give you specific, actionable answers, not generic advice.</div>
            </div>
          )}
          {msgs.map((m, i) => (
            <div key={i} className={`flex gap-3 ${m.role === "user" ? "justify-end" : ""}`}>
              {m.role !== "user" && <div className="w-8 h-8 rounded-xl bg-accent/15 text-accent grid place-items-center shrink-0"><Sparkles className="w-4 h-4" /></div>}
              <div className={`max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                {m.loading ? <span className="inline-flex gap-1"><span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce"></span><span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce delay-100"></span><span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce delay-200"></span></span> : m.text}
              </div>
              {m.role === "user" && <div className="w-8 h-8 rounded-xl bg-secondary text-secondary-foreground grid place-items-center shrink-0"><User className="w-4 h-4" /></div>}
            </div>
          ))}
          <div ref={endRef}></div>
        </div>

        {msgs.length === 0 && (
          <div className="px-5 pb-3 flex flex-wrap gap-2">
            {SUGGESTIONS.map(s => <button key={s} onClick={() => send(s)} className="text-xs px-3 py-1.5 rounded-full bg-muted hover:bg-accent/15 hover:text-accent transition" data-testid={`suggest-${s.slice(0,10)}`}>{s}</button>)}
          </div>
        )}

        <div className="border-t border-border p-3 flex gap-2">
          <Input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && !busy && send()} placeholder="Ask about your money…" className="h-12 rounded-xl" data-testid="chat-input" />
          <Button onClick={() => send()} disabled={busy} className="h-12 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90" data-testid="chat-send-btn"><Send className="w-4 h-4" /></Button>
        </div>
      </div>
    </div>
  );
}
