import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { callAIWithFallback } from "../_shared/ai-providers.ts";

const allowedOrigin = Deno.env.get("ALLOWED_ORIGIN") ?? "*";
const corsHeaders = {
  "Access-Control-Allow-Origin": allowedOrigin,
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ─────────────────────────────────────────────────────────────────────────────
// NÍVEL 1 — PROMPT MESTRE (Contexto + Stack + Rotas + Regras)
// Escopo EXCLUSIVO: objetivo, público, stack, rotas, tokens CSS, regras.
// NÃO contém: código de componentes, schema SQL, copywriting, deploy.
// ─────────────────────────────────────────────────────────────────────────────

const PROMPT_TYPES: Record<string, { title: string; platform: string; instructions: string }> = {

  "master": {
    title: "Prompt Mestre — Contexto & Arquitetura",
    platform: "Lovable",
    instructions: `Crie o PROMPT MESTRE do sistema. Escopo EXCLUSIVO: define o contexto, stack, rotas e regras que todos os outros módulos devem seguir. Não gere código de componente, schema SQL completo ou copywriting — isso fica nos módulos específicos.

## 1. CONTEXTO DO PROJETO
- Qual problema real o sistema resolve (1 parágrafo específico ao nicho)
- Quem usa o sistema: persona primária + secundária com comportamentos reais
- Proposta de valor única: o que diferencia de soluções existentes no mercado
- Diferenciais competitivos (mínimo 3, específicos ao nicho)

## 2. STACK TÉCNICA (com versões)
- React 18 + Vite 5 + TypeScript 5 strict (tsconfig: strictNullChecks, noImplicitAny)
- Tailwind CSS v3 + shadcn/ui — NUNCA hardcode de cor no JSX
- TanStack Query v5 para dados async, Zustand v4 para estado global de UI
- Supabase (Auth JWT, PostgreSQL 15, Storage, Edge Functions Deno 1.x)
- React Router v6 — rotas protegidas via ProtectedRoute + PublicOnlyRoute
- Validação: Zod v3 em TODOS os formulários + react-hook-form + zodResolver
- Animações: Framer Motion v11 (apenas above-the-fold, com prefers-reduced-motion)
- Toasts: sonner

## 3. DESIGN TOKENS (CSS variables — não código de componente)
Definir APENAS em src/index.css as variáveis HSL:
:root {
  --background:           [H S% L%]; /* ex: 222 47% 11% */
  --foreground:           [H S% L%];
  --primary:              [H S% L%]; /* cor principal da marca */
  --primary-foreground:   [H S% L%];
  --secondary:            [H S% L%];
  --secondary-foreground: [H S% L%];
  --muted:                [H S% L%];
  --muted-foreground:     [H S% L%];
  --accent:               [H S% L%];
  --accent-foreground:    [H S% L%];
  --destructive:          [H S% L%];
  --border:               [H S% L%];
  --card:                 [H S% L%];
  --card-foreground:      [H S% L%];
  --radius: 0.75rem;
}
.dark { /* variáveis invertidas para dark mode */ }
Tipografia: apenas as fontes e pesos (code completo de tipografia vai para o módulo Frontend).

## 4. MAPA DE ROTAS E GUARDS
Para cada rota, especificar:
- Path, componente responsável, guard (público / autenticado / admin)
- Dados carregados: tabela Supabase + campos do select
- Rendering strategy: Client-side / SSR-like via useQuery
Exemplo de nível esperado:
/dashboard → <DashboardPage> | guard: autenticado | dados: projects(id,title,status,updated_at), profiles(plan) | loading: skeleton cards

## 5. MÓDULOS DO SISTEMA (visão geral — sem código)
Listar cada módulo com: nome, responsabilidade em 1 frase, quais páginas/rotas usa, quais tabelas toca.
(Código detalhado de cada módulo fica no Prompt Frontend, Backend ou Banco)

## 6. REGRAS DE IMPLEMENTAÇÃO (críticas e verificáveis)
REGRAS TYPESCRIPT:
- Nunca usar `any` — tipos específicos ou `unknown` com narrowing
- Tipar responses Supabase: Database['public']['Tables']['tabela']['Row']
- Interfaces para objetos, type para unions e primitivos

REGRAS DE UI:
- Nunca hardcode de cor no JSX (sempre hsl(var(--primary)))
- Loading: Skeleton com mesma estrutura do conteúdo real
- Empty state: ícone Lucide relevante + título + subtítulo + CTA
- Error: Alert + mensagem amigável + retry button

REGRAS DE DADOS:
- RLS habilitado em todas as tabelas
- Zod validation em todos os formulários (cliente E servidor)
- useQuery com staleTime adequado ao tipo de dado
- Invalidar queryClient após toda mutation

REGRAS DE AUTH:
- Nunca armazenar JWT em localStorage — Supabase gerencia cookie
- ProtectedRoute: verificar session antes de renderizar
- Redirecionar /login após expiração de sessão

## 7. CHECKLIST DE ENTREGA (20+ itens verificáveis)
Cada item deve ser testável em produção — não genérico.
Exemplos do nível esperado:
- [ ] Login com email válido redireciona para /dashboard em < 2s
- [ ] Rota /admin bloqueia usuário com role=user e redireciona para /dashboard
- [ ] Formulário de cadastro mostra erro inline se email já existe
- [ ] Todas as queries retornam apenas dados do usuário autenticado (RLS validado)
- [ ] Skeleton aparece durante carregamento, nunca spinner genérico
[Gerar 20+ itens específicos para este projeto e nicho]`,
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // NÍVEL 2 — MÓDULO: AUTENTICAÇÃO (NOVO)
  // Escopo EXCLUSIVO: fluxo de auth, guards, profiles, roles.
  // ─────────────────────────────────────────────────────────────────────────────
  "auth": {
    title: "Módulo de Autenticação & Autorização",
    platform: "Supabase",
    instructions: `Gere a especificação COMPLETA do sistema de autenticação e autorização. Escopo EXCLUSIVO deste módulo — não duplicar em outros prompts.

## 1. FLUXOS DE AUTENTICAÇÃO

Cadastro (email + senha):
- Campos: nome completo, email, senha (mín. 8 chars, 1 maiúscula, 1 número), confirmar senha
- Schema Zod completo com mensagens PT-BR
- Após cadastro: confirmar email (não auto-confirmar em produção)
- Redirect: /verificar-email com instrução para checar inbox

Login:
- Campos: email + senha
- Lembrar sessão: checkbox que define persistência (local vs session storage do Supabase)
- Erro genérico: "E-mail ou senha incorretos" (não distinguir qual está errado)
- Redirect: returnTo param ou /dashboard padrão

Recuperação de senha:
- Formulário com email → Supabase envia link de reset
- Página /nova-senha: campos nova senha + confirmar com validação Zod
- Link expira em 1h (padrão Supabase)

Sessão persistente:
- supabase.auth.onAuthStateChange em AuthProvider (Context)
- Redirecionar para /login se SIGNED_OUT
- Token refresh automático pelo Supabase client

## 2. ESTRUTURA DE ARQUIVOS

src/hooks/useAuth.tsx:
- AuthContext com user, session, signIn, signUp, signOut, loading
- useAuth() hook para consumir o contexto
- AuthProvider envolvendo toda a aplicação no App.tsx

src/components/ProtectedRoute.tsx:
- Verifica session antes de renderizar children
- Redireciona para /login com state: { returnTo: location.pathname }
- Loading state enquanto verifica sessão

src/components/PublicOnlyRoute.tsx:
- Redireciona autenticados para /dashboard (evitar acessar /login estando logado)

## 3. PROFILES (tabela pública do usuário)

Trigger handle_new_user() — criar automaticamente ao cadastro:
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

Tabela profiles (campos completos para este projeto):
- user_id uuid (FK para auth.users, ON DELETE CASCADE)
- full_name, email, avatar_url
- plan text DEFAULT 'free'
- onboarding_completed boolean DEFAULT false
- created_at, updated_at (com trigger automático)
RLS: usuário lê/atualiza APENAS seu próprio perfil.

## 4. ROLES E AUTORIZAÇÃO (quando aplicável ao projeto)

Sistema de roles via tabela separada (NUNCA na tabela profiles):
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
CREATE TABLE public.user_roles (
  id      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role    app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

Função de verificação (SECURITY DEFINER — evita recursão RLS):
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

Guard admin no frontend:
const { user } = useAuth();
// verificar role via query Supabase, não localStorage
const isAdmin = await supabase.rpc('has_role', { _user_id: user.id, _role: 'admin' });

## 5. PÁGINAS DE AUTH (componentes completos)

/login — LoginPage:
- Layout: card centralizado, max-w-md, logo acima
- Form com react-hook-form + zodResolver
- Link para /cadastro e /recuperar-senha
- Social login (Google/GitHub) se aplicável ao projeto

/cadastro — CadastroPage:
- Mesma estrutura de LoginPage
- Campos: nome, email, senha, confirmar senha
- Checkbox LGPD (required)

/recuperar-senha — RecuperarSenhaPage
/nova-senha — NovaSenhaPage (acessada via link do email)

## 6. SEGURANÇA
- NUNCA armazenar JWT em localStorage
- Sempre usar HTTPS em produção
- Rate limiting nativo do Supabase Auth (5 tentativas/hora)
- Email de confirmação obrigatório antes do primeiro login
- Senhas: mínimo 8 chars (configurar em Supabase Auth settings)

## 7. CHECKLIST DE AUTH
- [ ] Cadastro cria profile automaticamente via trigger
- [ ] Email de confirmação chega em < 2 min
- [ ] Sessão persiste após refresh da página
- [ ] /dashboard bloqueia usuário não autenticado
- [ ] /login redireciona usuário já logado para /dashboard
- [ ] Recuperação de senha envia email e link funciona
- [ ] Logout limpa sessão e redireciona para /login
- [ ] Usuário admin acessa rotas admin, user regular não`,
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // NÍVEL 2 — MÓDULO: FRONTEND
  // Escopo EXCLUSIVO: componentes, páginas, design system em código.
  // NÃO contém schema SQL nem lógica de Edge Functions.
  // ─────────────────────────────────────────────────────────────────────────────
  "frontend": {
    title: "Módulo Frontend — Componentes & Design System",
    platform: "Lovable",
    instructions: `Gere a especificação COMPLETA do frontend React. Escopo EXCLUSIVO: design system em código, componentes de cada página, hooks de UI, responsividade e acessibilidade. Referenciar o Prompt Mestre para contexto de stack.

## 1. DESIGN SYSTEM EM CÓDIGO

Tipografia (implementar em index.css + tailwind.config.ts):
@import url('https://fonts.googleapis.com/css2?family=[FonteDisplay]:wght@600;700;800&family=[FonteBody]:wght@400;500;600&display=swap');

tailwind.config.ts — fontFamily:
  display: ['"[FonteDisplay]"', 'sans-serif'],
  sans:    ['"[FonteBody]"',    'sans-serif'],

Escala tipográfica com classes Tailwind EXATAS (adaptar ao projeto):
- H1: text-4xl md:text-5xl lg:text-6xl font-display font-bold leading-[1.1] tracking-tight
- H2: text-2xl md:text-3xl font-display font-semibold leading-tight
- H3: text-xl font-display font-semibold
- Body: text-sm font-sans leading-relaxed text-foreground
- Small: text-xs text-muted-foreground
- Label: text-2xs font-medium uppercase tracking-wide text-muted-foreground

Componentes shadcn/ui a instalar (lista exata para este projeto):
[listar apenas os necessários: Button, Card, Dialog, Form, Input, Select, Badge, etc.]

Variantes de Button customizadas (usar CVA):
- primary: bg-primary text-primary-foreground hover:bg-primary/90
- secondary: border border-border hover:bg-muted
- ghost: hover:bg-accent/10 hover:text-accent
- destructive: bg-destructive text-destructive-foreground

## 2. ESTRUTURA DE COMPONENTES (árvore completa)

src/
├── components/
│   ├── ui/              # shadcn/ui customizados
│   ├── layout/          # AppLayout, Sidebar, Header, Footer
│   └── [feature]/       # um diretório por módulo do sistema
├── pages/
│   └── app/             # uma página por rota autenticada
├── hooks/               # um hook por recurso (useProjects, useProfile, etc.)
├── lib/
│   ├── utils.ts         # cn(), formatters, helpers
│   └── validations.ts   # todos os schemas Zod exportados
└── stores/              # Zustand stores (useUIStore, etc.)

## 3. CADA PÁGINA (especificação completa)

Para cada página do sistema, especificar:
- Nome do arquivo, rota, guard (público/autenticado/admin)
- Composição: quais componentes formam a página
- Dados: useQuery keys, tabela Supabase, campos do select, staleTime
- Loading: Skeleton com estrutura idêntica ao conteúdo real
- Empty state: ícone + mensagem + CTA específico ao contexto
- Error: Alert com mensagem + retry button
- Animações: Framer Motion com initial/animate/transition EXATOS

[Especificar CADA página do sistema com o detalhamento acima]

## 4. FORMULÁRIOS (cada um completo)

Para cada formulário:
- Schema Zod com mensagens PT-BR (exportar de lib/validations.ts)
- Campos: tipo HTML, placeholder, mensagem de erro inline
- Submit: loading state no botão, toast sonner de sucesso/erro
- Reset do form após submit bem-sucedido

## 5. COMPONENTES COMPARTILHADOS

AppLayout:
- Sidebar colapsável (desktop: 240px / mobile: Sheet)
- Topbar: breadcrumb + avatar dropdown + notificações
- main com scroll independente

Navegação mobile:
- Sheet com os mesmos itens da Sidebar
- Trigger: menu burger no topbar
- Close automatico ao navegar

AppSidebar (itens e ícones Lucide exatos para este projeto)

## 6. RESPONSIVIDADE

Breakpoints testados: 375px, 768px, 1024px, 1440px
Para cada layout complexo, especificar:
- Mobile: grid-cols-1, textos reduzidos, elementos colapsados
- Tablet: grid-cols-2, sidebar como Sheet
- Desktop: layout completo com sidebar fixa

## 7. ACESSIBILIDADE (WCAG 2.1 AA)
- Contraste mínimo 4.5:1 para texto normal
- aria-label em botões icon-only
- Labels associados a inputs (htmlFor + id)
- Focus visible em todos os interativos (ring-2 ring-ring ring-offset-2)
- Skip to content link no topo do AppLayout

## 8. CHECKLIST DE FRONTEND
- [ ] Todos os componentes respondem em 375px sem overflow horizontal
- [ ] Skeleton aparece em TODOS os carregamentos (nunca spinner genérico isolado)
- [ ] Empty state com CTA em todos os módulos de lista
- [ ] Nenhum hardcode de cor no JSX (verificar grep por "#" em className)
- [ ] Dark mode funciona sem artefatos visuais
- [ ] Focus visible em todos os elementos interativos`,
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // NÍVEL 2 — MÓDULO: BACKEND
  // Escopo EXCLUSIVO: Edge Functions, webhooks, RLS policies.
  // NÃO contém schema SQL completo (fica no módulo Banco).
  // ─────────────────────────────────────────────────────────────────────────────
  "backend": {
    title: "Módulo Backend — Edge Functions & Integrações",
    platform: "Supabase",
    instructions: `Gere a especificação COMPLETA das Edge Functions e integrações externas. Escopo EXCLUSIVO: lógica de servidor, validações backend, webhooks e RLS. Schema SQL detalhado fica no módulo Banco.

## 1. EDGE FUNCTIONS (uma seção por função)

Para cada Edge Function do sistema, especificar:

\`\`\`typescript
// supabase/functions/[nome]/index.ts
// Método: POST | Rota: supabase.functions.invoke("[nome]", { body })

// Autenticação (padrão para todas as funções):
const authHeader = req.headers.get("Authorization");
const { data: { user }, error } = await supabase.auth.getUser(
  authHeader?.replace("Bearer ", "") ?? ""
);
if (!user) return errorResponse(401, "Não autorizado");

// CORS headers obrigatórios em TODAS as respostas (incluindo erros):
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, ...",
};

// Input: interface TypeScript + validação Zod
interface RequestBody { ... }
const schema = z.object({ ... });
const parsed = schema.safeParse(body);
if (!parsed.success) return errorResponse(400, parsed.error.message);

// Retorno padrão:
return new Response(JSON.stringify({ data: result }), {
  headers: { ...corsHeaders, "Content-Type": "application/json" }
});
\`\`\`

[Especificar CADA função do sistema com: nome, input tipado, lógica em passos, output, erros 400/401/429/500]

## 2. RLS POLICIES (cada tabela com politicas completas)

Para cada tabela do sistema:
ALTER TABLE public.[tabela] ENABLE ROW LEVEL SECURITY;

-- SELECT: usuário vê apenas seus dados
CREATE POLICY "[tabela]_select_own" ON public.[tabela]
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- INSERT: usuário insere apenas com seu user_id
CREATE POLICY "[tabela]_insert_own" ON public.[tabela]
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- UPDATE
CREATE POLICY "[tabela]_update_own" ON public.[tabela]
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- DELETE
CREATE POLICY "[tabela]_delete_own" ON public.[tabela]
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Políticas admin (se aplicável):
CREATE POLICY "[tabela]_admin_all" ON public.[tabela]
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

## 3. INTEGRAÇÃO COM IA (via Lovable AI Gateway)

Para cada feature de IA do sistema:
- Nome da Edge Function, modelo recomendado
- System prompt (em PT-BR, imperativo, específico ao domínio)
- User prompt (template com variáveis do projeto)
- Output esperado: formato JSON ou texto
- Como exibir no frontend: streaming vs batch, componente de loading

Usar sempre callLovableAI() de _shared/ai-providers.ts.
Sem hardcode de API keys — apenas LOVABLE_API_KEY do ambiente.

## 4. WEBHOOKS E INTEGRAÇÕES EXTERNAS

Para cada integração externa:
- Endpoint de recebimento (Edge Function dedicada)
- Validação de autenticidade do webhook (secret header)
- Payload esperado com tipos TypeScript
- Idempotência: verificar se já processou (campo processed_at no banco)
- Retry logic: responder 200 imediatamente, processar assincronamente

## 5. CONFIGURAÇÕES (supabase/config.toml)

[functions.nome-da-funcao]
verify_jwt = false  # para funções que validam JWT manualmente

## 6. CHECKLIST DE BACKEND
- [ ] CORS headers presentes em TODAS as respostas (200, 400, 401, 500)
- [ ] Todas as funções validam JWT antes de processar
- [ ] Validação Zod no servidor (nunca confiar apenas no frontend)
- [ ] Nenhuma função retorna dados de outros usuários
- [ ] Rate limiting: responder 429 se exceder limite
- [ ] Variáveis sensíveis apenas em secrets (nunca no código)`,
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // NÍVEL 2 — MÓDULO: BANCO DE DADOS
  // Escopo EXCLUSIVO: schema SQL, índices, triggers, funções de banco.
  // NÃO contém Edge Functions (fica no módulo Backend).
  // ─────────────────────────────────────────────────────────────────────────────
  "database": {
    title: "Módulo Banco de Dados — Schema SQL Completo",
    platform: "Supabase",
    instructions: `Gere o schema SQL COMPLETO e PRODUCTION-READY. Escopo EXCLUSIVO: DDL, índices, RLS, triggers, funções de banco. Edge Functions ficam no módulo Backend.

## 1. SCHEMA COMPLETO

Para cada tabela do sistema:
CREATE TABLE public.[tabela] (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- todos os campos com:
  --   tipo PostgreSQL exato (text, integer, numeric, boolean, timestamptz, jsonb, text[], uuid[])
  --   DEFAULT explícito
  --   NOT NULL ou NULL com justificativa
  --   CHECK constraint se necessário (ex: CHECK (complexity BETWEEN 1 AND 5))
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

Tipos PostgreSQL corretos (usar o tipo certo):
- Texto: text (varchar apenas se precisar limite de tamanho)
- Números: integer, bigint, numeric(10,2) para dinheiro
- Booleanos: boolean NOT NULL DEFAULT false
- Datas: timestamptz (SEMPRE com fuso horário)
- JSON flexível: jsonb (não json)
- Arrays: text[] ou uuid[]
- Enums: CREATE TYPE public.nome AS ENUM ('valor1', 'valor2')

## 2. ÍNDICES (com justificativa de performance)

-- Padrão mínimo: índice em toda FK e campo de busca frequente
CREATE INDEX idx_[tabela]_user_id ON public.[tabela](user_id);
-- Justificativa: "Todas as queries filtram por user_id — scan completo sem índice"

CREATE INDEX idx_[tabela]_status ON public.[tabela](status);
-- Justificativa: "Queries de listagem filtram por status frequentemente"

-- Índice composto quando WHERE usa múltiplos campos:
CREATE INDEX idx_[tabela]_user_status ON public.[tabela](user_id, status);

-- Full-text search (se necessário):
CREATE INDEX idx_[tabela]_fts ON public.[tabela] USING GIN(to_tsvector('portuguese', title || ' ' || description));

## 3. RLS COMPLETO

ALTER TABLE public.[tabela] ENABLE ROW LEVEL SECURITY;

[Políticas SELECT / INSERT / UPDATE / DELETE para cada tabela]
[Políticas especiais para tabelas públicas (sem filtro de user_id)]
[Políticas admin com has_role() para tabelas com acesso privilegiado]

## 4. TRIGGERS ESSENCIAIS

-- updated_at automático (aplicar em todas as tabelas mutáveis)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER set_[tabela]_updated_at
  BEFORE UPDATE ON public.[tabela]
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- handle_new_user (criar profile automático):
[SQL completo conforme especificado no módulo Auth]

## 5. FUNÇÕES DE BANCO (SECURITY DEFINER)

-- has_role (anti-recursão RLS):
[SQL completo conforme módulo Auth]

-- Funções de negócio específicas do projeto:
CREATE OR REPLACE FUNCTION public.[nome_funcao](_param tipo)
RETURNS tipo LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  [query]
$$;

## 6. SEEDS (dados iniciais obrigatórios)

-- Dados necessários para o sistema funcionar (categorias, planos, configurações):
INSERT INTO public.[tabela] (campo1, campo2) VALUES
  ('valor1', 'valor2'),
  ('valor3', 'valor4');

## 7. DIAGRAMA DE RELACIONAMENTOS (textual)

[tabela_a] (N) → [tabela_b] (1): campo_fk ON DELETE [CASCADE/SET NULL/RESTRICT]
[Listar todos os relacionamentos com cardinalidade e comportamento ON DELETE]

## 8. CHECKLIST DO BANCO
- [ ] Todas as tabelas com RLS habilitado (ALTER TABLE ... ENABLE ROW LEVEL SECURITY)
- [ ] Todas as FKs com ON DELETE definido explicitamente
- [ ] Trigger de updated_at em todas as tabelas com UPDATE
- [ ] Índice em toda FK e campo de filtro frequente
- [ ] Enums PostgreSQL para campos com valores fixos (não text livre)
- [ ] jsonb para campos JSON (nunca json)
- [ ] Sem dados sensíveis em colunas sem restrição de acesso`,
  },

  "dashboard": {
    title: "Módulo Dashboard — Painel Analítico",
    platform: "Lovable",
    instructions: `Gere um prompt completo para dashboard analítico com métricas reais, visualizações e UX de produto maduro. Referenciar design tokens do Prompt Mestre.

LAYOUT DO DASHBOARD:
- Sidebar colapsável com navegação principal
- Topbar com: breadcrumb, search global, notifications bell, avatar dropdown
- Grid de KPIs no topo: 4 cards com métrica principal, variação vs período anterior, ícone, cor de tendência
- Seção de gráficos: 2 colunas (linha temporal + pizza/barra)
- Tabela de dados recentes com paginação

COMPONENTES DE VISUALIZAÇÃO (Recharts):
- LineChart para métricas temporais: dataKey, dot, tooltip customizado com formatação pt-BR
- BarChart para comparações: multiple bars com cores das CSS vars do design system
- PieChart para distribuições: legenda customizada
- ResponsiveContainer em todos os gráficos
- Cores dos gráficos: hsl(var(--primary)), hsl(var(--accent)), hsl(var(--muted-foreground))

KPI CARDS (especificar cada um para este projeto):
- Título, valor atual formatado (moeda/percentual/número pt-BR), variação percentual
- Cor da variação: text-success se positivo, text-destructive se negativo
- Ícone Lucide relevante
- Loading skeleton: mesma estrutura do card preenchido

FILTROS:
- Seletor de período: Hoje / 7 dias / 30 dias / 90 dias / Personalizado
- Filtros por categoria/status: chips multi-select
- Estado dos filtros em Zustand (persistir na URL via searchParams)

DADOS E QUERIES:
- useQuery para cada bloco com staleTime adequado (métricas = 5min, listas = 1min)
- useMemo para derivar métricas no cliente
- Refresh automático a cada 5 minutos para métricas live

RESPONSIVIDADE:
- Mobile: KPIs em grid 2x2, gráficos em coluna única, tabela com scroll horizontal
- Desktop: KPIs em 1x4, layout completo lado a lado

ESTADOS:
- Loading: Skeleton para cada seção
- Empty: "Nenhum dado no período" com ícone BarChart e CTA
- Error: Alert com retry + timestamp da última atualização`,
  },

  "mvp": {
    title: "MVP — Versão Mínima Viável",
    platform: "Lovable",
    instructions: `Gere um prompt de MVP com escopo RIGIDAMENTE CONTROLADO. Objetivo: o menor produto que valida a hipótese central em menos de 2 semanas.

PRINCÍPIO DO MVP:
- Hipótese central a validar: [definir com base no nicho do projeto]
- Critério de corte: "se a feature não valida a hipótese, não entra"
- Lista explícita de "O que NÃO está no MVP" (funcionalidades v2)

FUNCIONALIDADES CORE (máximo 3-4):
- Cada feature: nome, descrição em 1 frase, critério de "está pronto"
- Fluxo end-to-end: cadastro → ação principal → resultado

STACK SIMPLIFICADA (sem over-engineering):
- React + Vite + Tailwind + shadcn/ui sem customização visual
- Supabase Auth + máximo 3 tabelas
- Zero Edge Functions no início (Supabase client direto)
- Zero integrações externas

BANCO MÍNIMO:
- Máximo 3-4 tabelas com apenas campos obrigatórios
- RLS básica: usuário vê seus dados
- Sem enums, sem triggers complexos

DESIGN INTENCIONAL:
- shadcn/ui sem customização
- Zero animações Framer Motion
- Foco: funcional > bonito

CHECKLIST DE LANÇAMENTO:
- [ ] Cadastro e login funcionando
- [ ] Fluxo principal end-to-end sem erros
- [ ] Mobile responsivo (375px)
- [ ] Zero console.error em produção
- [ ] URL pública compartilhável

MÉTRICAS DE VALIDAÇÃO:
- Métrica primária: o que medir para validar a hipótese
- Threshold: "X usuários fazem Y em Z dias = validado"`,
  },

  "premium": {
    title: "Versão Premium — Funcionalidades Avançadas",
    platform: "Lovable",
    instructions: `Gere um prompt para a versão COMPLETA com todas as funcionalidades avançadas, integrações e experiências diferenciadas. Partir do MVP validado.

FUNCIONALIDADES AVANÇADAS (além do MVP):
- Listar cada feature premium com: valor para o usuário, complexidade (1-5)
- Diferenciadores competitivos únicos no mercado

SISTEMA DE PLANOS:
- Definir tiers (Free/Pro/Enterprise ou equivalente)
- Por tier: features disponíveis, limites (storage, uso IA, projetos)
- Tabela plan_limits com os limites
- Guards de feature: verificar tier antes de ações premium
- Upgrade flow: modal com comparação + CTA de upgrade

INTEGRAÇÕES EXTERNAS AVANÇADAS:
- Para cada integração: OAuth ou API key, dados trocados, frequência de sync
- Webhooks com retry logic e idempotência
- Rate limiting por usuário para APIs externas

PERSONALIZAÇÃO:
- Perfil: avatar upload (Supabase Storage), preferências, notificações
- Workspace/organização: convidar membros, roles
- Tema: light/dark/system

IA E AUTOMAÇÃO:
- Cada feature de IA: input, modelo, output, streaming vs batch
- Lovable AI Gateway para modelos sem API key extra
- Cache de resultados IA no banco

PERFORMANCE:
- Paginação cursor-based para listas grandes
- Full-text search com tsvector + GIN index
- React.lazy + Suspense para módulos pesados

CHECKLIST DE PRODUÇÃO (25+ itens verificáveis)`,
  },

  "correction": {
    title: "Correção de Bugs — Guia de Debugging",
    platform: "Lovable",
    instructions: `Gere um prompt estruturado de debugging específico para este sistema. Nível de detalhe de engenheiro sênior.

MAPA DE BUGS COMUNS (por categoria):

AUTENTICAÇÃO:
- Sessão expira sem redirecionar → supabase.auth.onAuthStateChange implementado?
- Token JWT inválido não tratado → crash sem mensagem
- Verificar: ProtectedRoute checa session ou apenas user?

QUERIES E BANCO:
- Query sem RLS → retorna dados de outros usuários
- N+1 queries em listas → um fetch por item
- Missing await em async → data é undefined
- Verificar: todas as queries têm .eq("user_id", user.id)?

FORMULÁRIOS:
- Submit múltiplo → cria duplicatas → usar loading state no botão
- Zod com .parse() em vez de .safeParse() → throw em vez de erro amigável
- Form não reseta após submit

ESTADO E RE-RENDERS:
- useEffect com deps incorretas → loop ou dados obsoletos
- Estado não resetado ao trocar rota → dados do item anterior aparecem
- QueryClient não invalidado após mutation → UI desatualizada

EDGE FUNCTIONS:
- CORS headers ausentes em respostas de erro (apenas no 200)
- Erro não tratado → HTML de erro Deno em vez de JSON
- Secret não configurado → função quebra silenciosamente

CHECKLIST DE DEBUGGING (ordem):
1. DevTools → Console → verificar erros JS
2. DevTools → Network → verificar chamadas API (status, payload, response)
3. Supabase → Logs → erros nas Edge Functions
4. Testar com usuário diferente → bug é do usuário ou do sistema?
5. Testar em incógnito (sessão limpa)
6. Testar em mobile (375px)

FIXES PARA CADA CATEGORIA:
[Código de correção específico para cada tipo de bug adaptado a este projeto]`,
  },

  "refactoring": {
    title: "Refatoração — Arquitetura & Qualidade",
    platform: "Lovable",
    instructions: `Gere um prompt de refatoração técnica focado em performance, manutenibilidade e arquitetura limpa.

ANÁLISE DE DEBT TÉCNICO:
- Componentes > 300 linhas → candidatos a split
- useEffect com múltiplas responsabilidades → separar por concern
- Props drilling > 3 níveis → Context ou Zustand
- Lógica duplicada → extrair para hook/util

COMPONENTIZAÇÃO:
- Single Responsibility: cada componente faz UMA coisa
- Container vs Presentational: separar dados da UI
- Co-location: arquivos relacionados juntos

CUSTOM HOOKS:
- useAuth: session, user, signIn, signOut
- use[Resource]: fetch, loading, error, mutations para cada recurso
- useDebounce: para inputs de busca

TYPESCRIPT STRICTNESS:
- Eliminar todos os `any` → tipos específicos ou unknown
- Tipar responses Supabase: Database['public']['Tables'][tabela]['Row']
- Zod schemas exportados e reutilizados entre frontend e backend

PERFORMANCE:
- React.memo apenas em componentes com props estáveis e renders frequentes
- useMemo para cálculos derivados de listas grandes
- TanStack Query staleTime por tipo de dado
- Code splitting: React.lazy para páginas e modais pesados

ESTRUTURA DE PASTAS:
src/
├── components/ui/      # shadcn
├── components/[feat]/  # por feature
├── hooks/              # custom hooks
├── pages/              # routes
├── lib/                # utils, validations, constants
├── stores/             # Zustand
└── types/              # TypeScript interfaces

CHECKLIST:
- [ ] Zero warnings TypeScript strict
- [ ] Zero componentes > 300 linhas
- [ ] Zero any no código
- [ ] Todos os useEffect com cleanup quando necessário
- [ ] Bundle size analisado`,
  },

  "multiplatform": {
    title: "Multiplataforma (Bubble/Bolt)",
    platform: "Bubble",
    instructions: `Gere um prompt adaptado para plataformas no-code com especificidade operacional para Bubble ou Bolt.

BUBBLE — ESTRUTURA:

DATA TYPES:
- Para cada entidade: nome, campos com tipos Bubble (text/number/date/boolean/list/file)
- Privacy rules por tipo: condição de visibilidade e modificação

WORKFLOWS:
- Por ação: trigger, condições, steps em ordem
- Nomenclatura: [Página]-[Ação]
- Backend workflows para operações críticas

PÁGINAS:
- Nome, URL, restrição de acesso
- Grupos e containers principais
- Repeating Groups: data source, filtros, ordenação

ESTILOS:
- Cores como styles reutilizáveis (Primary, Secondary, etc.)
- Fonts via Google Fonts no header

PLUGINS NECESSÁRIOS:
- Listar com justificativa de uso
- API Connector: cada endpoint externo

BOLT — EQUIVALÊNCIAS:
- Components, rotas, stores
- Bubble Workflow → Bolt action/event handler`,
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// PROMPT TYPES — SITES
// ─────────────────────────────────────────────────────────────────────────────
const WEBSITE_PROMPT_TYPES: Record<string, { title: string; platform: string; instructions: string }> = {

  // NÍVEL 1 — Mestre do Site (lean: contexto + stack + rotas + tokens)
  "site_master": {
    title: "Prompt Mestre do Site — Contexto & Stack",
    platform: "Lovable",
    instructions: `Crie o PROMPT MESTRE do site. Escopo EXCLUSIVO: contexto, stack, mapa de rotas, design tokens e regras. Design system completo fica em site_design. Copywriting fica em site_copy. Deploy fica em site_deploy.

## 1. CONTEXTO DO SITE
- O que é o site, qual problema resolve para o visitante
- Público-alvo: persona principal com comportamento de busca real
- Diferencial único frente a concorrentes no mesmo nicho
- Tom de voz: formal/casual, técnico/acessível (com 2-3 exemplos de frase)
- Objetivo de conversão: o que o visitante deve fazer ao sair do site

## 2. STACK TÉCNICA (com versões)
- React 18 + Vite 5 + TypeScript strict
- Tailwind CSS v3 — NUNCA hardcode de cor
- shadcn/ui como base, customizado com design system
- Framer Motion v11 (apenas above-the-fold, prefers-reduced-motion obrigatório)
- React Router v6 (SPA) OU Next.js 14 App Router (se SSR/ISR necessário)
- TanStack Query para dados async (formulários, blog, CMS)
- react-hook-form + Zod para formulários

## 3. DESIGN TOKENS (apenas variáveis — código completo em site_design)
Definir em index.css:
:root {
  --background:           [H S% L%];
  --foreground:           [H S% L%];
  --primary:              [H S% L%]; /* cor principal da marca */
  --primary-foreground:   [H S% L%];
  --accent:               [H S% L%]; /* destaque / CTAs */
  --accent-foreground:    [H S% L%];
  --muted:                [H S% L%];
  --muted-foreground:     [H S% L%];
  --border:               [H S% L%];
  --card:                 [H S% L%];
  --radius: [valor]rem;
}
.dark { [variáveis dark] }
Tipografia: apenas nomear as fontes e pesos (implementação completa em site_design).

## 4. MAPA DE ROTAS E RENDERING STRATEGY
Para cada rota:
- Path, componente, rendering strategy (SSG / ISR revalidate:Ns / SSR / CSR)
- Justificativa da estratégia escolhida
- Dados carregados e origem (CMS, Supabase, API)

Exemplo: /blog/[slug] → BlogPost | ISR revalidate:3600 | dados: CMS post by slug

## 5. HEADLINE + SUBHEADLINE (resumo por seção)
Para cada seção principal, apenas a headline e subheadline (textos completos vão para site_copy):
- Hero: "[Headline impactante]" / "[Subheadline de apoio]"
- Benefícios: "[Título]" / "[Subtítulo]"
[etc. por seção]

## 6. REGRAS DE IMPLEMENTAÇÃO
- Nunca hardcode de cor no JSX (sempre hsl(var(--primary)))
- prefers-reduced-motion: respeitar em TODAS as animações
- Landmarks semânticos: header, main, nav, footer, section[aria-label]
- Alt text descritivo e contextual em todas as imagens
- Um único H1 por página

## 7. CHECKLIST DE ENTREGA
- [ ] Lighthouse ≥ 90 Performance mobile e desktop
- [ ] Um único H1 por página com keyword principal
- [ ] Formulário de contato testado (submissão chega no destino)
- [ ] Meta OG pré-visualiza corretamente no WhatsApp
- [ ] JSON-LD válido no schema.org/validator
[20+ itens específicos para este site e nicho]`,
  },

  // NÍVEL 2 — Design System (código CSS completo)
  "site_design": {
    title: "Design System & Identidade Visual",
    platform: "Figma / Lovable",
    instructions: `Gere o design system COMPLETO com valores específicos prontos para copiar no código. Escopo EXCLUSIVO: CSS variables, tipografia, componentes visuais, microinterações e grid system. Referenciar design tokens do Prompt Mestre.

CSS VARIABLES (index.css, valores HSL reais e específicos):
:root {
  --background:       [H S% L%];
  --foreground:       [H S% L%];
  --primary:          [H S% L%];
  --primary-foreground: [H S% L%];
  --secondary:        [H S% L%];
  --accent:           [H S% L%];
  --accent-foreground:[H S% L%];
  --muted:            [H S% L%];
  --muted-foreground: [H S% L%];
  --border:           [H S% L%];
  --card:             [H S% L%];
  --card-foreground:  [H S% L%];
  --destructive:      [H S% L%];
  --radius:           [valor]rem;
  
  /* Tokens extras do site */
  --gradient-hero:    linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)));
  --shadow-card:      0 4px 6px -1px hsl(var(--foreground) / 0.1);
  --shadow-card-hover: 0 10px 25px -5px hsl(var(--primary) / 0.2);
}
.dark { [todas as variáveis invertidas para dark mode] }

TIPOGRAFIA (Google Fonts + Tailwind):
@import url('https://fonts.googleapis.com/css2?family=[FonteDisplay]:wght@600;700;800&family=[FonteBody]:wght@400;500;600&display=swap');

tailwind.config.ts:
fontFamily: {
  display: ['"[FonteDisplay]"', 'sans-serif'],
  sans:    ['"[FonteBody]"', 'sans-serif'],
}

ESCALA TIPOGRÁFICA (classes Tailwind exatas):
- H1: text-5xl md:text-6xl lg:text-7xl font-display font-bold leading-[1.05] tracking-tight
- H2: text-3xl md:text-4xl font-display font-semibold leading-tight
- H3: text-xl md:text-2xl font-display font-semibold
- Body lg: text-base md:text-lg font-sans leading-relaxed
- Body: text-sm font-sans leading-relaxed
- Small: text-xs text-muted-foreground
- Caption: text-2xs uppercase tracking-widest font-medium

VARIANTES DE COMPONENTES (classes Tailwind exatas):
Button primary: bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm active:scale-[0.98]
Button secondary: border border-border text-foreground hover:bg-muted
Button ghost: text-primary hover:bg-primary/8
Card: bg-card border border-border rounded-[calc(var(--radius)+4px)] p-6 hover:shadow-[var(--shadow-card-hover)] hover:border-primary/30 transition-all duration-200

MICROINTERAÇÕES (Framer Motion, valores exatos):
const fadeUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] }
};
const stagger = { animate: { transition: { staggerChildren: 0.08 } } };
// Hover card: whileHover={{ scale: 1.01 }} transition={{ duration: 0.2 }}
// Sempre: if (prefersReducedMotion) skip animations

GRID E ESPAÇAMENTO:
- Section: py-16 md:py-24 lg:py-32
- Container: max-w-7xl mx-auto px-4 sm:px-6 lg:px-8
- Cards grid: grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8`,
  },

  // NÍVEL 2 — Copywriting
  "site_copy": {
    title: "Copywriting & Textos do Site",
    platform: "Geral",
    instructions: `Gere o copywriting COMPLETO e PRONTO PARA USO. Escopo EXCLUSIVO: textos reais de cada seção. SEO técnico fica em site_seo.

PARA CADA SEÇÃO, entregar:
1. Headline (H1/H2): impactante, benefício específico, máx 10 palavras
2. Subheadline: expandir benefício, 1-2 linhas, sem jargão
3. Corpo: 2-3 parágrafos com credibilidade + desejo + urgência
4. CTA Primário: verbo + benefício ("Comece Agora" > "Saiba Mais")
5. CTA Secundário: opção menos comprometida
6. Microcopy: labels, tooltips, placeholders, mensagens

SEÇÃO HERO:
- Badge de credibilidade acima do H1
- H1 que endereça a dor do público deste nicho
- Proposta de valor única vs concorrentes
- Prova social: métrica real ou "X empresas confiam"

BENEFÍCIOS/DIFERENCIAIS:
- 3-4 títulos curtos (3-5 palavras) + expansão de 1 frase cada
- Foco em benefícios (o que o cliente GANHA), não features

DEPOIMENTOS (template para coletar):
"[Resultado específico] em [Tempo]. [Como foi]. — [Nome, Cargo, Empresa]"

SOBRE/MANIFESTO:
- Por que a empresa existe (problema que resolve)
- Abordagem diferenciada vs mercado
- Tom: humano, direto, sem corporativismo

TOM DE VOZ:
- Vocabulário a usar e a evitar para este nicho
- Como tratar objeções comuns nos textos

VARIAÇÕES A/B PARA HERO:
- Versão A: headline focada na dor
- Versão B: headline focada na transformação`,
  },

  // NÍVEL 2 — SEO
  "site_seo": {
    title: "Estratégia SEO Técnica",
    platform: "Geral",
    instructions: `Gere estratégia SEO COMPLETA e IMPLEMENTÁVEL para este nicho. Escopo EXCLUSIVO: técnico, keywords, structured data. Copywriting dos textos fica em site_copy.

KEYWORDS (por página):
- URL, keyword primária, keywords secundárias, long-tail, intenção de busca

META TAGS (cada página):
<title>: keyword + marca (máx 60 chars)
<meta description>: benefício + CTA implícito (máx 155 chars)
<link rel="canonical">: URL canônica
Open Graph: og:title, og:description, og:image (1200x630), og:url, og:type

JSON-LD POR TIPO DE PÁGINA:
- Home: Organization + WebSite com SearchAction
- Serviços: Service com areaServed
- Cases: WebPage + BreadcrumbList
- Blog: BlogPosting com author Person, datePublished, wordCount
- Contato: ContactPage + LocalBusiness (se local)

TECHNICAL SEO:
- Um único H1 por página com keyword principal
- Alt text descritivo em todas as imagens
- Preload de LCP image
- Preconnect para Google Fonts e CDNs
- Sitemap.xml dinâmico (incluindo blog posts)
- robots.txt bloqueando /admin, /api
- Core Web Vitals: LCP < 2.5s, CLS < 0.1, INP < 200ms

ESTRATÉGIA DE CONTEÚDO (3 meses):
- Mês 1: 4 artigos de baixa dificuldade específicos ao nicho
- Mês 2: 4 artigos com intenção transacional
- Mês 3: 4 artigos + 1 landing page de comparação`,
  },

  // NÍVEL 2 — Seções (código)
  "site_sections": {
    title: "Código das Seções do Site",
    platform: "Lovable",
    instructions: `Gere prompts DETALHADOS para implementar cada seção individualmente. Referenciar design tokens do Prompt Mestre e design system de site_design.

PARA CADA SEÇÃO:
1. LAYOUT EXATO: estrutura HTML semântica, grid Tailwind, fundo, padding/margin por breakpoint
2. COMPONENTES INTERNOS: cada elemento filho com classes Tailwind exatas, conteúdo real do nicho
3. RESPONSIVIDADE: 375px → 768px → 1280px com cada ajuste especificado
4. ANIMAÇÕES FRAMER MOTION: whileInView com once:true, initial/animate exatos, stagger
5. CONTEÚDO REALISTA: textos do nicho (não Lorem Ipsum), métricas plausíveis

SEÇÕES A COBRIR:
- Hero com elemento visual dinâmico
- Benefícios/diferenciais (grid de cards)
- Cases/portfolio com filtros
- Depoimentos/social proof
- FAQ com acordeão (Accordion shadcn/ui)
- CTA final com urgência
- Footer (links, redes, copyright, newsletter)`,
  },

  // NÍVEL 2 — Performance
  "site_performance": {
    title: "Performance & Core Web Vitals",
    platform: "Geral",
    instructions: `Guia técnico para atingir Lighthouse 95+ mobile e desktop.

LCP < 2.5s:
- Identificar o elemento LCP (hero image ou H1)
- priority={true} na image LCP
- Preload: <link rel="preload" as="image">
- Preconnect para Google Fonts

CLS < 0.1:
- width e height em todas as imagens
- font-display: swap para fontes
- Não inserir conteúdo acima do existente

INP < 200ms:
- Debounce em inputs de busca (300ms)
- Lazy loading de componentes não críticos
- Evitar layouts síncronos forçados

IMAGENS:
- WebP/AVIF para todas as imagens
- sizes prop preciso por breakpoint
- Lazy loading abaixo da dobra

JAVASCRIPT:
- Bundle analysis: vite-bundle-visualizer
- React.lazy + Suspense para módulos pesados
- Tree-shaking: importar apenas o necessário

CHECKLIST LIGHTHOUSE:
- [ ] Performance ≥ 95 mobile
- [ ] LCP < 2.5s em 4G lento
- [ ] CLS < 0.1
- [ ] INP < 200ms
- [ ] Sem render-blocking resources`,
  },

  // NÍVEL 2 — Formulários
  "site_forms": {
    title: "Formulários & Integrações",
    platform: "Lovable",
    instructions: `Especificação completa de formulários com validação, integrações e conformidade LGPD.

STACK DE FORMULÁRIOS:
- react-hook-form + zodResolver
- Zod schemas em lib/validations.ts (reutilizar no backend)
- Sonner para toasts

PARA CADA FORMULÁRIO:
1. Schema Zod completo com mensagens PT-BR
2. Campos: tipo HTML, placeholder realista, mensagem de erro inline
3. Máscara: WhatsApp (XX) XXXXX-XXXX, CPF, CNPJ
4. Estados do botão: default / loading / sucesso / erro
5. Integração: Edge Function + webhook CRM + persistência no banco
6. Anti-spam: honeypot + rate limiting (máx 3/hora por IP)

LGPD (obrigatório para formulários com dados pessoais):
- Checkbox required: "Li e concordo com a Política de Privacidade"
- Armazenar consentimento: email + timestamp + IP + purpose`,
  },

  // NÍVEL 2 — E-commerce
  "site_ecommerce": {
    title: "Loja / E-commerce Completa",
    platform: "Lovable",
    instructions: `Prompt completo para loja virtual desde catálogo até checkout e gestão de pedidos.

BANCO (tabelas específicas):
CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  price numeric(10,2) NOT NULL CHECK (price >= 0),
  compare_price numeric(10,2),
  stock integer NOT NULL DEFAULT 0,
  sku text UNIQUE,
  images text[] DEFAULT '{}',
  category_id uuid REFERENCES categories(id),
  is_active boolean DEFAULT true,
  metadata jsonb DEFAULT '{}'
);

CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  email text NOT NULL,
  status order_status DEFAULT 'pending',
  items jsonb NOT NULL,
  subtotal numeric(10,2) NOT NULL,
  total numeric(10,2) NOT NULL,
  payment_id text,
  shipping_address jsonb
);

CREATE TYPE order_status AS ENUM ('pending','paid','processing','shipped','delivered','cancelled','refunded');

CHECKOUT (4 etapas):
1. Carrinho: itens, quantidades, subtotal, cupom
2. Identificação: login ou guest (nome + email)
3. Entrega: endereço com CEP (ViaCEP autocomplete), cálculo de frete
4. Pagamento: Stripe Elements ou MercadoPago Checkout Bricks

CARRINHO (Zustand):
useCartStore: addItem, removeItem, updateQty, clearCart
Persistência: localStorage, sync com banco ao logar

GATEWAY:
Stripe: PaymentIntent no backend + Elements no frontend + webhook de confirmação
MercadoPago: Preference no backend + Checkout Pro/Bricks + IPN webhook

GESTÃO DE PEDIDOS (admin):
- Filtro por status, busca por email/ID
- Ações: marcar enviado, cancelar, reembolsar
- Notificação email por status (Resend API)`,
  },

  // NÍVEL 2 — CMS/Blog
  "site_cms": {
    title: "Blog / Sistema de Conteúdo (CMS)",
    platform: "Lovable",
    instructions: `Prompt completo para blog integrado com CMS, SEO otimizado e experiência de leitura premium.

CMS (especificar conforme projeto):
Contentful: Space ID + Access Token, Content model BlogPost, funções getPosts/getPostBySlug, ISR revalidate:600
Notion API: Integration token + Database ID, filtros Published=true, renderizar blocos
Markdown local: /content/posts/*.mdx, gray-matter para frontmatter, next-mdx-remote

LISTAGEM:
- Grid 3 colunas (1 mobile), ArtigoCard com: capa, categoria, título, excerpt (2 linhas), autor + data + tempo de leitura
- Filtros: categoria (chips) + busca client-side
- Paginação: infinite scroll ou numerada

PÁGINA DO ARTIGO:
- @tailwindcss/typography customizado (font-display para headings)
- Tabela de conteúdo sticky (H2/H3 extraídos)
- Progress bar de leitura (2px topo)
- Tempo de leitura: Math.ceil(wordCount/200) min
- Compartilhamento: Twitter, LinkedIn, WhatsApp

SEO DO BLOG:
- generateMetadata: title, description, og:image da capa
- JSON-LD BlogPosting: headline, author, datePublished, image, wordCount
- Breadcrumb JSON-LD
- RSS feed /feed.xml

NEWSLETTER:
- Form inline no final de cada post
- Edge Function: validar + Resend/Mailchimp
- LGPD: checkbox obrigatório`,
  },

  // NÍVEL 2 — Deploy
  "site_deploy": {
    title: "Deploy & Go-Live",
    platform: "Vercel / Netlify",
    instructions: `Guia completo de deploy e lançamento do site.

VERCEL (configuração):
vercel.json com: security headers (X-Frame-Options, HSTS, CSP), cache para assets estáticos, redirects de URLs antigas

Variáveis de ambiente no painel Vercel (produção + preview):
[Listar todas as vars necessárias com comentário de onde obter]

CI/CD:
- main → produção automático
- feat/* → preview deployments
- Build check antes de merge

DOMÍNIO:
1. Adicionar em Vercel > Domains
2. DNS: CNAME www → cname.vercel-dns.com
3. Apex: A record → 76.76.21.21
4. SSL automático (Let's Encrypt)

MONITORAMENTO:
- Vercel Analytics + Speed Insights
- UptimeRobot para uptime (alerta email)
- Sentry para erros (opcional)

CHECKLIST DE LANÇAMENTO:
- [ ] next build sem erros
- [ ] Todas as env vars em produção
- [ ] Formulário testado e chegando no destino
- [ ] Google Analytics verificado
- [ ] robots.txt correto (não bloqueia páginas públicas)
- [ ] Sitemap enviado no Search Console
- [ ] JSON-LD validado
- [ ] Meta OG testado
- [ ] PageSpeed Insights mobile ≥ 90
- [ ] SSL funcionando
- [ ] 404 customizado com link para home`,
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// SYSTEM PROMPTS
// ─────────────────────────────────────────────────────────────────────────────
const SYSTEM_PROMPT_APPS = `Você é um arquiteto de software sênior especialista em criar prompts técnicos para ferramentas de IA (Lovable, Supabase, Bubble).

REGRA CRÍTICA DE ESCOPO: cada tipo de prompt tem responsabilidade EXCLUSIVA.
- Prompt MESTRE: define contexto, stack, design tokens e regras — NÃO contém SQL completo, código de componentes ou copywriting
- Prompt AUTH: fluxo de autenticação, guards, profiles, roles — NÃO duplicar em outros módulos
- Prompt FRONTEND: componentes, design system em código, animações — NÃO contém SQL ou Edge Functions
- Prompt BACKEND: Edge Functions, RLS policies, webhooks — NÃO contém schema SQL detalhado
- Prompt BANCO: schema SQL, índices, triggers — NÃO contém Edge Functions
Um desenvolvedor deve poder usar cada prompt de forma INDEPENDENTE, referenciando o Mestre para contexto.

PADRÃO DE QUALIDADE:
- Valores específicos e reais: CSS variables com HSL exatos, classes Tailwind exatas, tipos TypeScript específicos
- Código real: SQL com tipos PostgreSQL corretos, Zod schemas em PT-BR, snippets funcionais
- Checklist verificável: 20+ itens testáveis em produção (não genéricos)
- Adaptar ao nicho: exemplos, nomes de tabelas, fields e textos do domínio específico

LINGUAGEM: português brasileiro técnico. Imperativo direto ("Implemente...", "Crie...", "Configure...").

ESTRUTURA OBRIGATÓRIA — 7 seções numeradas:
## 1. CONTEXTO DO PROJETO
## 2. STACK TÉCNICA
## 3. [SEÇÃO PRINCIPAL do tipo de prompt — ver instrução específica]
## 4. [CONTINUAÇÃO]
## 5. [CONTINUAÇÃO]
## 6. [CONTINUAÇÃO]
## 7. CHECKLIST DE ENTREGA (20+ itens)`;

const SYSTEM_PROMPT_SITES = `Você é um especialista sênior em criação de sites modernos: design, copywriting, SEO, performance e conversão.

REGRA CRÍTICA DE ESCOPO: cada tipo de prompt tem responsabilidade EXCLUSIVA.
- Prompt MESTRE: contexto, stack, mapa de rotas, design tokens — NÃO contém design system completo nem copy
- Prompt DESIGN: CSS variables, tipografia, componentes visuais — NÃO duplica meta tags ou copywriting
- Prompt COPY: textos reais de cada seção — NÃO contém meta tags técnicas ou JSON-LD
- Prompt SEO: técnico, keywords, structured data — NÃO contém copywriting das seções
- Outros módulos: responsabilidade única descrita no título
Um desenvolvedor + designer + copywriter devem poder trabalhar em paralelo com prompts independentes.

PADRÃO DE QUALIDADE:
- CSS variables com HSL REAIS e específicos (ex: --primary: 217 91% 60%)
- Google Fonts com família + pesos específicos
- Classes Tailwind exatas para cada elemento
- Copywriting REAL adaptado ao nicho (nunca Lorem Ipsum)
- Animações com initial/animate/transition EXATOS

LINGUAGEM: português brasileiro técnico e direto.

ESTRUTURA OBRIGATÓRIA — 7 seções numeradas.`;

// ─────────────────────────────────────────────────────────────────────────────
// QUALITY REQUIREMENTS
// ─────────────────────────────────────────────────────────────────────────────
const QUALITY_REQUIREMENTS = `
REQUISITOS OBRIGATÓRIOS DE QUALIDADE (sem exceção):
✓ Mínimo 1.200 palavras — denso, específico, acionável
✓ Adaptar TODO o conteúdo ao nicho e contexto do projeto (sem exemplos genéricos)
✓ CSS variables com valores HSL REAIS (ex: --primary: 217 91% 60%)
✓ Código real: SQL com tipos PostgreSQL corretos, Zod em PT-BR, classes Tailwind exatas
✓ Checklist com MÍNIMO 20 itens concretos e verificáveis em produção
✓ ESCOPO EXCLUSIVO: não duplicar conteúdo de outros módulos
✗ PROIBIDO: generalidades vagas, "usar uma fonte bonita", "adicionar animação"
✗ PROIBIDO: repetir conteúdo que pertence a outro módulo (ex: SQL no Frontend, CSS no Backend)
✗ PROIBIDO: Lorem Ipsum ou placeholders genéricos — usar dados reais do nicho`;

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

    const websiteMeta = (project.metadata as Record<string, unknown>) ?? {};

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

    const systemPrompt = isSiteType ? SYSTEM_PROMPT_SITES : SYSTEM_PROMPT_APPS;

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

**Instrução específica para este módulo:**
${typeConfig.instructions}

${QUALITY_REQUIREMENTS}

Gere o prompt COMPLETO, DETALHADO e PRONTO PARA USO em ${typeConfig.platform}.
Adapte TODOS os exemplos, campos, textos e dados ao nicho específico: ${project.niche ?? "definir"}.
Este prompt será usado de forma INDEPENDENTE — inclua contexto suficiente para funcionar sem os outros módulos.
Comece DIRETAMENTE com "## 1." — sem introduções, sem "Aqui está:", sem meta-comentários.`;

    const content = await callAIWithFallback(systemPrompt, userPrompt, 8192, 0.6);

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

  } catch (err: unknown) {
    console.error("generate-prompt error:", err);
    const status = (err as { status?: number }).status;
    if (status === 429) {
      return new Response(JSON.stringify({ error: "Limite de requisições atingido. Aguarde alguns minutos e tente novamente." }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify({ error: "Erro interno ao gerar prompt" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
