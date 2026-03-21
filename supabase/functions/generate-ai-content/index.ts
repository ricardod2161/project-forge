import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { callGemini } from "../_shared/ai-providers.ts";

const allowedOrigin = Deno.env.get("ALLOWED_ORIGIN") ?? "*";
const corsHeaders = {
  "Access-Control-Allow-Origin": allowedOrigin,
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type ContentType = "modules" | "screens" | "database" | "rules"
  | "site_pages" | "site_copy" | "site_seo" | "site_structure";

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

  site_pages: `Liste e descreva todas as páginas e seções do site.
Para cada página principal:
- Nome e rota sugerida (/contato, /servicos, etc.)
- Objetivo da página (converter, informar, apresentar)
- Seções internas em ordem hierárquica
- Componentes de UI de cada seção (nomes específicos e visuais)
- Conteúdo placeholder realista para o nicho
- CTA principal e SEO H1 sugerido

Para cada seção das escolhidas pelo usuário:
- Layout (grid, full-width, split, etc.)
- Elementos visuais (imagens, ícones, vídeo, background)
- Textos: headline, subheadline, CTA
- Animação sugerida (fade, slide, parallax)
- Diferença mobile vs desktop

Mínimo 8 páginas/seções. Incluir Header e Footer globais.`,

  site_copy: `Gere o copywriting profissional completo para o site em Markdown.
Estruturar pelas seções escolhidas pelo usuário.

Para cada seção:

## Seção: [Nome]

Headline principal:
Subheadline:
Corpo (2-3 parágrafos):
CTA primário:
CTA secundário:
Microcopy (labels, placeholders):

Usar o tom de comunicação especificado. Linguagem persuasiva baseada em benefícios.
Incluir variações A/B para headline do Hero.
Meta title e meta description de SEO para cada página principal.`,

  site_seo: `Estratégia SEO completa para o site em Markdown estruturado.

## Palavras-chave

- Primárias (volume alto, específicas do nicho)
- Long-tail (intenção de compra/contato)
- Mapeamento: keyword principal por página

## Meta Tags por Página

Title (max 60 chars) e Description (max 155 chars) para cada página

## Schema Markup

JSON-LD para o tipo de negócio (LocalBusiness/Organization/Person/Product)

## Sitemap Sugerido

Hierarquia de URLs amigáveis

## Checklist Técnico

- H1 único por página, alt text em imagens, canonical, sitemap.xml,
  robots.txt, HTTPS, mobile-friendly, Core Web Vitals dentro do limite,
  Open Graph e Twitter Cards configurados`,

  site_structure: `Arquitetura técnica completa do site em Markdown.

## Stack Técnica Recomendada

Justificativa para cada escolha considerando tipo, complexidade, CMS.

## Estrutura de Pastas

Árvore completa com comentários em cada pasta.

## Componentes Principais

Lista de componentes com props (TypeScript), responsabilidade e onde é usado.

## Dados e Estado

Estático vs dinâmico, integração CMS, cache e revalidação.

## Configuração de Build e Deploy

Configuração vite.config.ts, variáveis de ambiente, domínio e DNS, headers de segurança, preview URLs.`,
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

    // Detect website and build context
    const isWebsite = (project.metadata as Record<string, unknown>)?.mode === "website";
    const websiteMeta = (project.metadata as Record<string, unknown>) ?? {};

    const websiteContext = isWebsite ? `

**Dados do site:**
Tipo de site: ${websiteMeta.website_type ?? project.type}
Estilo visual: ${websiteMeta.website_style ?? "Não definido"}
Tom: ${websiteMeta.website_tone ?? "Não definido"}
Seções: ${(websiteMeta.website_sections as string[] ?? []).join(", ") || "Não definidas"}
E-commerce: ${websiteMeta.website_has_ecommerce ? "sim" : "não"}
Blog/CMS: ${websiteMeta.website_has_blog ? (websiteMeta.website_cms ?? "sim") : "não"}
Formulário: ${websiteMeta.website_has_form ? "sim" : "não"}
` : "";

    const systemPrompt = isWebsite
      ? `Você é um especialista em criação de sites modernos, com profundo conhecimento em design, copywriting, SEO e performance web.
Você documenta sites com precisão técnica, especificidade de domínio e clareza acionável.
Responda sempre em Markdown bem estruturado com hierarquia clara de headings (##, ###).
Seja profundamente específico para o nicho, tipo e estilo visual do site descrito.
NUNCA use exemplos genéricos. Use terminologia técnica correta do domínio.
Linguagem: português brasileiro técnico-profissional.`
      : `Você é um arquiteto de software sênior com 20 anos de experiência construindo sistemas SaaS complexos.
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
${websiteContext}
Gere documentação profissional, completa e altamente específica para este projeto.`;

    // Gemini 2.0 Flash: contexto 1M tokens, ideal para geração de conteúdo longo
    const content = await callGemini(`${systemPrompt}\n\n${userPrompt}`, {
      maxTokens: 8192,
      temperature: 0.7,
    });

    return new Response(JSON.stringify({ content }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err: unknown) {
    console.error("generate-ai-content error:", err);
    const status = (err as { status?: number }).status;
    if (status === 429) {
      return new Response(JSON.stringify({ error: "Limite de requisições Google AI atingido. Aguarde alguns minutos e tente novamente." }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (status === 403) {
      return new Response(JSON.stringify({ error: "GOOGLE_AI_KEY inválida ou sem permissão. Verifique em aistudio.google.com." }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Erro interno" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
