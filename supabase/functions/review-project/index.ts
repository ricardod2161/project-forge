import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { callGroq, callGemini } from "../_shared/ai-providers.ts";

const allowedOrigin = Deno.env.get("ALLOWED_ORIGIN") ?? "*";
const corsHeaders = {
  "Access-Control-Allow-Origin": allowedOrigin,
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const TOOLS = [
  {
    type: "function",
    function: {
      name: "submit_review_findings",
      description: "Submete a lista completa de achados da revisão do projeto de software.",
      parameters: {
        type: "object",
        properties: {
          findings: {
            type: "array",
            description: "Lista de achados da análise",
            items: {
              type: "object",
              properties: {
                category: {
                  type: "string",
                  enum: ["lacuna", "inconsistencia", "melhoria", "risco"],
                  description: "Categoria do achado",
                },
                severity: {
                  type: "string",
                  enum: ["critico", "importante", "sugestao"],
                  description: "Severidade do achado",
                },
                title: {
                  type: "string",
                  description: "Título conciso do problema (máx 80 chars)",
                },
                description: {
                  type: "string",
                  description: "Descrição detalhada do problema identificado",
                },
                recommendation: {
                  type: "string",
                  description: "Recomendação específica e acionável para resolver o problema",
                },
              },
              required: ["category", "severity", "title", "description", "recommendation"],
              additionalProperties: false,
            },
          },
        },
        required: ["findings"],
        additionalProperties: false,
      },
    },
  },
];

const TOOL_CHOICE = { type: "function", function: { name: "submit_review_findings" } };

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Não autorizado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Token inválido" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { project_id } = await req.json();
    if (!project_id) {
      return new Response(
        JSON.stringify({ error: "project_id é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("*")
      .eq("id", project_id)
      .eq("user_id", user.id)
      .single();

    if (projectError || !project) {
      return new Response(
        JSON.stringify({ error: "Projeto não encontrado ou acesso negado" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const projectContext = `
PROJETO: ${project.title}
Tipo: ${project.type ?? "Não definido"}
Nicho: ${project.niche ?? "Não definido"}
Plataforma: ${project.platform ?? "Não definida"}
Público-alvo: ${project.audience ?? "Não definido"}
Monetização: ${project.monetization ?? "Não definida"}
Complexidade: ${project.complexity ?? "Não definida"}/5
Funcionalidades: ${(project.features ?? []).join(", ") || "Nenhuma listada"}
Integrações: ${(project.integrations ?? []).join(", ") || "Nenhuma listada"}
Descrição: ${project.description ?? "Não fornecida"}
Ideia Original: ${project.original_idea ?? "Não fornecida"}
Status: ${project.status}
    `.trim();

    const systemPrompt = `Você é um arquiteto sênior de software com 20 anos de experiência em sistemas de produção, 
com especialidade em análise crítica de requisitos, identificação de lacunas e revisão de projetos de software.

Seu papel é analisar projetos de software e retornar uma lista estruturada de findings (achados) categorizados por 
severidade e tipo. Você deve ser direto, técnico e construtivo — sem elogios genéricos.

Analise os seguintes aspectos:
1. COMPLETUDE: Há funcionalidades críticas faltando para o tipo de sistema definido?
2. INCONSISTÊNCIAS: Campos contraditórios entre si (ex: SaaS sem modelo de monetização)
3. RISCOS TÉCNICOS: Complexidade vs features vs integrações — algo está subdimensionado?
4. LACUNAS DE NICHO: Funcionalidades comuns para esse nicho que estão ausentes
5. MELHORIAS DE ESCOPO: Oportunidades para fortalecer o posicionamento
6. PÚBLICO E MERCADO: A definição de público é suficientemente específica?
7. INTEGRAÇÕES: As integrações fazem sentido para o tipo de sistema?

Retorne entre 6 e 15 findings. Seja específico — mencione os campos reais do projeto.
Severidades: "critico" para bloqueadores de produção, "importante" para gaps significativos, "sugestao" para melhorias.`;

    const userPrompt = `Analise este projeto de software e retorne seus findings:\n\n${projectContext}`;

    // Tenta Groq 70B com tool calling; se rate limit, usa Gemini com parsing manual
    let findings: unknown[];

    try {
      const { toolCall } = await callGroq(systemPrompt, userPrompt, {
        model: "llama-3.3-70b-versatile",
        temperature: 0.5,
        maxTokens: 4096,
        tools: TOOLS,
        toolChoice: TOOL_CHOICE,
      });

      if (!toolCall) throw new Error("Groq não retornou tool call");
      const parsed = JSON.parse((toolCall as { function: { arguments: string } }).function.arguments);
      findings = parsed.findings;

    } catch (groqErr: unknown) {
      const groqStatus = (groqErr as { status?: number }).status;

      if (groqStatus === 429) {
        console.warn("Groq rate limit (429), fallback para Gemini com parsing de texto…");

        // Fallback: Gemini retorna JSON dentro de um bloco markdown
        const fallbackPrompt = `${systemPrompt}\n\n${userPrompt}

IMPORTANTE: Retorne os findings em formato JSON válido dentro de um bloco \`\`\`json ... \`\`\`.
O JSON deve ter a chave "findings" contendo um array de objetos com: category, severity, title, description, recommendation.`;

        const geminiText = await callGemini(fallbackPrompt, { maxTokens: 4096, temperature: 0.5 });

        const jsonMatch = geminiText.match(/```json\s*([\s\S]*?)\s*```/);
        if (!jsonMatch) throw new Error("Gemini não retornou JSON estruturado nos findings");

        const parsed = JSON.parse(jsonMatch[1]);
        findings = parsed.findings;

      } else {
        throw groqErr;
      }
    }

    return new Response(
      JSON.stringify({ findings }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err: unknown) {
    console.error("review-project error:", err);
    const status = (err as { status?: number }).status;
    if (status === 429) {
      return new Response(
        JSON.stringify({ error: "Limite de requisições atingido. Tente novamente em alguns minutos." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const message = err instanceof Error ? err.message : "Erro interno ao processar revisão";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
