"use client";

import { useState, useEffect } from "react";

interface Settings {
  system_prompt: string;
  similarity_threshold: number;
  match_count: number;
  updated_at: string | null;
  updated_by: string | null;
}

const InfoIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
);

function Alert({ type, message, onClose }: { type: "success" | "error"; message: string; onClose: () => void; }) {
  const cfg = type === "success"
    ? { bg: "#F0FDF4", border: "#BBF7D0", text: "#166534" }
    : { bg: "#FEF2F2", border: "#FECACA", text: "#991B1B" };
  return (
    <div className="flex items-start gap-3 px-4 py-3.5 rounded-xl border mb-5" style={{ background: cfg.bg, borderColor: cfg.border }}>
      <p className="text-[13px] flex-1 font-medium" style={{ color: cfg.text }}>{message}</p>
      <button onClick={onClose} className="flex-shrink-0 opacity-50 hover:opacity-100" style={{ color: cfg.text }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
      </button>
    </div>
  );
}

function ConfirmSaveDialog({ onConfirm, onCancel, isSaving }: { onConfirm: () => void; onCancel: () => void; isSaving: boolean; }) {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6">
        <h3 className="font-bold text-gray-900 text-base mb-1">Simpan perubahan?</h3>
        <p className="text-[12.5px] text-gray-500 mb-5 leading-relaxed">
          Perubahan akan langsung berlaku untuk SEMUA percakapan chatbot setelah disimpan. Pastikan instruksi sudah benar.
        </p>
        <div className="flex gap-2.5">
          <button onClick={onCancel} disabled={isSaving} className="flex-1 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-[13px] font-semibold hover:bg-gray-50 disabled:opacity-50">Batal</button>
          <button onClick={onConfirm} disabled={isSaving} className="flex-1 py-2.5 text-white rounded-xl text-[13px] font-semibold flex items-center justify-center gap-2 disabled:opacity-50" style={{ background: "#E30A17" }}>
            {isSaving ? <><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Menyimpan…</> : "Ya, simpan"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AISettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [draft, setDraft] = useState<{ system_prompt: string; similarity_threshold: number; match_count: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [alert, setAlert] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => { loadSettings(); }, []);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/settings");
      const data = await res.json();
      if (data.success) {
        setSettings(data.data);
        setDraft({
          system_prompt: data.data.system_prompt,
          similarity_threshold: data.data.similarity_threshold,
          match_count: data.data.match_count,
        });
      } else {
        setAlert({ type: "error", message: data.error || "Gagal memuat pengaturan." });
      }
    } catch {
      setAlert({ type: "error", message: "Tidak dapat terhubung ke server." });
    } finally {
      setIsLoading(false);
    }
  };

  const hasChanges = settings && draft && (
    settings.system_prompt !== draft.system_prompt ||
    settings.similarity_threshold !== draft.similarity_threshold ||
    settings.match_count !== draft.match_count
  );

  const handleSaveClick = () => {
    if (!draft) return;
    if (!draft.system_prompt.includes("{context}")) {
      setAlert({ type: "error", message: "System prompt harus menyertakan placeholder {context} agar dokumen bisa disisipkan ke jawaban AI." });
      return;
    }
    setShowConfirm(true);
  };

  const handleConfirmSave = async () => {
    if (!draft) return;
    setIsSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAlert({ type: "success", message: "Pengaturan AI berhasil disimpan dan langsung aktif." });
        setShowConfirm(false);
        await loadSettings();
      } else {
        setAlert({ type: "error", message: data.error || "Gagal menyimpan pengaturan." });
        setShowConfirm(false);
      }
    } catch {
      setAlert({ type: "error", message: "Koneksi terputus saat menyimpan." });
      setShowConfirm(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetDraft = () => {
    if (!settings) return;
    setDraft({
      system_prompt: settings.system_prompt,
      similarity_threshold: settings.similarity_threshold,
      match_count: settings.match_count,
    });
  };

  const thresholdLabel = (v: number) => {
    if (v <= 0.3) return "Sangat longgar — bot mudah menjawab walau konteks kurang relevan";
    if (v <= 0.5) return "Seimbang — disarankan untuk kebanyakan kasus";
    if (v <= 0.7) return "Ketat — bot hanya menjawab jika dokumen sangat relevan";
    return "Sangat ketat — bot sering fallback ke layanan SSC langsung";
  };

  if (isLoading) {
    return (
      <div className="px-5 sm:px-8 py-6 sm:py-8 pt-16 lg:pt-8 max-w-4xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-7 w-48 bg-gray-100 rounded" />
          <div className="h-64 bg-gray-100 rounded-2xl" />
          <div className="h-40 bg-gray-100 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="px-5 sm:px-8 py-6 sm:py-8 pt-16 lg:pt-8 max-w-4xl mx-auto pb-24">
      <div className="mb-6">
        <h1 className="text-[22px] font-bold text-gray-900">Pengaturan AI</h1>
        <p className="text-[13px] text-gray-500 mt-0.5">Atur instruksi dasar dan sensitivitas pencarian chatbot</p>
      </div>

      {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden mb-5" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900 text-[14.5px]">Instruksi dasar (system prompt)</h2>
          <p className="text-[12px] text-gray-500 mt-0.5">
            Tentukan nada bicara, aturan, dan batasan AI. Jangan hapus placeholder <code className="bg-gray-100 px-1.5 py-0.5 rounded font-mono text-[11px]">{"{context}"}</code> — di situlah dokumen disisipkan otomatis.
          </p>
        </div>
        <div className="p-6">
          <textarea
            value={draft?.system_prompt ?? ""}
            onChange={(e) => setDraft((d) => d ? { ...d, system_prompt: e.target.value } : d)}
            rows={16}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-[13px] font-mono leading-relaxed resize-y focus:outline-none focus:ring-4 focus:ring-red-50 focus:border-[#E30A17] transition-all"
            spellCheck={false}
          />
          <div className="flex items-center justify-between mt-2">
            <p className="text-[11px] text-gray-400">{draft?.system_prompt.length ?? 0} karakter</p>
            {draft && !draft.system_prompt.includes("{context}") && (
              <p className="text-[11px] font-semibold text-red-600 flex items-center gap-1">
                <InfoIcon /> Placeholder {"{context}"} tidak ditemukan
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden mb-5" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900 text-[14.5px]">Sensitivitas pencarian (similarity threshold)</h2>
          <p className="text-[12px] text-gray-500 mt-0.5">
            Mengatur seberapa mirip dokumen harus dengan pertanyaan mahasiswa sebelum bot menggunakannya sebagai jawaban.
          </p>
        </div>
        <div className="p-6 space-y-5">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[12.5px] font-semibold text-gray-700">Threshold</span>
              <span className="text-[15px] font-bold" style={{ color: "#E30A17" }}>{draft?.similarity_threshold.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={draft?.similarity_threshold ?? 0.5}
              onChange={(e) => setDraft((d) => d ? { ...d, similarity_threshold: parseFloat(e.target.value) } : d)}
              className="w-full"
              style={{ accentColor: "#E30A17" }}
            />
            <div className="flex justify-between text-[10px] text-gray-400 mt-1">
              <span>0.0 (longgar)</span><span>0.5</span><span>1.0 (ketat)</span>
            </div>
            <p className="text-[11.5px] text-gray-500 mt-2.5 bg-gray-50 rounded-lg px-3 py-2">
              {thresholdLabel(draft?.similarity_threshold ?? 0.5)}
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[12.5px] font-semibold text-gray-700">Jumlah dokumen diambil (top-k)</span>
              <span className="text-[15px] font-bold" style={{ color: "#E30A17" }}>{draft?.match_count}</span>
            </div>
            <input
              type="range"
              min={1}
              max={10}
              step={1}
              value={draft?.match_count ?? 5}
              onChange={(e) => setDraft((d) => d ? { ...d, match_count: parseInt(e.target.value) } : d)}
              className="w-full"
              style={{ accentColor: "#E30A17" }}
            />
            <p className="text-[11.5px] text-gray-500 mt-2.5">
              Jumlah potongan dokumen (chunks) yang diambil sebagai konteks untuk setiap pertanyaan.
            </p>
          </div>
        </div>
      </div>

      {settings?.updated_at && (
        <p className="text-[11.5px] text-gray-400 mb-5">
          Terakhir diubah {new Date(settings.updated_at).toLocaleString("id-ID")}
          {settings.updated_by ? ` oleh ${settings.updated_by}` : ""}
        </p>
      )}

      {hasChanges && (
        <div className="fixed bottom-0 left-0 right-0 lg:left-64 bg-white border-t border-gray-200 px-5 sm:px-8 py-4 flex items-center justify-between gap-3 z-20" style={{ boxShadow: "0 -2px 12px rgba(0,0,0,0.06)" }}>
          <p className="text-[12.5px] text-gray-500 font-medium">Ada perubahan yang belum disimpan</p>
          <div className="flex gap-2.5">
            <button onClick={handleResetDraft} className="px-4 py-2 border border-gray-200 text-gray-600 rounded-xl text-[12.5px] font-semibold hover:bg-gray-50 transition-all">
              Batalkan
            </button>
            <button onClick={handleSaveClick} className="px-5 py-2 text-white rounded-xl text-[12.5px] font-semibold transition-all active:scale-95" style={{ background: "#E30A17" }}>
              Simpan perubahan
            </button>
          </div>
        </div>
      )}

      {showConfirm && (
        <ConfirmSaveDialog
          onConfirm={handleConfirmSave}
          onCancel={() => setShowConfirm(false)}
          isSaving={isSaving}
        />
      )}
    </div>
  );
}