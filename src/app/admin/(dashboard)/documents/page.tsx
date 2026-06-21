"use client";

import { useState, useEffect, useRef } from "react";

interface Document {
  doc_id: string;
  file_name: string;
  description: string;
  drive_link: string | null;
  status: string;
  chunk_count: number;
  page_count: string | null;
  uploaded_at: string;
}

interface UploadResult {
  doc_id: string;
  file_name: string;
  chunk_count: number;
  page_count: number;
  character_count: number;
}

const UploadIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);
const FileIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#E30A17" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
  </svg>
);
const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
  </svg>
);
const EyeIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
  </svg>
);
const LinkIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </svg>
);
const SearchIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; bg: string; text: string; border: string }> = {
    ready:      { label: "Siap digunakan", bg: "#F0FDF4", text: "#166534", border: "#BBF7D0" },
    extracting: { label: "Mengekstrak teks", bg: "#FFFBEB", text: "#92400E", border: "#FDE68A" },
    chunking:   { label: "Memecah teks", bg: "#FFFBEB", text: "#92400E", border: "#FDE68A" },
    embedding:  { label: "Membuat embedding", bg: "#FFFBEB", text: "#92400E", border: "#FDE68A" },
    failed:     { label: "Gagal diproses", bg: "#FEF2F2", text: "#991B1B", border: "#FECACA" },
  };
  const c = config[status] || config.ready;
  return (
    <span className="inline-flex items-center gap-1.5 text-[10.5px] font-semibold px-2.5 py-1 rounded-full border" style={{ background: c.bg, color: c.text, borderColor: c.border }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: c.text }} />
      {c.label}
    </span>
  );
}

function Alert({ type, message, onClose }: { type: "success" | "error" | "warning"; message: string; onClose: () => void; }) {
  const cfg = {
    success: { bg: "#F0FDF4", border: "#BBF7D0", text: "#166534" },
    error:   { bg: "#FEF2F2", border: "#FECACA", text: "#991B1B" },
    warning: { bg: "#FFFBEB", border: "#FDE68A", text: "#92400E" },
  }[type];
  return (
    <div className="flex items-start gap-3 px-4 py-3.5 rounded-xl border animate-slide-up mb-4" style={{ background: cfg.bg, borderColor: cfg.border }}>
      <p className="text-[13px] flex-1 leading-relaxed font-medium" style={{ color: cfg.text }}>{message}</p>
      <button onClick={onClose} className="flex-shrink-0 opacity-50 hover:opacity-100" style={{ color: cfg.text }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
      </button>
    </div>
  );
}

function DeleteDialog({ doc, onConfirm, onCancel, isDeleting }: { doc: Document; onConfirm: () => void; onCancel: () => void; isDeleting: boolean; }) {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6">
        <h3 className="font-bold text-gray-900 text-base mb-1">Hapus dokumen</h3>
        <p className="text-[12.5px] text-gray-500 mb-4">Tindakan ini permanen dan tidak bisa dibatalkan.</p>
        <div className="rounded-xl px-3.5 py-3 mb-5 border" style={{ background: "#FEF2F2", borderColor: "#FECACA" }}>
          <p className="text-[13px] font-medium text-gray-800 truncate">{doc.file_name}</p>
          <p className="text-[11.5px] text-gray-500 mt-0.5">{doc.chunk_count} chunks akan dihapus permanen</p>
        </div>
        <div className="flex gap-2.5">
          <button onClick={onCancel} disabled={isDeleting} className="flex-1 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-[13px] font-semibold hover:bg-gray-50 disabled:opacity-50">Batal</button>
          <button onClick={onConfirm} disabled={isDeleting} className="flex-1 py-2.5 text-white rounded-xl text-[13px] font-semibold flex items-center justify-center gap-2 disabled:opacity-50" style={{ background: "#E30A17" }}>
            {isDeleting ? <><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Menghapus…</> : "Ya, hapus"}
          </button>
        </div>
      </div>
    </div>
  );
}

