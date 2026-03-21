import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const allowedOrigin = Deno.env.get("ALLOWED_ORIGIN") ?? "*";
const corsHeaders = {
  "Access-Control-Allow-Origin": allowedOrigin,
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type ContentType = "modules" | "screens" | "database" | "rules";

const contentInstructions: Record<ContentType, string> = {
  modules: `Liste e descreva todos os módulos do sistema em formato Markdown estruturado.
Para cada módulo inclua:
- Nome do módulo (## Módulo: Nome)
- Descrição em 1-2 frases
- Funcionalidades principais (lista com bullets detalhados)
- Dependências de outros módulos (especifique quais e por quê)
- Nível de complexidade (Básico / Intermediário / Avançado) com justificativa
- Tecnologias ou padrões recomendados para implementação

Organize por ordem lógica de implementação (base → features → integrações).
Seja muito específico para este nicho e tipo de projeto. Nunca use exemplos genéricos.
Mínimo 8 módulos, máximo 15.`,

  screens: `Liste e descreva TODAS as telas/páginas do sistema com máximo de detalhes visuais e de UX em formato Markdown.
Para cada tela inclua:
- Nome da tela exato (## Tela: NomeDaTela) — use este formato exato
- Rota sugerida (/caminho/sugerido)
- Tipo de acesso (Pública / Privada / Admin)
- Componentes de UI presentes: liste cada componente visual específico (ex: tabela com 6 colunas, filtros laterais, cards de KPI, formulário com validação inline, barra de progresso, etc.)
- Hierarquia de informação: o que é mais importante visualmente nessa tela?
- Ações do usuário: botões, formulários, drag-and-drop, etc.
- Estados da tela: loading skeleton, estado vazio com CTA, estado de erro, estado preenchido com dados
- Dados exibidos: que tipo de informação aparece? (métricas, listas, gráficos, texto)
- Navegação: de onde o usuário vem e para onde pode ir

Organize pelo fluxo completo do usuário:
1. Autenticação (login, cadastro, recuperação)
2. Onboarding inicial
3. Dashboard/Home
4. Funcionalidades principais
5. Configurações e perfil
6. Admin (se aplicável)

Mínimo 10 telas, máximo 16. Seja extremamente específico para o nicho descrito.`,

  database: `Crie o esquema completo do banco de dados em formato Markdown com SQL detalhado.
Para cada tabela inclua:
- Nome e propósito preciso (## Tabela: nome)
- Definição SQL completa com tipos corretos, constraints e defaults
- Índices recomendados com justificativa de performance
- RLS policies essenciais (SELECT, INSERT, UPDATE, DELETE)
- Relacionamentos com outras tabelas (FK com ON DELETE behavior)
- Exemplos de dados realistas para a tabela

Use PostgreSQL com Supabase. Inclua campos padrão (id UUID primary key, created_at timestamptz, updated_at timestamptz, user_id UUID).
Inclua também:
- Funções e triggers necessários
- Views úteis para queries complexas
- Finalize com diagrama ERD simplificado em texto mostrando todos os relacionamentos`,

  rules: `Documente todas as regras de negócio do sistema em formato Markdown detalhado e técnico.
Para cada categoria inclua:
- Categoria (## Categoria: Nome)
- Regras numeradas, específicas e não ambíguas
- Casos de borda e exceções documentados
- Validações necessárias (frontend e backend)
- Fluxos condicionais com pseudocódigo quando necessário
- Impacto em outras partes do sistema

Categorias obrigatórias:
1. Autenticação, Autorização e Permissões
2. Fluxos de Dados e Processamento
3. Validações e Regras de Integridade
4. Notificações e Comunicação
5. Monetização, Planos e Limites
6. Integrações e APIs externas
7. Auditoria, Logs e Segurança
8. Performance e Escalabilidade

Seja extremamente específico e acionável — estas regras serão implementadas diretamente por desenvolvedores.`,
};

const modelForContentType: Record<ContentType, string> = {
  modules:  "google/gemini-2.5-flash",
  screens:  "google/gemini-2.5-flash",
  database: "google/gemini-2.5-flash",
  rules:    "google/gemini-2.5-flash",
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

    const systemPrompt = `Você é um arquiteto de software sênior com 20 anos de experiência construindo sistemas SaaS complexos.
Você documenta sistemas com precisão técnica, especificidade de domínio e clareza acionável.
Responda sempre em Markdown bem estruturado com hierarquia clara de headings (##, ###).
Seja profundamente específico para o nicho, tipo e público-alvo do projeto descrito.
NUNCA use exemplos genéricos. NUNCA escreva "Lorem ipsum".
Use terminologia técnica correta do domínio. Seja detalhista e completo.
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
**Monetização:** ${project.monetization ?? "Não definida"}

Gere documentação profissional, completa e altamente específica para este projeto.`;

    const selectedModel = modelForContentType[content_type];

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: selectedModel,
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
