"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

const LockIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const MailIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
);

const EyeIcon = ({ off }: { off?: boolean }) => off ? (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
) : (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectedFrom = searchParams.get("redirectedFrom") || "/admin";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError("Email dan kata sandi wajib diisi.");
      return;
    }

    setIsLoading(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) {
        // Pesan error yang ramah, tidak membocorkan detail teknis
        if (signInError.message.includes("Invalid login credentials")) {
          setError("Email atau kata sandi salah. Silakan coba lagi.");
        } else if (signInError.message.includes("Email not confirmed")) {
          setError("Akun belum dikonfirmasi. Hubungi tim IT untuk verifikasi.");
        } else {
          setError("Gagal masuk. Silakan coba lagi atau hubungi tim IT.");
        }
        setIsLoading(false);
        return;
      }

      router.push(redirectedFrom);
      router.refresh();
    } catch {
      setError("Terjadi kesalahan koneksi. Periksa internet Anda.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white font-sans px-4">
      <div className="w-full max-w-[400px]">

        {/* Logo & Branding */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-[#E30A17] flex items-center justify-center shadow-sm mb-4">
            <LockIcon />
          </div>
          <h1 className="text-[20px] font-bold text-gray-900 text-center leading-tight">
            Portal Admin SSC
          </h1>
          <p className="text-[13px] text-gray-500 font-medium mt-1 text-center">
            Telkom University Surabaya
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white border border-gray-200 rounded-[24px] shadow-sm p-7">
          <form onSubmit={handleSubmit} className="space-y-4">

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-[13px] rounded-xl px-4 py-3 font-medium">
                {error}
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">
                Email
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  <MailIcon />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@telkomuniversity.ac.id"
                  autoComplete="email"
                  disabled={isLoading}
                  className="w-full pl-11 pr-4 py-3 text-[14px] text-gray-900 placeholder-gray-400 bg-white border border-gray-300 rounded-[14px] focus:outline-none focus:ring-4 focus:ring-red-50 focus:border-[#E30A17] transition-all disabled:opacity-50"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">
                Kata Sandi
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  <LockIcon />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  disabled={isLoading}
                  className="w-full pl-11 pr-11 py-3 text-[14px] text-gray-900 placeholder-gray-400 bg-white border border-gray-300 rounded-[14px] focus:outline-none focus:ring-4 focus:ring-red-50 focus:border-[#E30A17] transition-all disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  tabIndex={-1}
                >
                  <EyeIcon off={showPassword} />
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 mt-2 rounded-[14px] bg-[#E30A17] hover:bg-red-700 text-white font-semibold text-[14px] flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Memproses…
                </>
              ) : (
                "Masuk"
              )}
            </button>
          </form>
        </div>

        {/* Catatan akses */}
        <p className="text-center text-[12px] text-gray-400 mt-6 leading-relaxed">
          Akun admin hanya dapat dibuat oleh tim IT.<br />
          Hubungi IT Support jika Anda memerlukan akses.
        </p>

        <div className="flex items-center justify-center mt-4">
          <a href="/" className="text-[12px] text-gray-400 hover:text-[#E30A17] font-medium transition-colors">
            ← Kembali ke halaman utama
          </a>
        </div>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-6 h-6 border-2 border-gray-200 border-t-[#E30A17] rounded-full animate-spin" /></div>}>
      <LoginForm />
    </Suspense>
  );
}