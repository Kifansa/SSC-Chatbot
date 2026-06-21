"use client";

import { useState } from "react";
import Link from "next/link";

const ChatIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);
const LockIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);
const DocIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
  </svg>
);
const ClockIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
  </svg>
);
const ShieldIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);
const ArrowRightIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
  </svg>
);

const FEATURES = [
  { icon: DocIcon, title: "Berbasis dokumen resmi", desc: "Jawaban diambil langsung dari panduan dan dokumen akademik resmi SSC." },
  { icon: ClockIcon, title: "Tersedia 24/7", desc: "Tanyakan kapan saja, tanpa perlu menunggu jam operasional kantor." },
  { icon: ShieldIcon, title: "Terhubung ke layanan resmi", desc: "Pertanyaan kompleks akan diarahkan ke staf SSC secara langsung." },
];

export default function LandingPage() {
  const [isHoveringChat, setIsHoveringChat] = useState(false);

  return (
    <div className="min-h-screen bg-white font-sans">

      <header className="border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#E30A17] flex items-center justify-center flex-shrink-0">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M12 2L4 6v6c0 5.25 3.5 10.1 8 11.5C16.5 22.1 20 17.25 20 12V6l-8-4z" /></svg>
            </div>
            <div>
              <p className="text-[14px] font-bold text-gray-900 leading-tight">SSC Telkom University</p>
              <p className="text-[11px] text-gray-500 leading-tight">Surabaya</p>
            </div>
          </div>

          {/* PERBAIKAN 1: Menggunakan <Link> untuk Login Admin */}
          <Link
            href="/admin/login"
            className="flex items-center gap-1.5 text-[12.5px] font-semibold text-gray-600 hover:text-[#E30A17] border border-gray-200 hover:border-red-200 px-3.5 py-2 rounded-xl hover:bg-red-50 transition-all"
          >
            <LockIcon />
            <span className="hidden sm:inline">Login Admin</span>
            <span className="sm:hidden">Admin</span>
          </Link>
        </div>
      </header>

      <section className="max-w-4xl mx-auto px-6 pt-16 pb-20 text-center">
        <div className="inline-flex items-center gap-2 bg-red-50 border border-red-100 rounded-full px-4 py-1.5 mb-7">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          <span className="text-[12px] font-semibold text-[#E30A17]">Layanan aktif 24 jam</span>
        </div>

        <h1 className="text-[32px] sm:text-[42px] font-bold text-gray-900 leading-[1.15] mb-4">
          Asisten Virtual<br />Student Service Center
        </h1>
        <p className="text-[15px] sm:text-[16px] text-gray-500 max-w-xl mx-auto leading-relaxed mb-9">
          Dapatkan jawaban instan seputar administrasi akademik, jadwal, dan persyaratan dokumen — langsung dari dokumen resmi Telkom University Surabaya.
        </p>

        {/* PERBAIKAN 2: Menggunakan <Link> untuk Tombol Mulai Chat */}
        <Link
          href="/chat"
          onMouseEnter={() => setIsHoveringChat(true)}
          onMouseLeave={() => setIsHoveringChat(false)}
          className="inline-flex items-center gap-2.5 text-white font-bold text-[15px] px-7 py-3.5 rounded-2xl transition-all active:scale-95"
          style={{
            background: "#E30A17",
            boxShadow: isHoveringChat ? "0 8px 24px rgba(227,10,23,0.35)" : "0 4px 14px rgba(227,10,23,0.25)",
            transform: isHoveringChat ? "translateY(-2px)" : "translateY(0)",
          }}
        >
          <ChatIcon />
          Mulai Chat Sekarang
          <ArrowRightIcon />
        </Link>

        <p className="text-[12px] text-gray-400 mt-4">Tidak perlu login atau registrasi untuk mahasiswa</p>
      </section>

      <section className="max-w-5xl mx-auto px-6 pb-20">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {FEATURES.map((f) => (
            <div key={f.title} className="border border-gray-100 rounded-2xl p-6 hover:border-red-100 hover:shadow-sm transition-all">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4" style={{ background: "#FEF2F2", color: "#E30A17" }}>
                <f.icon />
              </div>
              <h3 className="text-[14.5px] font-bold text-gray-900 mb-1.5">{f.title}</h3>
              <p className="text-[12.5px] text-gray-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-gray-50 border-y border-gray-100">
        <div className="max-w-4xl mx-auto px-6 py-14">
          <h2 className="text-[18px] font-bold text-gray-900 text-center mb-7">Contoh yang bisa kamu tanyakan</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              "Apa syarat pengajuan cuti semester?",
              "Bagaimana cara mengurus KRS online?",
              "Kapan batas akhir pembayaran UKT?",
              "Bagaimana prosedur legalisir ijazah?",
            ].map((q) => (
              
              /* PERBAIKAN 3: Menggunakan <Link> untuk Contoh Pertanyaan */
              <Link
                key={q}
                href="/chat"
                className="flex items-center justify-between gap-3 bg-white border border-gray-200 rounded-xl px-4 py-3.5 hover:border-red-200 hover:shadow-sm transition-all group"
              >
                <span className="text-[13px] text-gray-700 font-medium">{q}</span>
                <span className="text-gray-300 group-hover:text-[#E30A17] transition-colors flex-shrink-0">
                  <ArrowRightIcon />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <footer className="max-w-6xl mx-auto px-6 py-10 text-center">
        <p className="text-[12px] text-gray-400">
          SSC Telkom University Surabaya · Gedung Rektorat Lt. 1 · Senin–Jumat, 08.00–16.00 WIB
        </p>
        <p className="text-[11px] text-gray-300 mt-1.5">ssc@tus.ac.id</p>
      </footer>
    </div>
  );
}