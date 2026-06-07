import { NextRequest, NextResponse } from "next/server";
import { ChatGroq } from "@langchain/groq";
import { HuggingFaceInferenceEmbeddings } from "@langchain/community/embeddings/hf";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { supabaseAdmin } from "@/lib/supabase";
import {
  SSC_SYSTEM_PROMPT,
  EMPTY_CONTEXT_MESSAGE,
  TIMEOUT_ERROR_MESSAGE,
} from "@/lib/prompts";

// Timeout 25 detik untuk Groq API (Vercel Functions timeout 30 detik)
const GROQ_TIMEOUT_MS = 25000;

// Inisialisasi model embedding
const embeddings = new HuggingFaceInferenceEmbeddings({
  apiKey: process.env.HUGGINGFACEHUB_API_KEY!,
  model: "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2",
});

// Inisialisasi Groq LLM
const llm = new ChatGroq({
  apiKey: process.env.GROQ_API_KEY!,
  model: "llama-3.1-8b-instant",
  temperature: 0.2,
  maxTokens: 1024,
});

// Helper: Promise race dengan timeout
function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(
      () => reject(new Error(`TIMEOUT: Operasi melebihi ${timeoutMs}ms`)),
      timeoutMs
    )
  );
  return Promise.race([promise, timeoutPromise]);
}

// POST /api/chat
export async function POST(request: NextRequest) {
  try {
    // Validasi input
    const body = await request.json();
    const { question } = body;

    if (!question || typeof question !== "string") {
      return NextResponse.json(
        { error: "Field 'question' wajib diisi dan harus berupa string." },
        { status: 400 }
      );
    }

    const trimmedQuestion = question.trim();
    if (trimmedQuestion.length < 3) {
      return NextResponse.json(
        { error: "Pertanyaan terlalu singkat. Minimal 3 karakter." },
        { status: 400 }
      );
    }

    if (trimmedQuestion.length > 1000) {
      return NextResponse.json(
        { error: "Pertanyaan terlalu panjang. Maksimal 1000 karakter." },
        { status: 400 }
      );
    }

    // Embed pertanyaan mahasiswa
    let queryEmbedding: number[];
    try {
      queryEmbedding = await embeddings.embedQuery(trimmedQuestion);
    } catch (embError) {
      console.error("Query embedding error:", embError);
      return NextResponse.json(
        {
          answer: TIMEOUT_ERROR_MESSAGE,
          sources: [],
          error_type: "EMBEDDING_ERROR",
        },
        { status: 200 }
      );
    }

    // Cari dokumen relevan via Vector Search
    const { data: matchedChunks, error: searchError } = await supabaseAdmin.rpc(
      "match_ssc_documents",
      {
        query_embedding: queryEmbedding,
        match_threshold: 0.5,   // Ambang batas kemiripan (bisa dikalibrasi)
        match_count: 5,         // Ambil 5 chunk terbaik
      }
    );

    if (searchError) {
      console.error("Vector search error:", searchError);
      return NextResponse.json(
        {
          answer: TIMEOUT_ERROR_MESSAGE,
          sources: [],
          error_type: "SEARCH_ERROR",
        },
        { status: 200 }
      );
    }

    // Periksa apakah ada konteks yang relevan
    if (!matchedChunks || matchedChunks.length === 0) {
      return NextResponse.json({
        answer: EMPTY_CONTEXT_MESSAGE,
        sources: [],
        has_context: false,
      });
    }

    // Rakit konteks dari chunks yang ditemukan
    const contextText = matchedChunks
      .map((chunk: any, index: number) => {
        const fileName = chunk.metadata?.file_name || "Dokumen Tidak Dikenal";
        return `[Dokumen ${index + 1}: ${fileName}]\n${chunk.content}`;
      })
      .join("\n\n---\n\n");

    // Kumpulkan nama dokumen unik sebagai sumber
    const sources = [
      ...new Set(
        matchedChunks.map(
          (chunk: any) => chunk.metadata?.file_name || "Dokumen SSC"
        )
      ),
    ];

    // Susun prompt dan kirim ke Groq (dengan timeout)
    const systemPromptWithContext = SSC_SYSTEM_PROMPT.replace(
      "{context}",
      contextText
    );

    let llmResponse;
    try {
      llmResponse = await withTimeout(
        llm.invoke([
          new SystemMessage(systemPromptWithContext),
          new HumanMessage(trimmedQuestion),
        ]),
        GROQ_TIMEOUT_MS
      );
    } catch (groqError: any) {
      console.error("Groq API error:", groqError.message);

      // Bedakan timeout dari error lain
      const isTimeout = groqError.message?.includes("TIMEOUT");
      return NextResponse.json(
        {
          answer: TIMEOUT_ERROR_MESSAGE,
          sources: [],
          error_type: isTimeout ? "GROQ_TIMEOUT" : "GROQ_ERROR",
        },
        { status: 200 }
      );
    }

    // Ekstrak teks jawaban dan kembalikan ke klien
    const answerText =
      typeof llmResponse.content === "string"
        ? llmResponse.content
        : JSON.stringify(llmResponse.content);

    return NextResponse.json({
      answer: answerText,
      sources: sources,
      has_context: true,
      chunk_count: matchedChunks.length,
    });
  } catch (error: any) {
    console.error("Chat API unhandled error:", error);
    return NextResponse.json(
      {
        answer: TIMEOUT_ERROR_MESSAGE,
        sources: [],
        error_type: "SERVER_ERROR",
      },
      { status: 200 }
    );
  }
}