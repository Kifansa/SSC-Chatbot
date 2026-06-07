import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// GET /api/documents
// Mengambil daftar ringkasan semua dokumen, diurutkan dari yang terbaru
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("ssc_document_summary")
      .select("*")
      .order("uploaded_at", { ascending: false });

    if (error) {
      console.error("Supabase GET error:", error);
      return NextResponse.json(
        { error: "Gagal mengambil daftar dokumen dari database." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: data || [] });
  } catch (error) {
    console.error("Documents GET error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server." },
      { status: 500 }
    );
  }
}

// DELETE /api/documents?doc_id=xxxx
// Menghapus SEMUA chunk yang terkait dengan sebuah dokumen berdasarkan doc_id
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const docId = searchParams.get("doc_id");

    if (!docId) {
      return NextResponse.json(
        { error: "Parameter doc_id wajib disertakan." },
        { status: 400 }
      );
    }

    // Verifikasi dokumen ada sebelum dihapus
    const { data: existingChunks, error: checkError } = await supabaseAdmin
      .from("ssc_documents")
      .select("id")
      .eq("doc_id", docId)
      .limit(1);

    if (checkError) {
      return NextResponse.json(
        { error: "Gagal memeriksa dokumen." },
        { status: 500 }
      );
    }

    if (!existingChunks || existingChunks.length === 0) {
      return NextResponse.json(
        { error: `Dokumen dengan ID ${docId} tidak ditemukan.` },
        { status: 404 }
      );
    }

    // Hapus semua chunk yang memiliki doc_id ini
    const { error: deleteError, count } = await supabaseAdmin
      .from("ssc_documents")
      .delete({ count: "exact" })
      .eq("doc_id", docId);

    if (deleteError) {
      console.error("Supabase DELETE error:", deleteError);
      return NextResponse.json(
        { error: "Gagal menghapus dokumen dari database." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Dokumen berhasil dihapus. ${count} chunks telah dihapus dari sistem.`,
      deleted_count: count,
    });
  } catch (error) {
    console.error("Documents DELETE error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server." },
      { status: 500 }
    );
  }
}

// PATCH /api/documents?doc_id=xxxx
// Update metadata (deskripsi) sebuah dokumen berdasarkan doc_id
export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const docId = searchParams.get("doc_id");

    if (!docId) {
      return NextResponse.json(
        { error: "Parameter doc_id wajib disertakan." },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { description } = body;

    if (typeof description !== "string") {
      return NextResponse.json(
        { error: "Field 'description' harus berupa string." },
        { status: 400 }
      );
    }

    // Update metadata.description untuk semua chunk dengan doc_id ini
    const { error: updateError } = await supabaseAdmin.rpc(
      "update_document_description",
      {
        p_doc_id: docId,
        p_description: description,
      }
    );

    // Fallback jika RPC belum dibuat: update langsung lewat query
    if (updateError) {
      // Ambil semua baris dulu, update metadata-nya satu per satu
      const { data: rows, error: fetchError } = await supabaseAdmin
        .from("ssc_documents")
        .select("id, metadata")
        .eq("doc_id", docId);

      if (fetchError || !rows) {
        return NextResponse.json(
          { error: "Gagal mengambil data dokumen untuk diperbarui." },
          { status: 500 }
        );
      }

      const updates = rows.map((row) =>
        supabaseAdmin
          .from("ssc_documents")
          .update({ metadata: { ...row.metadata, description } })
          .eq("id", row.id)
      );

      await Promise.all(updates);
    }

    return NextResponse.json({
      success: true,
      message: "Deskripsi dokumen berhasil diperbarui.",
    });
  } catch (error) {
    console.error("Documents PATCH error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server." },
      { status: 500 }
    );
  }
}