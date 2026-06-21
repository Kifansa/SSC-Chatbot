import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  try {
    // 1. Statistik utama (scorecards) via fungsi SQL get_dashboard_stats
    const { data: statsData, error: statsError } = await supabaseAdmin.rpc(
      "get_dashboard_stats"
    );
    if (statsError) console.error("Stats RPC error:", statsError);

    // 2. Grafik jam sibuk (peak hours) - 7 hari terakhir
    const { data: peakHoursData, error: peakError } = await supabaseAdmin.rpc(
      "get_peak_hours",
      { days_back: 7 }
    );
    if (peakError) console.error("Peak hours RPC error:", peakError);

    const peakHoursMap = new Map(
      (peakHoursData || []).map((row: any) => [row.hour_of_day, Number(row.question_count)])
    );
    const peakHours = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      count: peakHoursMap.get(hour) || 0,
    }));

    // 3. Aktivitas terbaru - 5 pertanyaan terakhir
    const { data: recentChats, error: recentError } = await supabaseAdmin
      .from("ssc_chat_logs")
      .select("id, question, has_context, error_type, created_at")
      .order("created_at", { ascending: false })
      .limit(5);
    if (recentError) console.error("Recent chats error:", recentError);

    // 4. Dokumen terbaru diunggah - 5 item terakhir
    const { data: recentDocs, error: recentDocsError } = await supabaseAdmin
      .from("ssc_document_summary")
      .select("doc_id, file_name, uploaded_at, chunk_count, status")
      .order("uploaded_at", { ascending: false })
      .limit(5);
    if (recentDocsError) console.error("Recent docs error:", recentDocsError);

    // 5. Tren 7 hari terakhir (jumlah pertanyaan per hari)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const { data: weeklyLogs } = await supabaseAdmin
      .from("ssc_chat_logs")
      .select("created_at, has_context")
      .gte("created_at", sevenDaysAgo.toISOString());

    const dailyMap = new Map<string, { total: number; success: number }>();
    for (let i = 0; i < 7; i++) {
      const d = new Date(sevenDaysAgo);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      dailyMap.set(key, { total: 0, success: 0 });
    }
    for (const log of weeklyLogs || []) {
      const key = new Date(log.created_at).toISOString().slice(0, 10);
      const entry = dailyMap.get(key);
      if (entry) {
        entry.total += 1;
        if (log.has_context) entry.success += 1;
      }
    }
    const weeklyTrend = Array.from(dailyMap.entries()).map(([date, v]) => ({
      date,
      total: v.total,
      success: v.success,
    }));

    return NextResponse.json({
      success: true,
      stats: statsData || {
        total_documents: 0,
        total_chunks: 0,
        questions_today: 0,
        questions_total: 0,
        success_count_today: 0,
        fallback_count_today: 0,
        avg_response_time_ms: 0,
      },
      peak_hours: peakHours,
      recent_chats: recentChats || [],
      recent_documents: recentDocs || [],
      weekly_trend: weeklyTrend,
    });
  } catch (error) {
    console.error("Analytics API error:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data analitik." },
      { status: 500 }
    );
  }
}