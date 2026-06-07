"use client";

import { useState, useRef, useEffect } from "react";

// Konstanta & tipe
interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: string[];
  timestamp: Date;
  isError?: boolean;
}

// Ikon SVG inline
const SendIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);

const BotIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="10" rx="2" />
    <circle cx="12" cy="5" r="2" />
    <path d="M12 7v4" />
    <line x1="8" y1="16" x2="8" y2="16" strokeWidth="3" />
    <line x1="16" y1="16" x2="16" y2="16" strokeWidth="3" />
  </svg>
);

const DocIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
  </svg>
);

// Sub-komponen: Typing Indicator
function TypingIndicator() {
  return (
    <div className="flex items-end gap-2.5 animate-fade-in">
      {/* Avatar Bot */}
      <div className="w-8 h-8 rounded-full flex-shrink-0 overflow-hidden"
           style={{ background: "linear-gradient(135deg, #9B1C1C, #5C0F0F)" }}>
        <div className="w-full h-full flex items-center justify-center text-white">
          <BotIcon />
        </div>
      </div>
      {/* Bubble */}
      <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-sm px-4 py-3"
           style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
        <div className="flex gap-1.5 items-center h-4">
          {[0, 1, 2].map((i) => (
            <div key={i}
                 className="w-2 h-2 rounded-full bg-telkom-red"
                 style={{ animation: `bounceDot 1.2s ease-in-out infinite`, animationDelay: `${i * 180}ms` }} />
          ))}
        </div>
      </div>
    </div>
  );
}

// Sub-komponen: Bubble Pesan
function MessageBubble({ message, index }: { message: Message; index: number }) {
  const isUser = message.role === "user";

  // Render markdown dasar: bold, italic, code
  const renderContent = (text: string) =>
    text
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/`([^`]+)`/g, '<code class="font-mono text-xs bg-black/8 px-1.5 py-0.5 rounded">$1</code>')
      .replace(/\n/g, "<br/>");

  return (
    <div
      className={`flex items-end gap-2.5 ${isUser ? "flex-row-reverse" : "flex-row"} animate-slide-up`}
      style={{ animationDelay: `${Math.min(index * 30, 200)}ms` }}
    >
      {/* Avatar */}
      <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold
        ${isUser
          ? "bg-gray-200 text-gray-600"
          : "text-white"}`}
           style={!isUser ? { background: "linear-gradient(135deg, #9B1C1C, #5C0F0F)" } : {}}>
        {isUser ? "M" : <BotIcon />}
      </div>

      {/* Konten bubble */}
      <div className={`flex flex-col gap-1.5 max-w-[78%] sm:max-w-[72%] ${isUser ? "items-end" : "items-start"}`}>
        <div
          className={`px-4 py-3 text-sm leading-relaxed
            ${isUser
              ? "text-white rounded-2xl rounded-br-sm"
              : message.isError
                ? "bg-red-50 text-red-800 border border-red-200 rounded-2xl rounded-bl-sm"
                : "bg-white text-gray-800 border border-gray-100 rounded-2xl rounded-bl-sm"
            }`}
          style={isUser
            ? { background: "linear-gradient(135deg, #9B1C1C, #7A1515)", boxShadow: "0 2px 10px rgba(155,28,28,0.25)" }
            : message.isError
              ? {}
              : { boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }
          }
        >
          <div
            className="prose-chat whitespace-pre-wrap"
            dangerouslySetInnerHTML={{ __html: renderContent(message.content) }}
          />
        </div>

        {/* Badge sumber dokumen */}
        {message.sources && message.sources.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {message.sources.map((src, i) => (
              <span key={i}
                    className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border font-medium"
                    style={{ background: "#FEF2F2", color: "#9B1C1C", borderColor: "#FECACA" }}>
                <DocIcon />
                {src}
              </span>
            ))}
          </div>
        )}

        {/* Timestamp */}
        <span className="text-xs text-gray-400 px-1">
          {message.timestamp.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
        </span>
      </div>
    </div>
  );
}

