import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const allowedOrigin = Deno.env.get("ALLOWED_ORIGIN") ?? "*";
const corsHeaders = {
  "Access-Control-Allow-Origin": allowedOrigin,
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface Dimension {
  name: string;
  score: number;
  justification: string;
  recommendations: string[];
}

interface EvaluationResult {
  dimensions: Dimension[];
  overall_score: number;
  summary: string;
  top_priorities: string[];
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { project_id } = await req.json();
    if (!project_id) {
      return new Response(JSON.stringify({ error: "project_id é obrigatório" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("*")
      .eq("id", project_id)
      .eq("user_id", user.id)
      .single();

    if (projectError || !project) {
      return new Response(JSON.stringify({ error: "Projeto não encontrado" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY não configurado");

    const systemPrompt = `Você é um consultor sênior de produto e arquitetura de software com 20 anos de experiência avaliando projetos de software para investidores e times de desenvolvimento. Você avalia projetos em 7 dimensões de forma rigorosa e honesta. Retorne sempre via tool calling com o formato exato especificado.`;

    const userPrompt = `Avalie o seguinte projeto de software nas 7 dimensões abaixo. Seja rigoroso, honesto e específico — evite scores inflados:

**Projeto:** ${project.title}
**Tipo:** ${project.type ?? "Não definido"}
**Nicho:** ${project.niche ?? "Não definido"}
**Plataforma:** ${project.platform ?? "Web"}
**Complexidade declarada:** ${project.complexity ?? 3}/5
**Público-alvo:** ${project.audience ?? "Não especificado"}
**Ideia:** ${project.original_idea ?? "Não fornecida"}
**Funcionalidades:** ${(project.features ?? []).join(", ") || "Nenhuma listada"}
**Integrações:** ${(project.integrations ?? []).join(", ") || "Nenhuma"}
**Monetização:** ${project.monetization ?? "Não definida"}

**Dimensões para avaliação (0-100 cada):**
1. **Escopo** — O escopo está bem definido? As features são coerentes entre si?
2. **Estrutura** — A arquitetura implícita faz sentido para o tipo/complexidade declarada?
3. **Técnico** — Viabilidade técnica, escolhas de stack, integrações adequadas?
4. **Completude** — O projeto tem todas as informações necessárias para ser implementado?
5. **Viabilidade** — O projeto é realizável com os recursos de um time de 1-3 devs?
6. **Monetização** — O modelo de negócio é adequado para o nicho e tipo de produto?
7. **Maturidade** — O nível de detalhe e pensamento demonstra maturidade do projeto?`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "submit_evaluation",
              description: "Submete a avaliação completa do projeto com scores por dimensão",
              parameters: {
                type: "object",
                properties: {
                  dimensions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        score: { type: "number", minimum: 0, maximum: 100 },
                        justification: { type: "string" },
                        recommendations: { type: "array", items: { type: "string" } },
                      },
                      required: ["name", "score", "justification", "recommendations"],
                    },
                  },
                  overall_score: { type: "number", minimum: 0, maximum: 100 },
                  summary: { type: "string" },
                  top_priorities: { type: "array", items: { type: "string" }, maxItems: 3 },
                },
                required: ["dimensions", "overall_score", "summary", "top_priorities"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "submit_evaluation" } },
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições atingido. Aguarde alguns minutos." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI Gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("IA não retornou avaliação estruturada");

    const evaluation: EvaluationResult = JSON.parse(toolCall.function.arguments);

    // Salvar score no projeto
    await supabase
      .from("projects")
      .update({ quality_score: Math.round(evaluation.overall_score) })
      .eq("id", project_id)
      .eq("user_id", user.id);

    // Persistir avaliação detalhada na tabela evaluations
    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    await serviceClient.from("evaluations").insert({
      project_id,
      user_id: user.id,
      overall_score: Math.round(evaluation.overall_score),
      dimensions: evaluation.dimensions,
      summary: evaluation.summary,
      top_priorities: evaluation.top_priorities,
    });

    return new Response(JSON.stringify({ evaluation }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("evaluate-project error:", err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Erro interno" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
