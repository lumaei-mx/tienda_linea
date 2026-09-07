"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useCart } from "@/lib/cart-store";

type Role = "bot" | "user";
interface Msg { role: Role; text: string; }

const STR = {
  es: {
    title: "Soporte Lumaei 24/7",
    subtitle: "Respuesta inmediata · humano < 24h",
    placeholder: "Escribe tu mensaje…",
    send: "Enviar",
    open: "Abrir chat de soporte",
    close: "Cerrar chat",
    ticketTitle: "Deja tu caso a un humano",
    name: "Nombre",
    email: "Correo",
    order: "Nº pedido (opcional)",
    message: "Mensaje",
    ticketSend: "Crear ticket",
    ticketOk: "Ticket creado. Te contactamos en menos de 24h a tu correo.",
    ticketErr: "No se pudo crear el ticket. Escríbenos a lumaeiMX@gmail.com",
    chatErr: "Perdona, hubo un error. Intenta de nuevo o escribe a lumaeiMX@gmail.com",
    greeting: "¡Hola! Soy el asistente Lumaei 🤖 ¿En qué te ayudo?",
    quick: ["Rastrear pedido 📦", "Envíos 🚚", "Devoluciones 🔄", "Hablar con humano 🙋"],
    ticketToggle: "Contactar humano ✉️",
    backToChat: "← Volver al chat",
    langLabel: "EN",
  },
  en: {
    title: "Lumaei Support 24/7",
    subtitle: "Instant reply · human < 24h",
    placeholder: "Type your message…",
    send: "Send",
    open: "Open support chat",
    close: "Close chat",
    ticketTitle: "Leave your case to a human",
    name: "Name",
    email: "Email",
    order: "Order # (optional)",
    message: "Message",
    ticketSend: "Create ticket",
    ticketOk: "Ticket created. We'll reach out within 24h.",
    ticketErr: "Couldn't create the ticket. Email us at lumaeiMX@gmail.com",
    chatErr: "Sorry, something went wrong. Try again or email lumaeiMX@gmail.com",
    greeting: "Hi! I'm the Lumaei assistant 🤖 How can I help?",
    quick: ["Track order 📦", "Shipping 🚚", "Returns 🔄", "Talk to a human 🙋"],
    ticketToggle: "Contact human ✉️",
    backToChat: "← Back to chat",
    langLabel: "ES",
  },
} as const;