function EditDialog({ doc, onSave, onCancel, isSaving }: { doc: Document; onSave: (d: { description: string; drive_link: string }) => void; onCancel: () => void; isSaving: boolean; }) {
  const [desc, setDesc] = useState(doc.description || "");
  const [link, setLink] = useState(doc.drive_link || "");
  const [linkError, setLinkError] = useState<string | null>(null);

  const handleSave = () => {
    if (link && !/^https:\/\/(drive\.google\.com|docs\.google\.com)\//.test(link)) {
      setLinkError("Link harus diawali https://drive.google.com/");
      return;
    }
    setLinkError(null);
    onSave({ description: desc, drive_link: link });
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
        <h3 className="font-bold text-gray-900 text-base mb-1">Edit dokumen</h3>
        <p className="text-[12px] text-gray-500 mb-4 truncate font-mono">{doc.file_name}</p>

        <label className="block text-[12.5px] font-semibold text-gray-700 mb-1.5">Deskripsi</label>
        <textarea
          value={desc}
          onChange={(e) => setDesc(e.target.value.slice(0, 300))}
          rows={2}
          className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-[13px] resize-none mb-4 focus:outline-none focus:ring-4 focus:ring-red-50 focus:border-[#E30A17] transition-all"
          placeholder="Deskripsi singkat dokumen…"
        />

        <label className="flex items-center gap-1.5 text-[12.5px] font-semibold text-gray-700 mb-1.5">
          <LinkIcon /> Link Google Drive
        </label>
        <input
          type="url"
          value={link}
          onChange={(e) => { setLink(e.target.value); setLinkError(null); }}
          placeholder="https://drive.google.com/file/d/…"
          className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-[13px] mb-1 focus:outline-none focus:ring-4 focus:ring-red-50 focus:border-[#E30A17] transition-all"
        />
        {linkError && <p className="text-[11.5px] text-red-600 mb-3">{linkError}</p>}
        <p className="text-[11px] text-gray-400 mb-4">
          Link ini akan dikirim ke mahasiswa saat mereka meminta dokumen asli.
        </p>

        <div className="flex gap-2.5">
          <button onClick={onCancel} disabled={isSaving} className="flex-1 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-[13px] font-semibold hover:bg-gray-50 disabled:opacity-50">Batal</button>
          <button onClick={handleSave} disabled={isSaving} className="flex-1 py-2.5 text-white rounded-xl text-[13px] font-semibold flex items-center justify-center gap-2 disabled:opacity-50" style={{ background: "#E30A17" }}>
            {isSaving ? <><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Menyimpan…</> : "Simpan"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DocumentsManagementPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(true);
  const [search, setSearch] = useState("");

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [description, setDescription] = useState("");
  const [driveLink, setDriveLink] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [deleteTarget, setDeleteTarget] = useState<Document | null>(null);
  const [editTarget, setEditTarget] = useState<Document | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const [alert, setAlert] = useState<{ type: "success" | "error" | "warning"; message: string } | null>(null);

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

  const validateDriveLink = (link: string): string | null => {
    if (!link) return null;
    if (!/^https:\/\/(drive\.google\.com|docs\.google\.com)\//.test(link)) {
      return "Link harus diawali https://drive.google.com/";
    }
    return null;
  };

  const handleUpload = async () => {
    if (!selectedFile) { showAlert("warning", "Pilih file PDF terlebih dahulu."); return; }

    const linkErr = validateDriveLink(driveLink);
    if (linkErr) { showAlert("warning", linkErr); return; }

    setIsUploading(true);
    setUploadResult(null);

    const steps = ["Mengekstrak teks dari PDF…", "Memecah teks menjadi chunks…", "Membuat embedding vektor…", "Menyimpan ke database…"];
    let si = 0;
    const interval = setInterval(() => { if (si < steps.length) { setUploadProgress(steps[si]); si++; } }, 2200);

    try {
      const fd = new FormData();
      fd.append("file", selectedFile);
      fd.append("description", description);
      fd.append("drive_link", driveLink);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      clearInterval(interval);
      const data = await res.json();

      if (res.ok && data.success) {
        setUploadResult(data.data);
        showAlert("success", `Dokumen "${data.data.file_name}" berhasil diproses! ${data.data.chunk_count} chunks tersimpan.`);
        setSelectedFile(null);
        setDescription("");
        setDriveLink("");
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

  const handleSaveEdit = async (payload: { description: string; drive_link: string }) => {
    if (!editTarget) return;
    setIsSavingEdit(true);
    try {
      const res = await fetch(`/api/documents?doc_id=${editTarget.doc_id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showAlert("success", "Dokumen berhasil diperbarui.");
        setDocuments((prev) => prev.map((d) => d.doc_id === editTarget.doc_id ? { ...d, description: payload.description, drive_link: payload.drive_link } : d));
        setEditTarget(null);
      } else { showAlert("error", data.error || "Gagal memperbarui."); }
    } catch { showAlert("error", "Koneksi terputus."); }
    finally { setIsSavingEdit(false); }
  };

  const formatBytes = (b: number) => b < 1048576 ? `${(b / 1024).toFixed(0)} KB` : `${(b / 1048576).toFixed(1)} MB`;
  const formatDate = (s: string) => new Date(s).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

  const filteredDocs = documents.filter((d) =>
    d.file_name.toLowerCase().includes(search.toLowerCase()) ||
    (d.description || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="px-5 sm:px-8 py-6 sm:py-8 pt-16 lg:pt-8 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-[22px] font-bold text-gray-900">Manajemen Dokumen</h1>
        <p className="text-[13px] text-gray-500 mt-0.5">Pusat pengetahuan (knowledge base) chatbot SSC</p>
      </div>

      {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden mb-6" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white flex-shrink-0" style={{ background: "#E30A17" }}>
            <UploadIcon />
          </div>
          <div>
            <h2 className="font-bold text-gray-900 text-[14.5px]">Unggah dokumen baru</h2>
            <p className="text-[12px] text-gray-500">PDF berbasis teks · maksimum 10MB per berkas</p>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
            <div className="lg:col-span-3">
              <div
                className={`h-full min-h-[180px] border-2 border-dashed rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer transition-all p-8
                  ${isDragging || selectedFile ? "bg-red-50/40" : "border-gray-200 hover:border-red-200 hover:bg-gray-50"}`}
                style={isDragging || selectedFile ? { borderColor: "#E30A17" } : {}}
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
                    <p className="font-semibold text-gray-800 text-[14px]">{selectedFile.name}</p>
                    <p className="text-[12px] text-gray-500">{formatBytes(selectedFile.size)}</p>
                    <button onClick={(e) => { e.stopPropagation(); setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                            className="text-[12px] font-medium hover:underline" style={{ color: "#E30A17" }}>
                      × Ganti berkas
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="w-14 h-14 rounded-full mx-auto flex items-center justify-center" style={{ background: "#FEF2F2" }}>
                      <UploadIcon />
                    </div>
                    <p className="font-semibold text-gray-700 text-[14px]">Tarik & lepas berkas PDF di sini</p>
                    <p className="text-[12px] text-gray-400">atau klik untuk memilih dari perangkat</p>
                  </div>
                )}
              </div>
            </div>

            <div className="lg:col-span-2 space-y-3.5">
              <div>
                <label className="block text-[12.5px] font-semibold text-gray-700 mb-1.5">
                  Deskripsi <span className="text-gray-400 font-normal">(opsional)</span>
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value.slice(0, 200))}
                  placeholder="Mis. Panduan Cuti Akademik 2024/2025"
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-[13px] focus:outline-none focus:ring-4 focus:ring-red-50 focus:border-[#E30A17] transition-all"
                />
              </div>

              <div>
                <label className="flex items-center gap-1.5 text-[12.5px] font-semibold text-gray-700 mb-1.5">
                  <LinkIcon /> Link Google Drive <span className="text-gray-400 font-normal">(opsional)</span>
                </label>
                <input
                  type="url"
                  value={driveLink}
                  onChange={(e) => setDriveLink(e.target.value)}
                  placeholder="https://drive.google.com/file/d/…"
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-[13px] focus:outline-none focus:ring-4 focus:ring-red-50 focus:border-[#E30A17] transition-all"
                />
                <p className="text-[11px] text-gray-400 mt-1.5 leading-relaxed">
                  Jika diisi, chatbot bisa mengirim link ini saat mahasiswa meminta dokumen asli.
                </p>
              </div>

              {isUploading && uploadProgress && (
                <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border" style={{ background: "#FEF2F2", borderColor: "#FECACA" }}>
                  <div className="w-3.5 h-3.5 border-2 rounded-full animate-spin flex-shrink-0" style={{ borderColor: "#FECACA", borderTopColor: "#E30A17" }} />
                  <p className="text-[12px] font-medium" style={{ color: "#E30A17" }}>{uploadProgress}</p>
                </div>
              )}

              {uploadResult && (
                <div className="px-3.5 py-2.5 rounded-xl border" style={{ background: "#F0FDF4", borderColor: "#BBF7D0" }}>
                  <p className="text-[12px] font-semibold text-green-800">Upload berhasil!</p>
                  <p className="text-[11px] text-green-700">{uploadResult.chunk_count} chunks · {uploadResult.page_count} halaman</p>
                </div>
              )}

              <button onClick={handleUpload} disabled={!selectedFile || isUploading}
                      className="w-full py-3 text-white font-bold text-[13.5px] rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-40"
                      style={{ background: !selectedFile || isUploading ? "#D1D5DB" : "#E30A17" }}>
                {isUploading ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Memproses…</> : <><UploadIcon />Unggah & Proses</>}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between gap-3 flex-wrap">
          <h2 className="font-bold text-gray-900 text-[14.5px]">
            Inventaris dokumen <span className="text-gray-400 font-normal">({filteredDocs.length})</span>
          </h2>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><SearchIcon /></div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari dokumen…"
              className="pl-9 pr-3 py-2 text-[12.5px] border border-gray-200 rounded-lg w-48 focus:outline-none focus:ring-2 focus:ring-red-50 focus:border-[#E30A17]"
            />
          </div>
        </div>

        {isLoadingDocs ? (
          <div className="py-14 text-center">
            <div className="w-8 h-8 border-2 rounded-full animate-spin mx-auto mb-3" style={{ borderColor: "#FECACA", borderTopColor: "#E30A17" }} />
            <p className="text-[13px] text-gray-400 font-medium">Memuat dokumen…</p>
          </div>
        ) : filteredDocs.length === 0 ? (
          <div className="py-14 text-center">
            <p className="font-semibold text-gray-600 text-[13.5px]">{documents.length === 0 ? "Belum ada dokumen" : "Tidak ditemukan"}</p>
            <p className="text-[12px] text-gray-400 mt-1">{documents.length === 0 ? "Unggah PDF di atas untuk mulai membangun knowledge base" : "Coba kata kunci lain"}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left" style={{ tableLayout: "fixed" }}>
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  <th className="px-6 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wide" style={{ width: "32%" }}>Nama dokumen</th>
                  <th className="px-3 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wide" style={{ width: "15%" }}>Diunggah</th>
                  <th className="px-3 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wide" style={{ width: "17%" }}>Status</th>
                  <th className="px-3 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wide" style={{ width: "12%" }}>Drive</th>
                  <th className="px-3 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wide text-right" style={{ width: "24%" }}>Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredDocs.map((doc) => (
                  <tr key={doc.doc_id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "#FEF2F2" }}>
                          <FileIcon />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[12.5px] font-semibold text-gray-900 truncate">{doc.file_name}</p>
                          <p className="text-[11px] text-gray-400 truncate">{doc.chunk_count} chunks{doc.page_count ? ` · ${doc.page_count} hal.` : ""}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3.5 text-[12px] text-gray-500">{formatDate(doc.uploaded_at)}</td>
                    <td className="px-3 py-3.5"><StatusBadge status={doc.status} /></td>
                    <td className="px-3 py-3.5">
                      {doc.drive_link ? (
                        <span className="inline-flex items-center gap-1 text-[10.5px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                          <LinkIcon /> Terhubung
                        </span>
                      ) : (
                        <span className="text-[11px] text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-3 py-3.5">
                      <div className="flex justify-end gap-1.5">
                        {doc.drive_link && (
                          <a href={doc.drive_link} target="_blank" rel="noopener noreferrer"
                             className="flex items-center gap-1 text-[11.5px] font-medium text-gray-500 hover:text-blue-600 border border-gray-200 hover:border-blue-300 px-2.5 py-1.5 rounded-lg hover:bg-blue-50 transition-all">
                            <EyeIcon /> Lihat
                          </a>
                        )}
                        <button onClick={() => setEditTarget(doc)}
                                className="flex items-center gap-1 text-[11.5px] font-medium text-gray-500 hover:text-gray-800 border border-gray-200 px-2.5 py-1.5 rounded-lg hover:bg-gray-50 transition-all">
                          Edit
                        </button>
                        <button onClick={() => setDeleteTarget(doc)}
                                className="flex items-center gap-1 text-[11.5px] font-medium text-gray-500 border border-gray-200 px-2.5 py-1.5 rounded-lg transition-all hover:text-red-700 hover:border-red-200 hover:bg-red-50">
                          <TrashIcon /> Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {deleteTarget && <DeleteDialog doc={deleteTarget} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} isDeleting={isDeleting} />}
      {editTarget && <EditDialog doc={editTarget} onSave={handleSaveEdit} onCancel={() => setEditTarget(null)} isSaving={isSavingEdit} />}
    </div>
  );
}