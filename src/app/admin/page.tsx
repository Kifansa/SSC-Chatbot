
"use client";

import { useState, useEffect } from "react";

interface DashboardStats {
  total_documents: number;
  total_chunks: number;
  questions_today: number;
  questions_total: number;
  success_count_today: number;
  fallback_count_today: number;
  avg_response_time_ms: number;
}

interface PeakHour { hour: number; count: number; }
interface WeeklyTrendItem { date: string; total: number; success: number; }
interface RecentChat {
  id: number;
  question: string;
  has_context: boolean;
  error_type: string | null;
  created_at: string;
}
interface RecentDoc {
  doc_id: string;
  file_name: string;
  uploaded_at: string;
  chunk_count: number;
  status: string;
}

const DocIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
  </svg>
);
const ChatBubbleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);
const CheckCircleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);
const ClockIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
  </svg>
);
const RefreshIcon = ({ spin }: { spin?: boolean }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={spin ? "animate-spin" : ""}>
    <polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
  </svg>
);
const TrendUpIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" />
  </svg>
);

function Scorecard({ icon, label, value, sub, accent }: {
  icon: React.ReactNode; label: string; value: string | number; sub?: string; accent?: boolean;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${accent ? "text-white" : "text-[#E30A17]"}`}
             style={accent ? { background: "#E30A17" } : { background: "#FEF2F2" }}>
          {icon}
        </div>
      </div>
      <p className="text-[12.5px] text-gray-500 font-semibold mb-0.5">{label}</p>
      <p className="text-[26px] font-bold text-gray-900 leading-tight">{value}</p>
      {sub && <p className="text-[11.5px] text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
      <div className="w-10 h-10 rounded-xl bg-gray-100 mb-3" />
      <div className="w-20 h-3 bg-gray-100 rounded mb-2" />
      <div className="w-16 h-6 bg-gray-100 rounded" />
    </div>
  );
}

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [peakHours, setPeakHours] = useState<PeakHour[]>([]);
  const [weeklyTrend, setWeeklyTrend] = useState<WeeklyTrendItem[]>([]);
  const [recentChats, setRecentChats] = useState<RecentChat[]>([]);
  const [recentDocs, setRecentDocs] = useState<RecentDoc[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => { loadAnalytics(); }, []);

  const loadAnalytics = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/analytics");
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
        setPeakHours(data.peak_hours);
        setWeeklyTrend(data.weekly_trend);
        setRecentChats(data.recent_chats);
        setRecentDocs(data.recent_documents);
      }
    } catch (e) {
      console.error("Failed to load analytics:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const maxPeakCount = Math.max(...peakHours.map((p) => p.count), 1);
  const maxWeeklyCount = Math.max(...weeklyTrend.map((d) => d.total), 1);

  const successRate = stats && stats.questions_today > 0
    ? Math.round((stats.success_count_today / stats.questions_today) * 100)
    : 0;

  const formatRelativeTime = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Baru saja";
    if (mins < 60) return `${mins} menit lalu`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} jam lalu`;
    return `${Math.floor(hours / 24)} hari lalu`;
  };

  const dayLabels = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

  return (
    <div className="px-5 sm:px-8 py-6 sm:py-8 pt-16 lg:pt-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[22px] font-bold text-gray-900">Beranda</h1>
          <p className="text-[13px] text-gray-500 mt-0.5">Ringkasan status operasional chatbot SSC</p>
        </div>
        <button
          onClick={loadAnalytics}
          disabled={isLoading}
          className="flex items-center gap-1.5 text-[12.5px] font-semibold text-gray-600 hover:text-[#E30A17] border border-gray-200 hover:border-red-200 px-3 py-2 rounded-xl hover:bg-red-50 transition-all"
        >
          <RefreshIcon spin={isLoading} /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
        ) : (
          <>
            <Scorecard
              icon={<DocIcon />}
              label="Dokumen Aktif"
              value={stats?.total_documents ?? 0}
              sub={`${(stats?.total_chunks ?? 0).toLocaleString("id-ID")} total chunks`}
              accent
            />
            <Scorecard
              icon={<ChatBubbleIcon />}
              label="Pertanyaan Hari Ini"
              value={stats?.questions_today ?? 0}
              sub={`${(stats?.questions_total ?? 0).toLocaleString("id-ID")} sepanjang waktu`}
            />
            <Scorecard
              icon={<CheckCircleIcon />}
              label="Rasio Sukses"
              value={`${successRate}%`}
              sub={`${stats?.success_count_today ?? 0} sukses · ${stats?.fallback_count_today ?? 0} fallback`}
            />
            <Scorecard
              icon={<ClockIcon />}
              label="Waktu Respons"
              value={stats?.avg_response_time_ms ? `${(stats.avg_response_time_ms / 1000).toFixed(1)}s` : "—"}
              sub="Rata-rata hari ini"
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-5" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-[14.5px] font-bold text-gray-900">Jam sibuk mahasiswa</h2>
              <p className="text-[12px] text-gray-400">Distribusi pertanyaan per jam · 7 hari terakhir</p>
            </div>
          </div>

          {isLoading ? (
            <div className="h-44 bg-gray-50 rounded-xl animate-pulse" />
          ) : (
            <div className="flex items-end gap-1 h-44">
              {peakHours.map((p) => {
                const heightPct = Math.max((p.count / maxPeakCount) * 100, 2);
                const isPeak = p.count === maxPeakCount && p.count > 0;
                return (
                  <div key={p.hour} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                    <div className="hidden group-hover:block absolute -top-7 bg-gray-900 text-white text-[10px] px-2 py-1 rounded-md whitespace-nowrap z-10">
                      {p.hour}:00 · {p.count} pertanyaan
                    </div>
                    <div
                      className="w-full rounded-t-md transition-all"
                      style={{
                        height: `${heightPct}%`,
                        background: isPeak ? "#E30A17" : "#FECACA",
                        minHeight: "3px",
                      }}
                    />
                  </div>
                );
              })}
            </div>
          )}
          <div className="flex justify-between mt-2 text-[10px] text-gray-400 px-0.5">
            <span>00:00</span><span>06:00</span><span>12:00</span><span>18:00</span><span>23:00</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
          <div className="flex items-center gap-1.5 mb-4">
            <TrendUpIcon />
            <h2 className="text-[14.5px] font-bold text-gray-900">Tren 7 hari</h2>
          </div>

          {isLoading ? (
            <div className="h-44 bg-gray-50 rounded-xl animate-pulse" />
          ) : (
            <div className="space-y-2.5">
              {weeklyTrend.map((d) => {
                const date = new Date(d.date);
                const dayLabel = dayLabels[date.getDay()];
                const pct = (d.total / maxWeeklyCount) * 100;
                return (
                  <div key={d.date} className="flex items-center gap-2.5">
                    <span className="text-[10.5px] text-gray-400 font-medium w-7 flex-shrink-0">{dayLabel}</span>
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: "#E30A17" }} />
                    </div>
                    <span className="text-[11px] font-semibold text-gray-700 w-5 text-right flex-shrink-0">{d.total}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-[14.5px] font-bold text-gray-900">Aktivitas chat terbaru</h2>
          </div>
          {isLoading ? (
            <div className="p-5 space-y-3">
              {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-10 bg-gray-50 rounded-lg animate-pulse" />)}
            </div>
          ) : recentChats.length === 0 ? (
            <div className="py-10 text-center text-[12.5px] text-gray-400">Belum ada aktivitas chat</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {recentChats.map((chat) => (
                <div key={chat.id} className="px-5 py-3 flex items-start gap-3">
                  <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${chat.has_context ? "bg-green-500" : "bg-amber-400"}`} />
                  <div className="min-w-0 flex-1">
                    <p className="text-[12.5px] text-gray-800 truncate">{chat.question}</p>
                    <p className="text-[10.5px] text-gray-400 mt-0.5">
                      {chat.has_context ? "Berhasil dijawab" : "Fallback"} · {formatRelativeTime(chat.created_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-[14.5px] font-bold text-gray-900">Dokumen terbaru diunggah</h2>
            <a href="/admin/documents" className="text-[11.5px] font-semibold text-[#E30A17] hover:underline">Lihat semua</a>
          </div>
          {isLoading ? (
            <div className="p-5 space-y-3">
              {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-10 bg-gray-50 rounded-lg animate-pulse" />)}
            </div>
          ) : recentDocs.length === 0 ? (
            <div className="py-10 text-center text-[12.5px] text-gray-400">Belum ada dokumen diunggah</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {recentDocs.map((doc) => (
                <div key={doc.doc_id} className="px-5 py-3 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "#FEF2F2" }}>
                    <DocIcon />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[12.5px] font-medium text-gray-800 truncate">{doc.file_name}</p>
                    <p className="text-[10.5px] text-gray-400 mt-0.5">
                      {doc.chunk_count} chunks · {formatRelativeTime(doc.uploaded_at)}
                    </p>
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200 flex-shrink-0">
                    {doc.status === "ready" ? "Siap" : doc.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}