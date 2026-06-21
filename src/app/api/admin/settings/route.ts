import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("ssc_system_settings")
      .select("*")
      .eq("id", 1)
      .single();

    if (error) {
      console.error("Settings GET error:", error);
      return NextResponse.json(
        { error: "Gagal mengambil pengaturan." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Settings GET error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan server." }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { system_prompt, similarity_threshold, match_count } = body;

    if (!system_prompt || typeof system_prompt !== "string" || system_prompt.trim().length < 20) {
      return NextResponse.json(
        { error: "System prompt wajib diisi (minimal 20 karakter)." },
        { status: 400 }
      );
    }

    if (!system_prompt.includes("{context}")) {
      return NextResponse.json(
        { error: "System prompt harus menyertakan placeholder {context} agar dokumen bisa disisipkan." },
        { status: 400 }
      );
    }

    const threshold = Number(similarity_threshold);
    if (isNaN(threshold) || threshold < 0 || threshold > 1) {
      return NextResponse.json(
        { error: "Similarity threshold harus berupa angka antara 0.0 dan 1.0." },
        { status: 400 }
      );
    }

    const count = Number(match_count) || 5;
    if (count < 1 || count > 20) {
      return NextResponse.json(
        { error: "Jumlah dokumen yang diambil harus antara 1 dan 20." },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { error: updateError } = await supabaseAdmin
      .from("ssc_system_settings")
      .update({
        system_prompt: system_prompt.trim(),
        similarity_threshold: threshold,
        match_count: count,
        updated_at: new Date().toISOString(),
        updated_by: user?.email || "unknown",
      })
      .eq("id", 1);

    if (updateError) {
      console.error("Settings PUT error:", updateError);
      return NextResponse.json(
        { error: "Gagal menyimpan pengaturan." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Pengaturan AI berhasil diperbarui.",
    });
  } catch (error) {
    console.error("Settings PUT error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan server." }, { status: 500 });
  }
}