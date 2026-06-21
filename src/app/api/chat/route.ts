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

const GROQ_TIMEOUT_MS = 25000;

const embeddings = new HuggingFaceInferenceEmbeddings({
  apiKey: process.env.HUGGINGFACEHUB_API_KEY!,
  model: "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2",
});

const llm = new ChatGroq({
  apiKey: process.env.GROQ_API_KEY!,
  model: "llama-3.1-8b-instant",
  temperature: 0.2,
  maxTokens: 1024,
});

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(
      () => reject(new Error(`TIMEOUT: Operasi melebihi ${timeoutMs}ms`)),
      timeoutMs
    )
  );
  return Promise.race([promise, timeoutPromise]);
}

async function logChatInteraction(params: {
  question: string;
  answer: string;
  hasContext: boolean;
  matchedDocIds: string[];
  errorType: string | null;
  responseTimeMs: number;
}) {
  try {
    await supabaseAdmin.from("ssc_chat_logs").insert({
      question: params.question,
      answer: params.answer,
      has_context: params.hasContext,
      matched_doc_ids: params.matchedDocIds,
      error_type: params.errorType,
      response_time_ms: params.responseTimeMs,
    });
  } catch (logError) {
    console.error("Gagal mencatat chat log:", logError);
  }
}

async function getActiveSettings() {
  const { data, error } = await supabaseAdmin
    .from("ssc_system_settings")
    .select("system_prompt, similarity_threshold, match_count")
    .eq("id", 1)
    .single();

  if (error || !data) {
    return {
      systemPrompt: SSC_SYSTEM_PROMPT,
      threshold: 0.5,
      matchCount: 5,
    };
  }

  return {
    systemPrompt: data.system_prompt || SSC_SYSTEM_PROMPT,
    threshold: data.similarity_threshold ?? 0.5,
    matchCount: data.match_count ?? 5,
  };
}

function isRequestingDocument(question: string): boolean {
  const lower = question.toLowerCase();
  const keywords = [
    // varian "kirim/kirimkan"
    "kirim dokumen", "kirimkan dokumen", "kirim file", "kirimkan file",
    "kirim pdf", "kirimkan pdf", "kirim link", "kirimkan link",
    // varian "link"
    "linknya", "link dokumen", "link nya", "minta link", "link download",
    "link nya dong", "berikan link", "kasih link", "link sumbernya",
    "url dokumen", "urlnya",
    // varian "sumber" -- INI YANG SEBELUMNYA HILANG
    "sumbernya", "sumber dokumen", "sumber dokumennya", "berikan sumber",
    "kasih sumber", "sumber lengkapnya",
    // varian "dokumen/file asli"
    "dokumen aslinya", "file aslinya", "dokumen lengkapnya", "file lengkapnya",
    "mau lihat dokumennya", "boleh minta dokumennya", "boleh lihat dokumennya",
    "lihat dokumen aslinya",
    // varian "download/unduh"
    "dimana saya bisa download", "cara download", "cara unduh",
    "boleh download", "boleh unduh", "unduh dokumennya",
  ];
  return keywords.some((kw) => lower.includes(kw));
}

