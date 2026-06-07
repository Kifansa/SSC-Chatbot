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
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);

const TrashIcon = () => (
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
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6M14 11v6" />
    <path d="M9 6V4h6v2" />
  </svg>
);

const EditIcon = () => (
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
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const RefreshIcon = ({ spin }: { spin?: boolean }) => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={spin ? "animate-spin" : ""}
  >
    <polyline points="23 4 23 10 17 10" />
    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
  </svg>
);

const FileIcon = () => (
  <svg
    width="28"
    height="28"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#9B1C1C"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);

// Sub-komponen: Stat Card
function StatCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  accent?: boolean;
}) {
  return (
    <div
      className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3.5"
      style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}
    >
      <div
        className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 text-xl
                       ${accent ? "text-white" : "bg-gray-50"}`}
        style={
          accent
            ? { background: "linear-gradient(135deg, #9B1C1C, #7A1515)" }
            : {}
        }
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500 font-medium truncate">{label}</p>
        <p
          className={`font-bold text-xl leading-tight ${accent ? "text-telkom-red" : "text-gray-900"}`}
          style={accent ? { color: "#9B1C1C" } : {}}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

// Sub-komponen: Alert
function Alert({
  type,
  message,
  onClose,
}: {
  type: "success" | "error" | "warning";
  message: string;
  onClose: () => void;
}) {
  const cfg = {
    success: { bg: "#F0FDF4", border: "#BBF7D0", text: "#166534", icon: "✅" },
    error: { bg: "#FEF2F2", border: "#FECACA", text: "#991B1B", icon: "❌" },
    warning: { bg: "#FFFBEB", border: "#FDE68A", text: "#92400E", icon: "⚠️" },
  }[type];

  return (
    <div
      className="flex items-start gap-3 px-4 py-3.5 rounded-xl border animate-slide-up"
      style={{ background: cfg.bg, borderColor: cfg.border }}
    >
      <span className="text-base flex-shrink-0 mt-0.5 leading-relaxed max-w-full break-words">
        {cfg.icon}
      </span>
      <p className="text-sm flex-1 leading-relaxed" style={{ color: cfg.text }}>
        {message}
      </p>
      <button
        onClick={onClose}
        className="flex-shrink-0 opacity-50 hover:opacity-100 transition-opacity"
        style={{ color: cfg.text }}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
}

// Sub-komponen: Delete Confirm Dialog
function DeleteDialog({
  doc,
  onConfirm,
  onCancel,
  isDeleting,
}: {
  doc: Document;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting: boolean;
}) {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div
        className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 animate-slide-up"
        style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.18)" }}
      >
        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "#FEF2F2" }}
          >
            <span className="text-xl">🗑️</span>
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-base">Hapus Dokumen</h3>
            <p className="text-xs text-gray-500">
              Tindakan ini permanen dan tidak bisa dibatalkan
            </p>
          </div>
        </div>

        <div
          className="rounded-xl px-3.5 py-3 mb-5 border"
          style={{ background: "#FEF2F2", borderColor: "#FECACA" }}
        >
          <p
            className="text-xs font-semibold mb-1"
            style={{ color: "#9B1C1C" }}
          >
            Dokumen yang akan dihapus:
          </p>
          <p className="text-sm font-medium text-gray-800 truncate">
            {doc.file_name}
          </p>
          <p className="text-xs text-gray-500 mt-0.5 leading-relaxed max-w-full break-words">
            {doc.chunk_count} chunks akan dihapus permanen
          </p>
        </div>

        <div className="flex gap-2.5">
          <button
            onClick={onCancel}
            disabled={isDeleting}
            className="flex-1 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Batal
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 py-2.5 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
            style={{ background: "linear-gradient(135deg, #9B1C1C, #7A1515)" }}
          >
            {isDeleting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Menghapus…
              </>
            ) : (
              "Ya, Hapus"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// Sub-komponen: Edit Description Dialog
function EditDialog({
  doc,
  onSave,
  onCancel,
  isSaving,
}: {
  doc: Document;
  onSave: (d: string) => void;
  onCancel: () => void;
  isSaving: boolean;
}) {
  const [desc, setDesc] = useState(doc.description || "");
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div
        className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 animate-slide-up"
        style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.18)" }}
      >
        <h3 className="font-bold text-gray-900 text-base mb-1 leading-relaxed max-w-full break-words">
          Edit Deskripsi
        </h3>
        <p className="text-xs text-gray-500 mb-4 truncate font-mono">
          {doc.file_name}
        </p>

        <textarea
          value={desc}
          onChange={(e) => setDesc(e.target.value.slice(0, 300))}
          rows={3}
          className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm resize-none mb-1 focus:outline-none transition-all"
          placeholder="Tulis deskripsi singkat dokumen ini…"
          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          onFocus={(e) => {
            e.target.style.borderColor = "#9B1C1C";
            e.target.style.boxShadow = "0 0 0 3px rgba(155,28,28,0.12)";
          }}
          onBlur={(e) => {
            e.target.style.borderColor = "#E5E7EB";
            e.target.style.boxShadow = "none";
          }}
        />
        <p className="text-xs text-gray-400 text-right mb-4">
          {desc.length}/300
        </p>

        <div className="flex gap-2.5">
          <button
            onClick={onCancel}
            disabled={isSaving}
            className="flex-1 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Batal
          </button>
          <button
            onClick={() => onSave(desc)}
            disabled={isSaving}
            className="flex-1 py-2.5 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
            style={{ background: "linear-gradient(135deg, #9B1C1C, #7A1515)" }}
          >
            {isSaving ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Menyimpan…
              </>
            ) : (
              "Simpan"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// Icons needed for enterprise layout
const DashboardIcon = () => (
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
    <rect x="3" y="3" width="7" height="9" />
    <rect x="14" y="3" width="7" height="5" />
    <rect x="14" y="12" width="7" height="9" />
    <rect x="3" y="16" width="7" height="5" />
  </svg>
);

const DocsIcon = () => (
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
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);

const SettingsIcon = () => (
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
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

const LinkIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <polyline points="15 3 21 3 21 9" />
    <line x1="10" y1="14" x2="21" y2="3" />
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

// Komponen Utama: Admin Page
export default function AdminPage() {
  return <ModernAdminDashboard />;
}

function ModernAdminDashboard() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [description, setDescription] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({
    step: "",
    percent: 0,
  });
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Document | null>(null);
  const [editTarget, setEditTarget] = useState<Document | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [alert, setAlert] = useState<{
    type: "success" | "error" | "warning";
    message: string;
  } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState("overview");

  const showAlert = (
    type: "success" | "error" | "warning",
    message: string,
  ) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  };

  const loadDocuments = async () => {
    setIsLoadingDocs(true);
    try {
      const res = await fetch("/api/documents");
      const data = await res.json();
      setDocuments(data.documents || []);
    } catch (err) {
      showAlert("error", "Gagal memuat daftar dokumen.");
    } finally {
      setIsLoadingDocs(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  const validateFile = (file: File) => {
    if (file.type !== "application/pdf")
      return "Hanya file PDF yang diizinkan.";
    if (file.size > 10 * 1024 * 1024) return "Ukuran file maksimal 10MB.";
    return null;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const err = validateFile(file);
    if (err) return showAlert("error", err);
    setSelectedFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    const err = validateFile(file);
    if (err) return showAlert("error", err);
    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setIsUploading(true);
    setUploadResult(null);

    const steps = [
      "Membaca file PDF...",
      "Mengekstrak teks...",
      "Memecah menjadi chunks...",
      "Membuat embeddings...",
      "Menyimpan ke database...",
    ];
    let si = 0;
    const interval = setInterval(() => {
      setUploadProgress({
        step: steps[si],
        percent: Math.min(20 + si * 15, 90),
      });
      if (si < steps.length - 1) si++;
    }, 800);

    try {
      const fd = new FormData();
      fd.append("file", selectedFile);
      fd.append("description", description);

      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      clearInterval(interval);

      if (!res.ok) throw new Error(data.error || "Gagal mengunggah dokumen");

      setUploadProgress({ step: "Selesai!", percent: 100 });
      setUploadResult(data.data);
      showAlert("success", "Dokumen berhasil diunggah dan diproses.");
      setSelectedFile(null);
      setDescription("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      loadDocuments();
    } catch (err: any) {
      clearInterval(interval);
      showAlert("error", err.message);
      setUploadProgress({ step: "", percent: 0 });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/documents?doc_id=${deleteTarget.doc_id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menghapus dokumen");
      showAlert("success", "Dokumen berhasil dihapus.");
      setDeleteTarget(null);
      loadDocuments();
    } catch (err: any) {
      showAlert("error", err.message);
    } finally {
      setIsDeleting(false);
    }
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
      if (!res.ok) throw new Error(data.error || "Gagal menyimpan perubahan");
      showAlert("success", "Deskripsi berhasil diperbarui.");
      setEditTarget(null);
      loadDocuments();
    } catch (err: any) {
      showAlert("error", err.message);
    } finally {
      setIsSavingEdit(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    const hour = String(d.getHours()).padStart(2, "0");
    const minute = String(d.getMinutes()).padStart(2, "0");
    return `${day}/${month}/${year} ${hour}:${minute}`;
  };

  const totalChunks = documents.reduce((acc, doc) => acc + doc.chunk_count, 0);

  return (
    <div className="flex h-screen bg-[#FAFAFA] font-sans text-gray-900 overflow-hidden">
      {/* SIDEBAR */}
      <aside className="hidden md:flex flex-col w-[260px] bg-white border-r border-gray-200 z-20 shrink-0 shadow-sm">
        <div className="h-[72px] flex items-center px-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <SSCLogoIcon className="w-9 h-9 flex-shrink-0" />
            <div>
              <h1 className="font-bold text-[16px] leading-tight text-gray-900">
                SSC Admin
              </h1>
              <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest mt-0.5">
                Dashboard
              </p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          <button
            onClick={() => setActiveTab("overview")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] font-semibold transition-all ${activeTab === "overview" ? "bg-red-50 text-[#E30A17] shadow-sm" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"}`}
          >
            <DashboardIcon /> Overview
          </button>
          <button
            onClick={() => setActiveTab("documents")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] font-semibold transition-all ${activeTab === "documents" ? "bg-red-50 text-[#E30A17] shadow-sm" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"}`}
          >
            <DocsIcon /> Documents
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] font-semibold transition-all ${activeTab === "settings" ? "bg-red-50 text-[#E30A17] shadow-sm" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"}`}
          >
            <SettingsIcon /> Settings
          </button>
        </nav>

        <div className="p-4 border-t border-gray-200 bg-gray-50/50">
          <div className="flex items-center gap-3 p-2.5 rounded-xl border border-transparent hover:border-gray-200 hover:shadow-sm cursor-pointer transition-all bg-white shadow-sm">
            <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 shrink-0">
              <UserIcon />
            </div>
            <div className="flex flex-col min-w-0">
              <p className="text-[13px] font-bold text-gray-900 truncate">
                Administrator
              </p>
              <p className="text-[11px] font-medium text-gray-500 truncate">
                admin.ssc@telkom.edu
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden relative">
        {/* HEADER */}
        <header className="h-[72px] bg-white border-b border-gray-200 flex items-center justify-between px-8 lg:px-10 shrink-0 z-10 sticky top-0 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="md:hidden flex items-center gap-3">
              <SSCLogoIcon className="w-9 h-9 sm:w-10 sm:h-10 flex-shrink-0" />
              <h2 className="font-bold text-[15px] text-gray-900">SSC Admin</h2>
            </div>
            <h2 className="hidden md:block font-bold text-gray-900 text-[18px] capitalize">
              {activeTab}
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="/"
              target="_blank"
              className="flex items-center gap-2 text-[13px] font-bold text-gray-700 hover:text-[#E30A17] transition-all bg-white hover:bg-red-50 border border-gray-200 hover:border-red-200 shadow-sm hover:shadow px-4 py-2 rounded-xl"
            >
              <span>Go to Chatbot</span>
              <LinkIcon />
            </a>
          </div>
        </header>

        {/* ALERTS (Absolute position) */}
        {alert && (
          <div className="absolute top-20 right-6 z-50 min-w-[300px] max-w-sm">
            <Alert
              type={alert.type}
              message={alert.message}
              onClose={() => setAlert(null)}
            />
          </div>
        )}

        {/* SCROLLABLE CONTENT */}
        <main className="flex-1 overflow-y-auto w-full bg-[#FAFAFA]">
          <div className="max-w-[1200px] mx-auto px-6 lg:px-10 py-8 flex flex-col gap-8 pb-24 pb-20">
            {/* OVERVIEW TAB */}
            {(activeTab === "overview" || activeTab === "documents") && (
              <>
                {/* STATS ROW */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex items-start gap-5 hover:shadow-md transition-shadow">
                    <div className="w-14 h-14 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0 border border-blue-100 shadow-sm">
                      <DocsIcon />
                    </div>
                    <div className="pt-0.5">
                      <p className="text-[13px] font-bold text-gray-500 mb-1 tracking-wide uppercase">
                        Total Documents
                      </p>
                      <p className="text-3xl font-black text-gray-900 leading-none mt-2">
                        {documents.length}
                      </p>
                    </div>
                  </div>
                  <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex items-start gap-5 hover:shadow-md transition-shadow">
                    <div className="w-14 h-14 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 shrink-0 border border-purple-100 shadow-sm">
                      <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                        <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                        <line x1="12" y1="22.08" x2="12" y2="12" />
                      </svg>
                    </div>
                    <div className="pt-0.5">
                      <p className="text-[13px] font-bold text-gray-500 mb-1 tracking-wide uppercase">
                        Total Vector Chunks
                      </p>
                      <p className="text-3xl font-black text-gray-900 leading-none mt-2">
                        {totalChunks}
                      </p>
                    </div>
                  </div>
                  <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex items-start gap-5 hover:shadow-md transition-shadow">
                    <div className="w-14 h-14 rounded-xl bg-green-50 flex items-center justify-center text-green-600 shrink-0 border border-green-100 shadow-sm">
                      <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                        <polyline points="22 4 12 14.01 9 11.01" />
                      </svg>
                    </div>
                    <div className="pt-0.5">
                      <p className="text-[13px] font-bold text-gray-500 mb-1 tracking-wide uppercase">
                        System Status
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse shadow-sm"></div>
                        <p className="text-[17px] font-bold text-green-700 leading-none">
                          Online & Ready
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* UPLOAD SECTION */}
                <section className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="px-8 py-5 border-b border-gray-200 bg-white">
                    <h3 className="font-bold text-gray-900 text-[16px] mb-1">
                      Upload Knowledge Base
                    </h3>
                    <p className="text-[13px] text-gray-500 font-medium">
                      Add new PDF documents to the AI's knowledge base.
                    </p>
                  </div>
                  <div className="p-8 bg-[#FAFAFA]/40">
                    <div className="flex flex-col lg:flex-row gap-8">
                      {/* Dropzone */}
                      <div
                        className={`flex-[1.2] relative border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center transition-all min-h-[260px] bg-white shadow-sm
                          ${isDragging ? "border-[#E30A17] bg-red-50/50 scale-[1.02]" : "border-gray-300 hover:border-[#E30A17] hover:bg-gray-50"}
                          ${selectedFile ? "border-green-400 bg-green-50/30" : ""}`}
                        onDragOver={(e) => {
                          e.preventDefault();
                          setIsDragging(true);
                        }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={handleDrop}
                      >
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleFileSelect}
                          accept="application/pdf"
                          className="hidden"
                        />

                        {!selectedFile ? (
                          <>
                            <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center text-[#E30A17] mb-4">
                              <UploadIcon />
                            </div>
                            <p className="text-[15px] font-bold text-gray-800 mb-1">
                              Drag and drop your PDF here
                            </p>
                            <p className="text-[13px] text-gray-500 mb-6 font-medium">
                              or click to browse from your computer (Max 10MB)
                            </p>
                            <button
                              onClick={() => fileInputRef.current?.click()}
                              className="px-5 py-2.5 bg-white border border-gray-300 hover:border-gray-400 text-gray-700 rounded-xl text-[14px] font-bold shadow-sm hover:shadow transition-all hover:bg-gray-50 active:scale-[0.98]"
                            >
                              Select File
                            </button>
                          </>
                        ) : (
                          <>
                            <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center text-green-600 mb-3 shadow-sm border border-green-200">
                              <FileIcon />
                            </div>
                            <p className="text-[15px] font-bold text-gray-900 mb-1 truncate max-w-[250px]">
                              {selectedFile.name}
                            </p>
                            <p className="text-[13px] font-medium text-gray-500 mb-5">
                              {formatBytes(selectedFile.size)}
                            </p>
                            <button
                              onClick={() => {
                                setSelectedFile(null);
                                if (fileInputRef.current)
                                  fileInputRef.current.value = "";
                              }}
                              className="text-[13px] text-[#E30A17] hover:text-red-700 font-bold px-4 py-2 border border-red-100 rounded-lg bg-red-50 hover:bg-red-100 transition-colors shadow-sm active:scale-[0.98]"
                            >
                              Remove / Change File
                            </button>
                          </>
                        )}
                      </div>

                      {/* Upload Form */}
                      <div className="flex-1 flex flex-col justify-center">
                        <label className="block text-[14px] font-bold text-gray-800 mb-2">
                          Document Description
                        </label>
                        <textarea
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          disabled={!selectedFile || isUploading}
                          rows={4}
                          placeholder="Briefly describe what this document is about (e.g., 'Pedoman Akademik 2024')..."
                          className="w-full border border-gray-300 rounded-2xl px-4 py-3.5 text-[14px] text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-red-50 focus:border-[#E30A17] transition-all resize-none shadow-sm disabled:bg-gray-100 disabled:text-gray-500"
                        />

                        <div className="mt-6">
                          <button
                            onClick={handleUpload}
                            disabled={!selectedFile || isUploading}
                            className="w-full px-6 py-3.5 bg-[#E30A17] hover:bg-red-700 text-white rounded-xl text-[15px] font-bold shadow-sm hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-[0.98]"
                          >
                            {isUploading ? (
                              <>
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>{" "}
                                Processing...
                              </>
                            ) : (
                              <>
                                <UploadIcon /> Upload to Knowledge Base
                              </>
                            )}
                          </button>
                        </div>

                        {/* Progress Bar */}
                        {isUploading && (
                          <div className="mt-6 bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
                            <div className="flex justify-between text-[13px] font-bold text-gray-700 mb-2.5">
                              <span>{uploadProgress.step}</span>
                              <span className="text-[#E30A17]">{Math.round(uploadProgress.percent)}%</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden border border-gray-200 shadow-inner">
                              <div
                                className="bg-[#E30A17] h-full rounded-full transition-all duration-300 shadow-sm"
                                style={{ width: `${uploadProgress.percent}%` }}
                              ></div>
                            </div>
                          </div>
                        )}

                        {/* Result summary */}
                        {uploadResult && !isUploading && (
                          <div className="mt-6 bg-green-50 border border-green-200 rounded-2xl p-5 flex items-start gap-3 shadow-sm">
                            <div className="w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5 shadow-sm">
                              ✓
                            </div>
                            <div>
                              <p className="text-[14px] font-bold text-green-800 mb-1">
                                Processing Complete
                              </p>
                              <p className="text-[13px] text-green-700 font-medium">
                                Created{" "}
                                <strong className="text-green-900 font-bold">
                                  {uploadResult.chunk_count} vector chunks
                                </strong>{" "}
                                from {uploadResult.page_count} pages.
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </section>

                {/* DOCUMENTS TABLE SECTION */}
                <section className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
                  <div className="px-8 py-5 border-b border-gray-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="font-bold text-gray-900 text-[16px] mb-1">
                        Active Documents
                      </h3>
                      <p className="text-[13px] text-gray-500 font-medium">
                        Manage files currently available to the AI assistant.
                      </p>
                    </div>
                    <button
                      onClick={loadDocuments}
                      disabled={isLoadingDocs}
                      className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-xl text-[13px] font-bold text-gray-700 hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50 transition-all shadow-sm active:scale-[0.98]"
                    >
                      <RefreshIcon spin={isLoadingDocs} /> Refresh
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-gray-50/80 border-b border-gray-200">
                          <th className="px-8 py-4 text-[12px] font-bold text-gray-500 uppercase tracking-widest">
                            Document Name
                          </th>
                          <th className="px-8 py-4 text-[12px] font-bold text-gray-500 uppercase tracking-widest">
                            Description
                          </th>
                          <th className="px-8 py-4 text-[12px] font-bold text-gray-500 uppercase tracking-widest">
                            Chunks
                          </th>
                          <th className="px-8 py-4 text-[12px] font-bold text-gray-500 uppercase tracking-widest">
                            Uploaded At
                          </th>
                          <th className="px-8 py-4 text-[12px] font-bold text-gray-500 uppercase tracking-widest text-right">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {documents.length === 0 ? (
                          <tr>
                            <td
                              colSpan={5}
                              className="px-6 py-16 text-center text-gray-500 text-[14px] font-medium"
                            >
                              {isLoadingDocs
                                ? (
                                  <div className="flex flex-col items-center gap-3">
                                    <RefreshIcon spin />
                                    <span>Loading documents...</span>
                                  </div>
                                )
                                : "No documents found. Upload a PDF to get started."}
                            </td>
                          </tr>
                        ) : (
                          documents.map((doc) => (
                            <tr
                              key={doc.doc_id}
                              className="hover:bg-gray-50/50 transition-colors group"
                            >
                              <td className="px-8 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-9 h-9 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center text-[#E30A17] shrink-0 shadow-sm">
                                    <svg
                                      width="16"
                                      height="16"
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
                                      <polyline points="10 9 9 9 8 9" />
                                    </svg>
                                  </div>
                                  <span
                                    className="font-bold text-[14px] text-gray-900 truncate max-w-[200px] xl:max-w-[250px]"
                                    title={doc.file_name}
                                  >
                                    {doc.file_name}
                                  </span>
                                </div>
                              </td>
                              <td className="px-8 py-4">
                                <span
                                  className="text-[13.5px] text-gray-600 truncate max-w-[200px] xl:max-w-[300px] block font-medium"
                                  title={doc.description || "-"}
                                >
                                  {doc.description || (
                                    <span className="text-gray-400 italic font-normal">
                                      No description
                                    </span>
                                  )}
                                </span>
                              </td>
                              <td className="px-8 py-4">
                                <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[13px] font-bold bg-gray-100 text-gray-700 border border-gray-200">
                                  {doc.chunk_count}
                                </span>
                              </td>
                              <td className="px-8 py-4">
                                <span className="text-[13px] font-medium text-gray-500 whitespace-nowrap">
                                  {formatDate(doc.uploaded_at)}
                                </span>
                              </td>
                              <td className="px-8 py-4 text-right">
                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button
                                    onClick={() => setEditTarget(doc)}
                                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors border border-transparent hover:border-blue-200 hover:shadow-sm"
                                    title="Edit Description"
                                  >
                                    <EditIcon />
                                  </button>
                                  <button
                                    onClick={() => setDeleteTarget(doc)}
                                    className="p-2 text-gray-400 hover:text-[#E30A17] hover:bg-red-50 rounded-xl transition-colors border border-transparent hover:border-red-200 hover:shadow-sm"
                                    title="Delete Document"
                                  >
                                    <TrashIcon />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>
              </>
            )}

            {/* SETTINGS TAB */}
            {activeTab === "settings" && (
              <section className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden max-w-3xl">
                <div className="px-8 py-5 border-b border-gray-200 bg-white">
                  <h3 className="font-bold text-gray-900 text-[16px] mb-1">
                    Panduan Kalibrasi AI
                  </h3>
                  <p className="text-[13px] text-gray-500 font-medium">
                    Tips untuk mendapatkan hasil AI yang lebih baik.
                  </p>
                </div>
                <div className="p-8 bg-[#FAFAFA]/40">
                  <div className="prose prose-sm text-[14px] text-gray-700 leading-relaxed">
                    <p className="mb-4 text-[15px]">
                      Kualitas jawaban AI sangat bergantung pada bagaimana
                      dokumen disusun. Ikuti panduan berikut saat menyiapkan
                      file PDF Anda:
                    </p>
                    <ul className="list-disc pl-5 space-y-3 mb-6">
                      <li>
                        <strong className="text-gray-900 font-bold">
                          Gunakan teks yang bisa diseleksi (Searchable PDF):
                        </strong>{" "}
                        Jangan gunakan hasil scan gambar/foto. Pastikan teks
                        bisa diblok dan di-copy.
                      </li>
                      <li>
                        <strong className="text-gray-900 font-bold">Struktur hierarki yang jelas:</strong> Gunakan
                        Heading (H1, H2, H3) secara konsisten agar AI mudah
                        memahami konteks.
                      </li>
                      <li>
                        <strong className="text-gray-900 font-bold">Satu topik per paragraf:</strong> Hindari
                        paragraf yang terlalu panjang dan bertele-tele.
                      </li>
                      <li>
                        <strong className="text-gray-900 font-bold">Tabel sederhana:</strong> AI kadang kesulitan
                        membaca tabel kompleks (merged cells). Jika mungkin,
                        ubah tabel menjadi list atau poin-poin.
                      </li>
                      <li>
                        <strong className="text-gray-900 font-bold">Tulis deksripsi spesifik:</strong> Saat
                        mengunggah, tulis deskripsi yang ringkas namun
                        informatif agar mudah dikenali.
                      </li>
                    </ul>
                    <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 flex gap-4 shadow-sm">
                      <span className="text-blue-500 text-xl">💡</span>
                      <p className="text-blue-900 text-[13.5px] font-semibold leading-relaxed">
                        Proses ekstraksi otomatis memecah dokumen menjadi
                        "chunks" (potongan kecil) agar pencarian semantik
                        berjalan efisien dan tidak melebihi token limit AI.
                      </p>
                    </div>
                  </div>
                </div>
              </section>
            )}
          </div>
        </main>
      </div>

      {/* DIALOGS */}
      {deleteTarget && (
        <DeleteDialog
          doc={deleteTarget}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          isDeleting={isDeleting}
        />
      )}
      {editTarget && (
        <EditDialog
          doc={editTarget}
          onSave={handleSaveEdit}
          onCancel={() => setEditTarget(null)}
          isSaving={isSavingEdit}
        />
      )}
    </div>
  );
}

function OldAdminPage() {
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
  const [alert, setAlert] = useState<{
    type: "success" | "error" | "warning";
    message: string;
  } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadDocuments();
  }, []);

  const showAlert = (
    type: "success" | "error" | "warning",
    message: string,
  ) => {
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
    } catch {
      showAlert("error", "Tidak dapat terhubung ke server.");
    } finally {
      setIsLoadingDocs(false);
    }
  };

  const validateFile = (file: File): string | null => {
    if (file.type !== "application/pdf") return "Hanya file PDF yang diterima.";
    if (file.size > 10 * 1024 * 1024) return "Ukuran file melebihi 10MB.";
    return null;
  };

  const handleFileSelect = (file: File) => {
    const err = validateFile(file);
    if (err) {
      showAlert("warning", err);
      return;
    }
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
    if (!selectedFile) {
      showAlert("warning", "Pilih file PDF terlebih dahulu.");
      return;
    }
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
      if (si < steps.length) {
        setUploadProgress(steps[si]);
        si++;
      }
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
        showAlert(
          "success",
          `Dokumen "${data.data.file_name}" berhasil diproses! ${data.data.chunk_count} chunks tersimpan.`,
        );
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
      const res = await fetch(`/api/documents?doc_id=${deleteTarget.doc_id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showAlert(
          "success",
          `Dokumen "${deleteTarget.file_name}" berhasil dihapus.`,
        );
        setDocuments((prev) =>
          prev.filter((d) => d.doc_id !== deleteTarget.doc_id),
        );
        setDeleteTarget(null);
      } else {
        showAlert("error", data.error || "Gagal menghapus.");
      }
    } catch {
      showAlert("error", "Koneksi terputus.");
    } finally {
      setIsDeleting(false);
    }
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
        setDocuments((prev) =>
          prev.map((d) =>
            d.doc_id === editTarget.doc_id ? { ...d, description: newDesc } : d,
          ),
        );
        setEditTarget(null);
      } else {
        showAlert("error", data.error || "Gagal memperbarui.");
      }
    } catch {
      showAlert("error", "Koneksi terputus.");
    } finally {
      setIsSavingEdit(false);
    }
  };

  const formatBytes = (b: number) =>
    b < 1048576
      ? `${(b / 1024).toFixed(0)} KB`
      : `${(b / 1048576).toFixed(1)} MB`;
  const formatDate = (s: string) =>
    new Date(s).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const totalChunks = documents.reduce((a, d) => a + d.chunk_count, 0);

  return (
    <div
      className="min-h-screen bg-diagonal-pattern"
      style={{ backgroundColor: "#F8F4F0" }}
    >
      {/* ===== HEADER ===== */}
      <header
        className="sticky top-0 z-20"
        style={{
          background: "linear-gradient(135deg, #9B1C1C 0%, #6B1212 100%)",
          boxShadow: "0 2px 20px rgba(155,28,28,0.35)",
        }}
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-8 py-4 flex items-center gap-3">
          {/* Branding */}
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <div className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center flex-shrink-0">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                <path d="M12 2L4 6v6c0 5.25 3.5 10.1 8 11.5C16.5 22.1 20 17.25 20 12V6l-8-4z" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-white font-bold text-sm leading-tight truncate">
                Dasbor Admin SSC
              </p>
              <p className="text-white/55 text-xs leading-tight truncate hidden sm:block">
                Manajemen Knowledge Base Chatbot
              </p>
            </div>
          </div>
          {/* Link ke chat */}
          <a
            href="/"
            className="flex items-center gap-1.5 text-xs font-semibold text-white/80 hover:text-white border border-white/20 hover:border-white/40 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-all flex-shrink-0"
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <span>Lihat Chat</span>
          </a>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-5">
        {/* ===== ALERT ===== */}
        {alert && (
          <Alert
            type={alert.type}
            message={alert.message}
            onClose={() => setAlert(null)}
          />
        )}

        {/* ===== STAT CARDS ===== */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <StatCard
            icon="📂"
            label="Total Dokumen"
            value={documents.length}
            accent
          />
          <StatCard
            icon="🧩"
            label="Total Chunks"
            value={totalChunks.toLocaleString("id-ID")}
          />
          <StatCard icon="✅" label="Status Sistem" value="Aktif" />
        </div>

        {/* ===== FORM UPLOAD ===== */}
        <div
          className="bg-white rounded-2xl border border-gray-100 overflow-hidden"
          style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}
        >
          {/* Header kartu */}
          <div
            className="px-5 py-4 border-b border-gray-100 flex items-center gap-2.5"
            style={{ background: "linear-gradient(135deg, #FEF2F2, #FFFFFF)" }}
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm flex-shrink-0"
              style={{
                background: "linear-gradient(135deg, #9B1C1C, #7A1515)",
              }}
            >
              <UploadIcon />
            </div>
            <div>
              <h2 className="font-bold text-gray-900 text-sm">
                Unggah Dokumen Baru
              </h2>
              <p className="text-xs text-gray-500">
                PDF berbasis teks · Maks. 10MB per file
              </p>
            </div>
          </div>

          <div className="p-5 space-y-4">
            {/* Dropzone */}
            <div
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200
                ${isDragging ? "border-telkom-red bg-red-50/50" : selectedFile ? "border-telkom-red bg-red-50/30" : "border-gray-200 hover:border-red-300 hover:bg-gray-50"}`}
              style={
                isDragging || selectedFile ? { borderColor: "#9B1C1C" } : {}
              }
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFileSelect(f);
                }}
                className="hidden"
              />

              {selectedFile ? (
                <div className="space-y-2">
                  <div className="flex justify-center">
                    <FileIcon />
                  </div>
                  <p className="font-semibold text-gray-800 text-sm">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatBytes(selectedFile.size)}
                  </p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                    className="text-xs font-medium hover:underline transition-colors"
                    style={{ color: "#9B1C1C" }}
                  >
                    × Ganti file
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div
                    className="w-12 h-12 rounded-full mx-auto flex items-center justify-center text-2xl"
                    style={{ background: "#FEF2F2" }}
                  >
                    📁
                  </div>
                  <p className="font-semibold text-gray-700 text-sm">
                    Drag & drop atau klik untuk pilih
                  </p>
                  <p className="text-xs text-gray-400">
                    Format PDF berbasis teks, maksimum 10MB
                  </p>
                </div>
              )}
            </div>

            {/* Input deskripsi */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Deskripsi{" "}
                <span className="text-gray-400 font-normal">(opsional)</span>
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
              <div
                className="flex items-center gap-3 px-4 py-3 rounded-xl border"
                style={{ background: "#FEF2F2", borderColor: "#FECACA" }}
              >
                <div
                  className="w-4 h-4 border-2 rounded-full animate-spin flex-shrink-0"
                  style={{ borderColor: "#FECACA", borderTopColor: "#9B1C1C" }}
                />
                <p className="text-sm font-medium" style={{ color: "#9B1C1C" }}>
                  {uploadProgress}
                </p>
              </div>
            )}

            {/* Hasil upload sukses */}
            {uploadResult && (
              <div
                className="flex items-start gap-3 px-4 py-3.5 rounded-xl border animate-slide-up"
                style={{ background: "#F0FDF4", borderColor: "#BBF7D0" }}
              >
                <span className="text-lg flex-shrink-0">🎉</span>
                <div className="text-xs text-green-800 space-y-0.5">
                  <p className="font-semibold text-sm">Upload berhasil!</p>
                  <p>
                    {uploadResult.chunk_count} chunks ·{" "}
                    {uploadResult.page_count} halaman ·{" "}
                    {uploadResult.character_count.toLocaleString("id-ID")}{" "}
                    karakter
                  </p>
                </div>
              </div>
            )}

            {/* Tombol upload */}
            <button
              onClick={handleUpload}
              disabled={!selectedFile || isUploading}
              className="w-full py-3 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background:
                  !selectedFile || isUploading
                    ? "#D1D5DB"
                    : "linear-gradient(135deg, #9B1C1C, #7A1515)",
                boxShadow:
                  !selectedFile || isUploading
                    ? "none"
                    : "0 3px 14px rgba(155,28,28,0.30)",
              }}
            >
              {isUploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Memproses…
                </>
              ) : (
                <>
                  <UploadIcon />
                  Unggah &amp; Proses Dokumen
                </>
              )}
            </button>
          </div>
        </div>

        {/* ===== DAFTAR DOKUMEN ===== */}
        <div
          className="bg-white rounded-2xl border border-gray-100 overflow-hidden"
          style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}
        >
          <div
            className="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-3"
            style={{ background: "linear-gradient(135deg, #FEF2F2, #FFFFFF)" }}
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">📚</span>
              <h2 className="font-bold text-gray-900 text-sm">
                Dokumen Aktif
                <span className="text-gray-400 font-normal ml-1.5">
                  ({documents.length})
                </span>
              </h2>
            </div>
            <button
              onClick={loadDocuments}
              disabled={isLoadingDocs}
              className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-800 border border-gray-200 hover:border-gray-300 px-2.5 py-1.5 rounded-lg hover:bg-gray-50 transition-all"
            >
              <RefreshIcon spin={isLoadingDocs} />
              Refresh
            </button>
          </div>

          {isLoadingDocs ? (
            <div className="py-14 text-center">
              <div
                className="w-8 h-8 border-2 rounded-full animate-spin mx-auto mb-3"
                style={{ borderColor: "#FECACA", borderTopColor: "#9B1C1C" }}
              />
              <p className="text-sm text-gray-400 font-medium">
                Memuat dokumen…
              </p>
            </div>
          ) : documents.length === 0 ? (
            <div className="py-14 text-center">
              <div className="text-4xl mb-3">📭</div>
              <p className="font-semibold text-gray-600 text-sm">
                Belum ada dokumen
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Unggah PDF di atas untuk mulai membangun knowledge base
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {documents.map((doc, i) => (
                <div
                  key={doc.doc_id}
                  className="px-5 py-4 flex items-start gap-4 hover:bg-gray-50/60 transition-colors animate-fade-in"
                  style={{ animationDelay: `${i * 40}ms` }}
                >
                  {/* Ikon file */}
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: "#FEF2F2" }}
                  >
                    <FileIcon />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-gray-900 text-sm truncate">
                          {doc.file_name}
                        </p>
                        {doc.description && (
                          <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                            {doc.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          <span
                            className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium border"
                            style={{
                              background: "#FEF2F2",
                              color: "#9B1C1C",
                              borderColor: "#FECACA",
                            }}
                          >
                            🧩 {doc.chunk_count} chunks
                          </span>
                          <span className="text-xs text-gray-400">
                            {formatDate(doc.uploaded_at)}
                          </span>
                        </div>
                      </div>

                      {/* Aksi */}
                      <div className="flex gap-1.5 flex-shrink-0">
                        <button
                          onClick={() => setEditTarget(doc)}
                          className="flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-blue-600 border border-gray-200 hover:border-blue-300 px-2.5 py-1.5 rounded-lg hover:bg-blue-50 transition-all"
                        >
                          <EditIcon /> Edit
                        </button>
                        <button
                          onClick={() => setDeleteTarget(doc)}
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
                          }}
                        >
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
        <div
          className="rounded-2xl border p-5"
          style={{ background: "#FFFBEB", borderColor: "#FDE68A" }}
        >
          <h3 className="font-bold text-amber-800 mb-2.5 flex items-center gap-2 text-sm">
            ⚙️ Panduan Kalibrasi Sistem
          </h3>
          <div className="space-y-1.5 text-xs text-amber-800">
            <p>
              📊 <strong>Similarity Threshold</strong> — Edit{" "}
              <code className="bg-amber-100 px-1.5 py-0.5 rounded font-mono">
                api/chat/route.ts
              </code>{" "}
              (default 0.5 · naikkan jika jawaban tidak relevan)
            </p>
            <p>
              ✂️ <strong>Chunk Size</strong> — Edit{" "}
              <code className="bg-amber-100 px-1.5 py-0.5 rounded font-mono">
                api/upload/route.ts
              </code>{" "}
              (default 700 · turunkan jika konteks terpotong)
            </p>
            <p>
              🗣️ <strong>System Prompt</strong> — Edit{" "}
              <code className="bg-amber-100 px-1.5 py-0.5 rounded font-mono">
                lib/prompts.ts
              </code>{" "}
              untuk menyesuaikan perilaku AI
            </p>
          </div>
        </div>

        {/* Telkom branding footer */}
        <div className="flex items-center justify-center gap-2 py-2">
          <div className="h-px flex-1 bg-gray-200" />
          <p className="text-xs text-gray-400 px-3 font-medium">
            SSC Chatbot · Telkom University Surabaya
          </p>
          <div className="h-px flex-1 bg-gray-200" />
        </div>
      </main>

      {/* Dialogs */}
      {deleteTarget && (
        <DeleteDialog
          doc={deleteTarget}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          isDeleting={isDeleting}
        />
      )}
      {editTarget && (
        <EditDialog
          doc={editTarget}
          onSave={handleSaveEdit}
          onCancel={() => setEditTarget(null)}
          isSaving={isSavingEdit}
        />
      )}
    </div>
  );
}