export function SupportBot() {
  const storeLang = useCart((s) => s.lang);
  const [lang, setLang] = useState<"es" | "en">(storeLang === "en" ? "en" : "es");
  useEffect(() => { setLang(storeLang === "en" ? "en" : "es"); }, [storeLang]);

  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showTicket, setShowTicket] = useState(false);
  const [tName, setTName] = useState("");
  const [tEmail, setTEmail] = useState("");
  const [tOrder, setTOrder] = useState("");
  const [tMsg, setTMsg] = useState("");
  const [tStatus, setTStatus] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const greeted = useRef(false);

  const s = STR[lang];

  const openChat = useCallback(() => setOpen(true), []);

  useEffect(() => {
    const h = () => setOpen(true);
    window.addEventListener("lumaei:open-support", h);
    return () => window.removeEventListener("lumaei:open-support", h);
  }, []);

  useEffect(() => {
    if (open && !greeted.current) {
      greeted.current = true;
      setMsgs([{ role: "bot", text: STR[lang].greeting }]);
    }
  }, [open, lang]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs, open, showTicket]);

  async function send(text?: string) {
    const message = (text ?? input).trim();
    if (!message || loading) return;
    setInput("");
    setMsgs((m) => [...m, { role: "user", text: message }]);
    setLoading(true);
    try {
      const res = await fetch("/api/support/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, lang }),
      });
      const d = await res.json();
      const reply = typeof d.reply === "string" ? d.reply : s.chatErr;
      setMsgs((m) => [...m, { role: "bot", text: reply }]);
      if (d.escalated) setShowTicket((v) => v || false);
    } catch {
      setMsgs((m) => [...m, { role: "bot", text: s.chatErr }]);
    } finally {
      setLoading(false);
    }
  }

  async function sendTicket(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setTStatus(null);
    setLoading(true);
    try {
      const res = await fetch("/api/support/ticket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: tName, email: tEmail, message: tMsg, orderId: tOrder || undefined }),
      });
      const d = await res.json();
      if (res.ok && (d.ok || !d.error)) {
        setTStatus(s.ticketOk);
        setTName(""); setTEmail(""); setTOrder(""); setTMsg("");
      } else {
        setTStatus(d.error || s.ticketErr);
      }
    } catch {
      setTStatus(s.ticketErr);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Botón flotante */}
      {!open && (
        <button
          type="button"
          onClick={openChat}
          aria-label={s.open}
          className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-brown text-xl text-ivory shadow-xl transition hover:bg-gold-dark"
        >
          💬
        </button>
      )}

      {/* Panel */}
      {open && (
        <div className="fixed bottom-6 right-6 z-50 flex max-h-[80vh] w-[360px] max-w-[calc(100vw-3rem)] flex-col overflow-hidden rounded-2xl border border-gold/25 bg-cream shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between gap-2 bg-brown px-4 py-3 text-ivory">
            <div>
              <p className="font-serif text-base font-semibold leading-tight">{s.title}</p>
              <p className="text-[11px] opacity-80">{s.subtitle}</p>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setLang((l) => (l === "es" ? "en" : "es"))}
                className="rounded-full border border-ivory/30 px-2 py-0.5 text-[11px] font-bold hover:bg-ivory/10"
                aria-label="Cambiar idioma / Switch language"
              >
                {s.langLabel}
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={s.close}
                className="rounded-full px-2 py-0.5 text-lg leading-none hover:bg-ivory/10"
              >
                ×
              </button>
            </div>
          </div>

          {/* Mensajes */}
          <div ref={listRef} className="flex-1 space-y-2 overflow-y-auto bg-cream px-3 py-3">
            {msgs.map((m, i) => (
              <div
                key={i}
                className={`max-w-[85%] whitespace-pre-line rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                  m.role === "user"
                    ? "ml-auto bg-brown text-ivory"
                    : "border border-gold/20 bg-ivory text-brown"
                }`}
              >
                {m.text}
              </div>
            ))}
            {loading && (
              <div className="max-w-[60%] rounded-2xl border border-gold/20 bg-ivory px-3 py-2 text-sm text-brown-soft">
                …
              </div>
            )}
            {/* Quick replies */}
            {!showTicket && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {s.quick.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => send(q)}
                    disabled={loading}
                    className="rounded-full border border-gold/40 bg-ivory px-3 py-1 text-xs font-semibold text-brown transition hover:bg-gold/20 disabled:opacity-50"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Ticket / input */}
          <div className="border-t border-gold/20 bg-ivory px-3 py-3">
            {!showTicket ? (
              <>
                <form
                  onSubmit={(e) => { e.preventDefault(); send(); }}
                  className="flex gap-2"
                >
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={s.placeholder}
                    maxLength={2000}
                    className="min-w-0 flex-1 rounded-full border border-gold/30 bg-cream px-3 py-2 text-sm text-brown outline-none placeholder:text-brown-soft/60 focus:border-gold-dark"
                  />
                  <button
                    type="submit"
                    disabled={loading || !input.trim()}
                    className="shrink-0 rounded-full bg-brown px-4 py-2 text-sm font-semibold text-ivory transition hover:bg-gold-dark disabled:opacity-50"
                  >
                    {s.send}
                  </button>
                </form>
                <button
                  type="button"
                  onClick={() => setShowTicket(true)}
                  className="mt-2 w-full text-center text-xs font-semibold text-gold-dark hover:underline"
                >
                  {s.ticketToggle}
                </button>
              </>
            ) : (
              <>
                <p className="text-sm font-semibold text-brown">{s.ticketTitle}</p>
                <form onSubmit={sendTicket} className="mt-2 space-y-2">
                  <input
                    value={tName}
                    onChange={(e) => setTName(e.target.value)}
                    placeholder={s.name}
                    required
                    maxLength={120}
                    className="w-full rounded-xl border border-gold/30 bg-cream px-3 py-2 text-sm text-brown outline-none focus:border-gold-dark"
                  />
                  <input
                    value={tEmail}
                    onChange={(e) => setTEmail(e.target.value)}
                    placeholder={s.email}
                    required
                    type="email"
                    maxLength={160}
                    className="w-full rounded-xl border border-gold/30 bg-cream px-3 py-2 text-sm text-brown outline-none focus:border-gold-dark"
                  />
                  <input
                    value={tOrder}
                    onChange={(e) => setTOrder(e.target.value)}
                    placeholder={s.order}
                    maxLength={80}
                    className="w-full rounded-xl border border-gold/30 bg-cream px-3 py-2 text-sm text-brown outline-none focus:border-gold-dark"
                  />
                  <textarea
                    value={tMsg}
                    onChange={(e) => setTMsg(e.target.value)}
                    placeholder={s.message}
                    required
                    rows={3}
                    maxLength={2000}
                    className="w-full rounded-xl border border-gold/30 bg-cream px-3 py-2 text-sm text-brown outline-none focus:border-gold-dark"
                  />
                  {tStatus && <p className="text-xs text-brown-soft">{tStatus}</p>}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-full bg-brown px-4 py-2 text-sm font-semibold text-ivory transition hover:bg-gold-dark disabled:opacity-50"
                  >
                    {s.ticketSend}
                  </button>
                </form>
                <button
                  type="button"
                  onClick={() => setShowTicket(false)}
                  className="mt-2 w-full text-center text-xs font-semibold text-gold-dark hover:underline"
                >
                  {s.backToChat}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
