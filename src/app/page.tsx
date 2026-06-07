"use client";

import { useState, useRef, useEffect } from "react";

// Types
interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: string[];
  timestamp: Date;
  isError?: boolean;
}

// Icons
const SSCLogoIcon = ({ className = "w-8 h-8" }) => (
  <svg
    viewBox="0 0 100 100"
    className={`${className} object-contain`}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M15 30H45C45 30 50 35 50 40C50 35 55 30 85 30V45C85 45 60 45 50 55C40 45 15 45 15 45V30Z"
      fill="#E30A17"
    />
    <path
      d="M15 50V70C15 85 30 95 50 95C70 95 85 85 85 70V50H60V70C60 75 55 80 50 80C45 80 40 75 40 70V50H15Z"
      fill="#8A8C8E"
    />
    <path
      d="M40 70C40 75 45 80 50 80V95C30 95 15 85 15 70V50H40V70Z"
      fill="#717375"
    />
  </svg>
);

const SendIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);

const BotIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 8V4H8" />
    <rect width="16" height="12" x="4" y="8" rx="2" />
    <path d="M2 14h2" />
    <path d="M20 14h2" />
    <path d="M15 13v2" />
    <path d="M9 13v2" />
  </svg>
);

const PlusIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const ArrowUpRightIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="text-gray-400 group-hover:text-[#E30A17] transition-colors"
  >
    <line x1="7" y1="17" x2="17" y2="7" />
    <polyline points="7 7 17 7 17 17" />
  </svg>
);

const UserIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const DocIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
  </svg>
);

