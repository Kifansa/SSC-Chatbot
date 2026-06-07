"use client";

import { useState, useEffect, useRef } from "react";

// Types
interface Document {
  doc_id: string;
  file_name: string;
  description: string;
  chunk_count: number;
  uploaded_at: string;
}

interface UploadResult {
  doc_id: string;
  file_name: string;
  chunk_count: number;
  page_count: number;
  character_count: number;
}

// Ikon SVG inline
const UploadIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);

const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6M14 11v6" />
    <path d="M9 6V4h6v2" />
  </svg>
);

const EditIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const RefreshIcon = ({ spin }: { spin?: boolean }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
       className={spin ? "animate-spin" : ""}>
    <polyline points="23 4 23 10 17 10" />
    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
  </svg>
);

const FileIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#9B1C1C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);

// Sub-komponen: Stat Card
function StatCard({ icon, label, value, accent }: {
  icon: React.ReactNode; label: string; value: string | number; accent?: boolean;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3.5"
         style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 text-xl
                       ${accent ? "text-white" : "bg-gray-50"}`}
           style={accent ? { background: "linear-gradient(135deg, #9B1C1C, #7A1515)" } : {}}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500 font-medium truncate">{label}</p>
        <p className={`font-bold text-xl leading-tight ${accent ? "text-telkom-red" : "text-gray-900"}`}
           style={accent ? { color: "#9B1C1C" } : {}}>
          {value}
        </p>
      </div>
    </div>
  );
}

// Sub-komponen: Alert
function Alert({ type, message, onClose }: {
  type: "success" | "error" | "warning";
  message: string;
  onClose: () => void;
}) {
  const cfg = {
    success: { bg: "#F0FDF4", border: "#BBF7D0", text: "#166534", icon: "✅" },
    error:   { bg: "#FEF2F2", border: "#FECACA", text: "#991B1B", icon: "❌" },
    warning: { bg: "#FFFBEB", border: "#FDE68A", text: "#92400E", icon: "⚠️" },
  }[type];

  return (
    <div className="flex items-start gap-3 px-4 py-3.5 rounded-xl border animate-slide-up"
         style={{ background: cfg.bg, borderColor: cfg.border }}>
      <span className="text-base flex-shrink-0 mt-0.5">{cfg.icon}</span>
      <p className="text-sm flex-1 leading-relaxed" style={{ color: cfg.text }}>{message}</p>
      <button onClick={onClose} className="flex-shrink-0 opacity-50 hover:opacity-100 transition-opacity" style={{ color: cfg.text }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
  );
}

// Sub-komponen: Delete Confirm Dialog
function DeleteDialog({ doc, onConfirm, onCancel, isDeleting }: {
  doc: Document; onConfirm: () => void; onCancel: () => void; isDeleting: boolean;
}) {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 animate-slide-up"
           style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.18)" }}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
               style={{ background: "#FEF2F2" }}>
            <span className="text-xl">🗑️</span>
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-base">Hapus Dokumen</h3>
            <p className="text-xs text-gray-500">Tindakan ini permanen dan tidak bisa dibatalkan</p>
          </div>
        </div>

        <div className="rounded-xl px-3.5 py-3 mb-5 border" style={{ background: "#FEF2F2", borderColor: "#FECACA" }}>
          <p className="text-xs font-semibold mb-1" style={{ color: "#9B1C1C" }}>Dokumen yang akan dihapus:</p>
          <p className="text-sm font-medium text-gray-800 truncate">{doc.file_name}</p>
          <p className="text-xs text-gray-500 mt-0.5">{doc.chunk_count} chunks akan dihapus permanen</p>
        </div>

        <div className="flex gap-2.5">
          <button onClick={onCancel} disabled={isDeleting}
                  className="flex-1 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50">
            Batal
          </button>
          <button onClick={onConfirm} disabled={isDeleting}
                  className="flex-1 py-2.5 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                  style={{ background: "linear-gradient(135deg, #9B1C1C, #7A1515)" }}>
            {isDeleting
              ? <><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Menghapus…</>
              : "Ya, Hapus"}
          </button>
        </div>
      </div>
    </div>
  );
}

// Sub-komponen: Edit Description Dialog
function EditDialog({ doc, onSave, onCancel, isSaving }: {
  doc: Document; onSave: (d: string) => void; onCancel: () => void; isSaving: boolean;
}) {
  const [desc, setDesc] = useState(doc.description || "");
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 animate-slide-up"
           style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.18)" }}>
        <h3 className="font-bold text-gray-900 text-base mb-1">Edit Deskripsi</h3>
        <p className="text-xs text-gray-500 mb-4 truncate font-mono">{doc.file_name}</p>

        <textarea
          value={desc}
          onChange={(e) => setDesc(e.target.value.slice(0, 300))}
          rows={3}
          className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm resize-none mb-1 focus:outline-none transition-all"
          placeholder="Tulis deskripsi singkat dokumen ini…"
          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          onFocus={(e) => { e.target.style.borderColor = "#9B1C1C"; e.target.style.boxShadow = "0 0 0 3px rgba(155,28,28,0.12)"; }}
          onBlur={(e) => { e.target.style.borderColor = "#E5E7EB"; e.target.style.boxShadow = "none"; }}
        />
        <p className="text-xs text-gray-400 text-right mb-4">{desc.length}/300</p>

        <div className="flex gap-2.5">
          <button onClick={onCancel} disabled={isSaving}
                  className="flex-1 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50">
            Batal
          </button>
          <button onClick={() => onSave(desc)} disabled={isSaving}
                  className="flex-1 py-2.5 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                  style={{ background: "linear-gradient(135deg, #9B1C1C, #7A1515)" }}>
            {isSaving
              ? <><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Menyimpan…</>
              : "Simpan"}
          </button>
        </div>
      </div>
    </div>
  );
}

// Komponen Utama: Admin Page
export default function AdminPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [description, setDescription] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Document | null>(null);
  const [editTarget, setEditTarget] = useState<Document | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [alert, setAlert] = useState<{ type: "success" | "error" | "warning"; message: string } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { loadDocuments(); }, []);

  const showAlert = (type: "success" | "error" | "warning", message: string) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 6000);
  };

  const loadDocuments = async () => {
    setIsLoadingDocs(true);
    try {
      const res = await fetch("/api/documents");
      const data = await res.json();
      if (data.success) setDocuments(data.data);
      else showAlert("error", data.error || "Gagal memuat dokumen.");
    } catch { showAlert("error", "Tidak dapat terhubung ke server."); }
    finally { setIsLoadingDocs(false); }
  };

  const validateFile = (file: File): string | null => {
    if (file.type !== "application/pdf") return "Hanya file PDF yang diterima.";
    if (file.size > 10 * 1024 * 1024) return "Ukuran file melebihi 10MB.";
    return null;
  };

  const handleFileSelect = (file: File) => {
    const err = validateFile(file);
    if (err) { showAlert("warning", err); return; }
    setSelectedFile(file);
    setUploadResult(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) { showAlert("warning", "Pilih file PDF terlebih dahulu."); return; }
    setIsUploading(true);
    setUploadResult(null);

    const steps = [
      "📄 Mengekstrak teks dari PDF…",
      "✂️  Memecah teks menjadi chunks…",
      "🧠 Membuat embedding vektor…",
      "💾 Menyimpan ke database…",
    ];
    let si = 0;
    const interval = setInterval(() => {
      if (si < steps.length) { setUploadProgress(steps[si]); si++; }
    }, 2200);

    try {
      const fd = new FormData();
      fd.append("file", selectedFile);
      fd.append("description", description);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      clearInterval(interval);
      const data = await res.json();

      if (res.ok && data.success) {
        setUploadResult(data.data);
        showAlert("success", `Dokumen "${data.data.file_name}" berhasil diproses! ${data.data.chunk_count} chunks tersimpan.`);
        setSelectedFile(null);
        setDescription("");
        if (fileInputRef.current) fileInputRef.current.value = "";
        await loadDocuments();
      } else {
        showAlert("error", data.error || "Upload gagal.");
      }
    } catch {
      clearInterval(interval);
      showAlert("error", "Koneksi terputus saat upload.");
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/documents?doc_id=${deleteTarget.doc_id}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok && data.success) {
        showAlert("success", `Dokumen "${deleteTarget.file_name}" berhasil dihapus.`);
        setDocuments((prev) => prev.filter((d) => d.doc_id !== deleteTarget.doc_id));
        setDeleteTarget(null);
      } else { showAlert("error", data.error || "Gagal menghapus."); }
    } catch { showAlert("error", "Koneksi terputus."); }
    finally { setIsDeleting(false); }
  };

  const handleSaveEdit = async (newDesc: string) => {
    if (!editTarget) return;
    setIsSavingEdit(true);
    try {
      const res = await fetch(`/api/documents?doc_id=${editTarget.doc_id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: newDesc }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showAlert("success", "Deskripsi berhasil diperbarui.");
        setDocuments((prev) => prev.map((d) => d.doc_id === editTarget.doc_id ? { ...d, description: newDesc } : d));
        setEditTarget(null);
      } else { showAlert("error", data.error || "Gagal memperbarui."); }
    } catch { showAlert("error", "Koneksi terputus."); }
    finally { setIsSavingEdit(false); }
  };

  const formatBytes = (b: number) => b < 1048576 ? `${(b / 1024).toFixed(0)} KB` : `${(b / 1048576).toFixed(1)} MB`;
  const formatDate = (s: string) => new Date(s).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

  const totalChunks = documents.reduce((a, d) => a + d.chunk_count, 0);

  return (
    <div className="min-h-screen bg-diagonal-pattern" style={{ backgroundColor: "#F8F4F0" }}>

      {/* ===== HEADER ===== */}
      <header className="sticky top-0 z-20"
              style={{ background: "linear-gradient(135deg, #9B1C1C 0%, #6B1212 100%)", boxShadow: "0 2px 20px rgba(155,28,28,0.35)" }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3.5 flex items-center gap-3">
          {/* Branding */}
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <div className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center flex-shrink-0">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                <path d="M12 2L4 6v6c0 5.25 3.5 10.1 8 11.5C16.5 22.1 20 17.25 20 12V6l-8-4z"/>
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-white font-bold text-sm leading-tight truncate">Dasbor Admin SSC</p>
              <p className="text-white/55 text-xs leading-tight truncate hidden sm:block">Manajemen Knowledge Base Chatbot</p>
            </div>
          </div>
          {/* Link ke chat */}
          <a href="/"
             className="flex items-center gap-1.5 text-xs font-semibold text-white/80 hover:text-white border border-white/20 hover:border-white/40 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-all flex-shrink-0">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            <span>Lihat Chat</span>
          </a>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-5">

        {/* ===== ALERT ===== */}
        {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

        {/* ===== STAT CARDS ===== */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <StatCard icon="📂" label="Total Dokumen"  value={documents.length} accent />
          <StatCard icon="🧩" label="Total Chunks"   value={totalChunks.toLocaleString("id-ID")} />
          <StatCard icon="✅" label="Status Sistem"  value="Aktif" />
        </div>

        {/* ===== FORM UPLOAD ===== */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden"
             style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
          {/* Header kartu */}
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2.5"
               style={{ background: "linear-gradient(135deg, #FEF2F2, #FFFFFF)" }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm flex-shrink-0"
                 style={{ background: "linear-gradient(135deg, #9B1C1C, #7A1515)" }}>
              <UploadIcon />
            </div>
            <div>
              <h2 className="font-bold text-gray-900 text-sm">Unggah Dokumen Baru</h2>
              <p className="text-xs text-gray-500">PDF berbasis teks · Maks. 10MB per file</p>
            </div>
          </div>

          <div className="p-5 space-y-4">
            {/* Dropzone */}
            <div
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200
                ${isDragging ? "border-telkom-red bg-red-50/50" : selectedFile ? "border-telkom-red bg-red-50/30" : "border-gray-200 hover:border-red-300 hover:bg-gray-50"}`}
              style={isDragging || selectedFile ? { borderColor: "#9B1C1C" } : {}}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
            >
              <input ref={fileInputRef} type="file" accept="application/pdf"
                     onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); }}
                     className="hidden" />

              {selectedFile ? (
                <div className="space-y-2">
                  <div className="flex justify-center"><FileIcon /></div>
                  <p className="font-semibold text-gray-800 text-sm">{selectedFile.name}</p>
                  <p className="text-xs text-gray-500">{formatBytes(selectedFile.size)}</p>
                  <button onClick={(e) => { e.stopPropagation(); setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                          className="text-xs font-medium hover:underline transition-colors"
                          style={{ color: "#9B1C1C" }}>
                    × Ganti file
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="w-12 h-12 rounded-full mx-auto flex items-center justify-center text-2xl"
                       style={{ background: "#FEF2F2" }}>📁</div>
                  <p className="font-semibold text-gray-700 text-sm">Drag & drop atau klik untuk pilih</p>
                  <p className="text-xs text-gray-400">Format PDF berbasis teks, maksimum 10MB</p>
                </div>
              )}
            </div>

            {/* Input deskripsi */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Deskripsi <span className="text-gray-400 font-normal">(opsional)</span>
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value.slice(0, 200))}
                placeholder="Contoh: Panduan Cuti Akademik Semester Ganjil 2024/2025"
                className="input-field"
                maxLength={200}
              />
            </div>

            {/* Progress step */}
            {isUploading && uploadProgress && (
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl border"
                   style={{ background: "#FEF2F2", borderColor: "#FECACA" }}>
                <div className="w-4 h-4 border-2 rounded-full animate-spin flex-shrink-0"
                     style={{ borderColor: "#FECACA", borderTopColor: "#9B1C1C" }} />
                <p className="text-sm font-medium" style={{ color: "#9B1C1C" }}>{uploadProgress}</p>
              </div>
            )}

            {/* Hasil upload sukses */}
            {uploadResult && (
              <div className="flex items-start gap-3 px-4 py-3.5 rounded-xl border animate-slide-up"
                   style={{ background: "#F0FDF4", borderColor: "#BBF7D0" }}>
                <span className="text-lg flex-shrink-0">🎉</span>
                <div className="text-xs text-green-800 space-y-0.5">
                  <p className="font-semibold text-sm">Upload berhasil!</p>
                  <p>{uploadResult.chunk_count} chunks · {uploadResult.page_count} halaman · {uploadResult.character_count.toLocaleString("id-ID")} karakter</p>
                </div>
              </div>
            )}

            {/* Tombol upload */}
            <button onClick={handleUpload} disabled={!selectedFile || isUploading}
                    className="w-full py-3 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{
                      background: !selectedFile || isUploading ? "#D1D5DB" : "linear-gradient(135deg, #9B1C1C, #7A1515)",
                      boxShadow: !selectedFile || isUploading ? "none" : "0 3px 14px rgba(155,28,28,0.30)"
                    }}>
              {isUploading
                ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Memproses…</>
                : <><UploadIcon />Unggah &amp; Proses Dokumen</>
              }
            </button>
          </div>
        </div>

        {/* ===== DAFTAR DOKUMEN ===== */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden"
             style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-3"
               style={{ background: "linear-gradient(135deg, #FEF2F2, #FFFFFF)" }}>
            <div className="flex items-center gap-2">
              <span className="text-lg">📚</span>
              <h2 className="font-bold text-gray-900 text-sm">
                Dokumen Aktif
                <span className="text-gray-400 font-normal ml-1.5">({documents.length})</span>
              </h2>
            </div>
            <button onClick={loadDocuments} disabled={isLoadingDocs}
                    className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-800 border border-gray-200 hover:border-gray-300 px-2.5 py-1.5 rounded-lg hover:bg-gray-50 transition-all">
              <RefreshIcon spin={isLoadingDocs} />
              Refresh
            </button>
          </div>

          {isLoadingDocs ? (
            <div className="py-14 text-center">
              <div className="w-8 h-8 border-2 rounded-full animate-spin mx-auto mb-3"
                   style={{ borderColor: "#FECACA", borderTopColor: "#9B1C1C" }} />
              <p className="text-sm text-gray-400 font-medium">Memuat dokumen…</p>
            </div>
          ) : documents.length === 0 ? (
            <div className="py-14 text-center">
              <div className="text-4xl mb-3">📭</div>
              <p className="font-semibold text-gray-600 text-sm">Belum ada dokumen</p>
              <p className="text-xs text-gray-400 mt-1">Unggah PDF di atas untuk mulai membangun knowledge base</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {documents.map((doc, i) => (
                <div key={doc.doc_id}
                     className="px-5 py-4 flex items-start gap-4 hover:bg-gray-50/60 transition-colors animate-fade-in"
                     style={{ animationDelay: `${i * 40}ms` }}>
                  {/* Ikon file */}
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                       style={{ background: "#FEF2F2" }}>
                    <FileIcon />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-gray-900 text-sm truncate">{doc.file_name}</p>
                        {doc.description && (
                          <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{doc.description}</p>
                        )}
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium border"
                                style={{ background: "#FEF2F2", color: "#9B1C1C", borderColor: "#FECACA" }}>
                            🧩 {doc.chunk_count} chunks
                          </span>
                          <span className="text-xs text-gray-400">{formatDate(doc.uploaded_at)}</span>
                        </div>
                      </div>

                      {/* Aksi */}
                      <div className="flex gap-1.5 flex-shrink-0">
                        <button onClick={() => setEditTarget(doc)}
                                className="flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-blue-600 border border-gray-200 hover:border-blue-300 px-2.5 py-1.5 rounded-lg hover:bg-blue-50 transition-all">
                          <EditIcon /> Edit
                        </button>
                        <button onClick={() => setDeleteTarget(doc)}
                                className="flex items-center gap-1 text-xs font-medium text-gray-500 border border-gray-200 px-2.5 py-1.5 rounded-lg transition-all"
                                style={{}}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.color = "#9B1C1C";
                                  e.currentTarget.style.borderColor = "#FECACA";
                                  e.currentTarget.style.background = "#FEF2F2";
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.color = "";
                                  e.currentTarget.style.borderColor = "";
                                  e.currentTarget.style.background = "";
                                }}>
                          <TrashIcon /> Hapus
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ===== PANDUAN KALIBRASI ===== */}
        <div className="rounded-2xl border p-5" style={{ background: "#FFFBEB", borderColor: "#FDE68A" }}>
          <h3 className="font-bold text-amber-800 mb-2.5 flex items-center gap-2 text-sm">
            ⚙️ Panduan Kalibrasi Sistem
          </h3>
          <div className="space-y-1.5 text-xs text-amber-800">
            <p>📊 <strong>Similarity Threshold</strong> — Edit <code className="bg-amber-100 px-1.5 py-0.5 rounded font-mono">api/chat/route.ts</code> (default 0.5 · naikkan jika jawaban tidak relevan)</p>
            <p>✂️ <strong>Chunk Size</strong> — Edit <code className="bg-amber-100 px-1.5 py-0.5 rounded font-mono">api/upload/route.ts</code> (default 700 · turunkan jika konteks terpotong)</p>
            <p>🗣️ <strong>System Prompt</strong> — Edit <code className="bg-amber-100 px-1.5 py-0.5 rounded font-mono">lib/prompts.ts</code> untuk menyesuaikan perilaku AI</p>
          </div>
        </div>

        {/* Telkom branding footer */}
        <div className="flex items-center justify-center gap-2 py-2">
          <div className="h-px flex-1 bg-gray-200" />
          <p className="text-xs text-gray-400 px-3 font-medium">SSC Chatbot · Telkom University Surabaya</p>
          <div className="h-px flex-1 bg-gray-200" />
        </div>
      </main>

      {/* Dialogs */}
      {deleteTarget && <DeleteDialog doc={deleteTarget} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} isDeleting={isDeleting} />}
      {editTarget  && <EditDialog   doc={editTarget}   onSave={handleSaveEdit}  onCancel={() => setEditTarget(null)}  isSaving={isSavingEdit} />}
    </div>
  );
}