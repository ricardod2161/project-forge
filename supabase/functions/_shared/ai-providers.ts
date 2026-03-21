/**
 * _shared/ai-providers.ts
 * Utilitários de IA multi-provedor para o Project Forge.
 *
 * Provedores:
 *  - Groq   → chamadas de texto baratas / rápidas (free tier generoso)
 *  - Gemini → fallback e geração de conteúdo longo (free tier Google AI)
 *  - OpenAI → tool calling estruturado (gpt-4o-mini)
 */

// ── Groq ─────────────────────────────────────────────────────────────────────

export async function callGroq(
  systemPrompt: string,
  userPrompt: string,
  options?: {
    model?: string;
    maxTokens?: number;
    temperature?: number;
    tools?: unknown[];
    toolChoice?: unknown;
  }
): Promise<{ content: string; toolCall?: unknown }> {
  const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");
  if (!GROQ_API_KEY) throw new Error("GROQ_API_KEY não configurado");

  const body: Record<string, unknown> = {
    model: options?.model ?? "llama-3.3-70b-versatile",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user",   content: userPrompt   },
    ],
    temperature: options?.temperature ?? 0.7,
    max_tokens:  options?.maxTokens  ?? 4096,
  };

  if (options?.tools)      body.tools       = options.tools;
  if (options?.toolChoice) body.tool_choice = options.toolChoice;

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${GROQ_API_KEY}`,
      "Content-Type":  "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text().catch(() => "");
    throw Object.assign(new Error(`Groq error: ${res.status} — ${err}`), { status: res.status });
  }

  const data = await res.json();
  const message   = data.choices?.[0]?.message;
  const content   = message?.content   ?? "";
  const toolCall  = message?.tool_calls?.[0] ?? undefined;
  return { content, toolCall };
}

// ── Google AI (Gemini 2.0 Flash) ──────────────────────────────────────────────

export async function callGemini(
  prompt: string,
  options?: { maxTokens?: number; temperature?: number }
): Promise<string> {
  const GOOGLE_AI_KEY = Deno.env.get("GOOGLE_AI_KEY");
  if (!GOOGLE_AI_KEY) throw new Error("GOOGLE_AI_KEY não configurado");

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GOOGLE_AI_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature:      options?.temperature ?? 0.7,
          maxOutputTokens:  options?.maxTokens   ?? 8192,
          topP: 0.9,
        },
      }),
    }
  );

  if (!res.ok) {
    const err = await res.text().catch(() => "");
    throw Object.assign(new Error(`Google AI error: ${res.status} — ${err}`), { status: res.status });
  }

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  if (!text) throw new Error("Gemini não retornou conteúdo");
  return text;
}

// ── OpenAI (gpt-4o-mini) com tool calling ────────────────────────────────────

export async function callOpenAIWithTools(
  systemPrompt: string,
  userPrompt:   string,
  tools:        unknown[],
  toolChoice:   unknown,
  options?: { maxTokens?: number; temperature?: number }
): Promise<unknown> {
  const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
  if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY não configurado");

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENAI_API_KEY}`,
      "Content-Type":  "application/json",
    },
    body: JSON.stringify({
      model:       "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user",   content: userPrompt   },
      ],
      tools,
      tool_choice: toolChoice,
      temperature: options?.temperature ?? 0.3,
      max_tokens:  options?.maxTokens   ?? 2000,
    }),
  });

  if (!res.ok) {
    const status = res.status;
    if (status === 401 || status === 402) {
      throw Object.assign(
        new Error("OPENAI_API_KEY inválida ou sem créditos. Verifique em platform.openai.com."),
        { status }
      );
    }
    throw Object.assign(new Error(`OpenAI error: ${status}`), { status });
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.tool_calls?.[0];
}

// ── Fallback inteligente: Groq → Gemini ───────────────────────────────────────

export async function callAIWithFallback(
  systemPrompt: string,
  userPrompt:   string,
  maxTokens:    number,
  temperature   = 0.7,
  groqModel     = "llama-3.3-70b-versatile"
): Promise<string> {
  const GROQ_API_KEY  = Deno.env.get("GROQ_API_KEY");
  const GOOGLE_AI_KEY = Deno.env.get("GOOGLE_AI_KEY");

  // Tentativa 1: Groq
  if (GROQ_API_KEY) {
    try {
      const { content } = await callGroq(systemPrompt, userPrompt, {
        model: groqModel, maxTokens, temperature,
      });
      if (content.length > 50) return content;
    } catch (err: unknown) {
      const status = (err as { status?: number }).status;
      if (status !== 429) throw err; // só faz fallback em rate limit
      console.warn("Groq rate limit (429), usando fallback Google AI…");
    }
  }

  // Tentativa 2: Gemini (fallback)
  if (GOOGLE_AI_KEY) {
    return callGemini(`${systemPrompt}\n\n${userPrompt}`, { maxTokens, temperature });
  }

  throw new Error("Nenhum provedor de IA configurado. Adicione GROQ_API_KEY ou GOOGLE_AI_KEY.");
}
