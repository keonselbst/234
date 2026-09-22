import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { PageHeader, Panel } from "@/components/UI";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bot, Send, Loader2, Sparkles } from "lucide-react";

const suggestions = [
  { ru: "Сформулируй коммерческое предложение для промышленного вентилятора", en: "Draft a commercial proposal for an industrial fan" },
  { ru: "Как оптимизировать закупку металла у 3-х поставщиков?", en: "How to optimize metal procurement from 3 suppliers?" },
  { ru: "Напиши план цеха на смену", en: "Write a workshop plan for a shift" },
  { ru: "Какие KPI выбрать для менеджеров отдела продаж?", en: "Which KPIs for sales managers?" },
];

export default function Assistant() {
  const { t, lang } = useI18n();
  const { user } = useAuth();
  const ru = lang === "ru";
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const boxRef = useRef(null);

  useEffect(() => {
    api.get("/assistant/history").then((r) => {
      const hist = [];
      r.data.forEach((m) => {
        hist.push({ role: "user", content: m.user_message });
        hist.push({ role: "assistant", content: m.assistant_response, provider: m.provider });
      });
      setMessages(hist);
    }).catch(() => {});
  }, []);

  useEffect(() => { boxRef.current?.scrollTo({ top: boxRef.current.scrollHeight, behavior: "smooth" }); }, [messages]);

  const send = async (text) => {
    const msg = (text || input).trim(); if (!msg) return;
    const newMsgs = [...messages, { role: "user", content: msg }];
    setMessages(newMsgs); setInput(""); setLoading(true);
    try {
      const history = newMsgs.slice(0, -1).slice(-8).map((m) => ({ role: m.role, content: m.content }));
      const r = await api.post("/assistant/chat", { message: msg, history });
      setMessages([...newMsgs, { role: "assistant", content: r.data.text, provider: r.data.provider }]);
    } catch (e) {
      setMessages([...newMsgs, { role: "assistant", content: "Ошибка соединения с AI", provider: "error" }]);
    }
    setLoading(false);
  };

  return (
    <div className="pt-4">
      <PageHeader
        testId="assistant-header"
        eyebrow="GigaChat AI"
        title={t("assistant")}
        subtitle={t("ai_greeting")}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <Panel testId="assistant-chat" className="lg:col-span-9 p-0 overflow-hidden flex flex-col h-[calc(100vh-220px)]">
          <div ref={boxRef} className="flex-1 overflow-y-auto p-6 space-y-4" data-testid="assistant-messages">
            {messages.length === 0 && (
              <div className="h-full grid place-items-center text-center">
                <div>
                  <div className="w-16 h-16 rounded-3xl bg-[#FF5722]/15 grid place-items-center mx-auto mb-4">
                    <Bot className="w-8 h-8 text-[#FF5722]" />
                  </div>
                  <h3 className="font-heading font-bold text-xl">{ru ? "Начните разговор" : "Start conversation"}</h3>
                  <p className="text-white/50 text-sm mt-2 max-w-md">{ru ? "Задайте вопрос — ассистент поможет с производством, снабжением и продажами." : "Ask anything about production, procurement, and sales."}</p>
                </div>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`} data-testid={`assistant-msg-${i}`}>
                <Avatar className="w-8 h-8 shrink-0">
                  <AvatarFallback className={m.role === "user" ? "bg-[#FF5722] text-white text-xs" : "bg-white/5 text-[#E1FF00] text-xs"}>
                    {m.role === "user" ? (user?.full_name || user?.username || "?").slice(0, 2).toUpperCase() : <Bot className="w-4 h-4" />}
                  </AvatarFallback>
                </Avatar>
                <div className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap ${m.role === "user" ? "bg-[#FF5722]/20 border border-[#FF5722]/20" : "bg-black/30 border border-white/5"}`}>
                  {m.content}
                  {m.role === "assistant" && m.provider && <div className="mt-1.5 text-[10px] text-white/30 mono uppercase tracking-[0.15em]">{m.provider}</div>}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex gap-3">
                <Avatar className="w-8 h-8"><AvatarFallback className="bg-white/5"><Bot className="w-4 h-4 text-[#E1FF00]" /></AvatarFallback></Avatar>
                <div className="bg-black/30 border border-white/5 rounded-2xl px-4 py-3 text-sm">
                  <Loader2 className="w-4 h-4 animate-spin text-[#FF5722]" />
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-white/5 p-4 flex gap-2">
            <Textarea
              data-testid="assistant-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder={ru ? "Введите сообщение..." : "Type your message..."}
              className="bg-black/30 border-white/10 rounded-xl min-h-[52px] max-h-32 resize-none"
            />
            <Button
              data-testid="assistant-send-btn"
              onClick={() => send()}
              disabled={loading || !input.trim()}
              className="rounded-full bg-[#FF5722] hover:bg-[#FF6E40] px-5 h-[52px] shrink-0"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </Panel>

        <div className="lg:col-span-3 space-y-4">
          <Panel testId="assistant-suggestions">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-[#E1FF00]" />
              <div className="font-heading font-bold text-sm">{ru ? "Подсказки" : "Suggestions"}</div>
            </div>
            <div className="space-y-2">
              {suggestions.map((s, i) => (
                <button key={i} onClick={() => send(s[lang])} data-testid={`assistant-suggestion-${i}`} className="w-full text-left text-xs p-3 rounded-xl bg-black/20 hover:bg-white/5 transition-colors border border-white/5">
                  {s[lang]}
                </button>
              ))}
            </div>
          </Panel>

          <Panel>
            <div className="label-eyebrow mb-2">Provider</div>
            <div className="text-sm">
              <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> GigaChat</div>
              <div className="text-[11px] text-white/40 mt-2">{ru ? "Резервный: Emergent LLM (Claude)" : "Fallback: Emergent LLM"}</div>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
