import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type ContentType = "modules" | "screens" | "database" | "rules";

const contentInstructions: Record<ContentType, string> = {
  modules: `Liste e descreva todos os módulos do sistema em formato Markdown estruturado.
Para cada módulo inclua:
- Nome do módulo (## Módulo: Nome)
- Descrição em 1-2 frases
- Funcionalidades principais (lista com bullets)
- Dependências de outros módulos
- Nível de complexidade (Básico / Intermediário / Avançado)

Organize por ordem lógica de implementação. Seja específico para este nicho e tipo de projeto.`,

  screens: `Liste e descreva todas as telas/páginas do sistema em formato Markdown.
Para cada tela inclua:
- Nome da tela (## Tela: Nome)
- Rota sugerida (/caminho)
- Tipo (Pública / Privada / Admin)
- Elementos principais da UI (formulários, tabelas, cards, etc.)
- Ações disponíveis nessa tela
- Estados possíveis (loading, empty, error, success)

Organize por fluxo de usuário (onboarding → dashboard → features → configurações).`,

  database: `Crie o esquema completo do banco de dados em formato Markdown com SQL.
Para cada tabela inclua:
- Nome e propósito (## Tabela: nome)
- Definição SQL com tipos corretos
- Índices recomendados
- RLS policies essenciais
- Relacionamentos com outras tabelas

Use PostgreSQL. Inclua campos padrão (id UUID, created_at, updated_at, user_id onde aplicável).
Finalize com um diagrama de relacionamentos em texto (ERD simplificado).`,

  rules: `Documente todas as regras de negócio do sistema em formato Markdown.
Para cada área inclua:
- Categoria (## Categoria: Nome)
- Regras numeradas e específicas
- Casos de borda e exceções
- Validações necessárias
- Fluxos condicionais

Categorias sugeridas: Autenticação e Acesso, Fluxos de Dados, Validações, Notificações, Monetização/Planos, Integrações.
Seja específico e detalhado — estas regras serão usadas por desenvolvedores.`,
};

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

    const { project_id, content_type } = await req.json() as { project_id: string; content_type: ContentType };
    if (!project_id || !content_type) {
      return new Response(JSON.stringify({ error: "project_id e content_type são obrigatórios" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!contentInstructions[content_type]) {
      return new Response(JSON.stringify({ error: "content_type inválido" }), {
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

    const systemPrompt = `Você é um arquiteto de software sênior com 20 anos de experiência construindo sistemas complexos.
Você documenta sistemas de software de forma clara, técnica e acionável.
Responda sempre em Markdown bem estruturado com hierarquia clara de headings.
Seja específico para o nicho e tipo de sistema descrito. Nunca use exemplos genéricos.
Linguagem: português brasileiro técnico-profissional.`;

    const userPrompt = `Para o seguinte projeto, ${contentInstructions[content_type]}

**Projeto:** ${project.title}
**Tipo:** ${project.type ?? "Não definido"}
**Nicho:** ${project.niche ?? "Não definido"}  
**Plataforma:** ${project.platform ?? "Web"}
**Complexidade:** ${project.complexity ?? 3}/5
**Público-alvo:** ${project.audience ?? "Não especificado"}
**Ideia original:** ${project.original_idea ?? "Não fornecida"}
**Funcionalidades listadas:** ${(project.features ?? []).join(", ") || "Nenhuma"}
**Integrações:** ${(project.integrations ?? []).join(", ") || "Nenhuma"}
**Monetização:** ${project.monetization ?? "Não definida"}`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
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
    const content = aiData.choices?.[0]?.message?.content ?? "";

    return new Response(JSON.stringify({ content }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("generate-ai-content error:", err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Erro interno" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
