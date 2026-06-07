import { NextRequest, NextResponse } from "next/server";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { HuggingFaceInferenceEmbeddings } from "@langchain/community/embeddings/hf";
import { supabaseAdmin } from "@/lib/supabase";
import pdfParse from "pdf-parse";
import { randomUUID } from "crypto";

// Konfigurasi batas maksimum ukuran body request (10MB)
export const config = {
  api: {
    bodyParser: false,
  },
};

// Inisialisasi model embedding
const embeddings = new HuggingFaceInferenceEmbeddings({
  apiKey: process.env.HUGGINGFACEHUB_API_KEY!,
  model: "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2",
});

export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    // Terima dan validasi data form
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const description = (formData.get("description") as string) || "";

    if (!file) {
      return NextResponse.json(
        { error: "Tidak ada file yang diunggah." },
        { status: 400 }
      );
    }

    // Validasi tipe file
    if (file.type !== "application/pdf") {
      return NextResponse.json(
        { error: "Hanya file PDF yang diterima." },
        { status: 400 }
      );
    }

    // Validasi ukuran file (maksimum 10MB)
    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "Ukuran file melebihi batas maksimum 10MB." },
        { status: 400 }
      );
    }

    // Ekstraksi teks dari PDF
    const fileBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(fileBuffer);

    let pdfData;
    try {
      pdfData = await pdfParse(buffer);
    } catch (parseError) {
      return NextResponse.json(
        {
          error:
            "Gagal membaca file PDF. Pastikan file tidak rusak atau terenkripsi.",
        },
        { status: 422 }
      );
    }

    const rawText = pdfData.text.trim();

    // Validasi konten teks (cegah PDF scan/gambar)
    if (!rawText || rawText.length < 50) {
      return NextResponse.json(
        {
          error:
            "PDF tidak mengandung teks yang dapat dibaca. PDF hasil scan atau yang hanya berisi gambar belum didukung. Harap gunakan PDF berbasis teks.",
        },
        { status: 422 }
      );
    }

    // Pemecahan teks menjadi chunks
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 700,
      chunkOverlap: 100,
      separators: ["\n\n", "\n", ". ", " ", ""],
    });

    const chunks = await textSplitter.createDocuments([rawText]);

    if (chunks.length === 0) {
      return NextResponse.json(
        { error: "Tidak dapat memproses dokumen: hasil chunking kosong." },
        { status: 422 }
      );
    }

    // Buat ID unik untuk dokumen ini
    const docId = randomUUID();
    const fileName = file.name;

    // LANGKAH 6: Generate embeddings untuk setiap chunk
    const chunkTexts = chunks.map((chunk) => chunk.pageContent);

    let embeddingVectors: number[][];
    try {
      embeddingVectors = await embeddings.embedDocuments(chunkTexts);
    } catch (embError: any) {
      console.error("Embedding error:", embError);
      return NextResponse.json(
        {
          error:
            "Gagal memproses embedding. Kemungkinan API Hugging Face sedang tidak tersedia.",
        },
        { status: 503 }
      );
    }

    // Susun data untuk disimpan ke Supabase
    const rowsToInsert = chunks.map((chunk, index) => ({
      doc_id: docId,
      content: chunk.pageContent,
      metadata: {
        file_name: fileName,
        description: description,
        chunk_index: index,
        total_chunks: chunks.length,
        page_count: pdfData.numpages,
      },
      embedding: embeddingVectors[index],
    }));

    // Simpan ke Supabase dalam batch
    const BATCH_SIZE = 20;
    for (let i = 0; i < rowsToInsert.length; i += BATCH_SIZE) {
      const batch = rowsToInsert.slice(i, i + BATCH_SIZE);
      const { error: insertError } = await supabaseAdmin
        .from("ssc_documents")
        .insert(batch);

      if (insertError) {
        // Rollback: hapus chunks yang sudah tersimpan jika ada error
        await supabaseAdmin
          .from("ssc_documents")
          .delete()
          .eq("doc_id", docId);

        console.error("Supabase insert error:", insertError);
        return NextResponse.json(
          { error: "Gagal menyimpan dokumen ke database." },
          { status: 500 }
        );
      }
    }

    // Kembalikan respons sukses
    return NextResponse.json(
      {
        success: true,
        message: `Dokumen berhasil diproses dan disimpan.`,
        data: {
          doc_id: docId,
          file_name: fileName,
          chunk_count: chunks.length,
          page_count: pdfData.numpages,
          character_count: rawText.length,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Upload API error:", error);
    return NextResponse.json(
      {
        error: "Terjadi kesalahan server yang tidak terduga. Silakan coba lagi.",
      },
      { status: 500 }
    );
  }
}