import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { callLovableAI } from "../_shared/ai-providers.ts";

const allowedOrigin = Deno.env.get("ALLOWED_ORIGIN") ?? "*";
const corsHeaders = {
  "Access-Control-Allow-Origin": allowedOrigin,
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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

Seu papel é analisar projetos de software e retornar um JSON estruturado com findings (achados) categorizados.

REGRAS CRÍTICAS DE FORMATO:
- O campo "category" DEVE ser EXATAMENTE um destes valores: "lacuna", "inconsistencia", "melhoria", "risco"
- NUNCA use variações como "risco tecnico", "lacuna de nicho", "melhoria de escopo" — use apenas os 4 valores permitidos
- O campo "severity" DEVE ser EXATAMENTE um destes: "critico", "importante", "sugestao"
- Retorne APENAS um bloco JSON válido, sem texto adicional antes ou depois

Analise os seguintes aspectos:
1. COMPLETUDE: Há funcionalidades críticas faltando para o tipo de sistema definido?
2. INCONSISTÊNCIAS: Campos contraditórios entre si
3. RISCOS TÉCNICOS: Complexidade vs features vs integrações
4. LACUNAS DE NICHO: Funcionalidades comuns para esse nicho que estão ausentes
5. MELHORIAS DE ESCOPO: Oportunidades para fortalecer o posicionamento
6. PÚBLICO E MERCADO: A definição de público é suficientemente específica?
7. INTEGRAÇÕES: As integrações fazem sentido para o tipo de sistema?

Retorne entre 6 e 12 findings. Seja específico — mencione os campos reais do projeto.`;

    const userPrompt = `Analise este projeto e retorne APENAS um JSON no formato abaixo, sem texto adicional:

${projectContext}

Formato obrigatório:
\`\`\`json
{
  "findings": [
    {
      "category": "lacuna",
      "severity": "critico",
      "title": "Título conciso do problema (máx 80 chars)",
      "description": "Descrição detalhada do problema identificado",
      "recommendation": "Recomendação específica e acionável"
    }
  ]
}
\`\`\`

LEMBRE-SE: category só pode ser "lacuna", "inconsistencia", "melhoria" ou "risco". Nada mais.`;

    const rawText = await callLovableAI(systemPrompt, userPrompt, {
      model: "google/gemini-2.5-flash",
      maxTokens: 4096,
      temperature: 0.4,
    });

    // Extract JSON from markdown code block or raw JSON
    let findings: unknown[];
    const jsonMatch = rawText.match(/```json\s*([\s\S]*?)\s*```/) 
      || rawText.match(/```\s*([\s\S]*?)\s*```/);
    
    let jsonStr: string;
    if (jsonMatch) {
      jsonStr = jsonMatch[1];
    } else {
      // Try to find raw JSON object
      const objMatch = rawText.match(/\{[\s\S]*"findings"[\s\S]*\}/);
      if (!objMatch) throw new Error("Resposta da IA não contém JSON estruturado");
      jsonStr = objMatch[0];
    }

    const parsed = JSON.parse(jsonStr);
    findings = parsed.findings;

    // Validate and sanitize categories to ensure compliance
    const validCategories = new Set(["lacuna", "inconsistencia", "melhoria", "risco"]);
    const validSeverities = new Set(["critico", "importante", "sugestao"]);
    
    findings = (findings as Array<Record<string, string>>).map((f) => ({
      ...f,
      category: validCategories.has(f.category) ? f.category : "melhoria",
      severity: validSeverities.has(f.severity) ? f.severity : "importante",
    }));

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