function cleanQueryForEmbedding(question: string): string {
  let cleaned = question;
  const noisePhrases = [
    /berikan link dokumennya?/gi,
    /berikan sumbernya?/gi,
    /kirimkan? (dokumen|file|pdf|link)( ?nya)?/gi,
    /(boleh|bisa) (minta|lihat) (link|dokumen|file)( ?nya)?/gi,
    /link( nya)? dong/gi,
    /kasih (link|sumber)( ?nya)?/gi,
  ];
  for (const pattern of noisePhrases) {
    cleaned = cleaned.replace(pattern, "");
  }
  cleaned = cleaned.trim().replace(/\s+/g, " ");
  // Jika setelah dibersihkan jadi kosong/terlalu pendek, pakai pertanyaan asli
  return cleaned.length >= 3 ? cleaned : question;
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
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

    const { systemPrompt, threshold, matchCount } = await getActiveSettings();

    const queryForEmbedding = cleanQueryForEmbedding(trimmedQuestion);

    let queryEmbedding: number[];
    try {
      queryEmbedding = await embeddings.embedQuery(queryForEmbedding);
    } catch (embError) {
      console.error("Query embedding error:", embError);
      await logChatInteraction({
        question: trimmedQuestion,
        answer: TIMEOUT_ERROR_MESSAGE,
        hasContext: false,
        matchedDocIds: [],
        errorType: "EMBEDDING_ERROR",
        responseTimeMs: Date.now() - startTime,
      });
      return NextResponse.json(
        { answer: TIMEOUT_ERROR_MESSAGE, sources: [], error_type: "EMBEDDING_ERROR" },
        { status: 200 }
      );
    }

    const { data: matchedChunks, error: searchError } = await supabaseAdmin.rpc(
      "match_ssc_documents",
      {
        query_embedding: queryEmbedding,
        match_threshold: threshold,
        match_count: matchCount,
      }
    );

    if (searchError) {
      console.error("Vector search error:", searchError);
      await logChatInteraction({
        question: trimmedQuestion,
        answer: TIMEOUT_ERROR_MESSAGE,
        hasContext: false,
        matchedDocIds: [],
        errorType: "SEARCH_ERROR",
        responseTimeMs: Date.now() - startTime,
      });
      return NextResponse.json(
        { answer: TIMEOUT_ERROR_MESSAGE, sources: [], error_type: "SEARCH_ERROR" },
        { status: 200 }
      );
    }

    if (!matchedChunks || matchedChunks.length === 0) {
      await logChatInteraction({
        question: trimmedQuestion,
        answer: EMPTY_CONTEXT_MESSAGE,
        hasContext: false,
        matchedDocIds: [],
        errorType: null,
        responseTimeMs: Date.now() - startTime,
      });
      return NextResponse.json({
        answer: EMPTY_CONTEXT_MESSAGE,
        sources: [],
        has_context: false,
      });
    }

    const contextText = matchedChunks
      .map((chunk: any, index: number) => {
        const fileName = chunk.metadata?.file_name || "Dokumen Tidak Dikenal";
        return `[Dokumen ${index + 1}: ${fileName}]\n${chunk.content}`;
      })
      .join("\n\n---\n\n");

    const sources = [
      ...new Set(
        matchedChunks.map((chunk: any) => chunk.metadata?.file_name || "Dokumen SSC")
      ),
    ];

    const matchedDocIds = [
      ...new Set(matchedChunks.map((chunk: any) => chunk.doc_id as string)),
    ];

    const systemPromptWithContext = systemPrompt.replace("{context}", contextText);

    let llmResponse;
    try {
      llmResponse = await withTimeout(
        llm.invoke([
          new SystemMessage(systemPromptWithContext),
          new HumanMessage(trimmedQuestion), // tetap pakai pertanyaan ASLI untuk LLM
        ]),
        GROQ_TIMEOUT_MS
      );
    } catch (groqError: any) {
      console.error("Groq API error:", groqError.message);
      const isTimeout = groqError.message?.includes("TIMEOUT");
      await logChatInteraction({
        question: trimmedQuestion,
        answer: TIMEOUT_ERROR_MESSAGE,
        hasContext: false,
        matchedDocIds: [],
        errorType: isTimeout ? "GROQ_TIMEOUT" : "GROQ_ERROR",
        responseTimeMs: Date.now() - startTime,
      });
      return NextResponse.json(
        {
          answer: TIMEOUT_ERROR_MESSAGE,
          sources: [],
          error_type: isTimeout ? "GROQ_TIMEOUT" : "GROQ_ERROR",
        },
        { status: 200 }
      );
    }

    let answerText =
      typeof llmResponse.content === "string"
        ? llmResponse.content
        : JSON.stringify(llmResponse.content);

    // Deteksi intent dipakai dari pertanyaan ASLI (trimmedQuestion),
    // bukan dari queryForEmbedding yang sudah dibersihkan
    let documentLinks: { file_name: string; drive_link: string }[] = [];
    if (isRequestingDocument(trimmedQuestion) && matchedDocIds.length > 0) {
      const { data: docRows } = await supabaseAdmin
        .from("ssc_documents")
        .select("doc_id, drive_link, metadata")
        .in("doc_id", matchedDocIds)
        .not("drive_link", "is", null)
        .limit(matchedDocIds.length);

      const seen = new Set<string>();
      for (const row of docRows || []) {
        const fileName = row.metadata?.file_name || "Dokumen";
        if (row.drive_link && !seen.has(row.doc_id)) {
          seen.add(row.doc_id);
          documentLinks.push({ file_name: fileName, drive_link: row.drive_link });
        }
      }

      if (documentLinks.length > 0) {
        const linkText = documentLinks
          .map((d) => `📎 **${d.file_name}**: ${d.drive_link}`)
          .join("\n");
        answerText += `\n\nBerikut link dokumen yang kamu minta:\n${linkText}`;
      } else {
        answerText += `\n\nMaaf, link dokumen untuk topik ini belum tersedia. Silakan hubungi SSC langsung untuk mendapatkan salinannya.`;
      }
    }

    await logChatInteraction({
      question: trimmedQuestion,
      answer: answerText,
      hasContext: true,
      matchedDocIds,
      errorType: null,
      responseTimeMs: Date.now() - startTime,
    });

    return NextResponse.json({
      answer: answerText,
      sources: sources,
      has_context: true,
      chunk_count: matchedChunks.length,
      document_links: documentLinks,
    });
  } catch (error: any) {
    console.error("Chat API unhandled error:", error);
    await logChatInteraction({
      question: "—",
      answer: TIMEOUT_ERROR_MESSAGE,
      hasContext: false,
      matchedDocIds: [],
      errorType: "SERVER_ERROR",
      responseTimeMs: Date.now() - startTime,
    });
    return NextResponse.json(
      { answer: TIMEOUT_ERROR_MESSAGE, sources: [], error_type: "SERVER_ERROR" },
      { status: 200 }
    );
  }
}