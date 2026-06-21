import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

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

    const { data: sizeData, error: sizeError } = await supabaseAdmin.rpc(
      "get_table_size",
      { table_name: "ssc_documents" }
    );
    const dbSize = sizeError ? 0 : (sizeData || 0);

    return NextResponse.json({
      success: true,
      data: data || [],
      db_size: dbSize,
    });
  } catch (error) {
    console.error("Documents GET error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan server." }, { status: 500 });
  }
}

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

    const { data: existingChunks, error: checkError } = await supabaseAdmin
      .from("ssc_documents")
      .select("id")
      .eq("doc_id", docId)
      .limit(1);

    if (checkError) {
      return NextResponse.json({ error: "Gagal memeriksa dokumen." }, { status: 500 });
    }

    if (!existingChunks || existingChunks.length === 0) {
      return NextResponse.json(
        { error: `Dokumen dengan ID ${docId} tidak ditemukan.` },
        { status: 404 }
      );
    }

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
    return NextResponse.json({ error: "Terjadi kesalahan server." }, { status: 500 });
  }
}

// PATCH /api/documents?doc_id=xxxx
// Body bisa berisi: { description?: string, drive_link?: string }
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
    const { description, drive_link } = body;

    if (description === undefined && drive_link === undefined) {
      return NextResponse.json(
        { error: "Sertakan minimal salah satu field: description atau drive_link." },
        { status: 400 }
      );
    }

    // Validasi format link Google Drive (jika diisi)
    if (drive_link !== undefined && drive_link !== null && drive_link !== "") {
      const isValidDriveLink =
        /^https:\/\/(drive\.google\.com|docs\.google\.com)\//.test(drive_link);
      if (!isValidDriveLink) {
        return NextResponse.json(
          { error: "Link harus berupa URL Google Drive yang valid (diawali https://drive.google.com/ atau https://docs.google.com/)." },
          { status: 400 }
        );
      }
    }

    // Update drive_link (kolom langsung, berlaku untuk SEMUA chunk doc ini)
    if (drive_link !== undefined) {
      const { error: linkError } = await supabaseAdmin
        .from("ssc_documents")
        .update({ drive_link: drive_link || null })
        .eq("doc_id", docId);

      if (linkError) {
        console.error("Update drive_link error:", linkError);
        return NextResponse.json(
          { error: "Gagal menyimpan link Google Drive." },
          { status: 500 }
        );
      }
    }

    // Update description (di dalam metadata JSONB, per baris)
    if (description !== undefined) {
      if (typeof description !== "string") {
        return NextResponse.json(
          { error: "Field 'description' harus berupa string." },
          { status: 400 }
        );
      }

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
      message: "Dokumen berhasil diperbarui.",
    });
  } catch (error) {
    console.error("Documents PATCH error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan server." }, { status: 500 });
  }
}