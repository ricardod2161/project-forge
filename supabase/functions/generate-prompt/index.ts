import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const allowedOrigin = Deno.env.get("ALLOWED_ORIGIN") ?? "*";
const corsHeaders = {
  "Access-Control-Allow-Origin": allowedOrigin,
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PROMPT_TYPES: Record<string, { title: string; platform: string; instructions: string }> = {
  "master":        { title: "Prompt Mestre Lovable",        platform: "Lovable",   instructions: "Crie um prompt mestre completo para o Lovable que descreve todo o sistema. Inclua stack tecnológica, funcionalidades principais, design system, fluxos de usuário, autenticação, banco de dados e integrações." },
  "frontend":      { title: "Frontend Completo",            platform: "Lovable",   instructions: "Gere um prompt de frontend React detalhado incluindo: componentes de UI, rotas, estados, hooks customizados, responsividade e acessibilidade. Use shadcn/ui e Tailwind CSS." },
  "backend":       { title: "Backend / API",                platform: "Supabase",  instructions: "Gere um prompt de backend completo com Edge Functions Supabase, endpoints REST, autenticação JWT, RLS policies e integração com banco de dados PostgreSQL." },
  "database":      { title: "Esquema do Banco de Dados",    platform: "Supabase",  instructions: "Gere o schema SQL completo com todas as tabelas, relacionamentos, índices, RLS policies e triggers necessários para este sistema. Inclua comentários explicativos." },
  "dashboard":     { title: "Dashboard Analítico",          platform: "Lovable",   instructions: "Gere um prompt para dashboard com métricas chave, gráficos com Recharts, filtros por período, KPIs animados e layout responsivo em grid." },
  "mvp":           { title: "MVP — Versão Mínima",          platform: "Lovable",   instructions: "Gere um prompt focado no MVP mais enxuto possível: apenas as funcionalidades essenciais para validar o produto, priorizando velocidade de entrega e feedback do usuário." },
  "premium":       { title: "Versão Premium / Completa",    platform: "Lovable",   instructions: "Gere um prompt para a versão completa e premium do produto com todas as funcionalidades avançadas, integrações de terceiros e experiências diferenciadas." },
  "correction":    { title: "Prompt de Correção de Bugs",   platform: "Lovable",   instructions: "Gere um prompt estruturado de debugging para identificar e corrigir bugs comuns neste tipo de sistema, com lista de verificações e estratégias de teste." },
  "refactoring":   { title: "Refatoração e Otimização",     platform: "Lovable",   instructions: "Gere um prompt de refatoração focado em performance, clean code, componentização, remoção de código duplicado e melhorias de arquitetura." },
  "multiplatform": { title: "Multiplataforma (Bubble/Bolt)", platform: "Bubble",   instructions: "Gere um prompt adaptado para plataformas no-code como Bubble ou Bolt, descrevendo os workflows, data types, plugins e configurações visuais necessárias." },
};

const WEBSITE_PROMPT_TYPES: Record<string, { title: string; platform: string; instructions: string }> = {
  "site_master": {
    title: "Prompt Mestre do Site",
    platform: "Lovable",
    instructions: "Crie o prompt mestre completo para construir todo o site. Inclua: stack React+Tailwind+shadcn/ui, estrutura de rotas, design system completo com paleta HEX e tipografia, componentes principais, SEO básico (meta tags, og:tags), responsividade mobile-first, e animações Framer Motion. Adapte ao estilo visual e nicho específicos. Mínimo 900 palavras, linguagem imperativa e técnica.",
  },
  "site_copy": {
    title: "Copywriting e Textos",
    platform: "Geral",
    instructions: "Gere todo o copywriting para o site. Para cada seção escolhida: headline principal, subheadline, corpo do texto (2-3 parágrafos), CTA primário, CTA secundário, microcopy. Adaptar tom conforme especificado. Focar em conversão e persuasão baseada em benefícios. Incluir variações A/B para o Hero. Incluir meta title e meta description de SEO por página.",
  },
  "site_seo": {
    title: "Estratégia SEO Completa",
    platform: "Geral",
    instructions: "Gere estratégia SEO completa: keywords primárias e long-tail por página, meta titles (max 60 chars) e descriptions (max 155 chars) por página, schema markup JSON-LD para o tipo de negócio, sitemap.xml sugerido, checklist técnico SEO (H1 único, alt text, canonical, https, mobile-friendly, Core Web Vitals). Se tiver blog: 3 meses de pauta de conteúdo.",
  },
  "site_design": {
    title: "Design System e Identidade Visual",
    platform: "Figma / Lovable",
    instructions: "Gere o design system para o site: paleta de cores (primária, secundária, destaque — valores HEX), tipografia (Google Fonts, tamanhos h1-h6, body, caption), espaçamentos, border-radius e sombras, componentes específicos do site (header, footer, cards, botões, formulários), regras de uso de logo e marca, exemplos de aplicação do estilo em cada seção principal.",
  },
  "site_sections": {
    title: "Código de Cada Seção",
    platform: "Lovable",
    instructions: "Gere prompt para implementar cada seção individualmente. Para cada seção escolhida: layout exato (grid/flex/posicionamento), componentes internos detalhados, comportamento responsivo mobile/tablet/desktop, animações Framer Motion com scroll-trigger, conteúdo placeholder realista para o nicho, e variações de layout alternativo. Ordenar exatamente pelas seções escolhidas.",
  },
  "site_performance": {
    title: "Performance e Otimização",
    platform: "Geral",
    instructions: "Guia completo de performance: lazy loading de imagens e componentes, formatos WebP/AVIF, code splitting com React.lazy, preload de fontes críticas, Tailwind purge CSS, metas Core Web Vitals (LCP<2.5s, CLS<0.1, FID<100ms), configuração Vercel/Netlify, headers de segurança (CSP, HSTS), e checklist lighthouse com score mínimo 90 em todas as categorias.",
  },
  "site_forms": {
    title: "Formulários e Integrações",
    platform: "Lovable",
    instructions: "Prompt para todos os formulários do site. Por formulário: campos, validação Zod+react-hook-form, feedback visual inline, loading state, mensagem sucesso/erro, anti-spam (honeypot). Integrações: email via Resend/SendGrid, CRM (se aplicável), WhatsApp Business, analytics events por conversão, storage de leads no Supabase. LGPD: checkbox aceite + política privacidade.",
  },
  "site_ecommerce": {
    title: "Loja / E-commerce",
    platform: "Lovable",
    instructions: "Prompt para loja virtual integrada. Incluir: catálogo com filtros e busca, página de produto com galeria e variações, carrinho com persistência localStorage, checkout multi-etapas, gateway de pagamento (Stripe ou MercadoPago), gestão de pedidos, notificações email, cupons de desconto, cálculo de frete, painel admin de produtos simples, conformidade LGPD.",
  },
  "site_cms": {
    title: "Blog / Sistema de Conteúdo",
    platform: "Lovable",
    instructions: "Prompt para blog integrado ao site. Incluir: listagem de posts com paginação e filtro por categoria/tag, página de post com tipografia para leitura, tabela de conteúdo automática, compartilhamento social, posts relacionados, busca de conteúdo, RSS feed, sitemap de posts, integração com CMS escolhido (Notion API/Sanity/Markdown), SEO por post (slug, meta, og:image, schema Article).",
  },
  "site_deploy": {
    title: "Deploy e Go-Live",
    platform: "Vercel / Netlify",
    instructions: "Guia completo de deploy: configuração Git + pipeline automático, variáveis de ambiente, domínio personalizado com SSL, headers de segurança, redirects e rewrites, preview deploys para branches, monitoring básico. Checklist final de launch: SEO validado, performance testada, formulários funcionando, analytics ativo, backup configurado, testes mobile e cross-browser.",
  },
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

    const { project_id, prompt_type } = await req.json();
    if (!project_id || !prompt_type) {
      return new Response(JSON.stringify({ error: "project_id e prompt_type são obrigatórios" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Detect site type
    const isSiteType = prompt_type.startsWith("site_");
    const typeConfig = isSiteType ? WEBSITE_PROMPT_TYPES[prompt_type] : PROMPT_TYPES[prompt_type];

    if (!typeConfig) {
      return new Response(JSON.stringify({ error: "Tipo de prompt inválido" }), {
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

    const websiteMeta = (project.metadata as Record<string, unknown>) ?? {};

    // Site-specific context
    const siteContext = isSiteType ? `

**Dados específicos do site:**
Tipo de site: ${websiteMeta.website_type ?? project.type ?? "Não definido"}
Estilo visual: ${websiteMeta.website_style ?? "Não definido"}
Tom de comunicação: ${websiteMeta.website_tone ?? "Não definido"}
Seções desejadas: ${(websiteMeta.website_sections as string[] ?? []).join(", ") || "Não definidas"}
Tem e-commerce: ${websiteMeta.website_has_ecommerce ? "Sim" : "Não"}
Tem blog/CMS: ${websiteMeta.website_has_blog ? "Sim" : "Não"}
CMS escolhido: ${websiteMeta.website_cms ?? "Sem CMS"}
Tem formulário: ${websiteMeta.website_has_form ? "Sim" : "Não"}
` : "";

    const systemPrompt = isSiteType
      ? `Você é um especialista em criação de sites modernos: design, copywriting, SEO, performance e conversão.
Você escreve prompts extremamente detalhados, estruturados e acionáveis para construir sites completos com Lovable (React + Tailwind + shadcn/ui).
Linguagem: português brasileiro técnico. Seja específico, concreto e orientado à ação. Nunca use generalidades.

ESTRUTURA OBRIGATÓRIA do prompt — use exatamente estas seções com seus headers:

## 1. CONTEXTO E OBJETIVO DO SITE
(O que é o site, para quem, qual objetivo principal, diferencial de mercado)

## 2. STACK E FERRAMENTAS
(React + Vite + Tailwind + shadcn/ui, integrações específicas, CMS se aplicável)

## 3. ESTRUTURA DE PÁGINAS E SEÇÕES
(Mapa do site completo, hierarquia de páginas e seções)

## 4. DESIGN SYSTEM
(Cores HEX, tipografia, espaçamentos, estilo visual específico)

## 5. CONTEÚDO E COPYWRITING
(Textos de cada seção, CTAs, microcopy, tom de voz)

## 6. SEO E PERFORMANCE
(Meta tags, schema markup, Core Web Vitals, lazy loading)

## 7. CRITÉRIOS DE ENTREGA
(Checklist verificável do que deve funcionar ao final)`
      : `Você é um arquiteto de software sênior especialista em criar prompts para ferramentas de IA (Lovable, Bolt, Bubble, Supabase). 
Você escreve prompts extremamente detalhados, estruturados e acionáveis que uma IA consegue executar diretamente para construir sistemas completos.
Linguagem: português brasileiro técnico. Seja específico, concreto e orientado à ação. Nunca use generalidades.

ESTRUTURA OBRIGATÓRIA do prompt — use exatamente estas 7 seções com seus headers:

## 1. CONTEXTO DO PROJETO
(O que é, para quem, qual problema resolve, diferenciais competitivos)

## 2. STACK TÉCNICA
(Tecnologias específicas obrigatórias, versões quando relevante, justificativa das escolhas)

## 3. MÓDULOS E FUNCIONALIDADES
(Lista detalhada de todos os módulos, com sub-funcionalidades específicas)

## 4. BANCO DE DADOS
(Tabelas principais, campos essenciais, relacionamentos, tipos de dados)

## 5. REGRAS DE NEGÓCIO CRÍTICAS
(Validações, fluxos condicionais, restrições — não podem ser ignoradas)

## 6. COMPORTAMENTO ESPERADO DA IA
(Tom, formato de entrega, o que incluir, o que evitar, convenções de código)

## 7. CRITÉRIOS DE ENTREGA
(Checklist do que deve estar funcionando ao final — itens verificáveis)`;

    const userPrompt = `Gere um prompt profissional do tipo "${typeConfig.title}" para o seguinte projeto:

**Projeto:** ${project.title}
**Tipo:** ${project.type ?? "Não definido"}
**Nicho:** ${project.niche ?? "Não definido"}
**Plataforma:** ${project.platform ?? "Não definida"}
**Complexidade:** ${project.complexity ?? 3}/5
**Público-alvo:** ${project.audience ?? "Não definido"}
**Ideia original:** ${project.original_idea ?? "Não fornecida"}
**Funcionalidades:** ${(project.features ?? []).join(", ") || "Nenhuma listada"}
**Integrações:** ${(project.integrations ?? []).join(", ") || "Nenhuma"}
**Monetização:** ${project.monetization ?? "Não definida"}
**Descrição:** ${project.description ?? "Não fornecida"}
${siteContext}
**Instrução específica para este tipo:** ${typeConfig.instructions}

Gere um prompt COMPLETO, DETALHADO e PRONTO PARA USO em ${typeConfig.platform}.
O prompt deve:
- Ter NO MÍNIMO 900 palavras (seja denso e informativo)
- Usar as 7 seções estruturadas definidas no systemPrompt
- Ser extremamente específico para este projeto (mencionar dados reais: nicho, funcionalidades, público)
- Usar linguagem imperativa e técnica ("Implemente...", "Crie...", "Configure...")
- Incluir exemplos concretos e código/pseudocódigo onde relevante
- NUNCA usar exemplos genéricos ou frases de enchimento
- Começar DIRETAMENTE com "## 1." — sem introduções`;

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
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições atingido. Aguarde alguns minutos." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes. Acesse Configurações → Uso para adicionar créditos." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI Gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content ?? "";

    const tokensEstimate = Math.round(content.length / 4);

    const { data: existingPrompts } = await supabase
      .from("prompts")
      .select("version")
      .eq("project_id", project_id)
      .eq("user_id", user.id)
      .eq("type", prompt_type)
      .order("version", { ascending: false })
      .limit(1);

    const nextVersion = existingPrompts && existingPrompts.length > 0
      ? (existingPrompts[0].version + 1)
      : 1;

    const { data: savedPrompt, error: saveError } = await supabase
      .from("prompts")
      .insert({
        project_id,
        user_id: user.id,
        type: prompt_type,
        title: typeConfig.title,
        content,
        platform: typeConfig.platform,
        version: nextVersion,
        tokens_estimate: tokensEstimate,
      })
      .select()
      .single();

    if (saveError) throw saveError;

    return new Response(JSON.stringify({ prompt: savedPrompt }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("generate-prompt error:", err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Erro interno" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
