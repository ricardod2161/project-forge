import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { callLovableAI } from "../_shared/ai-providers.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { project_id, finding } = await req.json();

    if (!project_id || !finding) {
      return new Response(
        JSON.stringify({ error: "project_id e finding são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("*")
      .eq("id", project_id)
      .single();

    if (projectError || !project) {
      return new Response(
        JSON.stringify({ error: "Projeto não encontrado" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const systemPrompt = `Você é um assistente especializado em atualizar projetos de software.
Dado o contexto de um projeto e uma recomendação específica de melhoria, 
retorne APENAS um objeto JSON com os campos do projeto que devem ser atualizados.

Campos disponíveis para atualizar:
- description (string): descrição do projeto
- audience (string): público-alvo  
- monetization (string): modelo de monetização
- platform (string): plataforma principal
- complexity (number, 1-5): complexidade do projeto
- features (array de strings): funcionalidades do projeto
- integrations (array de strings): integrações

REGRAS OBRIGATÓRIAS:
1. Retorne APENAS o JSON puro, sem markdown, sem backticks, sem explicações
2. Inclua SOMENTE os campos que precisam ser atualizados baseado na recomendação
3. Para arrays (features, integrations): inclua TODOS os itens existentes + os novos
4. Seja conciso e direto — máximo 1-2 campos por vez
5. Não invente dados, use apenas o que a recomendação sugere

Exemplo de resposta válida:
{"audience": "Agências de marketing digital de pequeno e médio porte"}`;

    const projectContext = `Projeto: ${project.title}
Tipo: ${project.type ?? "Não definido"}
Nicho: ${project.niche ?? "Não definido"}
Público-alvo atual: ${project.audience ?? "Não definido"}
Descrição atual: ${project.description ?? "Não definida"}
Complexidade: ${project.complexity ?? 3}/5
Plataforma: ${project.platform ?? "Não definida"}
Funcionalidades atuais: ${project.features?.join(", ") ?? "Nenhuma"}
Integrações atuais: ${project.integrations?.join(", ") ?? "Nenhuma"}
Monetização: ${project.monetization ?? "Não definida"}`;

    const userPrompt = `${projectContext}

Finding a aplicar:
- Categoria: ${finding.category}
- Severidade: ${finding.severity}  
- Título: ${finding.title}
- Problema: ${finding.description}
- Recomendação: ${finding.recommendation}

Com base nesta recomendação específica, retorne o JSON com os campos do projeto que devem ser atualizados para resolver este problema.`;

    const aiResponse = await callLovableAI(systemPrompt, userPrompt, {
      model: "google/gemini-2.5-flash",
      maxTokens: 1024,
      temperature: 0.3,
    });

    // Parse the AI response to extract the JSON
    let updates: Record<string, unknown> = {};
    try {
      // Strip markdown code blocks if present
      const cleaned = aiResponse
        .replace(/```json\s*/gi, "")
        .replace(/```\s*/gi, "")
        .trim();
      updates = JSON.parse(cleaned);
    } catch {
      // Try to extract JSON from the response
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          updates = JSON.parse(jsonMatch[0]);
        } catch {
          return new Response(
            JSON.stringify({ error: "Não foi possível processar a resposta da IA" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
    }

    // Validate and sanitize updates — only allow known fields
    const allowedFields = ["description", "audience", "monetization", "platform", "complexity", "features", "integrations"];
    const sanitized: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (field in updates) {
        sanitized[field] = updates[field];
      }
    }

    // Ensure arrays are actually arrays
    if ("features" in sanitized && !Array.isArray(sanitized.features)) {
      delete sanitized.features;
    }
    if ("integrations" in sanitized && !Array.isArray(sanitized.integrations)) {
      delete sanitized.integrations;
    }

    // Clamp complexity to 1-5
    if ("complexity" in sanitized) {
      const c = Number(sanitized.complexity);
      sanitized.complexity = Math.min(5, Math.max(1, isNaN(c) ? 3 : c));
    }

    if (Object.keys(sanitized).length === 0) {
      // AI gave nothing useful — return a meaningful description update
      return new Response(
        JSON.stringify({ 
          error: "A IA não identificou campos específicos para atualizar. Tente aplicar manualmente." 
        }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ updates: sanitized, fields: Object.keys(sanitized) }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err: unknown) {
    const error = err as { status?: number; message?: string };
    console.error("apply-finding error:", error);

    if (error?.status === 429) {
      return new Response(
        JSON.stringify({ error: "Limite de requisições atingido. Aguarde alguns minutos." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (error?.status === 402) {
      return new Response(
        JSON.stringify({ error: "Créditos de IA esgotados. Adicione créditos em Configurações." }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: error?.message ?? "Erro interno ao aplicar finding" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