function TypingIndicator() {
  return (
    <div className="flex w-full justify-start mb-8">
      <div className="flex gap-4 max-w-[90%] lg:max-w-[70%]">
        <div className="flex-shrink-0 mt-1">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#E30A17] flex items-center justify-center text-white shadow-sm">
            <BotIcon />
          </div>
        </div>
        <div className="flex flex-col min-w-0">
          <div className="px-6 py-5 rounded-2xl bg-white border border-gray-200 shadow-sm h-[60px] flex items-center rounded-tl-sm">
            <div className="flex gap-1.5 items-center">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-2 h-2 rounded-full bg-gray-400"
                  style={{
                    animation: `pulseDot 1.4s ease-in-out infinite`,
                    animationDelay: `${i * 160}ms`,
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({
  message,
  index,
}: {
  message: Message;
  index: number;
}) {
  const isUser = message.role === "user";

  const renderContent = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, "<strong class='font-semibold'>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(
        /`([^`]+)`/g,
        '<code class="bg-black/5 border border-black/10 px-1.5 py-0.5 rounded text-[13.5px] font-mono">$1</code>',
      )
      .replace(/\n/g, "<br/>");
  };

  return (
    <div
      className={`flex w-full ${isUser ? "justify-end" : "justify-start"} mb-8 animate-slide-up`}
      style={{ animationDelay: `${Math.min(index * 20, 150)}ms` }}
    >
      <div
        className={`flex gap-4 max-w-[90%] sm:max-w-[80%] lg:max-w-[72%] ${isUser ? "flex-row-reverse" : "flex-row"}`}
      >
        {/* Avatar */}
        <div className="flex-shrink-0 mt-1">
          {isUser ? (
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold text-xs shadow-sm">
              U
            </div>
          ) : (
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#E30A17] flex items-center justify-center text-white shadow-sm">
              <BotIcon />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex flex-col min-w-0">
          <div
            className={`px-7 py-6 rounded-[24px] text-[15px] sm:text-[15.5px] leading-relaxed space-y-3 shadow-sm max-w-full overflow-hidden ${
              isUser
                ? "bg-gray-100 text-gray-900 rounded-tr-sm"
                : message.isError
                  ? "bg-red-50 border border-red-200 text-red-900 rounded-tl-sm"
                  : "bg-white border border-gray-200 text-gray-800 rounded-tl-sm"
            }`}
          >
            <div
              className="prose-chat break-words"
              dangerouslySetInnerHTML={{
                __html: renderContent(message.content),
              }}
            />
          </div>

          {message.sources && message.sources.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2.5">
              {message.sources.map((src, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1.5 text-[12px] px-3 py-1.5 rounded-xl border bg-white shadow-sm text-gray-600 border-gray-200 font-medium hover:bg-gray-50 transition-colors cursor-default"
                >
                  <DocIcon />
                  <span className="truncate max-w-[200px]">{src}</span>
                </span>
              ))}
            </div>
          )}

          <div
            className={`flex items-center gap-1.5 mt-1.5 px-1 ${isUser ? "justify-end" : "justify-start"}`}
          >
            <span className="text-[11px] text-gray-400 font-medium">
              {message.timestamp.toLocaleTimeString("id-ID", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 200) + "px";
  };

  const handleNewChat = () => {
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content:
          "Halo! Selamat datang di **Asisten Virtual SSC** Telkom University Surabaya. 👋\n\nSaya siap membantu kamu mendapatkan informasi seputar:\n- 📋 Prosedur & administrasi akademik\n- 📅 Jadwal dan deadline penting\n- 📝 Persyaratan dokumen\n- ❓ Pertanyaan umum layanan SSC\n\nSilakan ketik pertanyaanmu!",
        timestamp: new Date(),
      },
    ]);
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  const sendMessage = async () => {
    const question = input.trim();
    if (!question || isLoading) return;

    setMessages((prev) => [
      ...prev,
      {
        id: `u-${Date.now()}`,
        role: "user",
        content: question,
        timestamp: new Date(),
      },
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
          content:
            "Maaf, tidak dapat terhubung ke server. Periksa koneksi internet Anda.",
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
    <div className="flex h-screen bg-white font-sans overflow-hidden text-gray-800">
      {/* ===== SIDEBAR (DESKTOP ONLY) ===== */}
      <aside className="hidden lg:flex flex-col w-[280px] xl:w-[320px] bg-[#F9F9F9] border-r border-gray-200 z-20 shrink-0 h-full">
        {/* New Chat Button */}
        <div className="p-5 pb-3">
          <button
            onClick={handleNewChat}
            className="flex items-center gap-3 w-full bg-white border border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-all shadow-sm h-12 px-4 rounded-xl font-medium text-gray-800"
          >
            <PlusIcon />
            <span className="text-[14px]">Percakapan Baru</span>
          </button>
        </div>

        {/* Menu/History */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          <div>
            <h3 className="text-[11px] font-bold text-gray-400 mb-3 uppercase tracking-wider">
              Layanan Cepat
            </h3>
            <div className="flex flex-col gap-2">
              {quickQuestions.map((q) => (
                <button
                  key={q}
                  onClick={() => {
                    setInput(q);
                    textareaRef.current?.focus();
                  }}
                  className="w-full text-left px-4 py-3 text-[13.5px] text-gray-700 bg-white border border-gray-200 hover:border-[#E30A17] hover:text-[#E30A17] hover:shadow-sm rounded-xl truncate transition-all group flex items-center justify-between"
                >
                  <span className="truncate pr-2">{q}</span>
                  <ArrowUpRightIcon />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* User Profile */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center gap-3 hover:bg-gray-200/60 p-3 rounded-xl cursor-pointer transition-colors border border-transparent hover:border-gray-300">
            <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 shrink-0">
              <UserIcon />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[14px] font-semibold text-gray-800 leading-tight mb-0.5 truncate">
                Mahasiswa Tel-U
              </span>
              <span className="text-[12px] text-gray-500 leading-tight truncate">
                ssc@telkomuniversity.ac.id
              </span>
            </div>
          </div>
        </div>
      </aside>

      {/* ===== MAIN CHAT AREA ===== */}
      <main className="flex-1 flex flex-col min-w-0 bg-white h-screen relative">
        {/* Header */}
        <header className="h-[72px] shrink-0 sticky top-0 bg-white/90 backdrop-blur-md border-b border-gray-200 z-10 flex items-center justify-between px-6 lg:px-10">
          <div className="flex items-center gap-3.5">
            <SSCLogoIcon className="w-10 h-10 flex-shrink-0" />
            <div className="flex flex-col">
              <h1 className="text-[16px] font-bold text-gray-900 leading-tight">
                SSC Telkom University
              </h1>
              <span className="text-[13px] text-gray-500 font-medium leading-tight">
                Student Service Center
              </span>
            </div>
          </div>
          <div className="flex items-center">
            <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-full px-3.5 py-1.5 shadow-sm">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-[11px] font-bold text-green-700 tracking-wider uppercase">
                Online
              </span>
            </div>
          </div>
        </header>

        {/* Ruang Percakapan */}
        <div className="flex-1 overflow-y-auto w-full scroll-smooth">
          <div className="max-w-4xl mx-auto px-6 lg:px-10 py-10 flex flex-col">
            {/* Daftar pesan */}
            {messages.map((msg, i) => (
              <MessageBubble key={msg.id} message={msg} index={i} />
            ))}

            {/* Typing indicator */}
            {isLoading && <TypingIndicator />}

            <div ref={messagesEndRef} className="h-8" />
          </div>
        </div>

        {/* Area Input Container */}
        <div className="bg-gradient-to-t from-white via-white to-transparent pt-4 pb-8 px-6 lg:px-10 shrink-0">
          <div className="max-w-4xl mx-auto w-full relative">
            {/* Quick questions (hanya saat welcome) */}
            {isOnlyWelcome && (
              <div className="flex flex-wrap justify-center gap-2.5 mb-6">
                {quickQuestions.map((q) => (
                  <button
                    key={q}
                    onClick={() => {
                      setInput(q);
                      textareaRef.current?.focus();
                    }}
                    className="flex items-center gap-2 px-4 py-2 rounded-full border border-gray-200 bg-white hover:border-[#E30A17] hover:text-[#E30A17] hover:bg-red-50 hover:shadow-sm transition-all text-sm font-medium text-gray-600 group"
                  >
                    <span>{q}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Input bar */}
            <div className="relative flex items-end gap-3 bg-white border border-gray-300 rounded-[24px] shadow-sm focus-within:ring-4 focus-within:ring-red-50 focus-within:border-[#E30A17] transition-all p-2 pl-6">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                rows={1}
                disabled={isLoading}
                placeholder="Ketik pesan untuk Asisten SSC..."
                className="flex-1 max-h-[150px] min-h-[44px] resize-none bg-transparent py-3 text-[15px] text-gray-900 placeholder-gray-500 focus:outline-none leading-relaxed"
              />

              {/* Tombol kirim */}
              <button
                onClick={sendMessage}
                disabled={!input.trim() || isLoading}
                className="h-11 w-11 shrink-0 rounded-full flex items-center justify-center transition-all bg-[#E30A17] hover:bg-red-700 text-white shadow-sm disabled:opacity-50 disabled:bg-gray-200 disabled:text-gray-400 disabled:shadow-none mb-0.5 mr-0.5"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <SendIcon />
                )}
              </button>
            </div>

            {/* Footer note */}
            <div className="flex items-center justify-center mt-4">
              <span className="text-[12px] text-gray-400 text-center max-w-lg">
                Asisten SSC dapat membuat kesalahan. Harap verifikasi informasi
                akademik penting melalui portal resmi atau staf pelayanan.
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