// Komponen Utama
export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Halo! Selamat datang di **Asisten Virtual SSC** Telkom University Surabaya. 👋\n\nSaya siap membantu kamu mendapatkan informasi seputar:\n- 📋 Prosedur & administrasi akademik\n- 📅 Jadwal dan deadline penting\n- 📝 Persyaratan dokumen\n- ❓ Pertanyaan umum layanan SSC\n\nSilakan ketik pertanyaanmu!",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll saat ada pesan baru
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Auto-resize textarea
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 128) + "px";
  };

  const sendMessage = async () => {
    const question = input.trim();
    if (!question || isLoading) return;

    setMessages((prev) => [
      ...prev,
      { id: `u-${Date.now()}`, role: "user", content: question, timestamp: new Date() },
    ]);
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: "assistant",
          content: data.answer || "Maaf, tidak ada respons dari server.",
          sources: data.sources || [],
          timestamp: new Date(),
          isError: !!data.error_type,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: "assistant",
          content: "Maaf, tidak dapat terhubung ke server. Periksa koneksi internet Anda.",
          timestamp: new Date(),
          isError: true,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const quickQuestions = [
    "Apa syarat cuti semester?",
    "Cara mengurus KRS?",
    "Batas pembayaran UKT?",
    "Prosedur legalisir ijazah?",
  ];

  const isOnlyWelcome = messages.length === 1;

  return (
    <div className="flex flex-col h-screen bg-diagonal-pattern" style={{ backgroundColor: "#F8F4F0" }}>

      {/* ===== HEADER ===== */}
      <header className="relative z-10 flex-shrink-0"
              style={{
                background: "linear-gradient(135deg, #9B1C1C 0%, #6B1212 100%)",
                boxShadow: "0 2px 20px rgba(155,28,28,0.35)"
              }}>
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">

          {/* Logo & Shield */}
          <div className="flex-shrink-0 flex items-center gap-2.5">
            {/* Shield dekoratif */}
            <div className="relative w-10 h-10 flex-shrink-0">
              <div className="absolute inset-0 rounded-full bg-white/15 flex items-center justify-center">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
                  <path d="M12 2L4 6v6c0 5.25 3.5 10.1 8 11.5C16.5 22.1 20 17.25 20 12V6l-8-4z" opacity="0.9"/>
                  <path d="M9 12l2 2 4-4" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>

            {/* Teks branding */}
            <div>
              <div className="text-white font-bold text-sm leading-tight tracking-wide">
                Asisten SSC
              </div>
              <div className="text-white/60 text-xs leading-tight font-medium">
                Telkom University Surabaya
              </div>
            </div>
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Status online */}
          <div className="flex items-center gap-2 bg-white/10 rounded-full px-3 py-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-white/80 text-xs font-medium">Online 24/7</span>
          </div>
        </div>

        {/* Garis dekoratif bawah */}
        <div className="h-px w-full" style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)" }} />
      </header>

      {/* ===== AREA PESAN ===== */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-5 flex flex-col gap-4">

          {/* Info bar */}
          {isOnlyWelcome && (
            <div className="flex items-center gap-2 bg-white/80 border border-red-100 rounded-xl px-4 py-2.5 animate-fade-in"
                 style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="#9B1C1C">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
              </svg>
              <span className="text-xs text-gray-600">
                Jawaban didasarkan pada dokumen resmi SSC. Bukan pengganti konsultasi langsung.
              </span>
            </div>
          )}

          {/* Daftar pesan */}
          {messages.map((msg, i) => (
            <MessageBubble key={msg.id} message={msg} index={i} />
          ))}

          {/* Typing indicator */}
          {isLoading && <TypingIndicator />}

          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* ===== AREA INPUT ===== */}
      <footer className="flex-shrink-0 bg-white border-t border-gray-200"
              style={{ boxShadow: "0 -2px 16px rgba(0,0,0,0.06)" }}>
        <div className="max-w-3xl mx-auto px-4 pt-3 pb-4">

          {/* Quick questions (hanya saat welcome) */}
          {isOnlyWelcome && (
            <div className="flex flex-wrap gap-2 mb-3">
              {quickQuestions.map((q) => (
                <button key={q}
                        onClick={() => { setInput(q); textareaRef.current?.focus(); }}
                        className="text-xs px-3 py-1.5 rounded-full border font-medium transition-all duration-150 hover:-translate-y-0.5"
                        style={{
                          background: "#FEF2F2",
                          color: "#9B1C1C",
                          borderColor: "#FECACA"
                        }}>
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input bar */}
          <div className="flex items-end gap-2.5">
            <div className="flex-1 flex items-end gap-2 rounded-2xl border bg-white px-4 py-2.5 transition-all duration-200 focus-within:border-telkom-red"
                 style={{ borderColor: "#E5E7EB", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
              <textarea
                ref={textareaRef}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                rows={1}
                disabled={isLoading}
                placeholder="Ketik pertanyaanmu… (Enter untuk kirim, Shift+Enter baris baru)"
                className="flex-1 resize-none bg-transparent text-sm text-gray-800 placeholder-gray-400 focus:outline-none leading-relaxed max-h-32"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              />
            </div>

            {/* Tombol kirim */}
            <button
              onClick={sendMessage}
              disabled={!input.trim() || isLoading}
              className="w-11 h-11 flex-shrink-0 rounded-xl text-white flex items-center justify-center transition-all duration-200 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: input.trim() && !isLoading
                  ? "linear-gradient(135deg, #9B1C1C, #7A1515)"
                  : "#D1D5DB",
                boxShadow: input.trim() && !isLoading
                  ? "0 3px 12px rgba(155,28,28,0.35)"
                  : "none",
              }}
            >
              {isLoading
                ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <SendIcon />
              }
            </button>
          </div>

          {/* Footer note */}
          <p className="text-center text-xs text-gray-400 mt-2.5">
            SSC Telkom University Surabaya · Layanan fisik: Senin–Jumat, 08.00–16.00 WIB
          </p>
        </div>
      </footer>
    </div>
  );
}