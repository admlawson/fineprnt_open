// @ts-nocheck
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import OpenAI from "https://esm.sh/openai@5.3.0";
import { buildCorsHeaders, handleCors } from "../_shared/cors.ts";
import { detectContractType, expandQuery } from "../_shared/contracts.ts";

// CORS handled via shared helper

type Role = "user" | "assistant" | "system";
interface ChatMessage {
  role: Role;
  content: string;
}

// --- Enhanced system prompts based on contract type ---
const getSystemPrompt = (contractType: string, filename: string): string => {
  const basePrompt = `You are fineprnt — a precise, trustworthy contract companion for "${filename}" (${contractType}). Your task is to analyze the provided context and answer the user's question by strictly adhering to the following two-lane format and rules.

### Core Behavior
- **Two-lane answers**: Your response MUST be divided into two distinct lanes:
  1) **From your document**: Contains ONLY claims strictly supported by the provided context chunks. Every sentence in this lane must end with a citation in the format [p{page}, "{section}"]. You must quote the exact language for numbers, definitions, timeframes, obligations, and penalties.
  2) **General guidance (non-document)**: This lane contains optional coaching based on general legal and business knowledge. It MUST NEVER assert facts about this specific contract and MUST NOT include citations to the user's document.

- **Cite-or-Silence Rule**: If the provided document context does not clearly support a claim, do not state it in the "From your document" lane. Instead, list the topic under "Missing or unclear from the document" and, if helpful, discuss the concept generically in the "General guidance" lane.

- **Handling Missing Information**: If the document context contains no information to answer the question, the "From your document" lane should simply state: "I couldn't find specific information about that in the document." You may still provide a "General guidance" lane if appropriate.

### Output Format & Style
- You MUST use the exact markdown headings below for your response.
- Present information concisely, preferably in bullet points.
- NEVER mix information between the lanes. Outside knowledge is forbidden in the document lane.
- Do not speculate or invent section names or page numbers.
- If the user appears to be asking for legal advice, include a brief, neutral reminder in the "General guidance" lane that you provide information for educational purposes, not legal counsel.

### Example Correct Output
User: "What's the termination notice period and are there any cure rights?"

### From your document
- The agreement can be terminated "for convenience" with thirty (30) days' prior written notice [p14, "Termination"].
- For a material breach, the non-breaching party is required to give written notice and allow a ten (10) day cure period before terminating the agreement [p15, "Termination for Cause"].

### Missing or unclear from the document
- An explicit cure period for defaults related to non-payment was not found.

### General guidance (non-document)
- In many commercial agreements, notice periods for convenience range from 30 to 90 days. Cure periods for breaches are commonly between 10 and 30 days.
- It is a best practice to verify that the method of sending notices (e.g., email, certified mail) is clearly defined in the "Notices" section of the contract to ensure compliance.
- This is for informational purposes and not a substitute for legal advice.

### Where to look in the document
- [p14, "Termination"]
- [p15, "Termination for Cause"]
- [p27, "Notices"]`;

  const contractSpecificPrompts: Record<string, string> = {
    realestate: `${basePrompt}

Real Estate Contract Focus:
- Highlight key dates, deadlines, and notice periods
- Identify tenant vs landlord responsibilities
- Note payment terms, deposits, and late fees
- Flag maintenance and repair obligations
- Emphasize termination and renewal terms
- Identify property-specific requirements and restrictions`,
    
    medical: `${basePrompt}

Healthcare Contract Focus:
- Identify compliance requirements (HIPAA, regulatory)
- Note billing and reimbursement terms
- Flag authorization and coverage requirements
- Highlight liability and insurance provisions
- Emphasize patient privacy protections
- Note medical-specific obligations and restrictions`,
    
    employment: `${basePrompt}

Employment Contract Focus:
- Identify compensation structure and benefits
- Note work requirements and expectations
- Flag confidentiality and non-compete terms
- Highlight termination conditions and severance
- Emphasize intellectual property ownership
- Note employment-specific rights and obligations`,
    
    financial: `${basePrompt}

Financial Contract Focus:
- Identify interest rates and payment schedules
- Note collateral and security requirements
- Flag default terms and penalties
- Highlight fees and charges
- Emphasize repayment obligations
- Note financial-specific risks and protections`,
    
    legal: `${basePrompt}

Legal & Corporate Contract Focus:
- Identify governing law and jurisdiction
- Note dispute resolution procedures
- Flag liability limitations and indemnification
- Highlight confidentiality and privacy terms
- Emphasize amendment and termination procedures
- Note legal-specific rights and obligations`,
    
    insurance: `${basePrompt}

Insurance Contract Focus:
- Identify coverage limits and exclusions
- Note claim filing procedures and requirements
- Flag premium payment terms and schedules
- Highlight deductible and out-of-pocket costs
- Emphasize policy terms and conditions
- Note insurance-specific rights and obligations`,
    
    technology: `${basePrompt}

Technology & Software Contract Focus:
- Identify license terms and usage rights
- Note intellectual property ownership
- Flag source code and development terms
- Highlight API and integration requirements
- Emphasize data privacy and security
- Note technology-specific restrictions and permissions`,
    
    construction: `${basePrompt}

Construction & Engineering Contract Focus:
- Identify project scope and deliverables
- Note contractor responsibilities and qualifications
- Flag change order procedures
- Highlight payment schedules and milestones
- Emphasize safety and compliance requirements
- Note construction-specific warranties and guarantees`,
    
    manufacturing: `${basePrompt}

Manufacturing & Supply Contract Focus:
- Identify quality standards and specifications
- Note delivery schedules and timelines
- Flag inspection and testing requirements
- Highlight warranty terms and conditions
- Emphasize supply chain responsibilities
- Note manufacturing-specific compliance requirements`,
    
    transportation: `${basePrompt}

Transportation & Logistics Contract Focus:
- Identify delivery schedules and routes
- Note carrier responsibilities and qualifications
- Flag liability and insurance requirements
- Highlight equipment and maintenance standards
- Emphasize safety and compliance requirements
- Note transportation-specific terms and conditions`,
    
    entertainment: `${basePrompt}

Entertainment & Media Contract Focus:
- Identify rights and license terms
- Note royalty and compensation structures
- Flag distribution and release terms
- Highlight performance requirements
- Emphasize intellectual property rights
- Note entertainment-specific restrictions and permissions`,
    
    education: `${basePrompt}

Education & Training Contract Focus:
- Identify curriculum and program requirements
- Note accreditation and certification standards
- Flag tuition and payment terms
- Highlight attendance and participation requirements
- Emphasize evaluation and assessment procedures
- Note education-specific policies and procedures`,
    
    government: `${basePrompt}

Government & Public Sector Contract Focus:
- Identify compliance and regulatory requirements
- Note funding and budget allocations
- Flag reporting and documentation requirements
- Highlight audit and review procedures
- Emphasize procurement and bidding requirements
- Note government-specific terms and conditions`,
    
    nonprofit: `${basePrompt}

Non-Profit & Charity Contract Focus:
- Identify mission and purpose alignment
- Note funding and grant requirements
- Flag governance and leadership requirements
- Highlight compliance and reporting obligations
- Emphasize program and service delivery
- Note nonprofit-specific restrictions and requirements`,
    
    consulting: `${basePrompt}

Consulting & Professional Services Contract Focus:
- Identify scope of work and deliverables
- Note fee structures and payment terms
- Flag confidentiality and non-disclosure terms
- Highlight intellectual property ownership
- Emphasize termination and notice requirements
- Note consulting-specific terms and conditions`,
    
    retail: `${basePrompt}

Retail & E-commerce Contract Focus:
- Identify inventory and stock requirements
- Note pricing and markup structures
- Flag payment terms and methods
- Highlight delivery and fulfillment requirements
- Emphasize returns and refund policies
- Note retail-specific terms and conditions`,
    
    hospitality: `${basePrompt}

Hospitality & Tourism Contract Focus:
- Identify service quality standards
- Note facility and property requirements
- Flag booking and reservation procedures
- Highlight cancellation and refund policies
- Emphasize amenities and service offerings
- Note hospitality-specific terms and conditions`,
    
    energy: `${basePrompt}

Energy & Utilities Contract Focus:
- Identify consumption and usage requirements
- Note billing and payment terms
- Flag service reliability standards
- Highlight maintenance and repair requirements
- Emphasize safety and compliance requirements
- Note energy-specific terms and conditions`,
    
    telecom: `${basePrompt}

Telecommunications Contract Focus:
- Identify service plans and packages
- Note usage limits and overage charges
- Flag coverage area and network requirements
- Highlight equipment and device terms
- Emphasize termination and cancellation policies
- Note telecom-specific terms and conditions`,
    
    automotive: `${basePrompt}

Automotive Contract Focus:
- Identify warranty coverage and terms
- Note maintenance and service requirements
- Flag financing and payment terms
- Highlight insurance and liability requirements
- Emphasize registration and ownership terms
- Note automotive-specific terms and conditions`,
    
    agriculture: `${basePrompt}

Agriculture & Farming Contract Focus:
- Identify crop and production requirements
- Note equipment and machinery terms
- Flag land and property requirements
- Highlight water and irrigation rights
- Emphasize harvest and delivery schedules
- Note agriculture-specific terms and conditions`,
    
    pharmaceutical: `${basePrompt}

Pharmaceutical & Biotech Contract Focus:
- Identify clinical trial requirements
- Note regulatory approval processes
- Flag manufacturing and quality standards
- Highlight distribution and supply chain terms
- Emphasize patent and intellectual property rights
- Note pharmaceutical-specific terms and conditions`,
    
    mining: `${basePrompt}

Mining & Natural Resources Contract Focus:
- Identify extraction and production requirements
- Note equipment and machinery terms
- Flag safety and compliance requirements
- Highlight environmental protection obligations
- Emphasize royalty and payment structures
- Note mining-specific terms and conditions`,
    
    aerospace: `${basePrompt}

Aerospace & Defense Contract Focus:
- Identify aircraft and equipment specifications
- Note maintenance and service requirements
- Flag safety and compliance standards
- Highlight certification and approval processes
- Emphasize liability and insurance requirements
- Note aerospace-specific terms and conditions`,
    
    maritime: `${basePrompt}

Maritime & Shipping Contract Focus:
- Identify vessel and equipment requirements
- Note cargo and freight handling procedures
- Flag navigation and safety requirements
- Highlight crew and personnel qualifications
- Emphasize maintenance and service requirements
- Note maritime-specific terms and conditions`
  };
  
  return contractSpecificPrompts[contractType] || basePrompt;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    const preflight = handleCors(req);
    if (preflight) return preflight;
  }

  try {
    // --- Environment & Debug Mode ---
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
    const isDebugMode = Deno.env.get("DEBUG_MODE") === "true";

    if (!supabaseUrl || !supabaseServiceKey) throw new Error("Supabase env vars missing");
    if (!openaiApiKey) throw new Error("OPENAI_API_KEY not configured");

    // --- Body (supports `user_message` or `messages[]`) ---
    const body = await req.json().catch(() => ({}));
    const document_id: string | undefined = body.document_id;
    const session_id: string | undefined = body.session_id;
    const user_message: string | undefined = body.user_message;
    const messages: ChatMessage[] | undefined = Array.isArray(body.messages) ? body.messages : undefined;

    if (!document_id) throw new Error("Document ID is required");

    let latestUserMessage = "";
    if (typeof user_message === "string" && user_message.trim()) {
      latestUserMessage = user_message.trim();
    } else if (Array.isArray(messages)) {
      const userMsgs = messages.filter((m) => m?.role === "user" && typeof m?.content === "string");
      latestUserMessage = userMsgs[userMsgs.length - 1]?.content?.trim() ?? "";
    }
    if (!latestUserMessage) throw new Error("No user message found");

    // --- Supabase client & auth ---
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) throw new Error("Authorization header required");
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) throw new Error("Invalid or expired token");

    // B2C: no org lookup required

    // Optional: verify session ownership
    if (session_id) {
      const { data: sessionRow, error: sessionErr } = await supabase
        .from("chat_sessions")
        .select("id, user_id, document_id, message_count")
        .eq("id", session_id)
        .single();

      if (sessionErr || !sessionRow) {
        return new Response(JSON.stringify({ error: "Chat session not found" }), {
          status: 404,
          headers: { ...buildCorsHeaders(req.headers.get('origin') ?? undefined), "Content-Type": "application/json" },
        });
      }
      if (sessionRow.user_id !== user.id || (document_id && sessionRow.document_id !== document_id)) {
        return new Response(JSON.stringify({ error: "Forbidden: session not owned by user" }), {
          status: 403,
          headers: { ...buildCorsHeaders(req.headers.get('origin') ?? undefined), "Content-Type": "application/json" },
        });
      }
    }

    // --- Document name (verify ownership) ---
    const { data: document } = await supabase
      .from("documents")
      .select("filename, user_id")
      .eq("id", document_id)
      .single();
    if (!document || document.user_id !== user.id) {
      return new Response(JSON.stringify({ error: "Forbidden: document not owned by user" }), {
        status: 403,
        headers: { ...buildCorsHeaders(req.headers.get('origin') ?? undefined), "Content-Type": "application/json" },
      });
    }

    // --- Lightweight per-user rate limit: 30 req / 60s on chat_rag ---
    try {
      const { data: allowed } = await supabase.rpc('check_and_increment_rate_limit', {
        p_user_id: user.id,
        p_bucket: 'chat_rag',
        p_window_seconds: 60,
        p_limit: 30,
      });
      if (allowed === false) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Try again shortly.' }), {
          status: 429,
          headers: { ...buildCorsHeaders(req.headers.get('origin') ?? undefined), "Content-Type": "application/json" },
        });
      }
    } catch (_rlErr) {
      // Fail-open on rate limiter issues but log
      console.error('rate-limit-check error', _rlErr);
    }

    // --- Contract type detection and query expansion ---
    const contractType = detectContractType(document?.filename ?? "", "");
    const expandedQuery = expandQuery(latestUserMessage, contractType, isDebugMode);
    if (isDebugMode) {
      console.log(`Search start: doc=[REDACTED] user=[REDACTED] query_length=${latestUserMessage.length} contract_type=${contractType}`);
    }

    // --- Embedding for hybrid search ---
    const embeddingRes = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: { Authorization: `Bearer ${openaiApiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "text-embedding-3-small", input: expandedQuery }),
    });
    if (!embeddingRes.ok) {
      throw new Error(`Embedding generation failed: ${embeddingRes.status} ${embeddingRes.statusText}`);
    }
    const embeddingData = await embeddingRes.json();
    const queryEmbedding: number[] = embeddingData?.data?.[0]?.embedding ?? [];
    if (!Array.isArray(queryEmbedding) || queryEmbedding.length === 0) {
      throw new Error("Invalid embedding returned");
    }

    // --- Hybrid search with multiple strategies ---
    let chunks: any[] = [];
    
    // Strategy 1: Try hybrid search with lower threshold
    try {
      const res = await supabase.rpc("hybrid_search", {
        query_text: expandedQuery,
        query_embedding: JSON.stringify(queryEmbedding),
        match_document_id: document_id,
        match_threshold: 0.15, // Lower threshold for better recall
        match_count: 15,
        user_org_id: user.id,
      });
      if (res.error) throw res.error;
      if (Array.isArray(res.data)) chunks.push(...res.data);
    } catch (primaryErr: any) {
      const msg = String(primaryErr?.message || "").toLowerCase();
      const missing = msg.includes("could not find the function") || msg.includes("function public.hybrid_search");
      if (!missing) {
        console.error("Search error:", primaryErr);
      }
      
      // Fallback to vector-only search
      try {
        const fallback = await supabase.rpc("match_document_chunks", {
          match_document_id: document_id,
          query_embedding: JSON.stringify(queryEmbedding),
          match_threshold: 0.15,
          match_count: 15,
        });
        if (fallback.error) throw fallback.error;
        if (Array.isArray(fallback.data)) chunks.push(...fallback.data);
      } catch (fallbackErr) {
        console.error("Fallback search error:", fallbackErr);
      }
    }

    // Strategy 2: If still no results, try keyword search as backup
    if (chunks.length === 0) {
      if (isDebugMode) console.log("No hybrid/vector results, trying keyword search...");
      
      // Extract keywords from the query for direct text search
      const queryWords = latestUserMessage.toLowerCase()
        .replace(/[^\w\s]/g, " ")
        .split(/\s+/)
        .filter(word => word.length > 2)
        .slice(0, 5);
      
      if (queryWords.length > 0) {
        const orConditions = queryWords.map(word => `content.ilike.%${word}%`).join(",");
        
        const { data: keywordResults } = await supabase
          .from("document_vectors")
          .select("id, document_id, content, metadata")
          .eq("document_id", document_id)
          .or(orConditions)
          .limit(10);
        
        if (Array.isArray(keywordResults)) {
          // Add basic similarity score for keyword matches
          const keywordChunks = keywordResults.map(chunk => ({
            ...chunk,
            similarity: 0.3, // Default similarity for keyword matches
            text_rank: 0.3
          }));
          chunks.push(...keywordChunks);
          if (isDebugMode) console.log(`Found ${keywordChunks.length} results via keyword search`);
        }
      }
    }

    // Strategy 3: If still no results, try contract-specific keyword searches
    if (chunks.length === 0) {
      if (isDebugMode) console.log("No keyword results, trying contract-specific search...");
      
      // Use the shared contract hints for targeted search
      const { CONTRACT_HINTS } = await import('../_shared/contracts.ts');
      const keywords = CONTRACT_HINTS[contractType as keyof typeof CONTRACT_HINTS] || ["contract", "terms", "obligations", "rights", "liability", "payment", "termination", "confidentiality"];
      const keywordConditions = keywords.map(word => `content.ilike.%${word}%`).join(",");
      
      const { data: contractKeywordResults } = await supabase
        .from("document_vectors")
        .select("id, document_id, content, metadata")
        .eq("document_id", document_id)
        .or(keywordConditions)
        .limit(10);
      
      if (Array.isArray(contractKeywordResults)) {
        const contractKeywordChunks = contractKeywordResults.map(chunk => ({
          ...chunk,
          similarity: 0.3,
          text_rank: 0.3
        }));
        chunks.push(...contractKeywordChunks);
        if (isDebugMode) console.log(`Found ${contractKeywordResults.length} results via contract-specific keyword search for ${contractType}`);
      }
    }

    if (isDebugMode) console.log(`Search results: ${chunks?.length ?? 0} chunks found`);
    
    // Debug: Log chunk count and basic metrics only (no content)
    if (isDebugMode && chunks.length > 0) {
      console.log("Search metrics:", {
        total_chunks: chunks.length,
        avg_similarity: chunks.reduce((sum, c) => sum + (c.similarity || 0), 0) / chunks.length,
        has_metadata: chunks.filter(c => c.metadata).length
      });
    }

    // --- Build context blocks ---
    const safeChunks = Array.isArray(chunks) ? chunks : [];
    
    // Debug: If no chunks found, check document exists (without exposing content)
    if (safeChunks.length === 0 && isDebugMode) {
      console.log("No chunks found! Checking document_vectors table...");
      const { count } = await supabase
        .from("document_vectors")
        .select("id", { count: 'exact' })
        .eq("document_id", document_id);
      
      console.log(`Total chunks in document: ${count}`);
    }
    
    const contextBlocks = safeChunks
      .slice(0, 12)
      .map((c: any, i: number) => {
        // Parse metadata if it's a JSON string
        let metadata = c.metadata;
        if (typeof metadata === 'string') {
          try {
            metadata = JSON.parse(metadata);
          } catch (e) {
            if (isDebugMode) console.warn("Failed to parse metadata JSON");
            metadata = {};
          }
        }
        
        const pageNum = metadata?.page_number ?? "?";
        const sectionTitle = metadata?.section_title ?? "Unknown";
        return `[#${i + 1}] p${pageNum} :: "${sectionTitle}"\n${c.content}`;
      })
      .join("\n\n---\n\n");

    // --- Prompts ---
    const systemPrompt = getSystemPrompt(contractType, document?.filename ?? "");

    const userPrompt = `Question: ${latestUserMessage}

Document: "${document?.filename ?? "the document"}" (${contractType})

Context Chunks:
${contextBlocks}

Remember: Use the two-lane format with exact headings. Ground all claims in the context chunks with citations. Provide general guidance only when helpful and clearly labeled as non-document information.`;

    // --- OpenAI Chat Completions streaming (robust, plain text) ---
    const openai = new OpenAI({ apiKey: openaiApiKey });

    // Build messages array
    const chatMessages: ChatMessage[] = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ];

    // Stream from Chat Completions (supports gpt-5 per your docs)
    const stream = await openai.chat.completions.create({
      model: "gpt-5",
      messages: chatMessages as any,
      max_completion_tokens: 2000,
      // If you want GPT-5 minimal reasoning via Chat Completions:
      // @ts-ignore - some client versions call this `reasoning_effort`
      reasoning_effort: "minimal",
      stream: true,
    });

    const encoder = new TextEncoder();
    let finalText = "";

    const readable = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          for await (const chunk of stream as AsyncIterable<any>) {
            // Strictly extract ONLY text deltas
            const delta = chunk?.choices?.[0]?.delta;
            const textPiece =
              typeof delta?.content === "string"
                ? delta.content
                : ""; // ignore tool/function parts (objects)

            if (textPiece) {
              finalText += textPiece;
              controller.enqueue(encoder.encode(textPiece));
            }
          }

          // Persist the final text when streaming completes
          try {
            const textOut = finalText.trim();
            if (session_id && textOut) {
              const { data: sessionData } = await supabase
                .from("chat_sessions")
                .select("message_count")
                .eq("id", session_id)
                .single();

              const sequenceNumber = (sessionData?.message_count || 0) + 1;

              await supabase.from("chat_messages").insert({
                session_id,
                role: "assistant",
                content: textOut,
                sequence_number: sequenceNumber,
                metadata: {},
              });

              await supabase
                .from("chat_sessions")
                .update({ message_count: sequenceNumber, updated_at: new Date().toISOString() })
                .eq("id", session_id);
            }
          } catch (persistErr) {
            console.error("save-on-final error", persistErr);
          }

          controller.close();
        } catch (err) {
          controller.error(err);
        }
      },
    });

    // Return plain text stream to the browser
    return new Response(readable, {
      headers: {
        ...buildCorsHeaders(req.headers.get('origin') ?? undefined),
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error: any) {
    // Log full error for debugging but sanitize response
    const isDebugMode = Deno.env.get("DEBUG_MODE") === "true";
    console.error("Edge function error:", isDebugMode ? error : error?.message);
    
    const sanitizedError = isDebugMode 
      ? error?.message ?? String(error)
      : "An error occurred while processing your request";
    
    return new Response(JSON.stringify({ error: sanitizedError }), {
      status: 500,
      headers: { ...buildCorsHeaders(req.headers.get('origin') ?? undefined), "Content-Type": "application/json" },
    });
  }
});
