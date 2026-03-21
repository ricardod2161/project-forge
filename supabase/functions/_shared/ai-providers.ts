/**
 * _shared/ai-providers.ts
 * Utilitários de IA multi-provedor para o Project Forge.
 *
 * Provedores:
 *  - Lovable AI Gateway → principal (Gemini 2.5 Flash — sem cota gratuita limitada)
 *  - Groq               → rápido e barato para textos curtos/médios
 *  - Gemini direto      → legado, mantido para compatibilidade
 *  - OpenAI             → tool calling estruturado (gpt-4o-mini)
 */

// ── Lovable AI Gateway ────────────────────────────────────────────────────────

export async function callLovableAI(
  systemPrompt: string,
  userPrompt: string,
  options?: {
    model?: string;
    maxTokens?: number;
    temperature?: number;
  }
): Promise<string> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY não configurado");

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: options?.model ?? "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user",   content: userPrompt   },
      ],
      temperature: options?.temperature ?? 0.7,
      max_tokens:  options?.maxTokens   ?? 8192,
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    if (res.status === 429) {
      throw Object.assign(
        new Error("Limite de requisições Lovable AI atingido. Aguarde alguns instantes."),
        { status: 429 }
      );
    }
    if (res.status === 402) {
      throw Object.assign(
        new Error("Créditos Lovable AI esgotados. Adicione créditos em Settings → Workspace."),
        { status: 402 }
      );
    }
    throw Object.assign(new Error(`Lovable AI error: ${res.status} — ${errText}`), { status: res.status });
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content ?? "";
  if (!content) throw new Error("Lovable AI não retornou conteúdo");
  return content;
}

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

// ── Google AI (Gemini 2.0 Flash) — legado ────────────────────────────────────

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

// ── Fallback inteligente: Groq → Lovable AI ───────────────────────────────────

export async function callAIWithFallback(
  systemPrompt: string,
  userPrompt:   string,
  maxTokens:    number,
  temperature   = 0.7,
  groqModel     = "llama-3.3-70b-versatile"
): Promise<string> {
  const GROQ_API_KEY    = Deno.env.get("GROQ_API_KEY");
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

  // Tentativa 1: Groq (rápido e barato)
  if (GROQ_API_KEY) {
    try {
      const { content } = await callGroq(systemPrompt, userPrompt, {
        model: groqModel, maxTokens, temperature,
      });
      if (content.length > 50) return content;
    } catch (err: unknown) {
      const status = (err as { status?: number }).status;
      if (status !== 429) throw err;
      console.warn("Groq rate limit (429), usando fallback Lovable AI Gateway…");
    }
  }

  // Tentativa 2: Lovable AI Gateway (principal fallback — sem cota limitada)
  if (LOVABLE_API_KEY) {
    return callLovableAI(systemPrompt, userPrompt, { maxTokens, temperature });
  }

  throw new Error("Nenhum provedor de IA disponível. Tente novamente em alguns instantes.");
}
